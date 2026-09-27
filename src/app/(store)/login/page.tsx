import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CustomerLoginForm } from "@/components/auth/CustomerLoginForm";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Truck, RotateCcw } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In — KNOOS",
  description: "Sign in to your KNOOS account to manage orders, wishlist, and express checkout.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl || "/";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="min-h-[85vh] bg-brand-surface flex items-center justify-center py-12 sm:py-20 px-4 sm:px-6">
      <div className="w-full max-w-4xl bg-white border border-brand-sky-border/60 rounded-3xl shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Brand Campaign Stage (Hidden on mobile) */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-neutral-900 flex-col justify-between p-10 text-white overflow-hidden">
          <Image
            src="/images/hero-scroll-poster.webp"
            alt="KNOOS Footwear Campaign"
            fill
            sizes="40vw"
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/60 to-transparent" />

          {/* Top Wordmark */}
          <div className="relative z-10">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-white/70 font-semibold block">
              KNOOS FOOTWEAR
            </span>
          </div>

          {/* Bottom Editorial Quote */}
          <div className="relative z-10">
            <p className="font-serif text-2xl leading-snug mb-3 text-white/95">
              “Every step should feel deliberate, effortless, and refined.”
            </p>
            <p className="font-mono text-xs text-white/60 tracking-wider uppercase">
              The KNOOS Archive &bull; 2026
            </p>

            <div className="mt-8 pt-6 border-t border-white/15 space-y-2 text-xs font-mono text-white/80">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-brand-blue" />
                <span>Complimentary Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={14} className="text-brand-blue" />
                <span>3-Day Easy Return Window</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Form (Cols 6-12) */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="flex flex-col items-center mb-8">
            <Link href="/" className="mb-4">
              <Image
                src="/knoos-logo.png"
                alt="KNOOS"
                width={140}
                height={90}
                priority
                className="h-10 w-auto object-contain"
              />
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl text-brand-dark tracking-tight mb-2">
              Welcome to KNOOS
            </h1>
            <p className="text-neutral-500 text-xs sm:text-sm font-light text-center max-w-sm">
              Sign in to access your order history, saved addresses, and faster checkout.
            </p>
          </div>

          <CustomerLoginForm redirectTo={callbackUrl} />

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-xs font-mono text-neutral-400">
              By continuing, you agree to KNOOS{" "}
              <Link href="/terms" className="text-brand-blue hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-brand-blue hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
