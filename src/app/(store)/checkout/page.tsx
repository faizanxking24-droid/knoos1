import { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { CheckoutClient } from "./checkout-client";
import { CustomerLoginForm } from "@/components/auth/CustomerLoginForm";
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
      <main className="min-h-[80vh] flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-brand-sky/15">
        <div className="w-full max-w-md bg-white border border-brand-sky-border/80 rounded-2xl shadow-xl p-8 sm:p-10">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-brand-sky/30 border border-brand-sky-border/60 flex items-center justify-center text-brand-navy mb-4">
              <Lock className="w-6 h-6 text-brand-navy" />
            </div>
            <h1 className="font-serif text-3xl text-brand-navy mb-2">Secure Checkout</h1>
            <p className="font-mono text-xs uppercase tracking-wider text-brand-gray-500">
              Sign in to continue to delivery & payment
            </p>
          </div>

          <CustomerLoginForm redirectTo={callbackUrl} />

          <div className="mt-6 pt-6 border-t border-brand-sky-border/40 flex items-center justify-center gap-2 text-brand-gray-400 font-mono text-[11px] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-brand-blue" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-24 px-4 sm:px-6 md:px-12 lg:px-24 min-h-[85vh] bg-[#fafbfc]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-5xl text-brand-navy mb-2">Checkout</h1>
          <p className="text-brand-gray-500 font-mono text-xs md:text-sm uppercase tracking-wider">
            Complete your order with secure delivery & payment
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-24 text-center font-mono uppercase tracking-widest text-sm text-brand-gray-500">
              Loading checkout...
            </div>
          }
        >
          <CheckoutClient />
        </Suspense>
      </div>
    </main>
  );
}
