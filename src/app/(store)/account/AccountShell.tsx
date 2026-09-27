"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  AccountSidebar,
  ACCOUNT_NAV_ITEMS,
  AccountTab,
} from "./AccountSidebar";
import { AccountPageHeader } from "./AccountPageHeader";

interface AccountShellProps {
  children: React.ReactNode;
  active?: AccountTab;
  title: string;
  subtitle?: string;
  backHref?: string;
}

export default function AccountShell({
  children,
  active,
  title,
  subtitle,
  backHref,
}: AccountShellProps) {
  const pathname = usePathname();

  // Determine current active tab
  const currentTab: AccountTab =
    active ??
    ACCOUNT_NAV_ITEMS.find((item) => item.href === pathname)?.id ??
    "overview";

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex flex-col justify-between pt-10 sm:pt-12 lg:pt-16 pb-16 lg:pb-24">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-8 xl:px-10 w-full">
        {/* Mobile / Tablet Horizontal Navigation (< lg) */}
        <div className="lg:hidden mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-mono text-xs uppercase tracking-widest text-brand-blue font-semibold">
              Account
            </span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="font-mono text-xs uppercase tracking-wider text-brand-gray-500 hover:text-red-600 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>

          <nav
            className="overflow-x-auto no-scrollbar flex items-center gap-1.5 p-1.5 bg-brand-sky/25 border border-brand-sky-border/60 rounded-2xl"
            aria-label="Account navigation tabs"
          >
            {ACCOUNT_NAV_ITEMS.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
                    isActive
                      ? "bg-brand-navy text-white shadow-xs font-semibold"
                      : "text-brand-gray-600 hover:text-brand-navy hover:bg-brand-sky/40"
                  }`}
                >
                  <Icon size={15} strokeWidth={isActive ? 2 : 1.75} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)] gap-8 lg:gap-12 xl:gap-14 items-start">
          {/* Desktop Sticky Sidebar (lg+) */}
          <AccountSidebar currentTab={currentTab} />

          {/* Main Account Content Column */}
          <main className="min-w-0 flex-1">
            <AccountPageHeader
              title={title}
              subtitle={subtitle}
              backHref={backHref}
            />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
