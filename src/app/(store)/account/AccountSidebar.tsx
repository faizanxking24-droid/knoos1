"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  User,
  MapPin,
  Package,
  Lock,
  HelpCircle,
  LogOut,
} from "lucide-react";

export type AccountTab =
  | "overview"
  | "profile"
  | "addresses"
  | "orders"
  | "security"
  | "help";

export interface AccountNavItem {
  id: AccountTab;
  label: string;
  icon: typeof User;
  href: string;
}

export const ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/account" },
  { id: "profile", label: "My Profile", icon: User, href: "/account/profile" },
  { id: "addresses", label: "My Addresses", icon: MapPin, href: "/account/addresses" },
  { id: "orders", label: "My Orders", icon: Package, href: "/account/orders" },
  { id: "security", label: "Security", icon: Lock, href: "/account/security" },
  { id: "help", label: "Help", icon: HelpCircle, href: "/account/help" },
];

interface AccountSidebarProps {
  currentTab: AccountTab;
}

export function AccountSidebar({ currentTab }: AccountSidebarProps) {
  return (
    <aside className="hidden lg:block w-[240px] xl:w-[250px] shrink-0">
      <div className="sticky top-28">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-blue font-semibold mb-5 px-3">
          Account
        </p>

        <nav className="space-y-1.5" aria-label="Account navigation">
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 min-h-[46px] rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-brand-navy text-white shadow-xs font-semibold"
                    : "text-brand-gray-600 hover:bg-brand-sky/60 hover:text-brand-navy font-medium"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.75} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 pt-5 border-t border-brand-sky-border/60">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-2.5 min-h-[46px] text-brand-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors w-full text-sm font-medium"
            >
              <LogOut size={18} strokeWidth={1.75} className="shrink-0" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
