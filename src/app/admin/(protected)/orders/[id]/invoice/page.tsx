import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminInvoiceData, buildInvoiceNumber } from "@/lib/order-invoice";
import { InvoiceDocument } from "@/components/orders/InvoiceDocument";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Bill ${buildInvoiceNumber(id)} — Admin KNOOS`,
  };
}

export default async function AdminOrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) {
    redirect("/");
  }

  // Admin can access any order invoice
  const invoice = await getAdminInvoiceData(id);

  if (!invoice) {
    notFound();
  }

  return (
    <InvoiceDocument
      invoice={invoice}
      backHref={`/admin/orders/${id}`}
      backLabel="Back to Admin Order"
      userRole="ADMIN"
    />
  );
}
