"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { easings } from "@/components/motion/constants";

interface AccountPageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  className?: string;
}

export function AccountPageHeader({
  title,
  subtitle,
  backHref,
  className = "",
}: AccountPageHeaderProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.01 : 0.4, ease: easings.premium }}
      className={`mb-8 sm:mb-10 max-w-[900px] ${className}`}
    >
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 mb-3 text-xs font-mono uppercase tracking-wider text-brand-gray-500 hover:text-brand-navy transition-colors group"
        >
          <ChevronLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform duration-200"
          />
          <span>Back</span>
        </Link>
      )}
      <h1 className="font-serif text-3xl sm:text-4xl text-brand-dark tracking-tight leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm sm:text-base text-brand-gray-500 mt-2">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
