import { Metadata } from "next";
import { getCompleteDashboardData, getRecentOrdersList } from "@/lib/analytics/dashboard";
import type { DateRange } from "@/lib/analytics/date-range";
import { AdminDashboardClient } from "./DashboardClient";

type SearchParams = { range?: string; from?: string; to?: string };

export const metadata: Metadata = {
  title: "Dashboard — KNOOS Admin",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = searchParams ? await searchParams : {};
  const range: DateRange = (params.range as DateRange) || "30days";
  const dateFrom = params.from;
  const dateTo = params.to;

  const [dashboardData, recentOrders] = await Promise.all([
    getCompleteDashboardData({ range, dateFrom, dateTo }),
    getRecentOrdersList(10),
  ]);

  return (
    <AdminDashboardClient
      data={dashboardData}
      recentOrders={recentOrders}
    />
  );
}
