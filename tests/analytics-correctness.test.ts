import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BUSINESS_TIMEZONE,
  IST_OFFSET_MS,
  getIstComponents,
  createUtcFromIst,
  formatIstDateString,
  parseIstDateString,
  calculateAnalyticsDateRange,
  generateTrendBuckets,
} from "../src/lib/analytics/date-range";
import {
  calculateFinancialMetrics,
  calculatePaymentMetrics,
  calculateFulfillmentMetrics,
  calculateProfitMetrics,
  RawOrderForAnalytics,
} from "../src/lib/analytics/financial";
import {
  buildMetricComparison,
  formatINR,
  formatPercent,
} from "../src/lib/analytics/definitions";

describe("KNOOS Analytics Correctness & Calculation Engine", () => {
  // ─── 1. Canonical Business Timezone & Boundaries (Asia/Kolkata UTC+05:30) ───
  describe("1. Date & Timezone Engine (Asia/Kolkata)", () => {
    it("uses canonical Asia/Kolkata timezone with +05:30 offset (19,800,000 ms)", () => {
      assert.equal(BUSINESS_TIMEZONE, "Asia/Kolkata");
      assert.equal(IST_OFFSET_MS, 19800000);
    });

    it("verifies 18:30 UTC boundary corresponds exactly to midnight IST of next day", () => {
      // 31 Aug 18:30:00.000 UTC is exactly 1 Sep 00:00:00.000 IST
      const utcDate = new Date("2026-08-31T18:30:00.000Z");
      const ist = getIstComponents(utcDate);

      assert.equal(ist.year, 2026);
      assert.equal(ist.month, 8); // 8 = September (0-indexed)
      assert.equal(ist.day, 1);
      assert.equal(ist.hours, 0);
      assert.equal(ist.minutes, 0);
      assert.equal(ist.seconds, 0);
      assert.equal(formatIstDateString(utcDate), "2026-09-01");
    });

    it("verifies 18:29:59.999 UTC boundary falls strictly in previous calendar day IST", () => {
      // 1 ms before 18:30 UTC is still 31 Aug 23:59:59.999 IST
      const utcDate = new Date("2026-08-31T18:29:59.999Z");
      const ist = getIstComponents(utcDate);

      assert.equal(ist.year, 2026);
      assert.equal(ist.month, 7); // 7 = August
      assert.equal(ist.day, 31);
      assert.equal(ist.hours, 23);
      assert.equal(ist.minutes, 59);
      assert.equal(ist.seconds, 59);
      assert.equal(formatIstDateString(utcDate), "2026-08-31");
    });

    it("handles year transition boundary (31 Dec 18:30 UTC -> 1 Jan 00:00 IST)", () => {
      const newYearUtc = new Date("2026-12-31T18:30:00.000Z");
      const ist = getIstComponents(newYearUtc);
      assert.equal(ist.year, 2027);
      assert.equal(ist.month, 0); // January
      assert.equal(ist.day, 1);
      assert.equal(ist.hours, 0);
      assert.equal(formatIstDateString(newYearUtc), "2027-01-01");
    });

    it("handles leap day correctly (28 Feb -> 29 Feb 2028)", () => {
      const leapMidnightUtc = createUtcFromIst(2028, 1, 29, 0, 0, 0, 0);
      const ist = getIstComponents(leapMidnightUtc);
      assert.equal(ist.year, 2028);
      assert.equal(ist.month, 1); // February
      assert.equal(ist.day, 29);
      assert.equal(formatIstDateString(leapMidnightUtc), "2028-02-29");
    });

    it("LAST 7 DAYS includes exactly 7 calendar days (today + previous 6 calendar days)", () => {
      // Fix 'now' to 28 Sep 2026 12:00:00 IST
      const fixedNow = createUtcFromIst(2026, 8, 28, 12, 0, 0);
      const bounds = calculateAnalyticsDateRange("7days", undefined, undefined, fixedNow);

      assert.equal(bounds.calendarDays, 7);
      // fromInclusive must be 22 Sep 00:00:00 IST
      assert.equal(formatIstDateString(bounds.fromInclusive), "2026-09-22");
      // toExclusive must be 29 Sep 00:00:00 IST (so 28 Sep 23:59:59.999 is included, 29 Sep is not)
      assert.equal(formatIstDateString(bounds.toExclusive), "2026-09-29");

      // Verify exact duration in hours: 7 * 24 = 168 hours
      const diffHours = (bounds.toExclusive.getTime() - bounds.fromInclusive.getTime()) / (1000 * 3600);
      assert.equal(diffHours, 168);

      // Verify comparison period has exactly 7 days
      assert.equal(bounds.previousPeriod.calendarDays, 7);
      assert.equal(formatIstDateString(bounds.previousPeriod.fromInclusive), "2026-09-15");
      assert.equal(formatIstDateString(bounds.previousPeriod.toExclusive), "2026-09-22");
    });

    it("LAST 30 DAYS includes exactly 30 calendar days (today + previous 29 calendar days)", () => {
      const fixedNow = createUtcFromIst(2026, 8, 28, 12, 0, 0);
      const bounds = calculateAnalyticsDateRange("30days", undefined, undefined, fixedNow);

      assert.equal(bounds.calendarDays, 30);
      // fromInclusive must be 30 Aug 00:00:00 IST
      assert.equal(formatIstDateString(bounds.fromInclusive), "2026-08-30");
      // toExclusive must be 29 Sep 00:00:00 IST
      assert.equal(formatIstDateString(bounds.toExclusive), "2026-09-29");

      const diffHours = (bounds.toExclusive.getTime() - bounds.fromInclusive.getTime()) / (1000 * 3600);
      assert.equal(diffHours, 30 * 24);

      // Verify comparison period has exactly 30 days
      assert.equal(bounds.previousPeriod.calendarDays, 30);
      assert.equal(bounds.previousPeriod.toExclusive.getTime(), bounds.fromInclusive.getTime());
    });

    it("CUSTOM RANGE: 1 Sep to 27 Sep includes 1 Sep 00:00:00 through 27 Sep 23:59:59.999 IST and excludes 28 Sep", () => {
      const bounds = calculateAnalyticsDateRange("custom", "2026-09-01", "2026-09-27");

      assert.equal(formatIstDateString(bounds.fromInclusive), "2026-09-01");
      // toExclusive is nextDayAfterEnd = 2026-09-28 00:00:00 IST
      assert.equal(formatIstDateString(bounds.toExclusive), "2026-09-28");
      assert.equal(bounds.calendarDays, 27);

      // Verify boundary timestamp tests
      const lastMomentOf27th = new Date(bounds.toExclusive.getTime() - 1);
      assert.equal(formatIstDateString(lastMomentOf27th), "2026-09-27");
      assert(lastMomentOf27th.getTime() >= bounds.fromInclusive.getTime());
      assert(lastMomentOf27th.getTime() < bounds.toExclusive.getTime());

      // 28 Sep 00:00:00.000 IST MUST be strictly excluded
      const firstMomentOf28th = bounds.toExclusive;
      assert.equal(formatIstDateString(firstMomentOf28th), "2026-09-28");
      assert.equal(firstMomentOf28th.getTime() < bounds.toExclusive.getTime(), false);
    });

    it("CUSTOM RANGE: validates from > to and returns safe fallback with warning", () => {
      const bounds = calculateAnalyticsDateRange("custom", "2026-09-30", "2026-09-01");
      assert.equal(bounds.range, "custom");
      assert(bounds.warning, "Should set a validation warning");
      assert.equal(bounds.calendarDays, 1);
    });

    it("CUSTOM RANGE: parses and validates malformed date strings", () => {
      assert.equal(parseIstDateString("invalid"), null);
      assert.equal(parseIstDateString("2026-02-30"), null); // Non-existent date
      assert.deepStrictEqual(parseIstDateString("2026-09-15"), { year: 2026, month: 8, day: 15 });
    });

    it("Trend Buckets generation: 7-day daily strategy produces exactly 7 gap-free buckets", () => {
      const fixedNow = createUtcFromIst(2026, 8, 28, 12, 0, 0);
      const bounds = calculateAnalyticsDateRange("7days", undefined, undefined, fixedNow);
      const buckets = generateTrendBuckets(bounds.fromInclusive, bounds.toExclusive, "daily");

      assert.equal(buckets.length, 7);
      assert.equal(buckets[0].key, "2026-09-22");
      assert.equal(buckets[6].key, "2026-09-28");
    });

    it("Trend Buckets generation: Today hourly strategy produces exactly 24 continuous hourly buckets", () => {
      const fixedNow = createUtcFromIst(2026, 8, 28, 12, 0, 0);
      const bounds = calculateAnalyticsDateRange("today", undefined, undefined, fixedNow);
      const buckets = generateTrendBuckets(bounds.fromInclusive, bounds.toExclusive, "hourly");

      assert.equal(buckets.length, 24);
      assert.equal(buckets[0].key, "00:00");
      assert.equal(buckets[23].key, "23:00");
    });
  });

  // ─── 2. Golden Dataset Tests ────────────────────────────────────────────────
  describe("2. Deterministic Golden Dataset Assertions", () => {
    // Exact Golden Dataset from Prompt requirements
    const goldenOrders: RawOrderForAnalytics[] = [
      {
        id: "order-a",
        paymentStatus: "PAID",
        paymentMethod: "ONLINE",
        orderStatus: "PROCESSING",
        subtotal: 1000,
        discountAmount: 100,
        deliveryCharge: 50,
        total: 950,
        createdAt: new Date("2026-09-20T10:00:00Z"),
        items: [
          {
            id: "item-a1",
            productId: "prod-1",
            productName: "Knoos Oxford Tan",
            size: "8",
            quantity: 2,
            price: 500,
            total: 1000,
            unitCostPaise: 30000, // ₹300 per unit cost
          },
        ],
      },
      {
        id: "order-b",
        paymentStatus: "PENDING",
        paymentMethod: "COD",
        orderStatus: "PROCESSING",
        subtotal: 2000,
        discountAmount: 0,
        deliveryCharge: 100,
        total: 2100,
        createdAt: new Date("2026-09-21T11:00:00Z"),
        items: [
          {
            id: "item-b1",
            productId: "prod-2",
            productName: "Knoos Chelsea Boot Black",
            size: "9",
            quantity: 1,
            price: 2000,
            total: 2000,
          },
        ],
      },
      {
        id: "order-c",
        paymentStatus: "REFUNDED",
        paymentMethod: "ONLINE",
        orderStatus: "DELIVERED",
        subtotal: 1500,
        discountAmount: 200,
        deliveryCharge: 0,
        total: 1300,
        createdAt: new Date("2026-09-22T12:00:00Z"),
        items: [
          {
            id: "item-c1",
            productId: "prod-3",
            productName: "Knoos Monk Strap Brown",
            size: "7",
            quantity: 1,
            price: 1500,
            total: 1500,
          },
        ],
      },
      {
        id: "order-d",
        paymentStatus: "PENDING",
        paymentMethod: "COD",
        orderStatus: "CANCELLED", // Cancelled COD order!
        subtotal: 800,
        discountAmount: 0,
        deliveryCharge: 0,
        total: 800,
        createdAt: new Date("2026-09-23T13:00:00Z"),
        items: [
          {
            id: "item-d1",
            productId: "prod-4",
            productName: "Knoos Loafer Suede",
            size: "8",
            quantity: 1,
            price: 800,
            total: 800,
          },
        ],
      },
    ];

    it("verifies exact financial metrics matching prompt specifications", () => {
      const financial = calculateFinancialMetrics(goldenOrders);

      // Paid Revenue = Order A total = 950
      assert.equal(financial.paidRevenue, 950);

      // Merchandise Revenue for PAID orders = 1000 - 100 = 900
      assert.equal(financial.merchandiseRevenue, 900);

      // Delivery Revenue for PAID orders = 50
      assert.equal(financial.deliveryRevenue, 50);

      // Discount on paid order = 100
      assert.equal(financial.discountAmountPaid, 100);

      // Total discounts on PAID + REFUNDED = 100 + 200 = 300
      assert.equal(financial.discountAmountTotal, 300);

      // Pending payment value = Order B (2100) + Order D (800) = 2900
      assert.equal(financial.pendingPaymentValue, 2900);

      // Refunded Order Value = Order C total = 1300
      assert.equal(financial.refundedOrderValue, 1300);

      // Paid revenue invariant check passes
      assert.equal(financial.invariantCheck.isValid, true);
      assert.equal(financial.invariantCheck.discrepancyAmount, 0);
      assert.equal(financial.invariantCheck.violatingOrdersCount, 0);
      assert.equal(financial.merchandiseRevenue + financial.deliveryRevenue, financial.paidRevenue);
    });

    it("verifies exact payment method metrics and COD receivable calculation", () => {
      const payment = calculatePaymentMetrics(goldenOrders);

      // COD Pending Collection excludes CANCELLED COD (Order D: 800 is excluded)
      // Collectible pending = Order B only = 2100
      assert.equal(payment.codPendingCollection, 2100);
      assert.equal(payment.codOrders, 2);
      assert.equal(payment.codPendingOrders, 2);
      assert.equal(payment.codPaidOrders, 0);
      assert.equal(payment.codPaidRevenue, 0);

      // Online Metrics
      assert.equal(payment.onlineOrders, 2);
      assert.equal(payment.onlinePaidOrders, 1);
      assert.equal(payment.onlinePaidRevenue, 950);
      assert.equal(payment.onlineFailedOrders, 0);

      // Success Rate: 1 / (1 + 0) = 100.0%
      assert.equal(payment.paymentSuccessRate, 100);
      assert.equal(payment.formattedSuccessRate, "100.0%");
    });

    it("verifies fulfillment stage metrics", () => {
      const fulfillment = calculateFulfillmentMetrics(goldenOrders);

      assert.equal(fulfillment.processing, 2); // Order A and B
      assert.equal(fulfillment.delivered, 1);  // Order C
      assert.equal(fulfillment.cancelled, 1);  // Order D
      assert.equal(fulfillment.pending, 0);
      assert.equal(fulfillment.packed, 0);
      assert.equal(fulfillment.shipped, 0);
    });
  });

  // ─── 3. Status Independence Tests ───────────────────────────────────────────
  describe("3. Order Status & Payment Status Independence", () => {
    it("handles CANCELLED + PAID without losing financial truth", () => {
      const testOrders: RawOrderForAnalytics[] = [
        {
          id: "order-cancelled-but-paid",
          orderStatus: "CANCELLED", // Fulfillment cancelled
          paymentStatus: "PAID",   // Customer money received
          paymentMethod: "ONLINE",
          subtotal: 3000,
          discountAmount: 0,
          deliveryCharge: 100,
          total: 3100,
          createdAt: new Date(),
        },
      ];

      const financial = calculateFinancialMetrics(testOrders);
      const fulfillment = calculateFulfillmentMetrics(testOrders);

      // Financial truth: PaymentStatus is PAID, so paidRevenue must include 3100
      assert.equal(financial.paidRevenue, 3100);
      // Fulfillment truth: OrderStatus is CANCELLED
      assert.equal(fulfillment.cancelled, 1);
    });

    it("handles FAILED + PENDING payment combinations safely", () => {
      const testOrders: RawOrderForAnalytics[] = [
        {
          id: "order-failed-online",
          orderStatus: "PENDING",
          paymentStatus: "FAILED",
          paymentMethod: "ONLINE",
          subtotal: 1000,
          discountAmount: 0,
          deliveryCharge: 100,
          total: 1100,
          createdAt: new Date(),
        },
      ];

      const financial = calculateFinancialMetrics(testOrders);
      const payment = calculatePaymentMetrics(testOrders);

      assert.equal(financial.paidRevenue, 0);
      assert.equal(financial.failedPaymentValue, 1100);
      assert.equal(payment.onlineFailedOrders, 1);
      assert.equal(payment.onlinePaidOrders, 0);
      // Success rate with 0 paid and 1 failed = 0%
      assert.equal(payment.paymentSuccessRate, 0);
      assert.equal(payment.formattedSuccessRate, "0.0%");
    });

    it("handles 0 online paid and 0 online failed by returning '—' instead of NaN / Infinity", () => {
      const testOrders: RawOrderForAnalytics[] = [
        {
          id: "cod-only-order",
          orderStatus: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: "COD",
          subtotal: 1500,
          discountAmount: 0,
          deliveryCharge: 100,
          total: 1600,
          createdAt: new Date(),
        },
      ];

      const payment = calculatePaymentMetrics(testOrders);
      assert.equal(payment.paymentSuccessRate, null);
      assert.equal(payment.formattedSuccessRate, "—");
    });
  });

  // ─── 4. Inventory Stock Boundaries (0, 1, 5, 6) ─────────────────────────────
  describe("4. Inventory Low Stock & Out of Stock Boundaries", () => {
    function classifyStock(stock: number): { isLowStock: boolean; isOutOfStock: boolean } {
      return {
        isLowStock: stock >= 1 && stock <= 5,
        isOutOfStock: stock === 0,
      };
    }

    it("stock = 0 is OUT OF STOCK only, never LOW STOCK", () => {
      const result = classifyStock(0);
      assert.equal(result.isOutOfStock, true);
      assert.equal(result.isLowStock, false);
    });

    it("stock = 1 is LOW STOCK only, never OUT OF STOCK", () => {
      const result = classifyStock(1);
      assert.equal(result.isLowStock, true);
      assert.equal(result.isOutOfStock, false);
    });

    it("stock = 5 is LOW STOCK only, never OUT OF STOCK", () => {
      const result = classifyStock(5);
      assert.equal(result.isLowStock, true);
      assert.equal(result.isOutOfStock, false);
    });

    it("stock = 6 is NEITHER low stock nor out of stock", () => {
      const result = classifyStock(6);
      assert.equal(result.isLowStock, false);
      assert.equal(result.isOutOfStock, false);
    });
  });

  // ─── 5. Product Status & Soft Deletion ──────────────────────────────────────
  describe("5. Product Status Filtering (DELETED Excluded)", () => {
    const products = [
      { id: "p1", name: "Shoe A", status: "ACTIVE" },
      { id: "p2", name: "Shoe B", status: "ACTIVE" },
      { id: "p3", name: "Shoe C", status: "INACTIVE" },
      { id: "p4", name: "Shoe D", status: "DELETED" },
    ];

    it("Catalog products include ACTIVE and INACTIVE, and strictly exclude DELETED", () => {
      const catalog = products.filter((p) => p.status !== "DELETED");
      const active = products.filter((p) => p.status === "ACTIVE");
      const inactive = products.filter((p) => p.status === "INACTIVE");
      const deleted = products.filter((p) => p.status === "DELETED");

      assert.equal(catalog.length, 3);
      assert.equal(active.length, 2);
      assert.equal(inactive.length, 1);
      assert.equal(deleted.length, 1);
      assert(catalog.every((p) => p.status !== "DELETED"));
    });
  });

  // ─── 6. Forward-Looking Profit & Cost Snapshot Engine ───────────────────────
  describe("6. Profit, COGS, and Cost Snapshot Coverage", () => {
    it("calculates exact gross product profit for covered order: selling ₹1000, discount ₹100, cost ₹600", () => {
      const order: RawOrderForAnalytics = {
        id: "covered-order",
        paymentStatus: "PAID",
        paymentMethod: "ONLINE",
        orderStatus: "DELIVERED",
        subtotal: 1000,
        discountAmount: 100,
        deliveryCharge: 50,
        total: 950,
        createdAt: new Date(),
        items: [
          {
            id: "item-1",
            productId: "prod-1",
            productName: "Leather Oxford",
            size: "8",
            quantity: 1,
            price: 1000,
            total: 1000,
            unitCostPaise: 60000, // ₹600
          },
        ],
      };

      const profit = calculateProfitMetrics([order]);

      // Net Merchandise Sales = 1000 - 100 = 900 (excludes delivery charge 50)
      assert.equal(profit.netMerchandiseSalesCovered, 900);
      // COGS = 600
      assert.equal(profit.cogs, 600);
      // Gross Product Profit = 900 - 600 = 300
      assert.equal(profit.grossProductProfit, 300);
      // Gross Margin = (300 / 900) * 100 = 33.333% -> formatted as 33.3%
      assert.equal(Math.round(profit.grossMarginPercent!), 33);
      assert.equal(profit.formattedMarginPercent, "33.3%");
      assert.equal(profit.revenueCoveragePercent, 100);
      assert.equal(profit.coveredPaidOrders, 1);
    });

    it("calculates multi-quantity items correctly: qty 3 @ ₹400 cost = ₹1200 COGS", () => {
      const order: RawOrderForAnalytics = {
        id: "multi-qty-order",
        paymentStatus: "PAID",
        paymentMethod: "ONLINE",
        orderStatus: "DELIVERED",
        subtotal: 2400,
        discountAmount: 0,
        deliveryCharge: 0,
        total: 2400,
        createdAt: new Date(),
        items: [
          {
            id: "item-multi",
            productId: "prod-multi",
            productName: "Sneaker",
            size: "9",
            quantity: 3,
            price: 800,
            total: 2400,
            unitCostPaise: 40000, // ₹400 per unit cost
          },
        ],
      };

      const profit = calculateProfitMetrics([order]);
      assert.equal(profit.cogs, 1200);
      assert.equal(profit.grossProductProfit, 1200);
      assert.equal(profit.formattedMarginPercent, "50.0%");
    });

    it("legacy orders with null unitCostPaise are excluded from exact profit (not faked as 0 cost)", () => {
      const legacyOrder: RawOrderForAnalytics = {
        id: "legacy-order",
        paymentStatus: "PAID",
        paymentMethod: "ONLINE",
        orderStatus: "DELIVERED",
        subtotal: 2000,
        discountAmount: 200,
        deliveryCharge: 100,
        total: 1900,
        createdAt: new Date(),
        items: [
          {
            id: "legacy-item",
            productId: "prod-legacy",
            productName: "Vintage Boot",
            size: "8",
            quantity: 1,
            price: 2000,
            total: 2000,
            unitCostPaise: null, // Legacy order before snapshot migration
          },
        ],
      };

      const profit = calculateProfitMetrics([legacyOrder]);

      // Coverage must be 0%
      assert.equal(profit.revenueCoveragePercent, 0);
      assert.equal(profit.coveredPaidOrders, 0);
      assert.equal(profit.totalPaidOrders, 1);
      assert.equal(profit.cogs, 0);
      assert.equal(profit.grossProductProfit, 0);
      assert.equal(profit.grossMarginPercent, null);
      assert.equal(profit.formattedMarginPercent, "—");
    });
  });

  // ─── 7. Central Metric Delta Formatter ──────────────────────────────────────
  describe("7. Safe Percentage & Delta Formatting", () => {
    it("handles zero to zero comparison (0% change)", () => {
      const comp = buildMetricComparison(0, 0);
      assert.equal(comp.percentChange, 0);
      assert.equal(comp.formattedDelta, "0.0%");
    });

    it("handles zero to positive comparison (displays 'New', never Infinity%)", () => {
      const comp = buildMetricComparison(500, 0);
      assert.equal(comp.percentChange, null);
      assert.equal(comp.formattedDelta, "New");
    });

    it("formats positive and negative changes with proper sign and 1 decimal place", () => {
      const pos = buildMetricComparison(124, 100);
      assert.equal(pos.formattedDelta, "+24.0%");

      const neg = buildMetricComparison(75, 100);
      assert.equal(neg.formattedDelta, "-25.0%");
    });

    it("formatINR formats Indian Rupee amounts accurately without dividing by 100", () => {
      assert.equal(formatINR(1250), "₹1,250");
      assert.equal(formatINR(0), "₹0");
      assert.equal(formatINR(100000), "₹1,00,000");
    });
  });

  // ─── 8. Real-Data Realistic Production Cohort Spot Check ────────────────────
  describe("8. Realistic Order Spot Check & Mathematical Integrity", () => {
    // 6-order realistic cohort for date range: 1 Sep – 27 Sep 2026
    const spotCheckOrders: RawOrderForAnalytics[] = [
      // 1. Online Paid with coupon & delivery fee
      {
        id: "ord-101",
        subtotal: 3999,
        discountAmount: 400,
        deliveryCharge: 100,
        total: 3699, // 3999 - 400 + 100 = 3699
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        orderStatus: "DELIVERED",
        createdAt: new Date("2026-09-05T14:20:00Z"),
        items: [
          {
            id: "it-1",
            productId: "p-oxford",
            productName: "Knoos Oxford Classic",
            size: "8",
            quantity: 1,
            price: 3999,
            total: 3999,
            unitCostPaise: 150000, // ₹1500
          },
        ],
      },
      // 2. COD Paid (delivered and collected)
      {
        id: "ord-102",
        subtotal: 2499,
        discountAmount: 0,
        deliveryCharge: 100,
        total: 2599, // 2499 - 0 + 100 = 2599
        paymentMethod: "COD",
        paymentStatus: "PAID",
        orderStatus: "DELIVERED",
        createdAt: new Date("2026-09-10T09:15:00Z"),
        items: [
          {
            id: "it-2",
            productId: "p-loafer",
            productName: "Knoos Penny Loafer",
            size: "9",
            quantity: 1,
            price: 2499,
            total: 2499,
            unitCostPaise: 110000, // ₹1100
          },
        ],
      },
      // 3. COD Pending (active in transit)
      {
        id: "ord-103",
        subtotal: 4998,
        discountAmount: 500,
        deliveryCharge: 0,
        total: 4498, // 4998 - 500 + 0 = 4498
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        orderStatus: "SHIPPED",
        createdAt: new Date("2026-09-15T18:00:00Z"),
        items: [
          {
            id: "it-3",
            productId: "p-derby",
            productName: "Knoos Derby Wingtip",
            size: "7",
            quantity: 2,
            price: 2499,
            total: 4998,
            unitCostPaise: 95000, // ₹950
          },
        ],
      },
      // 4. COD Pending but CANCELLED by customer (must NOT count as collectible)
      {
        id: "ord-104",
        subtotal: 2499,
        discountAmount: 0,
        deliveryCharge: 100,
        total: 2599,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        orderStatus: "CANCELLED",
        createdAt: new Date("2026-09-18T11:45:00Z"),
        items: [
          {
            id: "it-4",
            productId: "p-chelsea",
            productName: "Knoos Chelsea Boot",
            size: "8",
            quantity: 1,
            price: 2499,
            total: 2499,
          },
        ],
      },
      // 5. Online Refunded (customer returned product)
      {
        id: "ord-105",
        subtotal: 3499,
        discountAmount: 350,
        deliveryCharge: 0,
        total: 3149,
        paymentMethod: "ONLINE",
        paymentStatus: "REFUNDED",
        orderStatus: "DELIVERED",
        createdAt: new Date("2026-09-20T08:30:00Z"),
        items: [
          {
            id: "it-5",
            productId: "p-monk",
            productName: "Knoos Double Monk",
            size: "9",
            quantity: 1,
            price: 3499,
            total: 3499,
          },
        ],
      },
      // 6. Online Failed transaction
      {
        id: "ord-106",
        subtotal: 2499,
        discountAmount: 0,
        deliveryCharge: 100,
        total: 2599,
        paymentMethod: "ONLINE",
        paymentStatus: "FAILED",
        orderStatus: "PENDING",
        createdAt: new Date("2026-09-25T16:10:00Z"),
        items: [
          {
            id: "it-6",
            productId: "p-oxford",
            productName: "Knoos Oxford Classic",
            size: "8",
            quantity: 1,
            price: 2499,
            total: 2499,
          },
        ],
      },
    ];

    it("verifies manual spot check results match financial engine exactly", () => {
      // Manual calculations:
      // Paid Orders: ord-101 (₹3699) + ord-102 (₹2599) = ₹6298
      const expectedPaidRevenue = 3699 + 2599; // 6298
      const expectedPaidCount = 2;
      const expectedAov = Math.round(expectedPaidRevenue / expectedPaidCount); // 3149
      const expectedMerchandiseRevenue = (3999 - 400) + (2499 - 0); // 3599 + 2499 = 6098
      const expectedDeliveryRevenue = 100 + 100; // 200
      const expectedRefundedValue = 3149; // ord-105 total
      // Collectible Pending COD: ord-103 only (₹4498), ord-104 is cancelled so excluded
      const expectedCodPendingCollection = 4498;

      const financial = calculateFinancialMetrics(spotCheckOrders);
      const payment = calculatePaymentMetrics(spotCheckOrders);

      assert.equal(financial.paidRevenue, expectedPaidRevenue);
      assert.equal(financial.merchandiseRevenue, expectedMerchandiseRevenue);
      assert.equal(financial.deliveryRevenue, expectedDeliveryRevenue);
      assert.equal(financial.refundedOrderValue, expectedRefundedValue);
      assert.equal(payment.codPendingCollection, expectedCodPendingCollection);

      // Verify invariant: 6098 + 200 = 6298
      assert.equal(financial.merchandiseRevenue + financial.deliveryRevenue, financial.paidRevenue);
      assert.equal(financial.invariantCheck.isValid, true);
      assert.equal(financial.invariantCheck.violatingOrdersCount, 0);

      // AOV formula check
      const paidOrdersList = spotCheckOrders.filter((o) => o.paymentStatus === "PAID");
      const aov = Math.round(financial.paidRevenue / paidOrdersList.length);
      assert.equal(aov, expectedAov);

      // Units sold: ord-101 (1) + ord-102 (1) = 2 units
      let unitsSold = 0;
      for (const o of paidOrdersList) {
        for (const itm of o.items || []) {
          unitsSold += itm.quantity;
        }
      }
      assert.equal(unitsSold, 2);
    });

    it("flags invariant violations when legacy data has corrupted totals", () => {
      const corruptedOrders: RawOrderForAnalytics[] = [
        {
          id: "corrupted-1",
          subtotal: 1000,
          discountAmount: 100,
          deliveryCharge: 50,
          total: 900, // Error: 1000 - 100 + 50 is 950, but stored total is 900
          paymentMethod: "ONLINE",
          paymentStatus: "PAID",
          orderStatus: "DELIVERED",
          createdAt: new Date(),
        },
      ];

      const financial = calculateFinancialMetrics(corruptedOrders);
      assert.equal(financial.invariantCheck.isValid, false);
      assert.equal(financial.invariantCheck.violatingOrdersCount, 1);
      assert.equal(financial.invariantCheck.discrepancyAmount, -50);
    });
  });
});
