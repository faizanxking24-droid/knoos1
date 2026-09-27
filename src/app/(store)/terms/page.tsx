import { Metadata } from "next";
import Link from "next/link";
import { StoreContainer } from "@/components/store/StoreContainer";

export const metadata: Metadata = {
  title: "Terms & Conditions | KNOOS",
  description: "Terms and conditions governing the use of the KNOOS online store and purchases made through KRIPA KIRAN SHOE COMPANY.",
};

export default function TermsPage() {
  return (
    <main className="bg-brand-surface min-h-screen py-12 sm:py-20 text-brand-dark">
      <StoreContainer>
        <div className="max-w-4xl mx-auto bg-white border border-brand-sky-border/60 rounded-3xl p-8 sm:p-14 lg:p-16 shadow-xs">
      {/* Header */}
      <div className="border-b border-brand-sky-border/80 pb-10 mb-12">
        <span className="font-mono text-xs uppercase tracking-widest text-brand-blue font-medium block mb-3">
          Legal Agreement
        </span>
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-tight mb-4 text-brand-dark">
          Terms &amp; Conditions
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-brand-gray-500">
          <span>KRIPA KIRAN SHOE COMPANY</span>
          <span>•</span>
          <span>Brand: KNOOS</span>
        </div>
      </div>

      {/* Intro */}
      <div className="space-y-12 leading-relaxed text-brand-gray-700 text-sm md:text-base">
        <section>
          <p className="mb-4">
            Welcome to <strong className="font-semibold text-brand-navy">KNOOS</strong>, operated by <strong className="font-semibold text-brand-navy">KRIPA KIRAN SHOE COMPANY</strong>. By accessing or using our website, or placing an order for footwear products, you agree to be bound by the following terms and conditions. Please read them carefully.
          </p>
        </section>

        {/* 1. Website Usage */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">01</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Website Usage &amp; Account</h2>
          </div>
          <p className="mb-3">
            By using this website, you represent that you are of legal age to form a binding contract. You may access the storefront as a guest or sign in securely using Google OAuth authentication.
          </p>
          <p className="text-brand-gray-600 text-sm">
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your session.
          </p>
        </section>

        {/* 2. Product Information & Pricing */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">02</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Products, Sizes &amp; Pricing</h2>
          </div>
          <p className="mb-3">
            We strive to display accurate descriptions, imagery, color representations, and pricing for all footwear items. However, minor variations in screen display or batch production may occur.
          </p>
          <p className="mb-3">
            All prices listed are in Indian Rupees (₹). We reserve the right to modify prices, update product descriptions, or discontinue items without prior notice.
          </p>
          <div className="bg-brand-cream/70 border border-brand-cream-border/60 rounded-xl p-4 text-xs md:text-sm text-brand-dark">
            <strong className="text-brand-navy">Fitting Recommendation:</strong> Footwear sizing fits can vary. We recommend reviewing sizing recommendations and trying footwear indoors on a clean surface upon delivery.
          </div>
        </section>

        {/* 3. Orders & Payment */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">03</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Orders &amp; Payment</h2>
          </div>
          <p className="mb-3">
            Placing an item in your shopping cart does not reserve inventory. An order is confirmed once payment has been successfully authorized and an order confirmation is generated.
          </p>
          <p className="text-sm text-brand-gray-600">
            Payments are securely processed via third-party payment gateways (Razorpay). KNOOS reserves the right to cancel or refuse any order in the event of stock unavailability, pricing discrepancies, or suspected fraudulent activity.
          </p>
        </section>

        {/* 4. Delivery & Shipping */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">04</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Delivery Options &amp; Shipping Charges</h2>
          </div>
          <p className="mb-4">
            We offer the following delivery options across eligible delivery locations:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="border border-brand-sky-border/60 bg-gradient-to-b from-white to-brand-sky/20 rounded-xl p-4 shadow-sm">
              <span className="font-mono text-xs text-brand-blue uppercase tracking-widest block mb-1 font-medium">
                Standard Shipping
              </span>
              <div className="font-serif text-xl mb-1 text-brand-navy">₹100</div>
              <p className="text-xs text-brand-gray-600">Reliable delivery to your shipping address.</p>
            </div>
            <div className="border border-brand-sky-border/60 bg-gradient-to-b from-white to-brand-sky/20 rounded-xl p-4 shadow-sm">
              <span className="font-mono text-xs text-brand-blue uppercase tracking-widest block mb-1 font-medium">
                Fast Shipping
              </span>
              <div className="font-serif text-xl mb-1 text-brand-navy">₹149</div>
              <p className="text-xs text-brand-gray-600">Expedited dispatch and priority transit.</p>
            </div>
          </div>
          <p className="text-xs text-brand-gray-500">
            Customers must provide accurate shipping details including contact phone numbers. KNOOS is not liable for delivery delays arising from incorrect addresses or courier logistics disruptions.
          </p>
        </section>

        {/* 5. Returns, Replacements & Refunds */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">05</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Returns &amp; Replacements</h2>
          </div>
          <p className="mb-3">
            All return, size exchange, and refund requests are strictly governed by our dedicated policy:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-brand-gray-600 mb-4">
            <li>Return requests must be initiated within <strong className="text-brand-navy">3 days of delivery</strong>.</li>
            <li>Wrong or damaged items require a continuous, uncut unboxing video.</li>
            <li>Size issues are eligible for replacement only (no refunds), subject to stock and customer-paid shipping charges.</li>
          </ul>
          <Link
            href="/returns-refunds"
            className="inline-flex items-center text-xs font-mono uppercase tracking-widest text-brand-navy underline hover:text-brand-blue transition-colors"
          >
            Read Complete Return &amp; Refund Policy &rarr;
          </Link>
        </section>

        {/* 6. Intellectual Property */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">06</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Intellectual Property</h2>
          </div>
          <p className="text-sm text-brand-gray-600">
            All trademarks, logos, brand assets, product imagery, layout designs, and text content associated with KNOOS and KRIPA KIRAN SHOE COMPANY are the intellectual property of their respective owners and may not be reproduced or utilized without explicit written consent.
          </p>
        </section>

        {/* 7. Limitation of Liability */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">07</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Limitation of Liability</h2>
          </div>
          <p className="text-sm text-brand-gray-600">
            To the maximum extent permitted by applicable law, KNOOS and KRIPA KIRAN SHOE COMPANY shall not be liable for any indirect, incidental, or consequential damages resulting from website use, service interruptions, or the use of products purchased on the platform.
          </p>
        </section>

        {/* 8. Contact & Policy Updates */}
        <section className="pt-2">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">08</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Contact &amp; Policy Modifications</h2>
          </div>
          <p className="mb-4">
            We reserve the right to revise these Terms &amp; Conditions at any time. For questions concerning these terms, please contact:
          </p>
          <div className="bg-brand-sky/20 p-6 border border-brand-sky-border/50 rounded-xl mb-6">
            <div className="font-medium text-brand-navy mb-1">KRIPA KIRAN SHOE COMPANY</div>
            <div className="text-xs text-brand-gray-600 mb-2">15/5 SORON KTRA SHAHGANJ, AGRA - 282010</div>
            <div className="text-xs font-mono">
              Email: <a href="mailto:KKSHOECOMPANY@GMAIL.COM" className="text-brand-navy underline hover:text-brand-blue">KKSHOECOMPANY@GMAIL.COM</a>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 border-t border-brand-sky-border/80 pt-6">
            <Link
              href="/contact"
              className="text-xs font-mono uppercase tracking-widest text-brand-navy hover:text-brand-blue hover:underline transition-colors"
            >
              Contact Us &rarr;
            </Link>
            <Link
              href="/privacy"
              className="text-xs font-mono uppercase tracking-widest text-brand-gray-600 hover:text-brand-blue transition-colors"
            >
              Privacy Policy &rarr;
            </Link>
          </div>
        </section>
      </div>
      </div>
      </StoreContainer>
    </main>
  );
}
