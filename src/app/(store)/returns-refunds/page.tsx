import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { StoreContainer } from "@/components/store/StoreContainer";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Return & Refund Policy | KNOOS",
  description: "Official KNOOS return, exchange, and refund policy for orders placed with KRIPA KIRAN SHOE COMPANY.",
};

export default function ReturnsRefundsPage() {
  return (
    <main className="bg-brand-surface min-h-screen py-12 sm:py-20 text-brand-dark">
      <StoreContainer>
        <Reveal>
          <div className="max-w-4xl mx-auto bg-white border border-brand-sky-border/60 rounded-3xl p-8 sm:p-14 lg:p-16 shadow-xs">
      {/* Policy Header */}
      <div className="border-b border-brand-sky-border/80 pb-10 mb-12">
        <span className="font-mono text-xs uppercase tracking-widest text-brand-blue font-medium block mb-3">
          Customer Service &amp; Policies
        </span>
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-tight mb-4 text-brand-dark">
          Return &amp; Refund Policy
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-brand-gray-500">
          <span>Last Updated: August 20, 2026</span>
          <span>•</span>
          <span>KRIPA KIRAN SHOE COMPANY</span>
        </div>
      </div>

      {/* Introduction Notice Box */}
      <div className="bg-brand-sky/25 border border-brand-sky-border/60 rounded-xl p-6 md:p-8 mb-12">
        <p className="text-brand-dark text-sm md:text-base leading-relaxed">
          At <strong className="font-semibold text-brand-navy">KNOOS</strong>, we carefully inspect and pack every product before dispatch to ensure the highest standards of quality.
        </p>
      </div>

      {/* Policy Sections */}
      <div className="space-y-12 leading-relaxed text-brand-gray-700 text-sm md:text-base">
        {/* Section 1 */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">01</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Return Window</h2>
          </div>
          <p className="mb-3">
            Return requests are accepted within <strong className="text-brand-navy font-semibold">3 days of delivery</strong>.
          </p>
          <p className="text-brand-gray-500 text-xs md:text-sm">
            Requests raised after the applicable 3-day window may not be accepted.
          </p>
        </section>

        {/* Section 2 */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">02</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Products Eligible for Return</h2>
          </div>
          <p className="mb-3">Returns are accepted only when:</p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li>The product received is wrong/different from the product ordered.</li>
            <li>The product received is damaged or has a manufacturing/transportation-related defect.</li>
          </ul>
          <div className="bg-brand-sky/20 border-l-2 border-brand-blue pl-4 py-3 mt-4 text-xs md:text-sm text-brand-dark rounded-r-lg">
            <strong className="text-brand-navy">Mandatory Verification:</strong> For wrong or damaged products, the customer must have a continuous unboxing video showing the package from the time it is received and opened. The unboxing video may be required to verify the package and product condition at delivery.
          </div>
        </section>

        {/* Section 3 */}
        {/* Section 3 */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">03</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Size-Related Issues</h2>
          </div>
          <p className="mb-3">
            Size or fitting issues are eligible for <strong className="text-brand-navy font-semibold">replacement/exchange only</strong>, subject to availability.
          </p>
          <p className="mb-4 text-brand-navy font-medium">
            Size-related issues are NOT eligible for a refund.
          </p>
          <p className="mb-2">The product must be unused, unworn, and in original condition with:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-brand-gray-600">
            <li>Original packaging</li>
            <li>Tags</li>
            <li>Labels</li>
            <li>Accessories where applicable</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">04</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Replacement Shipping Charges</h2>
          </div>
          <p className="mb-3">
            For replacement due to a size or fitting issue, applicable shipping/return charges are borne by the customer.
          </p>
          <p className="text-xs md:text-sm text-brand-gray-500">
            Replacement is processed after the original product is received and successfully passes quality inspection.
          </p>
        </section>

        {/* Section 5 */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">05</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Replacement Conditions</h2>
          </div>
          <p className="mb-3">The product must:</p>
          <ul className="list-disc pl-5 space-y-1.5 mb-4">
            <li>Be unused and unworn</li>
            <li>Be in original condition</li>
            <li>Have original tags and labels</li>
            <li>Include original packaging, box, and accessories where applicable</li>
            <li>Have no stains, scratches, dirt, marks, damage, or signs of use</li>
          </ul>
          <div className="bg-brand-cream/70 border border-brand-cream-border/60 rounded-xl p-4 text-xs md:text-sm text-brand-dark">
            Customers are advised to try footwear indoors on a clean surface before deciding whether the size is suitable. Products showing signs of outdoor use may not be accepted for replacement.
          </div>
        </section>

        {/* Section 6 */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">06</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Wrong or Damaged Product</h2>
          </div>
          <p className="mb-3">
            Customers must contact KNOOS within <strong className="text-brand-navy font-semibold">3 days of delivery</strong>.
          </p>
          <p className="mb-2">They should keep ready:</p>
          <ul className="list-disc pl-5 space-y-1.5 mb-4">
            <li>Order number</li>
            <li>Clear product photographs</li>
            <li>Clear packaging photographs</li>
            <li>Shipping label photographs</li>
            <li>Complete unboxing video</li>
          </ul>
          <p className="text-xs md:text-sm text-brand-gray-500">
            KNOOS may review the submitted information before approving the claim. If approved, KNOOS will arrange the applicable return/replacement process.
          </p>
        </section>

        {/* Section 7 */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">07</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Refund Policy</h2>
          </div>
          <p className="mb-3">
            Refunds are applicable only where specifically approved by KNOOS for an eligible wrong or damaged product claim.
          </p>
          <p className="mb-3">
            Size-related issues are replacement-only and are not eligible for a refund.
          </p>
          <p className="mb-3">
            Approved refunds will be processed through the applicable payment method used for the order.
          </p>
          <p className="text-xs md:text-sm text-brand-gray-500">
            Refund reflection time may vary depending on the payment gateway, bank, card issuer, or financial institution.
          </p>
        </section>

        {/* Section 8 */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">08</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Returns Not Eligible</h2>
          </div>
          <p className="mb-3">Returns/replacements may be rejected when:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Request is made after the 3-day return window</li>
            <li>Valid unboxing video is unavailable for a wrong/damaged product claim</li>
            <li>Product has been worn or used</li>
            <li>Product has been washed, altered, repaired, or modified</li>
            <li>Product has stains, dirt, scratches, marks, or signs of use</li>
            <li>Original packaging, tags, labels, or accessories are missing</li>
            <li>Product was damaged after delivery</li>
            <li>Returned product does not match the product originally shipped</li>
            <li>Reason does not fall within the eligible conditions</li>
          </ul>
        </section>

        {/* Section 9 */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">09</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">How to Raise a Request</h2>
          </div>
          <p className="mb-3">
            Customers should contact KNOOS through the customer support/contact option available on the website within the applicable 3-day period.
          </p>
          <p className="mb-2">They should provide:</p>
          <ul className="list-disc pl-5 space-y-1.5 mb-6">
            <li>Order number</li>
            <li>Reason for request</li>
            <li>Photographs</li>
            <li>Unboxing video wherever applicable</li>
          </ul>
          <p className="text-sm text-brand-gray-600 mb-6">
            The KNOOS team will review the request and provide further instructions if eligible.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-brand-navy text-white text-xs font-mono uppercase tracking-widest hover:bg-brand-blue rounded-xl transition-colors shadow-sm"
            >
              Contact Support Team
            </Link>
            <a
              href="https://wa.me/917088808882"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-brand-navy text-brand-navy text-xs font-mono uppercase tracking-widest hover:bg-brand-navy hover:text-white rounded-xl transition-colors"
            >
              WhatsApp Support (7088808882)
            </a>
          </div>
        </section>

        {/* Section 10 */}
        <section className="pt-2">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">10</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Important Note</h2>
          </div>
          <p className="mb-3">
            KNOOS reserves the right to verify every return or replacement request before approval.
          </p>
          <p className="mb-3">
            All returns and replacements are subject to product availability, quality inspection, and the conditions stated in this policy.
          </p>
          <p className="mb-6">
            By placing an order on the KNOOS website, the customer acknowledges and agrees to this Return &amp; Refund Policy.
          </p>
          <div className="border-t border-brand-sky-border/80 pt-6 mt-8">
            <Image
              src="/knoos-logo.png"
              alt="KNOOS"
              width={120}
              height={80}
              className="h-8 w-auto object-contain"
            />
            <div className="font-serif italic text-brand-navy text-sm mt-1">Comfort In Every Step</div>
          </div>
        </section>
      </div>
      </div>
        </Reveal>
      </StoreContainer>
    </main>
  );
}
