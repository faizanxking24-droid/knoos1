/**
 * KNOOS Admin Dashboard Analytics Orchestrator
 *
 * Combines date boundaries, financial formulas, inventory snapshots,
 * customer cohorts, sales trends, and profit coverage into a single
 * typed authoritative data structure.
 */

import { prisma } from "@/lib/db";
import {
  DateRange,
  calculateAnalyticsDateRange,
  generateTrendBuckets,
  getIstComponents,
  formatIstDateString,
} from "./date-range";
import {
  CompleteDashboardData,
  TopProductMetric,
  TopProductFamilyMetric,
  SalesTrendDataPoint,
  buildMetricComparison,
} from "./definitions";
import {
  calculateFinancialMetrics,
  calculatePaymentMetrics,
  calculateFulfillmentMetrics,
  calculateProfitMetrics,
  RawOrderForAnalytics,
} from "./financial";
import { getInventorySnapshot } from "./inventory";

export interface DashboardQueryFilters {
  range: DateRange;
  dateFrom?: string;
  dateTo?: string;
}

export interface RecentOrderSummary {
  id: string;
  createdAt: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryMethod: string;
  user: { name: string | null; email: string | null };
  items: { productName: string; size: string; quantity: number }[];
}

/**
 * Loads complete analytics payload for the admin dashboard.
 */
export async function getCompleteDashboardData(
  filters: DashboardQueryFilters
): Promise<CompleteDashboardData> {
  const dateConfig = calculateAnalyticsDateRange(
    filters.range,
    filters.dateFrom,
    filters.dateTo
  );

  const { fromInclusive, toExclusive, previousPeriod, bucketStrategy } = dateConfig;

  // Execute parallel queries for current period, previous period, inventory, customers, lifetime
  const [
    currentPeriodOrdersRaw,
    currentNewCustomersCount,
    prevPeriodOrdersRaw,
    prevNewCustomersCount,
    inventorySnapshot,
    totalCustomersLifetime,
    lifetimePaidRevenueAgg,
    lifetimePaidOrdersCount,
    lifetimeOrdersPlacedCount,
    repeatCustomersRaw,
  ] = await Promise.all([
    // 1. Current period orders with items and product metadata
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: fromInclusive,
          lt: toExclusive,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                colorGroupKey: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // 2. New customers in current period
    prisma.user.count({
      where: {
        role: "CUSTOMER",
        createdAt: {
          gte: fromInclusive,
          lt: toExclusive,
        },
      },
    }),

    // 3. Previous period orders (minimal fields for comparison deltas)
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: previousPeriod.fromInclusive,
          lt: previousPeriod.toExclusive,
        },
      },
      select: {
        total: true,
        paymentStatus: true,
        items: {
          select: {
            quantity: true,
          },
        },
      },
    }),

    // 4. New customers in previous period
    prisma.user.count({
      where: {
        role: "CUSTOMER",
        createdAt: {
          gte: previousPeriod.fromInclusive,
          lt: previousPeriod.toExclusive,
        },
      },
    }),

    // 5. Current Inventory Snapshot
    getInventorySnapshot(20),

    // 6. Total customers all time
    prisma.user.count({
      where: { role: "CUSTOMER" },
    }),

    // 7. Lifetime paid revenue
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: "PAID" },
    }),

    // 8. Lifetime paid orders count
    prisma.order.count({
      where: { paymentStatus: "PAID" },
    }),

    // 9. Lifetime orders placed
    prisma.order.count(),

    // 10. Repeat customers (customers with >= 2 PAID orders lifetime)
    prisma.order.groupBy({
      by: ["userId"],
      where: { paymentStatus: "PAID" },
      _count: { id: true },
      having: {
        id: { _count: { gte: 2 } },
      },
    }),
  ]);

  // ─── Format orders into analytics raw structure ──────────────────────────
  const currentOrders: RawOrderForAnalytics[] = currentPeriodOrdersRaw.map((o) => ({
    id: o.id,
    subtotal: o.subtotal,
    discountAmount: o.discountAmount,
    deliveryCharge: o.deliveryCharge,
    total: o.total,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    orderStatus: o.orderStatus,
    createdAt: o.createdAt,
    userId: o.userId,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      size: i.size,
      quantity: i.quantity,
      price: i.price,
      total: i.total,
      unitCostPaise: i.unitCostPaise,
    })),
  }));

  // ─── Calculate Current Period Domain Metrics ─────────────────────────────
  const financial = calculateFinancialMetrics(currentOrders);
  const payment = calculatePaymentMetrics(currentOrders);
  const fulfillment = calculateFulfillmentMetrics(currentOrders);
  const profit = calculateProfitMetrics(currentOrders);

  // Units sold in current period (PAID orders only)
  let currentUnitsSold = 0;
  for (const o of currentOrders) {
    if (o.paymentStatus === "PAID") {
      for (const item of o.items || []) {
        currentUnitsSold += item.quantity;
      }
    }
  }

  const currentPaidOrders = financial.paidRevenue > 0 || currentOrders.some(o => o.paymentStatus === "PAID")
    ? currentOrders.filter(o => o.paymentStatus === "PAID").length
    : 0;

  const currentPaidAov = currentPaidOrders > 0
    ? Math.round(financial.paidRevenue / currentPaidOrders)
    : 0;

  // Distinct purchasing customers in period
  const purchasingCustomerIds = new Set<string>();
  for (const o of currentOrders) {
    if (o.paymentStatus === "PAID" && o.userId) {
      purchasingCustomerIds.add(o.userId);
    }
  }

  // ─── Calculate Previous Period Summary for Comparison Deltas ─────────────
  let prevPaidRevenue = 0;
  let prevPaidOrders = 0;
  let prevUnitsSold = 0;
  const prevOrdersPlaced = prevPeriodOrdersRaw.length;

  for (const o of prevPeriodOrdersRaw) {
    if (o.paymentStatus === "PAID") {
      prevPaidRevenue += o.total;
      prevPaidOrders++;
      for (const i of o.items) {
        prevUnitsSold += i.quantity;
      }
    }
  }

  const prevPaidAov = prevPaidOrders > 0 ? Math.round(prevPaidRevenue / prevPaidOrders) : 0;

  // ─── Section A: Headline Metrics with Comparisons ─────────────────────────
  const headline = {
    paidRevenue: buildMetricComparison(financial.paidRevenue, prevPaidRevenue),
    ordersPlaced: buildMetricComparison(currentOrders.length, prevOrdersPlaced),
    paidOrders: buildMetricComparison(currentPaidOrders, prevPaidOrders),
    paidOrderAov: buildMetricComparison(currentPaidAov, prevPaidAov),
    unitsSold: buildMetricComparison(currentUnitsSold, prevUnitsSold),
    newCustomers: buildMetricComparison(currentNewCustomersCount, prevNewCustomersCount),
  };

  // ─── Section E: Top Selling Products & Product Families ───────────────────
  // Colorway-accurate ranking (each Product is an individual colorway)
  const productAggMap = new Map<string, { productName: string; unitsSold: number; paidRevenue: number }>();
  // Sibling family ranking (grouped by colorGroupKey)
  const familyAggMap = new Map<
    string,
    { familyName: string; colorways: Set<string>; unitsSold: number; paidRevenue: number }
  >();

  for (const o of currentPeriodOrdersRaw) {
    if (o.paymentStatus !== "PAID") continue;

    for (const item of o.items) {
      const pid = item.productId || item.productName;
      const existingProd = productAggMap.get(pid);
      if (existingProd) {
        existingProd.unitsSold += item.quantity;
        existingProd.paidRevenue += item.total;
      } else {
        productAggMap.set(pid, {
          productName: item.productName,
          unitsSold: item.quantity,
          paidRevenue: item.total,
        });
      }

      // Family aggregation if colorGroupKey exists
      const groupKey = item.product?.colorGroupKey;
      if (groupKey) {
        const existingFamily = familyAggMap.get(groupKey);
        if (existingFamily) {
          existingFamily.unitsSold += item.quantity;
          existingFamily.paidRevenue += item.total;
          if (item.productId) existingFamily.colorways.add(item.productId);
        } else {
          const colorways = new Set<string>();
          if (item.productId) colorways.add(item.productId);
          const rawName = item.product?.name || item.productName;
          const familyName = rawName.includes("-") ? rawName.split("-")[0].trim() : rawName;
          familyAggMap.set(groupKey, {
            familyName,
            colorways,
            unitsSold: item.quantity,
            paidRevenue: item.total,
          });
        }
      }
    }
  }

  const topProducts: TopProductMetric[] = Array.from(productAggMap.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.productName,
      unitsSold: data.unitsSold,
      paidRevenue: data.paidRevenue,
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold || b.paidRevenue - a.paidRevenue)
    .slice(0, 10);

  const topProductFamilies: TopProductFamilyMetric[] = Array.from(familyAggMap.entries())
    .map(([colorGroupKey, data]) => ({
      colorGroupKey,
      familyName: data.familyName,
      colorwaysCount: data.colorways.size,
      unitsSold: data.unitsSold,
      paidRevenue: data.paidRevenue,
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold || b.paidRevenue - a.paidRevenue)
    .slice(0, 10);

  // ─── Section E2: Sales Trend Buckets (Gap-Free & Period-Aware) ───────────
  const trendBuckets = generateTrendBuckets(fromInclusive, toExclusive, bucketStrategy);
  const salesTrend: SalesTrendDataPoint[] = trendBuckets.map((bucket) => {
    let revenue = 0;
    let orderCount = 0;

    for (const o of currentOrders) {
      if (o.paymentStatus !== "PAID") continue;
      const t = o.createdAt.getTime();
      if (t >= bucket.startUtc.getTime() && t < bucket.endUtc.getTime()) {
        revenue += o.total;
        orderCount++;
      }
    }

    return {
      key: bucket.key,
      label: bucket.label,
      revenue,
      orderCount,
    };
  });

  const trendStrategyLabelMap = {
    hourly: "hourly",
    daily: "daily",
    weekly: "weekly",
    monthly: "monthly",
  };
  const salesTrendLabel = `Paid Revenue — ${dateConfig.label} (${trendStrategyLabelMap[bucketStrategy]} aggregation)`;

  // ─── Section H: Customer Metrics ──────────────────────────────────────────
  const customers = {
    newCustomersInPeriod: currentNewCustomersCount,
    purchasingCustomersInPeriod: purchasingCustomerIds.size,
    totalCustomersLifetime,
    repeatCustomersLifetime: repeatCustomersRaw.length,
  };

  // ─── Section I: Lifetime / All-Time Snapshot ──────────────────────────────
  const lifetimePaidRevenue = lifetimePaidRevenueAgg._sum.total ?? 0;
  const lifetime = {
    lifetimePaidRevenue,
    lifetimePaidOrders: lifetimePaidOrdersCount,
    lifetimeOrdersPlaced: lifetimeOrdersPlacedCount,
    lifetimeAov: lifetimePaidOrdersCount > 0 ? Math.round(lifetimePaidRevenue / lifetimePaidOrdersCount) : 0,
  };

  return {
    range: dateConfig.range,
    periodLabel: dateConfig.label,
    calendarDays: dateConfig.calendarDays,
    customFromStr: filters.dateFrom,
    customToStr: filters.dateTo,
    warning: dateConfig.warning,

    headline,
    financial,
    payment,
    fulfillment,
    profit,
    topProducts,
    topProductFamilies,
    salesTrend,
    salesTrendLabel,

    inventory: inventorySnapshot,
    customers,
    lifetime,
  };
}

/**
 * Fetches recent orders across all dates (clearly labeled as operational view).
 */
export async function getRecentOrdersList(limit = 10): Promise<RecentOrderSummary[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      items: { orderBy: { id: "asc" } },
      user: { select: { name: true, email: true } },
    },
  });

  return orders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt.toISOString(),
    total: o.total,
    orderStatus: o.orderStatus,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    deliveryMethod: o.deliveryMethod,
    user: o.user,
    items: o.items.map((i) => ({
      productName: i.productName,
      size: i.size,
      quantity: i.quantity,
    })),
  }));
}
