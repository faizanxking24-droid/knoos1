"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { easings, durations } from "@/components/motion/constants";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  viewAllHref?: string;
  viewAllText?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  viewAllHref,
  viewAllText = "View All",
  centered = false,
  className = "",
}: SectionHeadingProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`flex flex-col ${
        centered ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"
      } mb-8 sm:mb-12 gap-4 ${className}`}
    >
      <div className={centered ? "max-w-2xl mx-auto" : "max-w-2xl"}>
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: easings.premium }}
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-brand-blue font-medium mb-2.5"
          >
            {eyebrow}
          </motion.p>
        )}

        <div className="overflow-hidden py-0.5">
          <motion.h2
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : "100%" }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: durations.reveal, delay: 0.05, ease: easings.premium }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark tracking-tight leading-[1.15]"
          >
            {title}
          </motion.h2>
        </div>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.12, ease: easings.premium }}
            className="mt-3 text-brand-gray-600 text-sm sm:text-base font-normal leading-relaxed"
          >
            {description}
          </motion.p>
        )}
      </div>

      {viewAllHref && !centered && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="pt-2 md:pt-0 self-start md:self-end shrink-0"
        >
          <Link
            href={viewAllHref}
            className="group relative inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brand-dark hover:text-brand-blue py-1 transition-colors duration-200"
          >
            <span className="relative">
              {viewAllText}
              <span className="absolute left-0 -bottom-0.5 w-full h-[1px] bg-brand-blue origin-left scale-x-0 transition-transform duration-250 ease-out group-hover:scale-x-100" />
            </span>
            <ArrowRight
              size={13}
              className="transition-transform duration-200 group-hover:translate-x-1 text-brand-blue"
            />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
