"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  OrderStatus,
  PaymentStatus,
} from "@/lib/constants";
import { AlertTriangle, ChevronRight, Search, ShieldCheck } from "lucide-react";

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

const PAYMENT_METHODS = ["ONLINE", "COD"] as const;

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
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatINR(rupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    orderId: string;
    field: "orderStatus" | "paymentStatus";
    value: string;
    title: string;
    description: string;
  } | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(paymentFilter ? { payment: paymentFilter } : {}),
        ...(methodFilter ? { method: methodFilter } : {}),
        ...(searchQuery ? { q: searchQuery } : {}),
      });

      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) {
        if (res.status === 403) {
          window.location.href = "/";
          return;
        }
        throw new Error("Failed to fetch orders");
      }
      const data: OrdersResponse = await res.json();
      setOrders(data.orders);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, paymentFilter, methodFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, paymentFilter, methodFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const executeStatusUpdate = async (
    orderId: string,
    field: "orderStatus" | "paymentStatus",
    value: string
  ) => {
    setUpdatingOrder(orderId);
    setActionNotice(null);
    try {
      const body: Record<string, string> = { id: orderId };
      body[field] = value;

      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionNotice({
          type: "error",
          text: data.error || `Failed to update ${field}`,
        });
        return;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, [field]: value } : o))
      );

      setActionNotice({
        type: "success",
        text: `Order #${orderId.slice(0, 8)} ${field === "orderStatus" ? "order" : "payment"} status updated to ${value}.`,
      });
    } catch {
      setActionNotice({
        type: "error",
        text: "Network error while updating status.",
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const requestStatusUpdate = (
    orderId: string,
    field: "orderStatus" | "paymentStatus",
    value: string
  ) => {
    const current = orders.find((o) => o.id === orderId);
    if (!current || current[field] === value) return;

    if (value === "CANCELLED") {
      setConfirmModal({
        orderId,
        field,
        value,
        title: "Confirm Order Cancellation",
        description:
          "Are you sure you want to mark this order as CANCELLED? This action updates the record to Cancelled.",
      });
      return;
    }

    if (value === "DELIVERED") {
      setConfirmModal({
        orderId,
        field,
        value,
        title: "Confirm Order Delivery",
        description:
          "Are you sure you want to mark this order as DELIVERED? Note: Payment status is independent and will not be changed automatically.",
      });
      return;
    }

    if (value === "REFUNDED") {
      setConfirmModal({
        orderId,
        field,
        value,
        title: "Confirm Payment Refund Status",
        description:
          "Are you sure you want to mark payment status as REFUNDED? Note: This updates the database record only. Gateway refunds must be issued separately via your Razorpay Dashboard.",
      });
      return;
    }

    executeStatusUpdate(orderId, field, value);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-brand-gray-200/80">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-gray-400 block mb-1">
            Operations
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-brand-navy font-normal tracking-tight">
            Orders
          </h1>
          <p className="text-brand-gray-500 font-sans text-sm mt-1">
            Manage fulfillment and payment status
          </p>
        </div>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div
          className={`px-5 py-3.5 text-xs font-mono rounded-xl border flex items-center justify-between ${
            actionNotice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>{actionNotice.text}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-brand-gray-400 hover:text-brand-navy font-mono text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white border border-brand-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-brand-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order ID, email, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-brand-gray-200 rounded-xl focus:outline-none focus:border-brand-navy transition-colors bg-white font-sans placeholder:text-brand-gray-400"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-brand-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-brand-navy transition-colors bg-white text-brand-dark cursor-pointer"
            >
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s] || s}
                </option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="border border-brand-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-brand-navy transition-colors bg-white text-brand-dark cursor-pointer"
            >
              <option value="">All Payments</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PAYMENT_STATUS_LABELS[s] || s}
                </option>
              ))}
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="border border-brand-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-brand-navy transition-colors bg-white text-brand-dark cursor-pointer"
            >
              <option value="">All Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m === "COD" ? "Cash on Delivery" : "Online"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Orders Table Container */}
      <div className="bg-white border border-brand-gray-200/90 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block w-8 h-8 border-2 border-brand-navy border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-brand-gray-400 font-mono text-xs uppercase tracking-widest">
              Loading orders...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <p className="font-serif text-2xl text-brand-navy mb-1 font-normal">No orders found.</p>
            <p className="text-brand-gray-400 font-mono text-xs uppercase tracking-wider">
              {searchQuery || statusFilter || paymentFilter || methodFilter
                ? "Try adjusting your search criteria or active filters."
                : "New customer orders will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gray-100 bg-[#fafbfc] text-left">
                  <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.15em] text-brand-gray-400 font-medium">
                    Order ID
                  </th>
                  <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.15em] text-brand-gray-400 font-medium">
                    Customer
                  </th>
                  <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.15em] text-brand-gray-400 font-medium text-center">
                    Items
                  </th>
                  <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.15em] text-brand-gray-400 font-medium text-right">
                    Total
                  </th>
                  <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.15em] text-brand-gray-400 font-medium">
                    Order Status
                  </th>
                  <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.15em] text-brand-gray-400 font-medium">
                    Method
                  </th>
                  <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.15em] text-brand-gray-400 font-medium">
                    Payment Status
                  </th>
                  <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.15em] text-brand-gray-400 font-medium">
                    Date
                  </th>
                  <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.15em] text-brand-gray-400 font-medium text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#fafbfc]/80 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-xs font-medium text-brand-navy">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        {order.user.image ? (
                          <img
                            src={order.user.image}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-brand-gray-200"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-brand-sky/60 border border-brand-sky-border/80 flex items-center justify-center font-mono text-[10px] text-brand-navy font-semibold">
                            {order.user.name ? order.user.name.charAt(0).toUpperCase() : "C"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-brand-dark truncate">
                            {order.user.name || "Customer"}
                          </p>
                          <p className="text-xs text-brand-gray-400 font-mono truncate">
                            {order.user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-center text-brand-gray-600 font-medium">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-right font-semibold text-brand-navy">
                      {formatINR(order.total)}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={order.orderStatus}
                        onChange={(e) =>
                          requestStatusUpdate(order.id, "orderStatus", e.target.value)
                        }
                        disabled={updatingOrder === order.id}
                        className={`text-xs px-2.5 py-1 rounded-full border font-mono font-medium focus:outline-none transition-colors cursor-pointer disabled:opacity-50 ${
                          ORDER_STATUS_COLORS[order.orderStatus as OrderStatus] ||
                          "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {ORDER_STATUS_LABELS[s] || s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
                          order.paymentMethod === "COD"
                            ? "bg-orange-50 text-orange-700 border-orange-200/80"
                            : "bg-blue-50 text-blue-700 border-blue-200/80"
                        }`}
                      >
                        {order.paymentMethod === "COD" ? "COD" : "Online"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) =>
                          requestStatusUpdate(order.id, "paymentStatus", e.target.value)
                        }
                        disabled={updatingOrder === order.id}
                        className={`text-xs px-2.5 py-1 rounded-full border font-mono font-medium focus:outline-none transition-colors cursor-pointer disabled:opacity-50 ${
                          PAYMENT_STATUS_COLORS[order.paymentStatus as PaymentStatus] ||
                          "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {PAYMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {PAYMENT_STATUS_LABELS[s] || s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-brand-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-brand-navy hover:text-brand-blue border border-brand-gray-200 hover:border-brand-navy px-3 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        <span>View</span>
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-brand-gray-100 px-6 py-4 flex items-center justify-between">
            <p className="text-brand-gray-400 font-mono text-xs">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-1.5 border border-brand-gray-200 rounded-lg text-xs font-mono uppercase tracking-wider disabled:opacity-30 hover:border-brand-navy transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-1.5 border border-brand-gray-200 rounded-lg text-xs font-mono uppercase tracking-wider disabled:opacity-30 hover:border-brand-navy transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Premium Confirmation Modal */}
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
                  const { orderId, field, value } = confirmModal;
                  setConfirmModal(null);
                  executeStatusUpdate(orderId, field, value);
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
