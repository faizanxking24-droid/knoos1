"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const ORDER_STATUSES = ["PENDING", "PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

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

export default function AdminOrderDetail({ order }: OrderDetailProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const updateStatus = async (field: "orderStatus" | "paymentStatus", value: string) => {
    setUpdating(field);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, [field]: value }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch {
      alert("Network error");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-3xl">Order</h1>
            <span className="font-mono text-xs text-brand-gray-400">#{order.id.slice(0, 12)}</span>
          </div>
          <p className="text-brand-gray-500 font-mono text-sm">
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-6 py-4">
              <h2 className="font-serif text-lg">Order Items</h2>
            </div>
            <div className="divide-y divide-brand-gray-50">
              {order.items.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-brand-gray-400 font-mono mt-0.5">
                      Size {item.size} x {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{formatINR(item.price)} each</p>
                    <p className="font-mono text-sm font-medium">{formatINR(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-brand-gray-200 px-6 py-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-brand-gray-500 font-mono">Subtotal</span>
                <span className="font-mono">{formatINR(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-brand-gray-500 font-mono">Coupon ({order.couponCode})</span>
                  <span className="font-mono">-{formatINR(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-2">
                <span className="text-brand-gray-500 font-mono">Delivery ({order.deliveryMethod})</span>
                <span className="font-mono">{formatINR(order.deliveryCharge)}</span>
              </div>
              <div className="flex justify-between font-medium pt-3 border-t border-brand-gray-100">
                <span className="font-mono uppercase text-sm">Total</span>
                <span className="font-mono">{formatINR(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Status + Customer + Razorpay */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-6 py-4">
              <h2 className="font-serif text-lg">Customer</h2>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center gap-3">
                {order.user.image && (
                  <img
                    src={order.user.image}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-brand-gray-100"
                  />
                )}
                <div>
                  <p className="font-medium">{order.user.name || "—"}</p>
                  <p className="text-xs text-brand-gray-400 font-mono">{order.user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-white border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-6 py-4">
              <h2 className="font-serif text-lg">Order Status</h2>
            </div>
            <div className="px-6 py-4">
              <select
                value={order.orderStatus}
                onChange={(e) => updateStatus("orderStatus", e.target.value)}
                disabled={updating === "orderStatus" || order.orderStatus === "DELIVERED" || order.orderStatus === "CANCELLED"}
                className={`w-full border px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-black transition-colors disabled:opacity-50 ${ORDER_STATUS_COLORS[order.orderStatus] || "bg-white border-brand-gray-200"}`}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-6 py-4">
              <h2 className="font-serif text-lg">Shipping Address</h2>
            </div>
            <div className="px-6 py-4 text-sm font-mono text-brand-gray-600">
              {order.address ? (
                <>
                  <p className="font-medium text-black mb-1">{order.address.name}</p>
                  <p>{order.address.address}</p>
                  <p>{order.address.city}, {order.address.state} {order.address.pincode}</p>
                  <p className="mt-2">Phone: {order.address.phone}</p>
                </>
              ) : (
                <p className="text-brand-gray-400">Address snapshot unavailable.</p>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-brand-gray-200">
            <div className="border-b border-brand-gray-200 px-6 py-4">
              <h2 className="font-serif text-lg">Payment</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-brand-gray-500 font-mono">Method</span>
                <span className="font-medium">{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-gray-500 font-mono">Status</span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${PAYMENT_STATUS_COLORS[order.paymentStatus] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {order.paymentMethod === "COD" && order.paymentStatus === "PENDING"
                    ? "COD — Pending Collection"
                    : order.paymentStatus}
                </span>
              </div>
              {order.paymentMethod === "COD" && (
                <p className="text-xs text-brand-gray-500">
                  {order.paymentStatus === "PAID"
                    ? "Cash collected on delivery."
                    : "Payment will be collected on delivery."}
                </p>
              )}
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
                <span className="font-mono">{order.deliveryMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-gray-500 font-mono">Charge</span>
                <span className="font-mono">{formatINR(order.deliveryCharge)}</span>
              </div>
            </div>
          </div>

          {/* Razorpay info */}
          {order.razorpayOrderId && (
            <div className="bg-white border border-brand-gray-200">
              <div className="border-b border-brand-gray-200 px-6 py-4">
                <h2 className="font-serif text-lg">Payment</h2>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <span className="text-xs text-brand-gray-400 font-mono block">Razorpay Order ID</span>
                  <p className="font-mono text-xs break-all">{order.razorpayOrderId}</p>
                </div>
                {order.razorpayPaymentId && (
                  <div>
                    <span className="text-xs text-brand-gray-400 font-mono block">Razorpay Payment ID</span>
                    <p className="font-mono text-xs break-all">{order.razorpayPaymentId}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
