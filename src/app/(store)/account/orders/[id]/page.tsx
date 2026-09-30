"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { loginWithGoogle } from "@/lib/auth-actions";
import { XCircle, PackageX, CheckCircle, AlertCircle, Printer } from "lucide-react";
import AccountShell from "../../AccountShell";

interface OrderAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

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
  subtotal: number;
  couponCode: string | null;
  discountAmount: number;
  deliveryCharge: number;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryMethod: string;
  createdAt: string;
  items: OrderItem[];
  address: OrderAddress | null;
}

function formatINR(rupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

const ALL_STATUSES = ["PENDING", "PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Order Confirmed",
  PAID: "Payment Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  PACKED: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === "CANCELLED") {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
        <h3 className="font-bold text-lg mb-1">Order Cancelled</h3>
        <p className="text-sm">This order is no longer being processed.</p>
      </div>
    );
  }

  const currentIndex = ALL_STATUSES.indexOf(currentStatus);
  const statusIndex = currentIndex === -1 ? 0 : currentIndex;

  const steps = [
    { label: "Order Placed", isCompleted: statusIndex >= 0 },
    { label: "Payment Confirmed", isCompleted: statusIndex >= 1 },
    { label: "Processing", isCompleted: statusIndex >= 2 },
    { label: "Packed", isCompleted: statusIndex >= 3 },
    { label: "Shipped", isCompleted: statusIndex >= 4 },
    { label: "Delivered", isCompleted: statusIndex >= 5 },
  ];

  return (
    <div className="py-4">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={step.label} className="flex-1 relative">
            {index < steps.length - 1 && (
              <div className={`absolute top-4 left-1/2 w-full h-[2px] transition-colors duration-500 ${step.isCompleted && steps[index + 1].isCompleted ? 'bg-brand-navy' : 'bg-gray-200'}`} />
            )}
            <div className={`relative z-10 w-8 h-8 mx-auto rounded-full flex items-center justify-center border-2 transition-colors ${
              step.isCompleted ? "border-brand-navy bg-brand-navy text-white" : "border-gray-300 bg-white"
            }`}>
              {step.isCompleted && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <p className={`mt-2 text-xs text-center font-medium uppercase tracking-wider transition-colors ${step.isCompleted ? 'text-brand-navy font-semibold' : 'text-gray-400'}`}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 401) {
            await loginWithGoogle(`/account/orders/${id}`);
            return;
          }
          if (res.status === 404) {
            setError("Order not found.");
            return;
          }
          throw new Error("Failed to load order details");
        }
        const data = await res.json();
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) fetchOrder();
    return () => { cancelled = true; };
  }, [id]);

  const handleCancel = async () => {
    if (!order) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/account/orders/${order.id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to cancel order." });
        return;
      }
      setOrder({ ...order, orderStatus: "CANCELLED" });
      setMessage({ type: "success", text: "Order has been cancelled." });
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/account/orders/${order.id}/reorder`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to reorder." });
        return;
      }
      if (data.allAdded) {
        setMessage({ type: "success", text: "All items added to cart." });
      } else {
        const unavailable = data.items.filter((i: { added: boolean }) => !i.added);
        const reasons = unavailable.map((i: { productName: string; reason?: string }) => `${i.productName}: ${i.reason}`).join("; ");
        setMessage({ type: "error", text: `Some items unavailable: ${reasons}` });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const baseMsg = encodeURIComponent("Hi KNOOS, I need help regarding my order.");
    const orderMsg = encodeURIComponent(` Order #${order?.id.slice(0, 12)}`);
    window.open(`https://wa.me/917088808882?text=${baseMsg}${order ? orderMsg : ""}`, "_blank");
  };

  const isCancellable =
    order &&
    order.orderStatus !== "CANCELLED" &&
    order.orderStatus !== "DELIVERED" &&
    (order.paymentMethod === "COD"
      ? ["PROCESSING", "PACKED", "SHIPPED"].includes(order.orderStatus)
      : ["PENDING", "PAID"].includes(order.orderStatus));

  if (loading) {
    return (
      <AccountShell title="Order Details" subtitle="" active="orders" backHref="/account/orders">
        <div className="max-w-[1100px] w-full animate-pulse space-y-6">
          <div className="h-48 bg-brand-sky/20 rounded-xl" />
          <div className="h-64 bg-brand-sky/20 rounded-xl" />
        </div>
      </AccountShell>
    );
  }

  if (error || !order) {
    return (
      <AccountShell title="Order Details" active="orders" backHref="/account/orders">
        <div className="max-w-[1100px] w-full">
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm">
            {error || "Order not found"}
          </div>
          <Link href="/account/orders" className="inline-block mt-4 text-xs font-mono uppercase tracking-wider text-brand-navy hover:underline">
            Back to Orders
          </Link>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell
      title={`Order #${order.id.slice(0, 10).toUpperCase()}`}
      subtitle={`Placed on ${new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`}
      active="orders"
      backHref="/account/orders"
    >
      <div className="max-w-[1100px] w-full">
        {message && (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border mb-6 text-sm ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {message.type === "success" ? <CheckIcon /> : <AlertIcon />}
            {message.text}
          </div>
        )}

        {order.paymentStatus === "FAILED" && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-6">
            <h3 className="font-bold mb-1">Payment Failed</h3>
            <p className="text-sm">Your payment could not be completed. Please try again or contact support.</p>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={`px-3 py-1 rounded text-xs font-medium border ${STATUS_COLORS[order.orderStatus] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
            {STATUS_LABELS[order.orderStatus] || order.orderStatus}
          </span>
          <span className="text-sm text-brand-gray-500">
            {order.deliveryMethod === "FAST" ? "Fast Delivery" : "Standard Delivery"} &bull;{" "}
            {order.paymentMethod === "COD"
              ? (order.paymentStatus === "PAID" ? "Paid on delivery" : "Payment will be collected on delivery")
              : (order.paymentStatus === "PAID" ? "Prepaid" : order.paymentStatus)}
          </span>
        </div>

        {/* Timeline */}
        <div className="bg-white p-5 sm:p-7 rounded-xl border border-brand-sky-border/60 mb-8 shadow-xs">
          <OrderTimeline currentStatus={order.orderStatus} />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Link
            href={`/account/orders/${order.id}/invoice`}
            className="inline-flex items-center gap-2 border border-brand-navy/30 bg-white text-brand-navy hover:bg-brand-navy hover:text-white px-5 py-2.5 text-xs font-mono tracking-widest uppercase rounded-xl transition-colors shadow-xs"
          >
            <Printer size={15} />
            <span>Print Bill</span>
          </Link>

          {isCancellable && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 border border-red-200 text-red-600 px-5 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
            >
              <XCircle size={15} />
              {actionLoading ? "Cancelling..." : "Cancel Order"}
            </button>
          )}

          {order.orderStatus === "DELIVERED" && (
            <button
              onClick={handleReorder}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 bg-brand-navy text-white px-5 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-brand-blue rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              <PackageX size={15} />
              {actionLoading ? "Adding to Cart..." : "Buy Again"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        {/* Items + Address */}
        <div className="lg:col-span-2 space-y-8">
          {/* Items */}
          <div>
            <h2 className="text-lg font-serif text-brand-navy mb-4 pb-2 border-b border-brand-sky-border/60">
              Items ({order.items.length})
            </h2>
            <div className="divide-y divide-brand-sky-border/40">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-sm sm:text-base text-brand-dark">{item.productName}</h3>
                    <p className="text-xs text-brand-gray-500 mt-1">
                      Size: {item.size} &bull; Qty: {item.quantity}
                    </p>
                    <p className="text-xs text-brand-gray-400">{formatINR(item.price)} each</p>
                  </div>
                  <div className="font-semibold text-sm sm:text-base text-right text-brand-navy shrink-0">
                    {formatINR(item.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <h2 className="text-lg font-serif text-brand-navy mb-4 pb-2 border-b border-brand-sky-border/60">
              Delivery Address
            </h2>
            {order.address ? (
              <div className="text-sm text-brand-gray-700 leading-relaxed">
                <p className="font-medium text-brand-dark">{order.address.name}</p>
                <p>{order.address.address}</p>
                <p>
                  {order.address.city}, {order.address.state} {order.address.pincode}
                </p>
                <p>+91 {order.address.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-brand-gray-400">Address details unavailable.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-brand-sky/20 p-5 sm:p-6 rounded-xl border border-brand-sky-border/50">
            <h2 className="text-lg font-serif text-brand-navy mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4 pb-4 border-b border-brand-sky-border/60">
              <div className="flex justify-between">
                <span className="text-brand-gray-600">Subtotal</span>
                <span className="font-medium">{formatINR(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-brand-gray-600">Coupon ({order.couponCode})</span>
                  <span className="text-green-600 font-medium">-{formatINR(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-brand-gray-600">
                  Delivery ({order.deliveryMethod === "FAST" ? "Fast" : "Standard"})
                </span>
                <span className="font-medium">{formatINR(order.deliveryCharge)}</span>
              </div>
            </div>
            <div className="flex justify-between font-serif text-lg text-brand-navy">
              <span>Total</span>
              <span className="font-semibold">{formatINR(order.total)}</span>
            </div>
          </div>

          {/* Support */}
          <div className="bg-brand-cream/70 p-5 sm:p-6 rounded-xl border border-brand-cream-border/60">
            <h2 className="text-lg font-serif text-brand-navy mb-3">Need Help?</h2>
            <p className="text-xs text-brand-gray-600 mb-4 leading-relaxed">
              Returns accepted within 3 days of delivery for wrong or damaged products (requires continuous unboxing video).
            </p>
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-green-700 transition-colors rounded-xl shadow-sm"
            >
              WhatsApp Us
            </button>
            <div className="mt-4 text-sm text-brand-gray-700 space-y-1">
              <p><strong className="text-brand-navy">Email:</strong> KKSHOECOMPANY@GMAIL.COM</p>
              <p className="text-xs text-brand-gray-500">Hours: 10 AM – 7 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AccountShell>
);
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
