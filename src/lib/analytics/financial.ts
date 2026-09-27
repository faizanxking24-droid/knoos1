/**
 * KNOOS Financial & Performance Calculations Engine
 *
 * Implements authoritative mathematical definitions for revenue, payment methods,
 * fulfillment, unit sales, AOV, and forward-looking profit analysis.
 */

import {
  PeriodFinancialMetrics,
  PeriodPaymentMetrics,
  PeriodFulfillmentMetrics,
  PeriodProfitMetrics,
  formatPercent,
} from "./definitions";

export interface RawOrderItemForAnalytics {
  id: string;
  productId: string | null;
  productName: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
  unitCostPaise?: number | null;
}

export interface RawOrderForAnalytics {
  id: string;
  subtotal: number;
  discountAmount: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: Date;
  userId?: string;
  items?: RawOrderItemForAnalytics[];
}

/**
 * Calculates authoritative financial breakdown for a set of orders.
 */
export function calculateFinancialMetrics(orders: RawOrderForAnalytics[]): PeriodFinancialMetrics {
  let paidRevenue = 0;
  let merchandiseRevenue = 0;
  let deliveryRevenue = 0;
  let discountAmountPaid = 0;
  let discountAmountTotal = 0;
  let pendingPaymentValue = 0;
  let refundedOrderValue = 0;
  let failedPaymentValue = 0;
  let violatingOrdersCount = 0;

  for (const o of orders) {
    if (o.paymentStatus === "PAID") {
      paidRevenue += o.total;
      const netMerch = o.subtotal - o.discountAmount;
      merchandiseRevenue += netMerch;
      deliveryRevenue += o.deliveryCharge;
      discountAmountPaid += o.discountAmount;
      discountAmountTotal += o.discountAmount;

      // Invariant check: total MUST equal subtotal - discountAmount + deliveryCharge
      const expectedTotal = o.subtotal - o.discountAmount + o.deliveryCharge;
      if (o.total !== expectedTotal) {
        violatingOrdersCount++;
      }
    } else if (o.paymentStatus === "REFUNDED") {
      refundedOrderValue += o.total;
      discountAmountTotal += o.discountAmount;
    } else if (o.paymentStatus === "PENDING") {
      pendingPaymentValue += o.total;
    } else if (o.paymentStatus === "FAILED") {
      failedPaymentValue += o.total;
    }
  }

  const discrepancyAmount = paidRevenue - (merchandiseRevenue + deliveryRevenue);

  return {
    paidRevenue,
    merchandiseRevenue,
    deliveryRevenue,
    discountAmountPaid,
    discountAmountTotal,
    pendingPaymentValue,
    refundedOrderValue,
    failedPaymentValue,
    invariantCheck: {
      isValid: discrepancyAmount === 0 && violatingOrdersCount === 0,
      discrepancyAmount,
      violatingOrdersCount,
    },
  };
}

/**
 * Calculates payment method breakdown, outstanding receivables, and gateway conversion.
 */
export function calculatePaymentMetrics(orders: RawOrderForAnalytics[]): PeriodPaymentMetrics {
  let codOrders = 0;
  let codPaidOrders = 0;
  let codPaidRevenue = 0;
  let codPendingOrders = 0;
  let codPendingCollection = 0;

  let onlineOrders = 0;
  let onlinePaidOrders = 0;
  let onlinePaidRevenue = 0;
  let onlinePendingOrders = 0;
  let onlineFailedOrders = 0;

  for (const o of orders) {
    if (o.paymentMethod === "COD") {
      codOrders++;
      if (o.paymentStatus === "PAID") {
        codPaidOrders++;
        codPaidRevenue += o.total;
      } else if (o.paymentStatus === "PENDING") {
        codPendingOrders++;
        // Exclude cancelled COD orders from pending collectible receivable
        if (o.orderStatus !== "CANCELLED") {
          codPendingCollection += o.total;
        }
      }
    } else {
      // Default / ONLINE payment method
      onlineOrders++;
      if (o.paymentStatus === "PAID") {
        onlinePaidOrders++;
        onlinePaidRevenue += o.total;
      } else if (o.paymentStatus === "PENDING") {
        onlinePendingOrders++;
      } else if (o.paymentStatus === "FAILED") {
        onlineFailedOrders++;
      }
    }
  }

  const denominator = onlinePaidOrders + onlineFailedOrders;
  const paymentSuccessRate = denominator > 0 ? (onlinePaidOrders / denominator) * 100 : null;
  const formattedSuccessRate = paymentSuccessRate !== null ? `${paymentSuccessRate.toFixed(1)}%` : "—";

  return {
    codOrders,
    codPaidOrders,
    codPaidRevenue,
    codPendingOrders,
    codPendingCollection,
    onlineOrders,
    onlinePaidOrders,
    onlinePaidRevenue,
    onlinePendingOrders,
    onlineFailedOrders,
    paymentSuccessRate,
    formattedSuccessRate,
  };
}

/**
 * Calculates fulfillment stage breakdown for orders in the selected period.
 */
export function calculateFulfillmentMetrics(orders: RawOrderForAnalytics[]): PeriodFulfillmentMetrics {
  let pending = 0;
  let processing = 0;
  let packed = 0;
  let shipped = 0;
  let delivered = 0;
  let cancelled = 0;

  for (const o of orders) {
    switch (o.orderStatus) {
      case "PENDING":
        pending++;
        break;
      case "PROCESSING":
        processing++;
        break;
      case "PACKED":
        packed++;
        break;
      case "SHIPPED":
        shipped++;
        break;
      case "DELIVERED":
        delivered++;
        break;
      case "CANCELLED":
        cancelled++;
        break;
      default:
        // Handle any unrecognized status safely
        break;
    }
  }

  return {
    pending,
    processing,
    packed,
    shipped,
    delivered,
    cancelled,
  };
}

/**
 * Calculates forward-looking profit, COGS, margin, and cost snapshot coverage.
 *
 * Rules:
 * 1. Historical orders without unitCostPaise are NOT assumed to have zero cost.
 * 2. Only paid orders where ALL items have unitCostPaise recorded are included in exact profit calculations.
 * 3. Merchandise margin excludes delivery charges.
 * 4. Profit is before payment gateway fees, shipping expenses, and taxes.
 */
export function calculateProfitMetrics(orders: RawOrderForAnalytics[]): PeriodProfitMetrics {
  const paidOrders = orders.filter((o) => o.paymentStatus === "PAID");

  let totalPaidMerch = 0;
  let coveredPaidMerch = 0;
  let coveredCogsPaise = 0;
  let coveredPaidOrdersCount = 0;

  for (const o of paidOrders) {
    const netMerch = o.subtotal - o.discountAmount;
    totalPaidMerch += netMerch;

    const items = o.items || [];
    const hasItems = items.length > 0;
    const allItemsHaveCost = hasItems && items.every((i) => i.unitCostPaise !== undefined && i.unitCostPaise !== null);

    if (allItemsHaveCost) {
      coveredPaidOrdersCount++;
      coveredPaidMerch += netMerch;
      for (const item of items) {
        coveredCogsPaise += (item.unitCostPaise ?? 0) * item.quantity;
      }
    }
  }

  const cogs = Math.round(coveredCogsPaise / 100);
  const grossProductProfit = coveredPaidMerch - cogs;
  const grossMarginPercent = coveredPaidMerch > 0 ? (grossProductProfit / coveredPaidMerch) * 100 : null;
  const revenueCoveragePercent = totalPaidMerch > 0 ? (coveredPaidMerch / totalPaidMerch) * 100 : 0;

  const disclaimer =
    "Profit analytics include only orders with historical cost snapshots. Gross Product Profit is before gateway fees, shipping expenses, and tax liabilities.";

  return {
    grossProductProfit,
    cogs,
    netMerchandiseSalesCovered: coveredPaidMerch,
    grossMarginPercent,
    formattedMarginPercent: formatPercent(grossMarginPercent),
    coveredPaidOrders: coveredPaidOrdersCount,
    totalPaidOrders: paidOrders.length,
    revenueCoveragePercent,
    formattedCoveragePercent: `${revenueCoveragePercent.toFixed(1)}%`,
    hasCompleteCoverage: revenueCoveragePercent >= 99.99 && paidOrders.length > 0,
    disclaimer,
  };
}
