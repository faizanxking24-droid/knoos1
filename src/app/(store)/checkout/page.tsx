import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { CheckoutClient } from "./checkout-client";
import { CustomerLoginForm } from "@/components/auth/CustomerLoginForm";
import { Reveal } from "@/components/motion";
import { Lock, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Checkout — KNOOS",
  description: "Secure Checkout for your KNOOS order.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const params = await searchParams;

  const queryParts: string[] = [];
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
        }
      } else if (value !== undefined) {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const callbackUrl = `/checkout${queryString}`;

  if (!session?.user?.id) {
    return (
      <main className="min-h-[85vh] flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-[#fafaf9]">
        <Reveal>
          <div className="w-full max-w-md bg-white border border-brand-gray-200/90 rounded-2xl shadow-sm p-8 sm:p-10">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-brand-sky/40 border border-brand-sky-border/70 flex items-center justify-center text-brand-navy mb-4">
                <Lock className="w-5 h-5 text-brand-navy" />
              </div>
              <h1 className="font-serif text-3xl text-brand-navy mb-2">Secure Checkout</h1>
              <p className="font-mono text-xs uppercase tracking-wider text-brand-gray-500">
                Sign in to continue to delivery & payment
              </p>
            </div>

            <CustomerLoginForm redirectTo={callbackUrl} />

            <div className="mt-6 pt-6 border-t border-brand-gray-100 flex items-center justify-center gap-2 text-brand-gray-400 font-mono text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-brand-blue" />
              <span>256-Bit SSL Encrypted Checkout</span>
            </div>
          </div>
        </Reveal>
      </main>
    );
  }

  return (
    <main className="pt-20 sm:pt-24 pb-28 px-4 sm:px-6 md:px-12 lg:px-20 min-h-[90vh] bg-[#fafaf9]">
      <div className="max-w-7xl mx-auto">
        {/* Editorial Luxury Header with visual progress indicator */}
        <Reveal>
          <div className="mb-10 sm:mb-12 pb-6 border-b border-brand-gray-200/80 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-gray-400 block mb-1">
                KNOOS Bespoke Footwear
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-navy font-normal tracking-tight">
                Checkout
              </h1>
              <p className="text-brand-gray-500 font-sans text-sm mt-1.5">
                Secure checkout for your KNOOS order
              </p>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-mono tracking-wider uppercase">
              <Link
                href="/cart"
                className="text-brand-gray-400 hover:text-brand-navy transition-colors flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Bag</span>
              </Link>
              <span className="text-brand-gray-300">→</span>
              <span className="text-brand-navy font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-navy" />
                <span>Details</span>
              </span>
              <span className="text-brand-gray-300">→</span>
              <span className="text-brand-gray-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gray-300" />
                <span>Payment</span>
              </span>
            </div>
          </div>
        </Reveal>

        <Suspense
          fallback={
            <div className="py-24 text-center">
              <div className="inline-block w-8 h-8 border-2 border-brand-navy border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-mono text-xs uppercase tracking-widest text-brand-gray-500">
                Loading checkout...
              </p>
            </div>
          }
        >
          <CheckoutClient />
        </Suspense>
      </div>
    </main>
  );
}
