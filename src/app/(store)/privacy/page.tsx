import { Metadata } from "next";
import Link from "next/link";
import { StoreContainer } from "@/components/store/StoreContainer";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Privacy Policy | KNOOS",
  description: "Learn how KNOOS and KRIPA KIRAN SHOE COMPANY collect, protect, and handle your personal data, Google authentication, and order details.",
};

export default function PrivacyPage() {
  return (
    <main className="bg-brand-surface min-h-screen py-12 sm:py-20 text-brand-dark">
      <StoreContainer>
        <Reveal>
          <div className="max-w-4xl mx-auto bg-white border border-brand-sky-border/60 rounded-3xl p-8 sm:p-14 lg:p-16 shadow-xs">
      {/* Header */}
      <div className="border-b border-brand-sky-border/80 pb-10 mb-12">
        <span className="font-mono text-xs uppercase tracking-widest text-brand-blue font-medium block mb-3">
          Legal &amp; Privacy
        </span>
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-tight mb-4 text-brand-dark">
          Privacy Policy
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
            KRIPA KIRAN SHOE COMPANY (&ldquo;KNOOS&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to respecting and protecting the privacy of our website visitors and customers. This Privacy Policy outlines how your personal data is collected, used, processed, and safeguarded when you visit our website or make a purchase from KNOOS.
          </p>
        </section>

        {/* 1. Information We Collect */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">01</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Information We Collect</h2>
          </div>
          <p className="mb-4">
            We collect information necessary to authenticate users, fulfill product orders, and provide responsive customer service:
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-brand-navy text-sm mb-1">A. Google Sign-In &amp; Account Information</h3>
              <p className="text-sm text-brand-gray-600">
                When you sign in using Google OAuth, we receive basic profile information provided by Google, including your name, email address, and profile picture.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-brand-navy text-sm mb-1">B. Checkout &amp; Shipping Details</h3>
              <p className="text-sm text-brand-gray-600">
                When placing an order, you provide contact details including your full name, phone number, shipping address, city, state, and postal code.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-brand-navy text-sm mb-1">C. Order History</h3>
              <p className="text-sm text-brand-gray-600">
                We store details of your purchases, including product variants, sizes, transaction status, delivery preferences, and customer support communications.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Payment Processing */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">02</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Payment Processing</h2>
          </div>
          <p className="mb-3">
            All online financial transactions are processed securely through authorized third-party payment gateways (such as Razorpay).
          </p>
          <div className="bg-brand-sky/20 border-l-2 border-brand-blue pl-4 py-3 text-xs md:text-sm text-brand-dark rounded-r-lg">
            <strong className="text-brand-navy">Important Notice:</strong> KNOOS does not collect, store, or process complete credit/debit card numbers, CVV codes, or net banking passwords on our servers. All sensitive payment details are encrypted and handled directly by the payment gateway.
          </div>
        </section>

        {/* 3. Cookies and Session Technologies */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">03</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Cookies &amp; Session Technologies</h2>
          </div>
          <p className="mb-3">
            We use essential cookies and local session identifiers strictly to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-brand-gray-600">
            <li>Maintain user authentication sessions.</li>
            <li>Store shopping cart state as you navigate between pages.</li>
            <li>Remember preferences and ensure site functionality.</li>
          </ul>
        </section>

        {/* 4. How We Use Your Information */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">04</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">How We Use Your Information</h2>
          </div>
          <p className="mb-3">Your personal data is used solely for legitimate business operations:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-brand-gray-600">
            <li>Processing, packing, and dispatching your footwear orders.</li>
            <li>Sending order confirmations, tracking updates, and delivery notices.</li>
            <li>Communicating regarding customer support inquiries, size exchanges, or returns.</li>
            <li>Preventing fraudulent transactions and ensuring website security.</li>
          </ul>
        </section>

        {/* 5. Third-Party Service Providers */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">05</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Third-Party Service Providers</h2>
          </div>
          <p className="mb-3">
            We may share necessary personal information with trusted service partners exclusively to fulfill business obligations:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-brand-gray-600">
            <li><strong className="text-brand-navy">Authentication:</strong> Google OAuth for secure sign-in.</li>
            <li><strong className="text-brand-navy">Payment Gateway:</strong> Razorpay for processing digital payments.</li>
            <li><strong className="text-brand-navy">Logistics &amp; Couriers:</strong> Delivery partners for shipping your packages to the provided address.</li>
          </ul>
          <p className="mt-3 text-xs md:text-sm text-brand-gray-500">
            We do not sell, rent, or trade your personal information to third parties for marketing purposes.
          </p>
        </section>

        {/* 6. Data Retention & Security */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">06</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Data Retention &amp; Security</h2>
          </div>
          <p className="mb-3">
            We employ industry-standard technical measures and secure protocols to protect your personal information against unauthorized access, loss, or alteration. Order records are retained as necessary to satisfy accounting, taxation, and customer service requirements.
          </p>
        </section>

        {/* 7. Customer Rights & Inquiries */}
        <section className="border-b border-brand-sky-border/50 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">07</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Your Rights &amp; Contact</h2>
          </div>
          <p className="mb-3">
            You may request access to, correction of, or deletion of your personal contact information by contacting our support team:
          </p>
          <div className="bg-brand-sky/20 p-6 border border-brand-sky-border/50 rounded-xl">
            <div className="font-medium text-brand-navy mb-1">KRIPA KIRAN SHOE COMPANY</div>
            <div className="text-xs text-brand-gray-600 mb-2">15/5 SORON KTRA SHAHGANJ, AGRA - 282010</div>
            <div className="text-xs font-mono">
              Email: <a href="mailto:KKSHOECOMPANY@GMAIL.COM" className="text-brand-navy underline hover:text-brand-blue">KKSHOECOMPANY@GMAIL.COM</a>
            </div>
          </div>
        </section>

        {/* 8. Changes to this Policy */}
        <section className="pt-2">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-xs text-brand-blue font-medium">08</span>
            <h2 className="font-serif text-xl md:text-2xl text-brand-navy">Changes to Privacy Policy</h2>
          </div>
          <p className="mb-6">
            We may update this Privacy Policy from time to time to reflect operational or legal updates. Any modifications will be posted on this page with an updated revision date.
          </p>
          <div className="flex flex-wrap gap-4 border-t border-brand-sky-border/80 pt-6">
            <Link
              href="/contact"
              className="text-xs font-mono uppercase tracking-widest text-brand-navy hover:text-brand-blue hover:underline transition-colors"
            >
              Contact Us &rarr;
            </Link>
            <Link
              href="/terms"
              className="text-xs font-mono uppercase tracking-widest text-brand-gray-600 hover:text-brand-blue transition-colors"
            >
              Terms &amp; Conditions &rarr;
            </Link>
          </div>
        </section>
      </div>
      </div>
        </Reveal>
      </StoreContainer>
    </main>
  );
}
