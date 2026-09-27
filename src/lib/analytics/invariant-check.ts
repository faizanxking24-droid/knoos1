/**
 * KNOOS Analytics Invariant Check & Diagnostic Engine
 *
 * Verifies mathematical integrity across database aggregates and calculations:
 * 1. Database aggregate sum(Order.total WHERE paymentStatus = 'PAID') MUST equal calculated paidRevenue.
 * 2. For every individual PAID order: total === subtotal - discountAmount + deliveryCharge.
 * 3. merchandiseRevenue + deliveryRevenue MUST equal paidRevenue.
 *
 * Reproducible and safe: contains zero customer PII.
 */

import { prisma } from "@/lib/db";
import { calculateFinancialMetrics } from "./financial";

export interface AnalyticsInvariantReport {
  isConsistent: boolean;
  evaluatedFrom: string | null;
  evaluatedTo: string | null;
  totalOrdersChecked: number;
  paidOrdersCount: number;
  aggregateSumPaidTotal: number;
  calculatedPaidRevenue: number;
  merchandiseRevenue: number;
  deliveryRevenue: number;
  discountAmountPaid: number;
  mathCheckPaidRevenueMatchesComponents: boolean;
  aggregateMatchesCalculatedRevenue: boolean;
  violatingOrders: Array<{
    orderId: string;
    total: number;
    subtotal: number;
    discountAmount: number;
    deliveryCharge: number;
    discrepancy: number;
  }>;
}

/**
 * Runs an invariant audit across orders in a given date boundary (or all-time if unspecified).
 */
export async function runAnalyticsInvariantCheck(
  fromInclusive?: Date,
  toExclusive?: Date
): Promise<AnalyticsInvariantReport> {
  const whereClause: Record<string, unknown> = {};
  if (fromInclusive || toExclusive) {
    const createdAtFilter: Record<string, Date> = {};
    if (fromInclusive) createdAtFilter.gte = fromInclusive;
    if (toExclusive) createdAtFilter.lt = toExclusive;
    whereClause.createdAt = createdAtFilter;
  }

  const [dbAggregate, rawOrders] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        paymentStatus: "PAID",
        ...whereClause,
      },
    }),
    prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        subtotal: true,
        discountAmount: true,
        deliveryCharge: true,
        total: true,
        paymentMethod: true,
        paymentStatus: true,
        orderStatus: true,
        createdAt: true,
      },
    }),
  ]);

  const aggregateSumPaidTotal = dbAggregate._sum.total ?? 0;
  const financial = calculateFinancialMetrics(rawOrders);

  const violatingOrders: AnalyticsInvariantReport["violatingOrders"] = [];

  for (const o of rawOrders) {
    if (o.paymentStatus === "PAID") {
      const expectedTotal = o.subtotal - o.discountAmount + o.deliveryCharge;
      if (o.total !== expectedTotal) {
        violatingOrders.push({
          orderId: o.id,
          total: o.total,
          subtotal: o.subtotal,
          discountAmount: o.discountAmount,
          deliveryCharge: o.deliveryCharge,
          discrepancy: o.total - expectedTotal,
        });
      }
    }
  }

  const paidOrdersCount = rawOrders.filter((o) => o.paymentStatus === "PAID").length;
  const aggregateMatchesCalculatedRevenue = aggregateSumPaidTotal === financial.paidRevenue;
  const mathCheckPaidRevenueMatchesComponents =
    financial.paidRevenue === financial.merchandiseRevenue + financial.deliveryRevenue;

  const isConsistent =
    aggregateMatchesCalculatedRevenue &&
    mathCheckPaidRevenueMatchesComponents &&
    violatingOrders.length === 0;

  return {
    isConsistent,
    evaluatedFrom: fromInclusive ? fromInclusive.toISOString() : null,
    evaluatedTo: toExclusive ? toExclusive.toISOString() : null,
    totalOrdersChecked: rawOrders.length,
    paidOrdersCount,
    aggregateSumPaidTotal,
    calculatedPaidRevenue: financial.paidRevenue,
    merchandiseRevenue: financial.merchandiseRevenue,
    deliveryRevenue: financial.deliveryRevenue,
    discountAmountPaid: financial.discountAmountPaid,
    mathCheckPaidRevenueMatchesComponents,
    aggregateMatchesCalculatedRevenue,
    violatingOrders,
  };
}
