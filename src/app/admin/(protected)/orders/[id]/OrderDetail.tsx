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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-3xl">Order</h1>
            <span className="font-mono text-xs text-brand-gray-400">
              #{currentOrder.id.slice(0, 12)}
            </span>
          </div>
          <p className="text-brand-gray-500 font-mono text-sm">
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
          className="px-5 py-2 border border-brand-gray-200 text-sm font-mono uppercase tracking-wide hover:border-brand-black transition-colors"
        >
          Back to Orders
        </Link>
      </div>

      {/* Status feedback message */}
      {message && (
        <div
          className={`px-6 py-4 text-sm font-mono mb-6 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-6 py-4">
              <h2 className="font-serif text-lg">Order Items</h2>
            </div>
            <div className="divide-y divide-brand-gray-50">
              {currentOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-brand-gray-400 font-mono mt-0.5">
                      Size {item.size} x {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">
                      {formatINR(item.price)} each
                    </p>
                    <p className="font-mono text-sm font-medium">
                      {formatINR(item.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-brand-gray-200 px-6 py-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-brand-gray-500 font-mono">Subtotal</span>
                <span className="font-mono">{formatINR(currentOrder.subtotal)}</span>
              </div>
              {currentOrder.discountAmount > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-brand-gray-500 font-mono">
                    Coupon ({currentOrder.couponCode})
                  </span>
                  <span className="font-mono">
                    -{formatINR(currentOrder.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-2">
                <span className="text-brand-gray-500 font-mono">
                  Delivery ({currentOrder.deliveryMethod})
                </span>
                <span className="font-mono">
                  {formatINR(currentOrder.deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between font-medium pt-3 border-t border-brand-gray-100">
                <span className="font-mono uppercase text-sm">Total</span>
                <span className="font-mono">{formatINR(currentOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Status + Customer + Shipping + Payment */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-6 py-4">
              <h2 className="font-serif text-lg">Customer</h2>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center gap-3">
                {currentOrder.user.image && (
                  <img
                    src={currentOrder.user.image}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-brand-gray-100"
                  />
                )}
                <div>
                  <p className="font-medium">{currentOrder.user.name || "—"}</p>
                  <p className="text-xs text-brand-gray-400 font-mono">
                    {currentOrder.user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Control */}
          <div className="bg-white border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-serif text-lg">Order Status</h2>
              <span
                className={`text-xs font-mono uppercase px-2 py-0.5 border ${
                  ORDER_STATUS_COLORS[currentOrder.orderStatus as OrderStatus] ||
                  "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {currentOrder.orderStatus}
              </span>
            </div>
            <div className="px-6 py-4 space-y-2">
              <label className="text-xs font-mono text-brand-gray-500 uppercase block">
                Change Status
              </label>
              <select
                value={currentOrder.orderStatus}
                onChange={(e) => handleStatusChange("orderStatus", e.target.value)}
                disabled={updating === "orderStatus"}
                className={`w-full border px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-black transition-colors disabled:opacity-50 ${
                  ORDER_STATUS_COLORS[currentOrder.orderStatus as OrderStatus] ||
                  "bg-white border-brand-gray-200"
                }`}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s] || s}
                  </option>
                ))}
              </select>
              <p className="text-xs text-brand-gray-400 font-mono">
                Admins may transition between any order statuses.
              </p>
            </div>
          </div>

          {/* Payment Status Control */}
          <div className="bg-white border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-serif text-lg">Payment Status</h2>
              <span
                className={`text-xs font-mono uppercase px-2 py-0.5 border ${
                  PAYMENT_STATUS_COLORS[currentOrder.paymentStatus as PaymentStatus] ||
                  "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {currentOrder.paymentStatus}
              </span>
            </div>
            <div className="px-6 py-4 space-y-2">
              <label className="text-xs font-mono text-brand-gray-500 uppercase block">
                Change Status
              </label>
              <select
                value={currentOrder.paymentStatus}
                onChange={(e) => handleStatusChange("paymentStatus", e.target.value)}
                disabled={updating === "paymentStatus"}
                className={`w-full border px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-black transition-colors disabled:opacity-50 ${
                  PAYMENT_STATUS_COLORS[currentOrder.paymentStatus as PaymentStatus] ||
                  "bg-white border-brand-gray-200"
                }`}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PAYMENT_STATUS_LABELS[s] || s}
                  </option>
                ))}
              </select>
              <p className="text-xs text-brand-gray-400 font-mono">
                Manual status changes do not initiate payment capture or refunds.
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-6 py-4">
              <h2 className="font-serif text-lg">Shipping Address</h2>
            </div>
            <div className="px-6 py-4 text-sm font-mono text-brand-gray-600">
              {currentOrder.address ? (
                <>
                  <p className="font-medium text-black mb-1">
                    {currentOrder.address.name}
                  </p>
                  <p>{currentOrder.address.address}</p>
                  <p>
                    {currentOrder.address.city}, {currentOrder.address.state}{" "}
                    {currentOrder.address.pincode}
                  </p>
                  <p className="mt-2">Phone: {currentOrder.address.phone}</p>
                </>
              ) : (
                <p className="text-brand-gray-400">Address snapshot unavailable.</p>
              )}
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="bg-white border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-6 py-4">
              <h2 className="font-serif text-lg">Payment Details</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-brand-gray-500 font-mono">Method</span>
                <span className="font-medium font-mono">
                  {currentOrder.paymentMethod === "COD"
                    ? "Cash on Delivery (COD)"
                    : "Online Payment"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-gray-500 font-mono">Collection State</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
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
              {currentOrder.paymentMethod === "COD" && (
                <p className="text-xs text-brand-gray-500 font-mono">
                  {currentOrder.paymentStatus === "PAID"
                    ? "Cash collected on delivery."
                    : "Payment will be collected on delivery."}
                </p>
              )}
              <div className="border-t border-brand-gray-100 pt-3">
                <p className="text-xs text-brand-gray-400 font-mono">
                  Note: Manual status changes do not initiate payment capture or refunds.
                </p>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-6 py-4">
              <h2 className="font-serif text-lg">Delivery</h2>
            </div>
            <div className="px-6 py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-gray-500 font-mono">Method</span>
                <span className="font-mono">{currentOrder.deliveryMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-gray-500 font-mono">Charge</span>
                <span className="font-mono">
                  {formatINR(currentOrder.deliveryCharge)}
                </span>
              </div>
            </div>
          </div>

          {/* Razorpay info */}
          {currentOrder.razorpayOrderId && (
            <div className="bg-white border border-brand-gray-200">
              <div className="border-b border-brand-gray-200 px-6 py-4">
                <h2 className="font-serif text-lg">Gateway Reference</h2>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <span className="text-xs text-brand-gray-400 font-mono block">
                    Razorpay Order ID
                  </span>
                  <p className="font-mono text-xs break-all">
                    {currentOrder.razorpayOrderId}
                  </p>
                </div>
                {currentOrder.razorpayPaymentId && (
                  <div>
                    <span className="text-xs text-brand-gray-400 font-mono block">
                      Razorpay Payment ID
                    </span>
                    <p className="font-mono text-xs break-all">
                      {currentOrder.razorpayPaymentId}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white max-w-md w-full p-6 border border-brand-gray-200 shadow-xl space-y-4">
            <h3 className="font-serif text-xl">{confirmModal.title}</h3>
            <p className="text-sm font-mono text-brand-gray-600 leading-relaxed">
              {confirmModal.description}
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-brand-gray-100">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-brand-gray-200 text-xs font-mono uppercase tracking-wide hover:border-brand-black transition-colors"
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
                className="px-4 py-2 bg-brand-black text-white text-xs font-mono uppercase tracking-wide hover:bg-neutral-800 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
