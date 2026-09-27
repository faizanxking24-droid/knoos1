/**
 * KNOOS Analytics Type Definitions & Central Formatters
 *
 * Single Source of Truth for all administrative analytics, reporting,
 * calculations, and invariants.
 */

import type { DateRange } from "./date-range";

// ─── Metric Value with Comparison ─────────────────────────────────────────────

export interface MetricComparison {
  current: number;
  previous: number;
  diff: number;
  /**
   * Percentage change vs previous equal-length period.
   * null if previous was 0 and current > 0 (display as 'New').
   */
  percentChange: number | null;
  /**
   * Formatted string ready for UI, e.g. '+12.4%', '-5.0%', '0.0%', or 'New'
   */
  formattedDelta: string;
}

// ─── Section A: Selected Period Headline Metrics ──────────────────────────────

export interface PeriodHeadlineMetrics {
  paidRevenue: MetricComparison;           // Sum of Order.total for currently PAID orders
  ordersPlaced: MetricComparison;          // Total count of orders created in period
  paidOrders: MetricComparison;            // Count of currently PAID orders
  paidOrderAov: MetricComparison;          // paidRevenue / paidOrders (0 if 0)
  unitsSold: MetricComparison;             // Sum of OrderItem.quantity for PAID orders
  newCustomers: MetricComparison;          // User count where role=CUSTOMER created in period
}

// ─── Section B: Financial Breakdown ───────────────────────────────────────────

export interface PeriodFinancialMetrics {
  paidRevenue: number;                     // Sum of Order.total (PAID)
  merchandiseRevenue: number;              // Sum of (subtotal - discountAmount) for PAID orders
  deliveryRevenue: number;                 // Sum of deliveryCharge for PAID orders
  discountAmountPaid: number;              // Sum of discountAmount for PAID orders
  discountAmountTotal: number;             // Sum of discountAmount for PAID + REFUNDED orders
  pendingPaymentValue: number;             // Sum of Order.total (PENDING)
  refundedOrderValue: number;              // Sum of Order.total (REFUNDED)
  failedPaymentValue: number;              // Sum of Order.total (FAILED)

  // Invariant validation for the period
  invariantCheck: {
    isValid: boolean;                      // true if merchandiseRevenue + deliveryRevenue === paidRevenue
    discrepancyAmount: number;             // paidRevenue - (merchandiseRevenue + deliveryRevenue)
    violatingOrdersCount: number;          // orders where total !== subtotal - discount + delivery
  };
}

// ─── Section C: Payment Method Analytics ──────────────────────────────────────

export interface PeriodPaymentMetrics {
  // Cash on Delivery
  codOrders: number;                       // Total COD orders placed
  codPaidOrders: number;                   // COD orders that reached PAID
  codPaidRevenue: number;                  // Revenue collected from COD (PAID)
  codPendingOrders: number;                // COD orders currently PENDING payment
  codPendingCollection: number;            // Sum Order.total where COD + PENDING + orderStatus != CANCELLED

  // Online (Razorpay)
  onlineOrders: number;                    // Total Online orders placed
  onlinePaidOrders: number;                // Online orders that reached PAID
  onlinePaidRevenue: number;               // Revenue collected from Online (PAID)
  onlinePendingOrders: number;             // Online orders currently PENDING payment
  onlineFailedOrders: number;              // Online orders that FAILED
  paymentSuccessRate: number | null;       // onlinePaid / (onlinePaid + onlineFailed) * 100, or null if denom=0
  formattedSuccessRate: string;            // e.g. '94.2%' or '—'
}

// ─── Section D: Fulfillment Breakdown ─────────────────────────────────────────

export interface PeriodFulfillmentMetrics {
  pending: number;                         // orderStatus = PENDING
  processing: number;                      // orderStatus = PROCESSING
  packed: number;                          // orderStatus = PACKED
  shipped: number;                         // orderStatus = SHIPPED
  delivered: number;                       // orderStatus = DELIVERED
  cancelled: number;                       // orderStatus = CANCELLED
}

// ─── Section E: Product Performance & Sales Trend ─────────────────────────────

export interface TopProductMetric {
  productId: string;
  productName: string;
  unitsSold: number;                       // Sum quantity on PAID orders
  paidRevenue: number;                     // Sum total on PAID order items
}

export interface TopProductFamilyMetric {
  colorGroupKey: string;
  familyName: string;
  colorwaysCount: number;
  unitsSold: number;
  paidRevenue: number;
}

export interface SalesTrendDataPoint {
  key: string;                             // Identifier (e.g. '2026-09-28' or '14:00')
  label: string;                           // Display label (e.g. '28 Sep' or '2 PM')
  revenue: number;                         // Paid revenue in INR rupees
  orderCount: number;                      // Paid order count
}

// ─── Section F: Forward-Looking Profit & Margin ───────────────────────────────

export interface PeriodProfitMetrics {
  grossProductProfit: number;              // Net Merchandise Sales (covered) - COGS (rupees)
  cogs: number;                            // Cost of Goods Sold for covered orders (rupees)
  netMerchandiseSalesCovered: number;      // Net merchandise sales for covered orders
  grossMarginPercent: number | null;       // (Gross Product Profit / Net Merchandise Sales) * 100
  formattedMarginPercent: string;          // e.g. '38.5%' or '—'
  coveredPaidOrders: number;               // Count of paid orders with 100% cost snapshot coverage
  totalPaidOrders: number;                 // Total paid orders in period
  revenueCoveragePercent: number;          // % of paid merchandise revenue that has historical cost snapshots
  formattedCoveragePercent: string;        // e.g. '82.0%' or '0.0%'
  hasCompleteCoverage: boolean;            // true if 100% coverage
  disclaimer: string;                      // Clear business note on limitations
}

// ─── Section G: Inventory Snapshot (Current, Live, Independent of Range) ──────

export interface InventoryVariantItem {
  id: string;
  size: string;
  stock: number;
  sku: string;
  product: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
}

export interface InventorySnapshotMetrics {
  catalogProducts: number;                 // status != DELETED
  activeProducts: number;                  // status = ACTIVE
  inactiveProducts: number;                // status = INACTIVE
  deletedProducts: number;                 // status = DELETED (for internal audit)
  activeVariants: number;                  // Variants under ACTIVE products
  inventoryUnits: number;                  // Sum of stock of variants under ACTIVE products
  lowStockCount: number;                   // Variants with 1 <= stock <= 5 under ACTIVE products
  outOfStockCount: number;                 // Variants with stock = 0 under ACTIVE products
  lowStockVariants: InventoryVariantItem[];
  outOfStockVariants: InventoryVariantItem[];
}

// ─── Section H: Customer Analytics ────────────────────────────────────────────

export interface CustomerAnalyticsMetrics {
  newCustomersInPeriod: number;            // role=CUSTOMER created in period
  purchasingCustomersInPeriod: number;     // Distinct customer count with >= 1 PAID order in period
  totalCustomersLifetime: number;          // Total customers (all time)
  repeatCustomersLifetime: number;         // Customers with >= 2 PAID orders (all time)
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

// ─── Section I: All-Time / Lifetime Snapshot ──────────────────────────────────

export interface LifetimeSnapshotMetrics {
  lifetimePaidRevenue: number;             // All-time sum Order.total (PAID)
  lifetimePaidOrders: number;              // All-time count of PAID orders
  lifetimeOrdersPlaced: number;            // All-time count of all orders placed
  lifetimeAov: number;                     // Lifetime paidRevenue / lifetimePaidOrders
}

// ─── Consolidated Dashboard Payload ───────────────────────────────────────────

export interface CompleteDashboardData {
  range: DateRange;
  periodLabel: string;
  calendarDays: number;
  customFromStr?: string;
  customToStr?: string;
  warning?: string;

  headline: PeriodHeadlineMetrics;
  financial: PeriodFinancialMetrics;
  payment: PeriodPaymentMetrics;
  fulfillment: PeriodFulfillmentMetrics;
  profit: PeriodProfitMetrics;
  topProducts: TopProductMetric[];
  topProductFamilies: TopProductFamilyMetric[];
  salesTrend: SalesTrendDataPoint[];
  salesTrendLabel: string;

  inventory: InventorySnapshotMetrics;
  customers: CustomerAnalyticsMetrics;
  lifetime: LifetimeSnapshotMetrics;
}

// ─── Central Formatters ───────────────────────────────────────────────────────

/**
 * Formats a rupee amount into canonical Indian currency format.
 * Input is in INR RUPEES (do NOT divide by 100).
 */
export function formatINR(rupees: number): string {
  if (!Number.isFinite(rupees)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(rupees));
}

/**
 * Formats a decimal percentage to 1 decimal place (e.g. 33.3%).
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return `${value.toFixed(1)}%`;
}

/**
 * Builds metric comparison structure with safe delta calculation.
 */
export function buildMetricComparison(current: number, previous: number): MetricComparison {
  const diff = current - previous;
  let percentChange: number | null = null;
  let formattedDelta = "0.0%";

  if (previous === 0) {
    if (current === 0) {
      percentChange = 0;
      formattedDelta = "0.0%";
    } else {
      percentChange = null;
      formattedDelta = "New";
    }
  } else {
    percentChange = (diff / previous) * 100;
    const sign = percentChange > 0 ? "+" : "";
    formattedDelta = `${sign}${percentChange.toFixed(1)}%`;
  }

  return {
    current,
    previous,
    diff,
    percentChange,
    formattedDelta,
  };
}
