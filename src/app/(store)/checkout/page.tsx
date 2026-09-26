import { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout — KNOOS",
};

export default function CheckoutPage() {
  return (
    <main className="pt-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl mb-4">Checkout</h1>
        <p className="text-brand-gray-400 font-mono text-sm mb-8">Choose your delivery and payment method</p>
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
