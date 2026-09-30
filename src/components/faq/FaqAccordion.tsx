"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export function FaqAccordion({ faqs }: { faqs: FAQ[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  if (faqs.length === 0) {
    return (
      <div className="py-20 text-center font-mono text-sm text-brand-gray-400">
        No FAQs available at the moment.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      {faqs.map((faq, index) => {
        const isOpen = openId === faq.id;
        const triggerId = `faq-trigger-${faq.id}`;
        const panelId = `faq-panel-${faq.id}`;

        return (
          <motion.div 
            key={faq.id} 
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: shouldReduceMotion ? 0.01 : 0.45,
              delay: shouldReduceMotion ? 0 : Math.min(index * 0.05, 0.35),
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`border-b border-brand-sky-border/60 transition-colors duration-200 rounded-lg ${
              isOpen ? "bg-brand-sky/20 border-l-2 border-l-brand-blue" : ""
            }`}
          >
            <button
              id={triggerId}
              type="button"
              onClick={() => toggleOpen(faq.id)}
              className="w-full text-left py-6 px-4 md:px-6 flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-brand-blue/20 rounded-lg"
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className="font-serif text-lg md:text-xl text-brand-dark group-hover:text-brand-blue transition-colors pr-8">
                {faq.question}
              </span>
              <motion.span
                aria-hidden="true"
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`flex-shrink-0 transition-colors ${
                  isOpen ? "text-brand-blue" : "text-brand-navy/60 group-hover:text-brand-blue"
                }`}
              >
                <Plus size={20} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.25,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="overflow-hidden"
                >
                  <div className="px-4 md:px-6 pb-6 text-brand-gray-600 text-sm md:text-base leading-relaxed">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
