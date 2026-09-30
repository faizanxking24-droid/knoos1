"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  User,
  MapPin,
  Package,
  HelpCircle,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { motion } from "framer-motion";
import AccountShell from "./AccountShell";

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

interface ProfileData {
  name?: string | null;
  email: string;
  phone?: string | null;
}

interface RecentOrder {
  id: string;
  orderStatus: string;
  total: number;
  createdAt: string;
}

interface OrderSummary {
  total: number;
  active: number;
  delivered: number;
  addressCount: number;
}

export default function AccountOverviewClient() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [recentOrder, setRecentOrder] = useState<RecentOrder | null>(null);
  const [isPrefConfigured, setIsPrefConfigured] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    let cancelled = false;
    try {
      const [profileRes, ordersRes, addressesRes, prefRes] = await Promise.all([
        fetch("/api/account/profile", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/addresses", { cache: "no-store" }),
        fetch("/api/account/preferences", { cache: "no-store" }),
      ]);

      if (profileRes.ok && !cancelled) {
        setProfile(await profileRes.json());
      }

      if (prefRes.ok && !cancelled) {
        const prefData = await prefRes.json();
        setIsPrefConfigured(Boolean(prefData.isConfigured));
      }

      if (ordersRes.ok && !cancelled) {
        const orders = await ordersRes.json();
        const active = orders.filter(
          (o: { orderStatus: string }) =>
            !["CANCELLED", "DELIVERED"].includes(o.orderStatus)
        ).length;
        const delivered = orders.filter(
          (o: { orderStatus: string }) => o.orderStatus === "DELIVERED"
        ).length;
        setSummary({
          total: orders.length,
          active,
          delivered,
          addressCount: 0,
        });
        if (orders.length > 0) setRecentOrder(orders[0]);
      }

      if (addressesRes.ok && !cancelled) {
        const addresses = await addressesRes.json();
        setSummary((prev) =>
          prev ? { ...prev, addressCount: addresses.length } : null
        );
      }
    } catch {
      // silent
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const firstName = profile?.name?.trim()?.split(" ")[0] || "there";

  return (
    <AccountShell
      title={`Welcome back, ${firstName}`}
      subtitle="Here's what's happening with your account."
      active="overview"
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full space-y-9 sm:space-y-10"
      >
        {/* Non-blocking Onboarding Prompt for Let Us Know Preferences */}
        {!isPrefConfigured && !loading && (
          <div className="bg-brand-sky/30 border border-brand-sky-border/80 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-brand-blue font-semibold">
                  Shopping Preferences
                </span>
              </div>
              <h3 className="font-serif text-lg text-brand-navy">
                Personalize Your Fit: Let Us Know
              </h3>
              <p className="text-xs sm:text-sm text-brand-gray-500 mt-0.5 max-w-xl">
                Tell us your shoe size and style preferences to get curated
                recommendations tailored to you.
              </p>
            </div>
            <Link
              href="/account/profile"
              className="inline-flex items-center justify-center whitespace-nowrap bg-brand-navy text-white px-5 py-2.5 font-mono text-xs uppercase tracking-widest rounded-xl hover:bg-brand-blue transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98] shrink-0 shadow-xs"
            >
              Complete Preferences
            </Link>
          </div>
        )}

        {/* 4 Stats Cards */}
        <section aria-label="Account Summary Stats">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
            <StatCard
              index={0}
              label="Total Orders"
              value={(summary?.total ?? 0).toString()}
            />
            <StatCard
              index={1}
              label="Active Orders"
              value={(summary?.active ?? 0).toString()}
            />
            <StatCard
              index={2}
              label="Delivered"
              value={(summary?.delivered ?? 0).toString()}
            />
            <StatCard
              index={3}
              label="Addresses"
              value={(summary?.addressCount ?? 0).toString()}
            />
          </div>
        </section>

        {/* Recent Order */}
        <section aria-label="Recent Order">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-blue font-semibold mb-3">
            Recent Order
          </p>
          {recentOrder ? (
            <RecentOrderCard order={recentOrder} />
          ) : (
            <EmptyState />
          )}
        </section>

        {/* Quick Actions */}
        <section aria-label="Quick Actions" className="pt-2">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-blue font-semibold mb-3.5">
            Quick Actions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <QuickLink
              index={0}
              href="/account/profile"
              label="Profile & Preferences"
              icon={User}
            />
            <QuickLink
              index={1}
              href="/account/addresses"
              label="Manage Addresses"
              icon={MapPin}
            />
            <QuickLink
              index={2}
              href="/account/orders"
              label="View All Orders"
              icon={Package}
            />
            <QuickLink
              index={3}
              href="/account/help"
              label="Help & Support"
              icon={HelpCircle}
            />
          </div>
        </section>
      </motion.div>
    </AccountShell>
  );
}

function StatCard({ label, value, index = 0 }: { label: string; value: string; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-brand-sky-border/60 rounded-xl p-5 sm:p-6 shadow-xs hover:border-brand-blue/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
    >
      <p className="font-serif text-2xl sm:text-3xl lg:text-4xl text-brand-navy font-normal">
        {value}
      </p>
      <p className="font-mono text-xs uppercase tracking-wider text-brand-gray-500 mt-1.5">
        {label}
      </p>
    </motion.div>
  );
}

function RecentOrderCard({ order }: { order: RecentOrder }) {
  return (
    <div className="bg-white border border-brand-sky-border/60 rounded-xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Metadata columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 flex-1">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-brand-gray-400 mb-1">
              Order #
            </p>
            <p className="font-mono text-sm font-semibold text-brand-navy">
              #{order.id.slice(0, 10).toUpperCase()}
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-brand-gray-400 mb-1">
              Date
            </p>
            <p className="text-sm text-brand-dark font-medium">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-brand-gray-400 mb-1">
              Status
            </p>
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${
                STATUS_COLORS[order.orderStatus] ||
                "bg-gray-100 text-gray-800 border-gray-200"
              }`}
            >
              {STATUS_LABELS[order.orderStatus] || order.orderStatus}
            </span>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-brand-gray-400 mb-1">
              Total
            </p>
            <p className="text-sm font-semibold text-brand-navy">
              ₹{order.total.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 sm:pt-0 sm:pl-4 sm:border-l sm:border-brand-sky-border/40 shrink-0">
          <Link
            href={`/account/orders/${order.id}`}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-brand-navy hover:text-brand-blue font-semibold transition-colors group"
          >
            <span>View Order</span>
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
  index = 0,
}: {
  href: string;
  label: string;
  icon: typeof User;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={href}
        className="flex items-center justify-between min-h-[72px] sm:min-h-[76px] px-5 py-4 bg-white border border-brand-sky-border/60 rounded-xl hover:border-brand-blue/50 hover:bg-brand-sky/20 hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200 group shadow-xs"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-sky/50 text-brand-navy flex items-center justify-center shrink-0 group-hover:bg-brand-navy group-hover:text-white transition-colors">
            <Icon size={18} strokeWidth={1.75} />
          </div>
          <span className="text-sm font-medium text-brand-dark group-hover:text-brand-blue transition-colors">
            {label}
          </span>
        </div>
        <ArrowRight
          size={16}
          className="text-brand-gray-400 group-hover:text-brand-blue group-hover:translate-x-1 transition-all shrink-0"
        />
      </Link>
    </motion.div>
  );
}

function EmptyState() {
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
        className="inline-block bg-brand-navy text-white px-6 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-brand-blue rounded-xl transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98] shadow-xs"
      >
        Start Shopping
      </Link>
    </div>
  );
}
