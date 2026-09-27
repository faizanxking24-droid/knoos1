"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  OrderStatus,
  PaymentStatus,
} from "@/lib/constants";
import { AlertTriangle, ArrowLeft, CreditCard, MapPin, ShieldCheck, User } from "lucide-react";

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;

interface OrderItem {
  id: string;
  productName: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  userId: string;
  subtotal: number;
  couponCode: string | null;
  discountAmount: number;
  deliveryCharge: number;
  total: number;
  deliveryMethod: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null; image: string | null };
  items: OrderItem[];
  address: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
}

interface OrderDetailProps {
  order: Order;
}

function formatINR(rupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export default function AdminOrderDetail({ order: initialOrder }: OrderDetailProps) {
  const [currentOrder, setCurrentOrder] = useState<Order>(initialOrder);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    field: "orderStatus" | "paymentStatus";
    value: string;
    title: string;
    description: string;
  } | null>(null);

  const executeStatusUpdate = async (
    field: "orderStatus" | "paymentStatus",
    value: string
  ) => {
    setUpdating(field);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${currentOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentOrder.id, [field]: value }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || `Failed to update ${field}`,
        });
        return;
      }

      // Update local state immediately with returned order
      setCurrentOrder((prev) => ({
        ...prev,
        ...data,
      }));

      setMessage({
        type: "success",
        text: `${field === "orderStatus" ? "Order" : "Payment"} status successfully updated to ${value}.`,
      });
    } catch {
      setMessage({ type: "error", text: "Network error while updating status." });
    } finally {
      setUpdating(null);
    }
  };

  const handleStatusChange = (
    field: "orderStatus" | "paymentStatus",
    value: string
  ) => {
    if (value === currentOrder[field]) return;

    // High-impact confirmation dialogs for terminal or financial operations
    if (value === "CANCELLED") {
      setConfirmModal({
        field,
        value,
        title: "Confirm Order Cancellation",
        description:
          "Are you sure you want to mark this order as CANCELLED? This updates the record to Cancelled. Manual status updates do not trigger automated refunds or inventory alterations.",
      });
      return;
    }

    if (value === "DELIVERED") {
      setConfirmModal({
        field,
        value,
        title: "Confirm Order Delivery",
        description:
          "Are you sure you want to mark this order as DELIVERED? Note: Order status and Payment status are independent. Payment status will NOT be changed automatically.",
      });
      return;
    }

    if (value === "REFUNDED") {
      setConfirmModal({
        field,
        value,
        title: "Confirm Payment Refund Status",
        description:
          "Are you sure you want to mark payment status as REFUNDED? Note: This updates the database record only. Actual gateway refunds must be issued separately via your Razorpay Dashboard.",
      });
      return;
    }

    // Direct transition for non-critical statuses
    executeStatusUpdate(field, value);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-gray-200/80">
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="font-serif text-3xl sm:text-4xl text-brand-navy font-normal tracking-tight">
              Order #{currentOrder.id.slice(0, 8)}
            </h1>
            <span
              className={`text-xs font-mono uppercase px-2.5 py-0.5 rounded-full border font-medium ${
                ORDER_STATUS_COLORS[currentOrder.orderStatus as OrderStatus] ||
                "bg-gray-50 text-gray-700 border-gray-200"
              }`}
            >
              {ORDER_STATUS_LABELS[currentOrder.orderStatus as OrderStatus] || currentOrder.orderStatus}
            </span>
            <span
              className={`text-xs font-mono uppercase px-2.5 py-0.5 rounded-full border font-medium ${
                PAYMENT_STATUS_COLORS[currentOrder.paymentStatus as PaymentStatus] ||
                "bg-gray-50 text-gray-700 border-gray-200"
              }`}
            >
              {PAYMENT_STATUS_LABELS[currentOrder.paymentStatus as PaymentStatus] || currentOrder.paymentStatus}
            </span>
          </div>
          <p className="text-brand-gray-500 font-sans text-xs sm:text-sm">
            Placed on{" "}
            {new Date(currentOrder.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 border border-brand-gray-200 hover:border-brand-navy rounded-xl text-xs font-mono uppercase tracking-wider text-brand-navy transition-colors font-medium self-start sm:self-auto"
        >
          <ArrowLeft size={14} />
          <span>Back to Orders</span>
        </Link>
      </div>

      {/* Status feedback message */}
      {message && (
        <div
          className={`px-5 py-3.5 text-xs font-mono rounded-xl border flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-brand-gray-400 hover:text-brand-navy font-mono text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Order Items & Pricing Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-brand-gray-200/90 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="border-b border-brand-gray-100 px-6 py-4.5 flex items-center justify-between bg-[#fafbfc]">
              <h2 className="font-serif text-xl text-brand-navy font-normal">Order Items</h2>
              <span className="text-xs font-mono text-brand-gray-400 uppercase tracking-wider">
                {currentOrder.items.reduce((s, i) => s + i.quantity, 0)} Units
              </span>
            </div>
            <div className="divide-y divide-brand-gray-100">
              {currentOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="px-6 py-4.5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-brand-navy text-sm sm:text-base truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-brand-gray-400 font-mono mt-0.5">
                      Size: UK {item.size} • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs text-brand-gray-400">
                      {formatINR(item.price)} each
                    </p>
                    <p className="font-mono text-sm font-semibold text-brand-navy mt-0.5">
                      {formatINR(item.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-brand-gray-100 px-6 py-5 bg-[#fbfcfd] space-y-3">
              <div className="flex justify-between text-sm text-brand-gray-600">
                <span>Subtotal</span>
                <span className="font-mono font-medium text-brand-dark">{formatINR(currentOrder.subtotal)}</span>
              </div>
              {currentOrder.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>Coupon ({currentOrder.couponCode})</span>
                  <span className="font-mono font-semibold">-{formatINR(currentOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-brand-gray-600">
                <span>Delivery ({currentOrder.deliveryMethod})</span>
                <span className="font-mono font-medium text-brand-dark">{formatINR(currentOrder.deliveryCharge)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-4 border-t border-brand-gray-200">
                <span className="font-mono text-xs uppercase tracking-wider text-brand-dark font-medium">Total Amount</span>
                <span className="font-serif text-2xl font-bold text-brand-navy">{formatINR(currentOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Operations & Information Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Management Panel */}
          <div className="bg-white border border-brand-gray-200/90 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-5">
            <div className="border-b border-brand-gray-100 pb-3 flex items-center justify-between">
              <h2 className="font-serif text-xl text-brand-navy font-normal">Status Management</h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-navy bg-brand-sky px-2 py-0.5 rounded border border-brand-sky-border/60 font-semibold">
                Admin Control
              </span>
            </div>

            {/* Order Status Control */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-brand-gray-400 uppercase tracking-wider block">
                Order Fulfillment Status
              </label>
              <select
                value={currentOrder.orderStatus}
                onChange={(e) => handleStatusChange("orderStatus", e.target.value)}
                disabled={updating === "orderStatus"}
                className={`w-full border px-4 py-2.5 text-xs font-mono font-medium rounded-xl focus:outline-none focus:border-brand-navy transition-colors cursor-pointer disabled:opacity-50 ${
                  ORDER_STATUS_COLORS[currentOrder.orderStatus as OrderStatus] ||
                  "bg-white border-brand-gray-200 text-brand-dark"
                }`}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s] || s}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Status Control */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-brand-gray-400 uppercase tracking-wider block">
                Payment Collection Status
              </label>
              <select
                value={currentOrder.paymentStatus}
                onChange={(e) => handleStatusChange("paymentStatus", e.target.value)}
                disabled={updating === "paymentStatus"}
                className={`w-full border px-4 py-2.5 text-xs font-mono font-medium rounded-xl focus:outline-none focus:border-brand-navy transition-colors cursor-pointer disabled:opacity-50 ${
                  PAYMENT_STATUS_COLORS[currentOrder.paymentStatus as PaymentStatus] ||
                  "bg-white border-brand-gray-200 text-brand-dark"
                }`}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PAYMENT_STATUS_LABELS[s] || s}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-brand-gray-400 font-mono pt-1">
                Manual status changes do not initiate payment capture or refunds.
              </p>
            </div>
          </div>

          {/* Customer Card */}
          <div className="bg-white border border-brand-gray-200/90 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="border-b border-brand-gray-100 pb-3 mb-4">
              <h2 className="font-serif text-lg text-brand-navy font-normal">Customer</h2>
            </div>
            <div className="flex items-center gap-3">
              {currentOrder.user.image ? (
                <img
                  src={currentOrder.user.image}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-brand-gray-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-sky/60 border border-brand-sky-border/80 flex items-center justify-center font-mono text-sm text-brand-navy font-semibold">
                  {currentOrder.user.name ? currentOrder.user.name.charAt(0).toUpperCase() : "C"}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-brand-navy truncate">
                  {currentOrder.user.name || "—"}
                </p>
                <p className="text-xs text-brand-gray-400 font-mono truncate">
                  {currentOrder.user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Address Card */}
          <div className="bg-white border border-brand-gray-200/90 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="border-b border-brand-gray-100 pb-3 mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg text-brand-navy font-normal">Shipping Address</h2>
              <MapPin size={16} className="text-brand-gray-400" />
            </div>
            {currentOrder.address ? (
              <div className="text-sm font-sans text-brand-gray-600 leading-relaxed space-y-1">
                <p className="font-medium text-brand-dark">{currentOrder.address.name}</p>
                <p>{currentOrder.address.address}</p>
                <p>
                  {currentOrder.address.city}, {currentOrder.address.state} —{" "}
                  <span className="font-mono text-brand-navy font-medium">
                    {currentOrder.address.pincode}
                  </span>
                </p>
                <p className="pt-1.5 font-mono text-xs text-brand-gray-400">
                  Phone: +91 {currentOrder.address.phone}
                </p>
              </div>
            ) : (
              <p className="text-brand-gray-400 font-mono text-xs">Address snapshot unavailable.</p>
            )}
          </div>

          {/* Payment & Gateway Information */}
          <div className="bg-white border border-brand-gray-200/90 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3.5">
            <div className="border-b border-brand-gray-100 pb-3">
              <h2 className="font-serif text-lg text-brand-navy font-normal">Payment Information</h2>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-gray-400 font-mono text-xs uppercase tracking-wider">Method</span>
              <span className="font-mono text-xs font-semibold text-brand-navy">
                {currentOrder.paymentMethod === "COD"
                  ? "Cash on Delivery (COD)"
                  : "Online Payment"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-gray-400 font-mono text-xs uppercase tracking-wider">Status</span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${
                  PAYMENT_STATUS_COLORS[currentOrder.paymentStatus as PaymentStatus] ||
                  "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {currentOrder.paymentMethod === "COD" &&
                currentOrder.paymentStatus === "PENDING"
                  ? "COD — Pending Collection"
                  : currentOrder.paymentStatus}
              </span>
            </div>

            {currentOrder.razorpayOrderId && (
              <div className="pt-3 border-t border-brand-gray-100 space-y-2">
                <div>
                  <span className="text-[10px] text-brand-gray-400 font-mono uppercase tracking-wider block mb-0.5">
                    Razorpay Order ID
                  </span>
                  <div className="p-2 bg-[#fafbfc] border border-brand-gray-200/80 rounded-lg font-mono text-xs text-brand-navy break-all select-all">
                    {currentOrder.razorpayOrderId}
                  </div>
                </div>
                {currentOrder.razorpayPaymentId && (
                  <div>
                    <span className="text-[10px] text-brand-gray-400 font-mono uppercase tracking-wider block mb-0.5">
                      Razorpay Payment ID
                    </span>
                    <div className="p-2 bg-[#fafbfc] border border-brand-gray-200/80 rounded-lg font-mono text-xs text-brand-navy break-all select-all">
                      {currentOrder.razorpayPaymentId}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/40 backdrop-blur-xs">
          <div className="bg-white border border-brand-gray-200 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-serif text-xl text-brand-navy font-normal">{confirmModal.title}</h3>
                <span className="text-[11px] font-mono uppercase tracking-wider text-brand-gray-400">
                  Target status: {confirmModal.value}
                </span>
              </div>
            </div>
            <p className="text-sm font-sans text-brand-gray-600 leading-relaxed pt-1">
              {confirmModal.description}
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-brand-gray-100">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-brand-gray-300 rounded-xl text-xs font-mono uppercase tracking-wider text-brand-dark hover:bg-brand-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const { field, value } = confirmModal;
                  setConfirmModal(null);
                  executeStatusUpdate(field, value);
                }}
                className="px-5 py-2 bg-brand-navy hover:bg-[#1a365d] text-white text-xs font-mono uppercase tracking-wider rounded-xl transition-colors shadow-xs"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
