"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Printer, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { InvoiceData, formatInvoiceINR } from "@/lib/order-invoice";
import { INVOICE_BUSINESS_CONFIG } from "@/lib/invoice-config";

interface InvoiceDocumentProps {
  invoice: InvoiceData;
  backHref: string;
  backLabel?: string;
  userRole?: "ADMIN" | "CUSTOMER";
}

export function InvoiceDocument({
  invoice,
  backHref,
  backLabel = "Back to Order",
}: InvoiceDocumentProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#14212B] font-sans antialiased py-6 sm:py-10 px-3 sm:px-6 print:p-0 print:m-0 print:bg-white print:min-h-0">
      {/* SCREEN-ONLY ACTION BAR */}
      <div className="max-w-[210mm] mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden no-print">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-navy hover:text-brand-blue bg-white border border-brand-gray-200 px-4 py-2.5 rounded-xl shadow-xs transition-colors self-start"
        >
          <ArrowLeft size={14} />
          <span>{backLabel}</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            aria-label="Print invoice or save as PDF"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl text-xs font-mono uppercase tracking-wider transition-all shadow-sm active:scale-[0.98] font-semibold cursor-pointer"
          >
            <Printer size={15} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* A4 PRINTABLE INVOICE SHEET */}
      <article
        id="knoos-printable-invoice"
        className="max-w-[210mm] mx-auto bg-white rounded-2xl shadow-md border border-brand-gray-200 p-6 sm:p-10 md:p-12 print:shadow-none print:border-none print:rounded-none print:p-0 print:max-w-none print:w-full print:m-0"
      >
        {/* TOP BRAND & INVOICE HEADER */}
        <header className="pb-6 border-b border-brand-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            {/* Business Brand Left */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <img
                  src="/knoos-logo.png"
                  alt={INVOICE_BUSINESS_CONFIG.businessName}
                  className="h-9 sm:h-10 w-auto object-contain"
                />
              </div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-brand-gray-500 font-medium">
                {INVOICE_BUSINESS_CONFIG.legalEntityName}
              </p>
              <p className="text-xs text-brand-gray-600 max-w-sm leading-relaxed">
                {INVOICE_BUSINESS_CONFIG.businessAddress}
              </p>
              <div className="text-xs text-brand-gray-500 space-x-3 pt-0.5">
                <span>{INVOICE_BUSINESS_CONFIG.supportPhone}</span>
                <span>&bull;</span>
                <span>{INVOICE_BUSINESS_CONFIG.supportEmail}</span>
              </div>
            </div>

            {/* Invoice Meta Right */}
            <div className="sm:text-right space-y-1.5 shrink-0">
              <h1 className="font-serif text-3xl sm:text-4xl text-brand-navy tracking-tight uppercase font-medium">
                INVOICE
              </h1>
              <div className="font-mono text-xs sm:text-sm font-semibold text-brand-navy">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-brand-gray-500">
                <span className="font-mono text-[11px] uppercase tracking-wider text-brand-gray-400">Order ID: </span>
                <span className="font-mono font-medium text-brand-dark">{invoice.orderId}</span>
              </div>
              <div className="text-xs text-brand-gray-500">
                <span className="font-mono text-[11px] uppercase tracking-wider text-brand-gray-400">Date: </span>
                <span className="font-medium text-brand-dark">{invoice.orderDate}</span>
              </div>
            </div>
          </div>
        </header>

        {/* CUSTOMER & DELIVERY ADDRESS TWO-COLUMN */}
        <section className="py-6 border-b border-brand-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          {/* Bill To / Customer */}
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-brand-gray-400 block font-semibold mb-1">
              Customer Details
            </span>
            <p className="font-semibold text-brand-navy text-base">
              {invoice.customer.name}
            </p>
            {invoice.customer.email && (
              <p className="text-brand-gray-600 text-xs font-mono">
                {invoice.customer.email}
              </p>
            )}
            {invoice.customer.phone && (
              <p className="text-brand-gray-600 text-xs font-mono">
                +91 {invoice.customer.phone}
              </p>
            )}
          </div>

          {/* Ship To / Delivery Address Snapshot */}
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-brand-gray-400 block font-semibold mb-1">
              Delivery Address (Snapshot)
            </span>
            {invoice.deliveryAddress ? (
              <div className="text-xs sm:text-sm text-brand-gray-700 leading-relaxed">
                <p className="font-semibold text-brand-navy">
                  {invoice.deliveryAddress.recipientName}
                </p>
                <p>{invoice.deliveryAddress.address}</p>
                <p>
                  {invoice.deliveryAddress.city}, {invoice.deliveryAddress.state} &ndash;{" "}
                  <span className="font-mono font-medium text-brand-navy">
                    {invoice.deliveryAddress.pincode}
                  </span>
                </p>
                <p className="font-mono text-xs text-brand-gray-500 pt-0.5">
                  Phone: +91 {invoice.deliveryAddress.phone}
                </p>
              </div>
            ) : (
              <p className="text-xs text-brand-gray-400 font-mono">
                Address details unavailable in order snapshot.
              </p>
            )}
          </div>
        </section>

        {/* ORDER ITEMS TABLE */}
        <section className="py-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-brand-navy/80 text-[11px] font-mono uppercase tracking-[0.15em] text-brand-navy bg-brand-sky/20 print:bg-transparent">
                  <th className="py-3 px-3 font-semibold">Item</th>
                  <th className="py-3 px-3 font-semibold text-center w-20">Size</th>
                  <th className="py-3 px-3 font-semibold text-center w-16">Qty</th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Unit Price</th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-200 text-xs sm:text-sm">
                {invoice.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-brand-gray-400 font-mono text-xs">
                      No line items recorded for this order.
                    </td>
                  </tr>
                ) : (
                  invoice.items.map((item) => (
                    <tr key={item.id} className="break-inside-avoid print-avoid-break">
                      <td className="py-3.5 px-3 font-medium text-brand-dark">
                        <div className="font-semibold">{item.productName}</div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-brand-gray-600">
                        {item.size}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-brand-gray-600">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-brand-gray-600">
                        {formatInvoiceINR(item.unitPrice)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-brand-navy">
                        {formatInvoiceINR(item.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* FINANCIAL SUMMARY & PAYMENT DETAILS */}
        <section className="pt-2 pb-6 border-t border-brand-gray-200 break-inside-avoid print-avoid-break">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
            {/* Left: Payment & Order Information */}
            <div className="space-y-3 bg-[#fafbfc] print:bg-transparent p-4 sm:p-5 rounded-xl border border-brand-gray-200/80">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-brand-gray-400 block font-semibold mb-1">
                Payment &amp; Fulfillment
              </span>

              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-gray-500 font-mono uppercase tracking-wider">Method:</span>
                <span className="font-semibold text-brand-navy font-mono">
                  {invoice.paymentMethodLabel}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-gray-500 font-mono uppercase tracking-wider">Payment Status:</span>
                <span className="font-semibold text-brand-navy font-mono">
                  {invoice.paymentStatusLabel}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-gray-500 font-mono uppercase tracking-wider">Order Status:</span>
                <span className="font-semibold text-brand-navy font-mono">
                  {invoice.orderStatusLabel}
                </span>
              </div>

              {invoice.razorpayOrderId && (
                <div className="pt-2 border-t border-brand-gray-200/60 text-[11px] font-mono space-y-1">
                  <div className="text-brand-gray-400 uppercase tracking-wider text-[10px]">
                    Razorpay Order ID:
                  </div>
                  <div className="text-brand-dark break-all">
                    {invoice.razorpayOrderId}
                  </div>
                  {invoice.razorpayPaymentId && (
                    <>
                      <div className="text-brand-gray-400 uppercase tracking-wider text-[10px] pt-1">
                        Razorpay Payment ID:
                      </div>
                      <div className="text-brand-dark break-all">
                        {invoice.razorpayPaymentId}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right: Authoritative Price Breakdown */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-brand-gray-600">
                <span className="font-mono text-xs uppercase tracking-wider">Subtotal</span>
                <span className="font-mono font-medium text-brand-dark">
                  {formatInvoiceINR(invoice.subtotal)}
                </span>
              </div>

              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span className="font-mono text-xs uppercase tracking-wider">
                    Discount {invoice.couponCode ? `(${invoice.couponCode})` : ""}
                  </span>
                  <span className="font-mono font-semibold">
                    -{formatInvoiceINR(invoice.discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-brand-gray-600">
                <span className="font-mono text-xs uppercase tracking-wider">
                  Delivery Charge ({invoice.deliveryMethod === "FAST" ? "Fast" : "Standard"})
                </span>
                <span className="font-mono font-medium text-brand-dark">
                  {invoice.deliveryCharge === 0 ? "FREE" : formatInvoiceINR(invoice.deliveryCharge)}
                </span>
              </div>

              <div className="pt-3 border-t-2 border-brand-navy flex justify-between items-baseline">
                <span className="font-serif text-base sm:text-lg font-semibold text-brand-navy uppercase tracking-wide">
                  Grand Total
                </span>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy">
                  {formatInvoiceINR(invoice.total)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* INVOICE FOOTER NOTE & LEGAL */}
        <footer className="pt-8 border-t border-brand-gray-200 text-center space-y-2 break-inside-avoid print-avoid-break">
          <p className="font-serif text-sm text-brand-navy italic">
            Thank you for shopping with KNOOS.
          </p>
          <p className="text-[11px] text-brand-gray-500 max-w-xl mx-auto leading-relaxed">
            This is a computer-generated order invoice and does not require a physical signature.
            Operated by {INVOICE_BUSINESS_CONFIG.legalEntityName}, {INVOICE_BUSINESS_CONFIG.businessAddress}.
          </p>
          <div className="text-[10px] font-mono text-brand-gray-400 pt-1">
            <span>Website: {INVOICE_BUSINESS_CONFIG.website}</span>
            <span className="mx-2">&bull;</span>
            <span>Support: {INVOICE_BUSINESS_CONFIG.supportEmail}</span>
            <span className="mx-2">&bull;</span>
            <span>Helpline: {INVOICE_BUSINESS_CONFIG.supportPhone}</span>
          </div>
        </footer>
      </article>
    </div>
  );
}
