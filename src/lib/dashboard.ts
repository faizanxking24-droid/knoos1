/**
 * KNOOS Dashboard Service (Compatibility & Delegation Layer)
 *
 * This module delegates directly to the canonical analytics engine in `@/lib/analytics/`.
 * Preserves legacy function signatures and exports for backwards compatibility.
 */

import {
  DateRange,
  calculateAnalyticsDateRange,
} from "./analytics/date-range";
import {
  getCompleteDashboardData,
  getRecentOrdersList,
  DashboardQueryFilters,
  RecentOrderSummary,
} from "./analytics/dashboard";
import { formatIstDateString } from "./analytics/date-range";
import type { ProductVariant } from "@prisma/client";

export type { DateRange };

export interface DashboardFilters {
  range: DateRange;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DashboardStats {
  // Revenue (selected period & live values)
  revenueToday: number;
  revenueThisMonth: number;
  totalRevenue: number;

  // Orders
  ordersToday: number;
  ordersThisMonth: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;

  // Customers
  totalCustomers: number;
  newCustomers: number;

  // Products
  totalProducts: number;
  activeProducts: number;
  lowStockVariants: (ProductVariant & { product: { id: string; name: string; slug: string } })[];
  outOfStockVariants: (ProductVariant & { product: { id: string; name: string; slug: string } })[];
}

export type RecentOrder = RecentOrderSummary;

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

/**
 * Legacy date bounds function preserved for compatibility.
 * Boundaries conform to Asia/Kolkata (IST).
 */
export function getDateBounds(range: DateRange, dateFrom?: Date, dateTo?: Date): { from: Date; to: Date } {
  const fromStr = dateFrom ? formatIstDateString(dateFrom) : undefined;
  const toStr = dateTo ? formatIstDateString(dateTo) : undefined;
  const config = calculateAnalyticsDateRange(range, fromStr, toStr);
  return {
    from: config.fromInclusive,
    to: config.toExclusive,
  };
}

/**
 * Legacy getDashboardStats delegating to the canonical analytics orchestrator.
 */
export async function getDashboardStats(filters: DashboardFilters): Promise<DashboardStats> {
  const fromStr = filters.dateFrom ? formatIstDateString(filters.dateFrom) : undefined;
  const toStr = filters.dateTo ? formatIstDateString(filters.dateTo) : undefined;

  const data = await getCompleteDashboardData({
    range: filters.range,
    dateFrom: fromStr,
    dateTo: toStr,
  });

  return {
    revenueToday: data.headline.paidRevenue.current,
    revenueThisMonth: data.headline.paidRevenue.current,
    totalRevenue: data.lifetime.lifetimePaidRevenue,
    ordersToday: data.headline.ordersPlaced.current,
    ordersThisMonth: data.headline.ordersPlaced.current,
    totalOrders: data.lifetime.lifetimeOrdersPlaced,
    paidOrders: data.headline.paidOrders.current,
    pendingOrders: data.fulfillment.pending,
    cancelledOrders: data.fulfillment.cancelled,
    averageOrderValue: data.headline.paidOrderAov.current,
    totalCustomers: data.customers.totalCustomersLifetime,
    newCustomers: data.customers.newCustomersInPeriod,
    totalProducts: data.inventory.catalogProducts,
    activeProducts: data.inventory.activeProducts,
    lowStockVariants: data.inventory.lowStockVariants as any,
    outOfStockVariants: data.inventory.outOfStockVariants as any,
  };
}

/**
 * Legacy getRecentOrders delegating to getRecentOrdersList.
 */
export async function getRecentOrders(limit = 10): Promise<RecentOrder[]> {
  return getRecentOrdersList(limit);
}

/**
 * Legacy getTopSellingProducts delegating to canonical analytics.
 */
export async function getTopSellingProducts(filters: DashboardFilters, limit = 10): Promise<TopProduct[]> {
  const fromStr = filters.dateFrom ? formatIstDateString(filters.dateFrom) : undefined;
  const toStr = filters.dateTo ? formatIstDateString(filters.dateTo) : undefined;

  const data = await getCompleteDashboardData({
    range: filters.range,
    dateFrom: fromStr,
    dateTo: toStr,
  });

  return data.topProducts.slice(0, limit).map((p) => ({
    productId: p.productId,
    productName: p.productName,
    totalQuantity: p.unitsSold,
    totalRevenue: p.paidRevenue,
  }));
}

/**
 * Legacy getSalesTrend delegating to canonical analytics.
 */
export async function getSalesTrend(filters: DashboardFilters, _days = 14): Promise<SalesTrendPoint[]> {
  const fromStr = filters.dateFrom ? formatIstDateString(filters.dateFrom) : undefined;
  const toStr = filters.dateTo ? formatIstDateString(filters.dateTo) : undefined;

  const data = await getCompleteDashboardData({
    range: filters.range,
    dateFrom: fromStr,
    dateTo: toStr,
  });

  return data.salesTrend.map((p) => ({
    date: p.key,
    revenue: p.revenue,
    orderCount: p.orderCount,
  }));
}
