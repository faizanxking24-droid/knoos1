import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCustomerInvoiceData, buildInvoiceNumber } from "@/lib/order-invoice";
import { InvoiceDocument } from "@/components/orders/InvoiceDocument";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Bill ${buildInvoiceNumber(id)} — KNOOS`,
  };
}

export default async function CustomerOrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/account/orders/${id}/invoice`)}`);
  }

  // Fetch invoice securely: must belong to the logged-in user
  const invoice = await getCustomerInvoiceData(id, session.user.id);

  if (!invoice) {
    notFound();
  }

  return (
    <InvoiceDocument
      invoice={invoice}
      backHref={`/account/orders/${id}`}
      backLabel="Back to Order Details"
      userRole="CUSTOMER"
    />
  );
}
