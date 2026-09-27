"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CompleteDashboardData,
  RecentOrderSummary,
  formatINR,
} from "@/lib/analytics/definitions";
import type { DateRange } from "@/lib/analytics/date-range";

interface DashboardClientProps {
  data: CompleteDashboardData;
  recentOrders: RecentOrderSummary[];
}

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7days", label: "7 Days" },
  { value: "30days", label: "30 Days" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom" },
];

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  PACKED: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-gray-50 text-gray-600 border-gray-200",
};

export function AdminDashboardClient({ data, recentOrders }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customFrom, setCustomFrom] = useState(() => searchParams.get("from") || data.customFromStr || "");
  const [customTo, setCustomTo] = useState(() => searchParams.get("to") || data.customToStr || "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const maxTrendRevenue = useMemo(
    () => Math.max(...data.salesTrend.map((p) => p.revenue), 1),
    [data.salesTrend]
  );

  const handleRangeChange = useCallback(
    (newRange: DateRange) => {
      setValidationError(null);
      if (newRange === "custom") {
        const params = new URLSearchParams(searchParams.toString());
        params.set("range", "custom");
        router.push(`/admin?${params.toString()}`);
        return;
      }
      router.push(`/admin?range=${newRange}`);
    },
    [router, searchParams]
  );

  const handleCustomApply = useCallback(() => {
    if (!customFrom || !customTo) {
      setValidationError("Please select both a start date and an end date.");
      return;
    }
    if (customFrom > customTo) {
      setValidationError("Start date cannot be after end date.");
      return;
    }
    setValidationError(null);
    router.push(`/admin?range=custom&from=${customFrom}&to=${customTo}`);
  }, [router, customFrom, customTo]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* ─── Header & Range Selector ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-brand-gray-200 pb-6">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-brand-black">Dashboard</h1>
          <p className="text-brand-gray-500 font-mono text-xs mt-1">
            Store Analytics & Metrics — <span className="text-brand-black font-medium">{data.periodLabel}</span> (Asia/Kolkata IST)
          </p>
          <p className="text-[11px] text-brand-gray-400 font-mono mt-0.5">
            Cohort: grouped by order creation date. Financial truth: Payment Status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => handleRangeChange(r.value)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wide border transition-colors ${
                data.range === r.value
                  ? "bg-brand-black text-white border-brand-black shadow-sm"
                  : "bg-white text-brand-gray-600 border-brand-gray-200 hover:border-brand-black"
              }`}
            >
              {r.label}
            </button>
          ))}

          {data.range === "custom" && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border border-brand-gray-200 px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-black bg-white"
              />
              <span className="text-brand-gray-400 text-xs">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border border-brand-gray-200 px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-black bg-white"
              />
              <button
                onClick={handleCustomApply}
                disabled={!customFrom || !customTo}
                className="px-3 py-1.5 text-xs font-mono uppercase tracking-wide border border-brand-black bg-brand-black text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-gray-800 transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Warnings & Validation Alerts */}
      {(validationError || data.warning) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 text-xs font-mono">
          <p className="font-semibold">Notice:</p>
          <p>{validationError || data.warning}</p>
        </div>
      )}

      {/* ─── SECTION A: Selected Period Headline Metrics ─────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg text-brand-black">Selected Period Performance</h2>
            <p className="text-brand-gray-400 font-mono text-xs">
              Every metric in this section strictly reflects the {data.calendarDays}-day period ({data.periodLabel})
            </p>
          </div>
          <span className="text-[11px] font-mono text-brand-gray-400">
            vs prior equal-length period
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Paid Revenue */}
          <div className="bg-white border border-brand-gray-200 p-4 relative group">
            <p className="text-brand-gray-500 text-[11px] font-mono uppercase tracking-wider">
              Paid Revenue
            </p>
            <p className="text-xl font-serif mt-2 text-brand-black">
              {formatINR(data.headline.paidRevenue.current)}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 border rounded-xs ${
                  data.headline.paidRevenue.diff >= 0
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {data.headline.paidRevenue.formattedDelta}
              </span>
              <span className="text-[10px] text-brand-gray-400 font-mono">
                prev {formatINR(data.headline.paidRevenue.previous)}
              </span>
            </div>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              From {data.headline.paidOrders.current} paid orders
            </p>
          </div>

          {/* Orders Placed */}
          <div className="bg-white border border-brand-gray-200 p-4">
            <p className="text-brand-gray-500 text-[11px] font-mono uppercase tracking-wider">
              Orders Placed
            </p>
            <p className="text-xl font-serif mt-2 text-brand-black">
              {data.headline.ordersPlaced.current}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 border rounded-xs ${
                  data.headline.ordersPlaced.diff >= 0
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {data.headline.ordersPlaced.formattedDelta}
              </span>
              <span className="text-[10px] text-brand-gray-400 font-mono">
                prev {data.headline.ordersPlaced.previous}
              </span>
            </div>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              All statuses combined
            </p>
          </div>

          {/* Paid Orders */}
          <div className="bg-white border border-brand-gray-200 p-4">
            <p className="text-brand-gray-500 text-[11px] font-mono uppercase tracking-wider">
              Paid Orders
            </p>
            <p className="text-xl font-serif mt-2 text-brand-black">
              {data.headline.paidOrders.current}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 border rounded-xs ${
                  data.headline.paidOrders.diff >= 0
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {data.headline.paidOrders.formattedDelta}
              </span>
              <span className="text-[10px] text-brand-gray-400 font-mono">
                prev {data.headline.paidOrders.previous}
              </span>
            </div>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              Payment confirmed
            </p>
          </div>

          {/* Paid Order AOV */}
          <div className="bg-white border border-brand-gray-200 p-4">
            <p className="text-brand-gray-500 text-[11px] font-mono uppercase tracking-wider">
              Paid Order AOV
            </p>
            <p className="text-xl font-serif mt-2 text-brand-black">
              {formatINR(data.headline.paidOrderAov.current)}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 border rounded-xs ${
                  data.headline.paidOrderAov.diff >= 0
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {data.headline.paidOrderAov.formattedDelta}
              </span>
              <span className="text-[10px] text-brand-gray-400 font-mono">
                prev {formatINR(data.headline.paidOrderAov.previous)}
              </span>
            </div>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              Paid Revenue / Paid Orders
            </p>
          </div>

          {/* Units Sold */}
          <div className="bg-white border border-brand-gray-200 p-4">
            <p className="text-brand-gray-500 text-[11px] font-mono uppercase tracking-wider">
              Units Sold
            </p>
            <p className="text-xl font-serif mt-2 text-brand-black">
              {data.headline.unitsSold.current}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 border rounded-xs ${
                  data.headline.unitsSold.diff >= 0
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {data.headline.unitsSold.formattedDelta}
              </span>
              <span className="text-[10px] text-brand-gray-400 font-mono">
                prev {data.headline.unitsSold.previous}
              </span>
            </div>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              From paid orders
            </p>
          </div>

          {/* New Customers */}
          <div className="bg-white border border-brand-gray-200 p-4">
            <p className="text-brand-gray-500 text-[11px] font-mono uppercase tracking-wider">
              New Customers
            </p>
            <p className="text-xl font-serif mt-2 text-brand-black">
              {data.headline.newCustomers.current}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 border rounded-xs ${
                  data.headline.newCustomers.diff >= 0
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {data.headline.newCustomers.formattedDelta}
              </span>
              <span className="text-[10px] text-brand-gray-400 font-mono">
                prev {data.headline.newCustomers.previous}
              </span>
            </div>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              Registered in period
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION B: Financial Breakdown ─────────────────────────────── */}
      <section className="bg-white border border-brand-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-brand-gray-100 gap-2">
          <div>
            <h2 className="font-serif text-lg text-brand-black">Financial Breakdown</h2>
            <p className="text-brand-gray-500 font-mono text-xs mt-0.5">
              Exact revenue allocation for orders placed in {data.periodLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-mono px-2 py-0.5 border ${
                data.financial.invariantCheck.isValid
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {data.financial.invariantCheck.isValid
                ? "✓ Invariant Verified (Merch + Delivery = Paid Revenue)"
                : `⚠ Discrepancy: ₹${data.financial.invariantCheck.discrepancyAmount}`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/50">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase tracking-wide">
              Merchandise Revenue
            </p>
            <p className="text-lg font-serif mt-1 text-brand-black">
              {formatINR(data.financial.merchandiseRevenue)}
            </p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              Subtotal − Discounts (PAID)
            </p>
          </div>

          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/50">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase tracking-wide">
              Discounts Given
            </p>
            <p className="text-lg font-serif mt-1 text-brand-black">
              {formatINR(data.financial.discountAmountTotal)}
            </p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              PAID ({formatINR(data.financial.discountAmountPaid)}) + REFUNDED
            </p>
          </div>

          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/50">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase tracking-wide">
              Delivery Revenue
            </p>
            <p className="text-lg font-serif mt-1 text-brand-black">
              {formatINR(data.financial.deliveryRevenue)}
            </p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              Delivery fees from paid orders
            </p>
          </div>

          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/50">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase tracking-wide">
              Pending Payment Value
            </p>
            <p className="text-lg font-serif mt-1 text-brand-black">
              {formatINR(data.financial.pendingPaymentValue)}
            </p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              Awaiting settlement (COD & Online)
            </p>
          </div>

          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/50">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase tracking-wide">
              Refunded Order Value
            </p>
            <p className="text-lg font-serif mt-1 text-brand-black">
              {formatINR(data.financial.refundedOrderValue)}
            </p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              Total of currently REFUNDED orders
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION C & D: Payment & Fulfillment ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods & Conversion */}
        <div className="bg-white border border-brand-gray-200 p-6">
          <div className="border-b border-brand-gray-100 pb-3">
            <h2 className="font-serif text-lg text-brand-black">Payment Methods & Conversion</h2>
            <p className="text-brand-gray-500 font-mono text-xs mt-0.5">
              Online gateway efficiency and COD receivable analysis
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {/* COD Block */}
            <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/30">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase font-medium text-brand-black">
                  Cash On Delivery (COD)
                </span>
                <span className="font-mono text-xs text-brand-gray-500">
                  {data.payment.codOrders} orders placed
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-brand-gray-100">
                <div>
                  <p className="text-[11px] font-mono text-brand-gray-400">COD Collected (Paid)</p>
                  <p className="font-serif text-base text-brand-black mt-0.5">
                    {formatINR(data.payment.codPaidRevenue)}
                  </p>
                  <p className="text-[10px] font-mono text-brand-gray-400 mt-0.5">
                    {data.payment.codPaidOrders} orders paid
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-brand-gray-400">Pending Collection</p>
                  <p className="font-serif text-base text-brand-black mt-0.5">
                    {formatINR(data.payment.codPendingCollection)}
                  </p>
                  <p className="text-[10px] font-mono text-brand-gray-400 mt-0.5">
                    {data.payment.codPendingOrders} pending (excl. cancelled)
                  </p>
                </div>
              </div>
            </div>

            {/* Online Block */}
            <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/30">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase font-medium text-brand-black">
                  Online Payments (Razorpay)
                </span>
                <span className="font-mono text-xs text-brand-gray-500">
                  {data.payment.onlineOrders} orders placed
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-brand-gray-100">
                <div>
                  <p className="text-[11px] font-mono text-brand-gray-400">Online Paid</p>
                  <p className="font-serif text-base text-brand-black mt-0.5">
                    {formatINR(data.payment.onlinePaidRevenue)}
                  </p>
                  <p className="text-[10px] font-mono text-brand-gray-400 mt-0.5">
                    {data.payment.onlinePaidOrders} orders
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-brand-gray-400">Online Failed</p>
                  <p className="font-serif text-base text-red-600 mt-0.5">
                    {data.payment.onlineFailedOrders}
                  </p>
                  <p className="text-[10px] font-mono text-brand-gray-400 mt-0.5">
                    Failed transactions
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-brand-gray-400">Success Rate</p>
                  <p className="font-serif text-base text-brand-black mt-0.5">
                    {data.payment.formattedSuccessRate}
                  </p>
                  <p className="text-[10px] font-mono text-brand-gray-400 mt-0.5">
                    Paid / (Paid + Failed)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fulfillment Breakdown */}
        <div className="bg-white border border-brand-gray-200 p-6">
          <div className="border-b border-brand-gray-100 pb-3">
            <h2 className="font-serif text-lg text-brand-black">Fulfillment Status</h2>
            <p className="text-brand-gray-500 font-mono text-xs mt-0.5">
              Current stage for orders created in {data.periodLabel}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            <div className="border border-brand-gray-100 p-3 bg-brand-gray-50/20">
              <span className="text-[11px] font-mono text-yellow-700 bg-yellow-50 px-2 py-0.5 border border-yellow-200 inline-block">
                PENDING
              </span>
              <p className="text-xl font-serif mt-2 text-brand-black">{data.fulfillment.pending}</p>
              <p className="text-[10px] font-mono text-brand-gray-400 mt-0.5">Awaiting review</p>
            </div>

            <div className="border border-brand-gray-100 p-3 bg-brand-gray-50/20">
              <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200 inline-block">
                PROCESSING
              </span>
              <p className="text-xl font-serif mt-2 text-brand-black">{data.fulfillment.processing}</p>
              <p className="text-[10px] font-mono text-brand-gray-400 mt-0.5">In fulfillment queue</p>
            </div>

            <div className="border border-brand-gray-100 p-3 bg-brand-gray-50/20">
              <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 border border-purple-200 inline-block">
                PACKED
              </span>
              <p className="text-xl font-serif mt-2 text-brand-black">{data.fulfillment.packed}</p>
              <p className="text-[10px] font-mono text-brand-gray-400 mt-0.5">Ready for pickup</p>
            </div>

            <div className="border border-brand-gray-100 p-3 bg-brand-gray-50/20">
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 border border-indigo-200 inline-block">
                SHIPPED
              </span>
              <p className="text-xl font-serif mt-2 text-brand-black">{data.fulfillment.shipped}</p>
              <p className="text-[10px] font-mono text-brand-gray-400 mt-0.5">In transit</p>
            </div>

            <div className="border border-brand-gray-100 p-3 bg-brand-gray-50/20">
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 inline-block">
                DELIVERED
              </span>
              <p className="text-xl font-serif mt-2 text-brand-black">{data.fulfillment.delivered}</p>
              <p className="text-[10px] font-mono text-brand-gray-400 mt-0.5">Completed deliveries</p>
            </div>

            <div className="border border-brand-gray-100 p-3 bg-brand-gray-50/20">
              <span className="text-[11px] font-mono text-red-700 bg-red-50 px-2 py-0.5 border border-red-200 inline-block">
                CANCELLED
              </span>
              <p className="text-xl font-serif mt-2 text-brand-black">{data.fulfillment.cancelled}</p>
              <p className="text-[10px] font-mono text-brand-gray-400 mt-0.5">Cancelled fulfillment</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION E: Sales Trend ─────────────────────────────────────── */}
      <div className="bg-white border border-brand-gray-200 p-6">
        <div className="border-b border-brand-gray-200 pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h2 className="font-serif text-xl text-brand-black">Sales Trend</h2>
            <p className="text-brand-gray-500 text-xs font-mono mt-0.5">
              {data.salesTrendLabel}
            </p>
          </div>
          <span className="text-[11px] font-mono text-brand-gray-400">
            {data.salesTrend.length} data points
          </span>
        </div>

        <div className="pt-6">
          {data.salesTrend.length === 0 || data.headline.paidRevenue.current === 0 ? (
            <p className="text-brand-gray-400 font-mono text-sm text-center py-12">
              No paid sales recorded in this period
            </p>
          ) : (
            <div className="flex items-end gap-1.5 h-36 pt-4 overflow-x-auto">
              {data.salesTrend.map((point) => {
                const heightPct =
                  maxTrendRevenue > 0
                    ? Math.max((point.revenue / maxTrendRevenue) * 100, point.revenue > 0 ? 4 : 2)
                    : 2;

                return (
                  <div
                    key={point.key}
                    className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group relative"
                  >
                    <div
                      className={`w-full transition-colors rounded-t-xs min-h-[3px] ${
                        point.revenue > 0
                          ? "bg-brand-black hover:bg-brand-gray-700"
                          : "bg-brand-gray-200"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[9px] text-brand-gray-400 font-mono truncate max-w-full text-center">
                      {point.label}
                    </span>

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 bg-brand-black text-white text-xs px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap pointer-events-none">
                      <p className="font-mono font-medium">{point.label}</p>
                      <p className="text-white/80">{formatINR(point.revenue)}</p>
                      <p className="text-white/50 text-[10px]">{point.orderCount} paid orders</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Top Selling Products & Families ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products (Colorway-specific) */}
        <div className="bg-white border border-brand-gray-200">
          <div className="border-b border-brand-gray-200 px-6 py-4 flex items-baseline justify-between">
            <div>
              <h2 className="font-serif text-xl">Top Selling Colorways</h2>
              <p className="text-brand-gray-500 text-xs font-mono mt-0.5">
                Individual colorways ranked by units sold ({data.periodLabel})
              </p>
            </div>
            <span className="text-[11px] font-mono text-brand-gray-400">PAID items only</span>
          </div>

          <div className="divide-y divide-brand-gray-100">
            {data.topProducts.map((product, idx) => (
              <div key={product.productId} className="px-6 py-3.5 flex items-center justify-between hover:bg-brand-gray-50/50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-brand-gray-400 w-5">
                    {idx + 1}
                  </span>
                  <div>
                    <Link
                      href={`/admin/products/${product.productId}`}
                      className="text-sm font-medium text-brand-black hover:underline truncate max-w-[240px] block"
                    >
                      {product.productName}
                    </Link>
                    <p className="text-xs text-brand-gray-400 font-mono">
                      {product.unitsSold} units sold
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs text-brand-black font-medium">
                  {formatINR(product.paidRevenue)}
                </span>
              </div>
            ))}
            {data.topProducts.length === 0 && (
              <div className="px-6 py-10 text-center">
                <p className="text-brand-gray-400 font-mono text-sm">No items sold in this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Product Families */}
        <div className="bg-white border border-brand-gray-200">
          <div className="border-b border-brand-gray-200 px-6 py-4 flex items-baseline justify-between">
            <div>
              <h2 className="font-serif text-xl">Top Product Families</h2>
              <p className="text-brand-gray-500 text-xs font-mono mt-0.5">
                Combined colorways sharing the same colorGroupKey
              </p>
            </div>
            <span className="text-[11px] font-mono text-brand-gray-400">Aggregated family</span>
          </div>

          <div className="divide-y divide-brand-gray-100">
            {data.topProductFamilies.map((family, idx) => (
              <div key={family.colorGroupKey} className="px-6 py-3.5 flex items-center justify-between hover:bg-brand-gray-50/50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-brand-gray-400 w-5">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-brand-black truncate max-w-[240px]">
                      {family.familyName}
                    </p>
                    <p className="text-xs text-brand-gray-400 font-mono">
                      {family.colorwaysCount} colorways • {family.unitsSold} units sold
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs text-brand-black font-medium">
                  {formatINR(family.paidRevenue)}
                </span>
              </div>
            ))}
            {data.topProductFamilies.length === 0 && (
              <div className="px-6 py-10 text-center">
                <p className="text-brand-gray-400 font-mono text-sm">
                  No multi-colorway sales in this period
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── SECTION F: Forward-Looking Profit & Margin ─────────────────── */}
      <section className="bg-white border border-brand-gray-200 p-6">
        <div className="border-b border-brand-gray-100 pb-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h2 className="font-serif text-lg text-brand-black">Gross Product Margin & Profit</h2>
            <p className="text-brand-gray-500 font-mono text-xs mt-0.5">
              Forward-looking profitability derived strictly from purchase-time cost snapshots
            </p>
          </div>
          <span className="text-[11px] font-mono text-brand-gray-400">
            Snapshot Coverage: {data.profit.formattedCoveragePercent}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/40">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase tracking-wide">
              Gross Product Profit
            </p>
            <p className="text-xl font-serif mt-1 text-brand-black">
              {data.profit.revenueCoveragePercent > 0 ? formatINR(data.profit.grossProductProfit) : "—"}
            </p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              Covered Merch Sales − COGS
            </p>
          </div>

          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/40">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase tracking-wide">
              Cost of Goods Sold (COGS)
            </p>
            <p className="text-xl font-serif mt-1 text-brand-black">
              {data.profit.revenueCoveragePercent > 0 ? formatINR(data.profit.cogs) : "—"}
            </p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              Sum of historical item costs
            </p>
          </div>

          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/40">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase tracking-wide">
              Gross Product Margin
            </p>
            <p className="text-xl font-serif mt-1 text-brand-black">
              {data.profit.formattedMarginPercent}
            </p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              Profit / Covered Merch Sales
            </p>
          </div>

          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/40">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase tracking-wide">
              Cost Snapshot Coverage
            </p>
            <p className="text-xl font-serif mt-1 text-brand-black">
              {data.profit.formattedCoveragePercent}
            </p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-1">
              {data.profit.coveredPaidOrders} of {data.profit.totalPaidOrders} paid orders
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-brand-gray-100 text-[11px] font-mono text-brand-gray-400">
          <p>
            * Note: {data.profit.disclaimer}
          </p>
          {data.profit.revenueCoveragePercent < 100 && (
            <p className="mt-1 text-brand-gray-500">
              Orders created prior to the cost-snapshot migration have null unit cost and are excluded from exact profit to avoid artificial 100% margins.
            </p>
          )}
        </div>
      </section>

      {/* ─── SECTION G: Inventory Snapshot (Live Current State) ─────────── */}
      <section className="bg-white border border-brand-gray-200 p-6">
        <div className="border-b border-brand-gray-100 pb-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h2 className="font-serif text-lg text-brand-black">Current Inventory Snapshot</h2>
            <p className="text-brand-gray-500 font-mono text-xs mt-0.5">
              Live warehouse stock levels across active catalog variants (independent of date range)
            </p>
          </div>
          <span className="text-[11px] font-mono text-brand-gray-400">
            Current live database status
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase">Catalog Products</p>
            <p className="text-xl font-serif mt-1 text-brand-black">{data.inventory.catalogProducts}</p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">Excludes DELETED</p>
          </div>

          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase">Live Products</p>
            <p className="text-xl font-serif mt-1 text-brand-black">{data.inventory.activeProducts}</p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">Active colorways</p>
          </div>

          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase">Live Families</p>
            <p className="text-xl font-serif mt-1 text-brand-black">{data.inventory.liveProductFamilies}</p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">Distinct shoe models</p>
          </div>

          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase">Inactive / Draft</p>
            <p className="text-xl font-serif mt-1 text-brand-black">{data.inventory.inactiveProducts + (data.inventory.draftProducts ?? 0)}</p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">{data.inventory.inactiveProducts} inactive, {data.inventory.draftProducts ?? 0} draft</p>
          </div>

          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase">Inventory Units</p>
            <p className="text-xl font-serif mt-1 text-brand-black">{data.inventory.inventoryUnits}</p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">In active variants</p>
          </div>

          <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
            <p className="text-brand-gray-500 font-mono text-[11px] uppercase">Low / Out of Stock</p>
            <p className="text-xl font-serif mt-1 text-orange-600">{data.inventory.lowStockCount} <span className="text-sm font-sans text-brand-gray-400">/</span> <span className="text-red-600">{data.inventory.outOfStockCount}</span></p>
            <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">1–5 low / 0 OOS</p>
          </div>
        </div>

        {/* Low Stock & Out of Stock Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Low Stock */}
          <div className="border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-4 py-3 bg-brand-gray-50/50 flex justify-between items-center">
              <h3 className="font-serif text-base text-brand-black">Low Stock Variants (1 – 5 units)</h3>
              <span className="text-[10px] font-mono text-orange-600 font-medium">{data.inventory.lowStockCount} items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-gray-100 text-left bg-white">
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase text-brand-gray-500">Product</th>
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase text-brand-gray-500">Size</th>
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase text-brand-gray-500 text-right">Units</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventory.lowStockVariants.slice(0, 8).map((variant) => (
                    <tr key={variant.id} className="border-b border-brand-gray-50 hover:bg-brand-gray-50">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/products/${variant.product.id}`} className="text-brand-black hover:underline text-xs">
                          {variant.product.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{variant.size}</td>
                      <td className="px-4 py-2.5 font-mono text-right text-xs font-semibold text-orange-600">
                        {variant.stock}
                      </td>
                    </tr>
                  ))}
                  {data.inventory.lowStockVariants.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-brand-gray-400 font-mono text-xs">
                        No low-stock variants found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Out of Stock */}
          <div className="border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-4 py-3 bg-brand-gray-50/50 flex justify-between items-center">
              <h3 className="font-serif text-base text-brand-black">Out of Stock Variants (0 units)</h3>
              <span className="text-[10px] font-mono text-red-600 font-medium">{data.inventory.outOfStockCount} items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-gray-100 text-left bg-white">
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase text-brand-gray-500">Product</th>
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase text-brand-gray-500">Size</th>
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase text-brand-gray-500 text-right">Units</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventory.outOfStockVariants.slice(0, 8).map((variant) => (
                    <tr key={variant.id} className="border-b border-brand-gray-50 hover:bg-brand-gray-50">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/products/${variant.product.id}`} className="text-red-600 hover:underline text-xs">
                          {variant.product.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{variant.size}</td>
                      <td className="px-4 py-2.5 font-mono text-right text-xs font-semibold text-red-600">
                        0
                      </td>
                    </tr>
                  ))}
                  {data.inventory.outOfStockVariants.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-brand-gray-400 font-mono text-xs">
                        No out-of-stock variants found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION H & I: Customers & Lifetime Quick Snapshot ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customer Cohorts */}
        <div className="bg-white border border-brand-gray-200 p-6">
          <div className="border-b border-brand-gray-100 pb-3">
            <h2 className="font-serif text-lg text-brand-black">Customer Insights</h2>
            <p className="text-brand-gray-500 font-mono text-xs mt-0.5">
              Registration cohorts and lifetime buying behavior
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
              <p className="text-brand-gray-500 font-mono text-[11px] uppercase">New in Period</p>
              <p className="text-xl font-serif mt-1 text-brand-black">{data.customers.newCustomersInPeriod}</p>
              <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">Joined in {data.periodLabel}</p>
            </div>

            <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
              <p className="text-brand-gray-500 font-mono text-[11px] uppercase">Purchasing in Period</p>
              <p className="text-xl font-serif mt-1 text-brand-black">{data.customers.purchasingCustomersInPeriod}</p>
              <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">Distinct buyers (PAID)</p>
            </div>

            <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
              <p className="text-brand-gray-500 font-mono text-[11px] uppercase">Total Customers</p>
              <p className="text-xl font-serif mt-1 text-brand-black">{data.customers.totalCustomersLifetime}</p>
              <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">All-time customer accounts</p>
            </div>

            <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
              <p className="text-brand-gray-500 font-mono text-[11px] uppercase">Repeat Buyers</p>
              <p className="text-xl font-serif mt-1 text-brand-black">{data.customers.repeatCustomersLifetime}</p>
              <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">≥ 2 paid orders all-time</p>
            </div>
          </div>
        </div>

        {/* Lifetime Quick Snapshot */}
        <div className="bg-white border border-brand-gray-200 p-6">
          <div className="border-b border-brand-gray-100 pb-3">
            <h2 className="font-serif text-lg text-brand-black">All-Time Store Summary</h2>
            <p className="text-brand-gray-500 font-mono text-xs mt-0.5">
              Cumulative historical totals across all dates
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
              <p className="text-brand-gray-500 font-mono text-[11px] uppercase">Lifetime Revenue</p>
              <p className="text-xl font-serif mt-1 text-brand-black">{formatINR(data.lifetime.lifetimePaidRevenue)}</p>
              <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">From all paid orders</p>
            </div>

            <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
              <p className="text-brand-gray-500 font-mono text-[11px] uppercase">Lifetime Paid Orders</p>
              <p className="text-xl font-serif mt-1 text-brand-black">{data.lifetime.lifetimePaidOrders}</p>
              <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">Successful orders</p>
            </div>

            <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
              <p className="text-brand-gray-500 font-mono text-[11px] uppercase">Total Orders Placed</p>
              <p className="text-xl font-serif mt-1 text-brand-black">{data.lifetime.lifetimeOrdersPlaced}</p>
              <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">All statuses</p>
            </div>

            <div className="border border-brand-gray-100 p-4 bg-brand-gray-50/20">
              <p className="text-brand-gray-500 font-mono text-[11px] uppercase">Lifetime Paid AOV</p>
              <p className="text-xl font-serif mt-1 text-brand-black">{formatINR(data.lifetime.lifetimeAov)}</p>
              <p className="text-[10px] text-brand-gray-400 font-mono mt-0.5">Lifetime revenue / paid orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION J: Recent Orders (Operational List) ────────────────── */}
      <section className="bg-white border border-brand-gray-200">
        <div className="border-b border-brand-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl">Recent Orders — Latest Across All Dates</h2>
            <p className="text-brand-gray-500 text-xs font-mono mt-0.5">
              Live operational view showing the 10 most recent orders placed in the system
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-mono uppercase tracking-wide text-brand-gray-400 hover:text-brand-black transition-colors"
          >
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-gray-100 text-left bg-brand-gray-50/30">
                <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Order</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Customer</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Method</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-right">Total</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Fulfillment</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Payment</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-right">Date (IST)</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-brand-gray-50 hover:bg-brand-gray-50/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-xs text-brand-black font-medium hover:underline"
                    >
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-brand-black">{order.user.name || "—"}</p>
                    <p className="text-xs text-brand-gray-400 font-mono">
                      {order.user.email || ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-gray-600">
                    {order.paymentMethod}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-right font-medium text-brand-black">
                    {formatINR(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 border ${
                        ORDER_STATUS_COLORS[order.orderStatus] ||
                        "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 border ${
                        PAYMENT_STATUS_COLORS[order.paymentStatus] ||
                        "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-gray-400 text-right">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <p className="text-brand-gray-400 font-mono text-sm">No orders yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}