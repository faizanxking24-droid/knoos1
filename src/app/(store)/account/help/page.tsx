"use client";

import AccountShell from "../AccountShell";

const WHATSAPP_NUMBER = "917088808882";
const WHATSAPP_MESSAGE = encodeURIComponent("Hi KNOOS, I need help regarding my order.");

export default function HelpPage() {
  return (
    <AccountShell
      title="Help & Support"
      subtitle="We're here to help"
      active="help"
    >
      <div className="max-w-2xl">
        <div className="border border-brand-sky-border/60 rounded-xl bg-white overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8">
            <h2 className="font-serif text-xl text-brand-navy mb-2">Need help with your order?</h2>
            <p className="text-sm text-brand-gray-500 mb-8 leading-relaxed">
              Our team is available from 10 AM to 7 PM. Reach out to us via WhatsApp or email and we&apos;ll get back to you as soon as possible.
            </p>

            <div className="space-y-4">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 border border-brand-sky-border/60 rounded-xl px-5 py-4 hover:border-brand-blue/40 hover:bg-brand-sky/15 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-dark group-hover:text-brand-blue transition-colors">Chat on WhatsApp</p>
                  <p className="text-xs text-brand-gray-500">Get instant support</p>
                </div>
                <svg
                  className="shrink-0 text-brand-gray-400 group-hover:text-brand-blue group-hover:translate-x-1 transition-transform"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>

              <a
                href="mailto:KKSHOECOMPANY@GMAIL.COM"
                className="flex items-center gap-4 border border-brand-sky-border/60 rounded-xl px-5 py-4 hover:border-brand-blue/40 hover:bg-brand-sky/15 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-brand-sky text-brand-navy flex items-center justify-center shrink-0">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-dark group-hover:text-brand-blue transition-colors">Email Us</p>
                  <p className="text-xs text-brand-gray-500">KKSHOECOMPANY@GMAIL.COM</p>
                </div>
                <svg
                  className="shrink-0 text-brand-gray-400 group-hover:text-brand-blue group-hover:translate-x-1 transition-transform"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-brand-sky-border/60">
              <h3 className="font-mono text-xs uppercase tracking-widest text-brand-blue font-medium mb-4">
                Frequently Asked Questions
              </h3>
              <div className="space-y-4">
                <FAQItem
                  question="What is your return policy?"
                  answer="We accept returns within 3 days of delivery for wrong or damaged products. A continuous unboxing video is required for all returns."
                />
                <FAQItem
                  question="How do I track my order?"
                  answer="Once your order ships, you'll receive a tracking number via SMS. You can also track it from your order details page."
                />
                <FAQItem
                  question="What payment methods do you accept?"
                  answer="We accept Cash on Delivery (COD) and prepaid payments via UPI, card, and net banking."
                />
                <FAQItem
                  question="How can I cancel my order?"
                  answer="You can cancel your order from the order details page before it's processed. Once processing begins, cancellation is no longer possible."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccountShell>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-brand-sky-border/40 last:border-b-0">
      <summary className="flex items-center justify-between py-4 text-sm font-medium text-brand-dark group-hover:text-brand-blue cursor-pointer list-none transition-colors">
        {question}
        <svg
          className="w-4 h-4 text-brand-gray-400 group-hover:text-brand-blue group-open:rotate-45 transition-transform"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </summary>
      <p className="text-sm text-brand-gray-600 pb-4 leading-relaxed">{answer}</p>
    </details>
  );
}
