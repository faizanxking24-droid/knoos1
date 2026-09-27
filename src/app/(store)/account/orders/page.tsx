"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { loginWithGoogle } from "@/lib/auth-actions";
import AccountShell from "../AccountShell";

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
}

function formatINR(rupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  PACKED: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Order Confirmed",
  PAID: "Payment Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 401) {
            await loginWithGoogle("/account/orders");
            return;
          }
          throw new Error("Failed to fetch orders");
        }
        const data = await res.json();
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AccountShell
      title="My Orders"
      subtitle="View and track your orders"
      active="orders"
    >
      <div className="max-w-[1100px] w-full">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 bg-brand-sky/20 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </AccountShell>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="border border-brand-sky-border/60 rounded-xl bg-white overflow-hidden shadow-xs">
      {/* Order Header Bar */}
      <div className="bg-brand-sky/20 px-5 sm:px-6 py-4 border-b border-brand-sky-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:gap-8">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-brand-gray-400 mb-0.5">
                Order Placed
              </p>
              <p className="text-sm font-medium text-brand-navy">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-brand-gray-400 mb-0.5">
                Total
              </p>
              <p className="text-sm font-semibold text-brand-navy">
                {formatINR(order.total)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-brand-gray-400 mb-0.5">
                Order #
              </p>
              <p className="text-xs sm:text-sm font-mono text-brand-gray-700 font-medium">
                {order.id.slice(0, 10).toUpperCase()}
              </p>
            </div>
          </div>

          <Link
            href={`/account/orders/${order.id}`}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 border border-brand-navy/30 bg-white text-brand-navy px-4 py-2 text-xs font-mono uppercase tracking-wider hover:bg-brand-navy hover:text-white transition-colors rounded-lg font-medium shadow-xs self-start sm:self-auto"
          >
            <span>View Details</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Order Body */}
      <div className="px-5 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
          <div>
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${
                STATUS_COLORS[order.orderStatus] ||
                "bg-gray-100 text-gray-800 border-gray-200"
              }`}
            >
              {STATUS_LABELS[order.orderStatus] || order.orderStatus}
            </span>
            <p className="text-sm text-brand-gray-600 mt-2 font-medium">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""} &bull;{" "}
              {order.deliveryMethod === "FAST"
                ? "Fast Delivery"
                : "Standard Delivery"}{" "}
              &bull;{" "}
              {order.paymentMethod === "COD"
                ? order.paymentStatus === "PAID"
                  ? "Paid on delivery"
                  : "Pay on delivery"
                : order.paymentStatus === "PAID"
                ? "Prepaid"
                : order.paymentStatus}
            </p>
            <p className="text-xs text-brand-gray-400 mt-1 line-clamp-1">
              {order.items
                .map((i) => `${i.productName} (x${i.quantity})`)
                .join(", ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="border border-brand-sky-border/60 rounded-xl bg-white py-12 px-6 text-center shadow-xs">
      <div className="w-12 h-12 rounded-full bg-brand-sky/40 text-brand-navy flex items-center justify-center mx-auto mb-3">
        <ShoppingBag size={22} strokeWidth={1.75} />
      </div>
      <h3 className="font-serif text-xl mb-1.5 text-brand-navy">
        No orders yet
      </h3>
      <p className="text-brand-gray-500 text-sm mb-5 max-w-sm mx-auto">
        Your orders will appear here once you make your first purchase.
      </p>
      <Link
        href="/search"
        className="inline-block bg-brand-navy text-white px-6 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-brand-blue rounded-xl transition-colors shadow-xs"
      >
        Start Shopping
      </Link>
    </div>
  );
}
