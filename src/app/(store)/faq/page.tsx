import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { StoreContainer } from "@/components/store/StoreContainer";
import { Reveal } from "@/components/motion";

const customerFaqs = [
  {
    id: "customer-shoe-size",
    question: "How do I choose the right shoe size?",
    answer:
      "Check the available size options on each product page and select the size you normally wear. If you are unsure, contact us before placing your order and our team will help you choose.",
  },
  {
    id: "customer-everyday-wear",
    question: "Are KNOOS shoes suitable for everyday wear?",
    answer:
      "Yes. KNOOS footwear is designed with everyday comfort, fit, and clean styling in mind.",
  },
  {
    id: "customer-place-order",
    question: "How can I place an order?",
    answer:
      "Choose your product, select the required size and quantity, add it to your cart, and continue through checkout.",
  },
  {
    id: "customer-order-confirmation",
    question: "How will I know if my order has been confirmed?",
    answer:
      "After your order is successfully placed, you will receive an order confirmation with your order details through the available contact method.",
  },
  {
    id: "customer-change-size",
    question: "Can I change my size after placing an order?",
    answer:
      "If your order has not yet been processed or shipped, contact the KNOOS team as soon as possible. Changes depend on product availability and order status.",
  },
  {
    id: "customer-size-unavailable",
    question: "What if my selected size is unavailable?",
    answer:
      "Unavailable sizes cannot be added to your order. You can check the product again later or contact us regarding availability.",
  },
  {
    id: "customer-payment-methods",
    question: "What payment methods are available?",
    answer: "The available payment options will be shown during checkout.",
  },
  {
    id: "customer-shoe-care",
    question: "How should I care for my KNOOS shoes?",
    answer:
      "Keep your footwear clean and dry, avoid prolonged exposure to water, and use suitable cleaning products for the shoe material.",
  },
  {
    id: "customer-returns-exchanges",
    question: "Can I return or exchange my order?",
    answer:
      "Return and exchange eligibility is governed by the current KNOOS Return & Refund Policy. Please review that policy page for complete details.",
  },
  {
    id: "customer-contact",
    question: "How can I contact KNOOS?",
    answer:
      "You can contact the KNOOS team using the phone, WhatsApp, or email information provided on the Contact page and website footer.",
  },
  {
    id: "customer-previous-orders",
    question: "Where can I see my previous orders?",
    answer:
      "Sign in to your KNOOS account and open the Account page to view your available order information.",
  },
  {
    id: "customer-product-colours",
    question: "Do product colours look exactly the same in person?",
    answer:
      "We try to display product colours as accurately as possible, but slight differences may occur because of lighting, photography, and screen settings.",
  },
] as const;

export const metadata: Metadata = {
  title: "Frequently Asked Questions | KNOOS",
  description: "Find answers to frequently asked questions about KNOOS footwear, shipping, returns, and more.",
};

export const revalidate = 60; // Revalidate every minute

export default async function FaqPage() {
  let managedFaqs: Array<{ id: string; question: string; answer: string }> = [];
  try {
    managedFaqs = await prisma.fAQ.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        question: true,
        answer: true,
      }
    });
  } catch (error) {
    console.warn("Could not query FAQs from database:", error instanceof Error ? error.message : error);
  }

  const customerQuestions = new Set(
    customerFaqs.map((faq) => faq.question.trim().toLocaleLowerCase())
  );
  const faqs = [
    ...customerFaqs,
    ...managedFaqs.filter(
      (faq) => !customerQuestions.has(faq.question.trim().toLocaleLowerCase())
    ),
  ];

  return (
    <main className="bg-brand-surface min-h-screen py-12 sm:py-20 lg:py-24">
      <StoreContainer>
        <Reveal>
          <div className="max-w-3xl mx-auto text-center mb-14 sm:mb-20">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-brand-blue font-semibold block mb-3">
              CONCIERGE &bull; ASSISTANCE
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-brand-dark mb-4 tracking-tight leading-[1.1]">
              Frequently Asked Questions
            </h1>
            <p className="text-neutral-500 text-sm sm:text-base font-light max-w-xl mx-auto">
              Everything you need to know regarding fits, artisanal leathers, dispatch, and doorstep exchanges.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <FaqAccordion faqs={faqs} />
        </Reveal>
      </StoreContainer>
    </main>
  );
}
