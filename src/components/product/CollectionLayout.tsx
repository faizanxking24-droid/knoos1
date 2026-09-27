"use client";

import { ReactNode, Suspense } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ProductFilters } from "./ProductFilters";
import { MobileFilters } from "./MobileFilters";
import { StoreContainer } from "@/components/store/StoreContainer";
import { easings, durations } from "@/components/motion/constants";

interface CollectionLayoutProps {
  title: string;
  count: number;
  description?: string;
  children: ReactNode;
  sizes?: string[];
  bannerImage?: string;
}

export function CollectionLayout({
  title,
  count,
  description,
  children,
  sizes,
}: CollectionLayoutProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="bg-brand-surface min-h-screen py-8 sm:py-12 lg:py-16">
      <StoreContainer>
        {/* Editorial Collection Header Banner with Orchestrated Entrance */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-brand-sky-light/40 to-brand-sky/20 border border-brand-sky-border/50 p-8 sm:p-12 lg:p-16 mb-10 sm:mb-14 shadow-xs">
          <div className="max-w-2xl">
            {/* 1. Eyebrow */}
            <motion.span
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: shouldReduceMotion ? 0 : 0.05, ease: easings.premium }}
              className="font-mono text-xs uppercase tracking-[0.25em] text-brand-blue font-semibold block mb-3"
            >
              THE CURATION &bull; 2026
            </motion.span>

            {/* 2. Large Collection Title (Masked text reveal) */}
            <div className="overflow-hidden py-1 mb-4">
              <motion.h1
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : "105%" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: durations.reveal, delay: shouldReduceMotion ? 0 : 0.12, ease: easings.premium }}
                className="font-serif text-3xl sm:text-5xl lg:text-6xl text-brand-dark tracking-tight leading-[1.1]"
              >
                {title}
              </motion.h1>
            </div>

            {/* 3. Small Description */}
            <motion.p
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: shouldReduceMotion ? 0 : 0.22, ease: easings.premium }}
              className="text-brand-gray-600 text-sm sm:text-base font-light leading-relaxed mb-6"
            >
              {description ||
                "Handcrafted leather footwear engineered for effortless daily movement, timeless proportion, and enduring comfort."}
            </motion.p>

            {/* 4. Count Pill */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: shouldReduceMotion ? 0 : 0.3, ease: easings.premium }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-brand-sky-border/70 text-xs font-mono text-brand-dark shadow-2xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
              <span>
                {count} {count === 1 ? "Signature Silhouette" : "Signature Silhouettes"} Available
              </span>
            </motion.div>
          </div>

          {/* Background Ambient Wordmark */}
          <div
            aria-hidden="true"
            className="absolute -right-8 -bottom-10 pointer-events-none select-none hidden md:block"
          >
            <span className="font-serif font-black text-8xl lg:text-9xl text-brand-sky-border/20 uppercase tracking-tighter">
              KNOOS
            </span>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <Suspense fallback={null}>
          <MobileFilters sizes={sizes} />
        </Suspense>

        {/* Desktop Layout: Sticky Sidebar + Main Product Grid */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          <div className="hidden lg:block w-64 lg:w-72 flex-shrink-0 sticky top-28 self-start">
            <Suspense fallback={<div className="w-full h-96 bg-white/40 rounded-2xl animate-pulse" />}>
              <ProductFilters sizes={sizes} />
            </Suspense>
          </div>
          <div className="flex-1 min-w-0 w-full">
            {children}
          </div>
        </div>
      </StoreContainer>
    </main>
  );
}
