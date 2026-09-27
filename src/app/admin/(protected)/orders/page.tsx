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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Orders</h1>
        <p className="text-brand-gray-500 font-mono text-sm mt-1">
          Manage customer orders and payment statuses
        </p>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div
          className={`px-6 py-4 text-sm font-mono mb-6 border ${
            actionNotice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {actionNotice.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-brand-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by order ID, email, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-brand-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-brand-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
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
            className="border border-brand-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
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
            className="border border-brand-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
          >
            <option value="">All Payment Methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m === "COD" ? "Cash on Delivery (COD)" : "Online"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="bg-white border border-brand-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-brand-gray-400 font-mono text-sm">Loading...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-brand-gray-400 font-mono text-sm">
              {searchQuery || statusFilter || paymentFilter || methodFilter
                ? "No orders match your filters"
                : "No orders yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gray-100 text-left">
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">
                    Order ID
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">
                    Customer
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">
                    Items
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-right">
                    Total
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">
                    Order Status
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">
                    Method
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">
                    Payment Status
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-brand-gray-50 hover:bg-brand-gray-50"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {order.user.image && (
                          <img
                            src={order.user.image}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover border border-brand-gray-100"
                          />
                        )}
                        <div>
                          <p className="text-sm">{order.user.name || "—"}</p>
                          <p className="text-xs text-brand-gray-400 font-mono">
                            {order.user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-center">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-right font-medium">
                      {formatINR(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.orderStatus}
                        onChange={(e) =>
                          requestStatusUpdate(order.id, "orderStatus", e.target.value)
                        }
                        disabled={updatingOrder === order.id}
                        className={`text-xs px-2.5 py-1 border font-mono focus:outline-none disabled:opacity-50 ${
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
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-medium border ${
                          order.paymentMethod === "COD"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {order.paymentMethod === "COD" ? "COD" : "Online"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) =>
                          requestStatusUpdate(order.id, "paymentStatus", e.target.value)
                        }
                        disabled={updatingOrder === order.id}
                        className={`text-xs px-2.5 py-1 border font-mono focus:outline-none disabled:opacity-50 ${
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
                    <td className="px-4 py-3 font-mono text-xs text-brand-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-mono uppercase tracking-wide text-brand-gray-400 hover:text-brand-black transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-brand-gray-200 px-6 py-4 flex items-center justify-between">
            <p className="text-brand-gray-400 font-mono text-xs">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-1.5 border border-brand-gray-200 text-sm font-mono disabled:opacity-30 hover:border-brand-black transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-1.5 border border-brand-gray-200 text-sm font-mono disabled:opacity-30 hover:border-brand-black transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
                  const { orderId, field, value } = confirmModal;
                  setConfirmModal(null);
                  executeStatusUpdate(orderId, field, value);
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
