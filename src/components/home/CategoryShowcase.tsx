"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { StoreContainer } from "@/components/store/StoreContainer";
import { SectionHeading } from "@/components/store/SectionHeading";
import { easings, durations } from "@/components/motion/constants";

interface CategoryCardProps {
  title: string;
  eyebrow: string;
  subtitle: string;
  ctaText: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  stats?: string;
  badge?: string;
  className?: string;
  delay?: number;
  imageClassName?: string;
}

function CategoryCard({
  title,
  eyebrow,
  subtitle,
  ctaText,
  href,
  imageSrc,
  imageAlt,
  stats,
  badge,
  className = "",
  delay = 0,
  imageClassName = "object-center",
}: CategoryCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: durations.reveal, delay, ease: easings.premium }}
      className="h-full min-w-0 w-full"
    >
      <Link
        href={href}
        className={`group relative flex flex-col justify-between h-full min-w-0 w-full overflow-hidden rounded-xl sm:rounded-2xl bg-neutral-900 border border-neutral-800 shadow-md hover:shadow-2xl transition-all duration-700 focus:outline-none focus:ring-2 focus:ring-brand-blue ${className}`}
      >
        {/* Background Image with subtle zoom on hover */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 50vw, 50vw"
            className={`object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] md:group-hover:scale-105 opacity-90 md:group-hover:opacity-95 ${imageClassName}`}
          />
          {/* Editorial Gradients for Depth & Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 transition-all duration-500 md:group-hover:from-black/95 md:group-hover:via-black/45" />
        </div>

        {/* Top Meta Bar */}
        <div className="relative z-10 p-3 sm:p-5 md:p-6 lg:p-8 flex items-start justify-between gap-1.5 sm:gap-2">
          <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
            <span className="font-mono text-[8px] sm:text-[10px] lg:text-[11px] uppercase tracking-[0.14em] md:tracking-[0.18em] lg:tracking-[0.2em] text-white/80 font-medium whitespace-nowrap">
              {eyebrow}
            </span>
            {stats && (
              <span className="hidden sm:block font-mono text-[9px] md:text-[10px] text-white/60 tracking-wider whitespace-nowrap">
                {stats}
              </span>
            )}
          </div>

          {badge ? (
            <span className="hidden md:inline-flex shrink-0 items-center px-2.5 py-0.5 lg:px-3 lg:py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white font-mono text-[9px] lg:text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-300 md:group-hover:border-white/40 md:group-hover:bg-white/25 md:group-hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              {badge}
            </span>
          ) : (
            <div className="hidden md:flex w-7 h-7 lg:w-9 lg:h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 items-center justify-center text-white transition-all duration-300 md:group-hover:bg-white md:group-hover:text-neutral-950 md:group-hover:scale-110 shrink-0">
              <ArrowUpRight size={16} />
            </div>
          )}
        </div>

        {/* Bottom Content Area */}
        <div className="relative z-10 mt-auto p-3 sm:p-5 md:p-6 lg:p-10 flex flex-col justify-end">
          <h3 className="font-serif text-[17px] sm:text-xl md:text-3xl lg:text-4xl text-white font-normal tracking-tight leading-tight sm:leading-snug mb-1 sm:mb-2 md:mb-3 transition-transform duration-300 md:group-hover:-translate-y-0.5">
            {title}
          </h3>
          <p className="line-clamp-2 text-[11px] sm:text-xs md:text-sm lg:text-base text-white/75 font-light leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 md:mb-6 max-w-md">
            {subtitle}
          </p>

          <div className="flex items-center">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-full bg-white text-neutral-900 font-mono text-[9px] sm:text-[11px] md:text-xs uppercase tracking-wider sm:tracking-widest font-semibold shadow-md transition-all duration-300 md:group-hover:bg-brand-blue md:group-hover:text-white whitespace-nowrap">
              <span>{ctaText}</span>
              <ArrowRight
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 transition-transform duration-300 md:group-hover:translate-x-1 shrink-0"
              />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CategoryShowcase() {
  return (
    <section
      id="curated-by-silhouette"
      className="py-16 sm:py-20 lg:py-24 bg-brand-surface border-b border-brand-sky-border/40"
    >
      <StoreContainer>
        <SectionHeading
          eyebrow="The KNOOS Collections"
          title="Curated by Silhouette"
          description="Handcrafted footwear tailored for all-day comfort, architectural proportions, and enduring distinction."
          viewAllHref="/search"
          viewAllText="Explore All"
        />

        {/* 2-Column Responsive Luxury Showcase */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:gap-6 lg:gap-8">
          <CategoryCard
            eyebrow="MENSWEAR ARCHIVE"
            title="The Men's Collection"
            subtitle="Architectural loafers, Chelsea boots, formal lace-ups, and cushioned daily slip-ons."
            ctaText="Shop Men"
            href="/men"
            imageSrc="/images/men-category.jpg"
            imageAlt="KNOOS Men's Footwear Collection"
            stats="Hand-Burnished Leathers"
            badge="Essential Series"
            className="aspect-[3/4] sm:aspect-[4/5] md:aspect-[4/5]"
            delay={0}
          />

          <CategoryCard
            eyebrow="WOMENSWEAR EDIT"
            title="The Women's Collection"
            subtitle="Sculpted flats, effortless slip-ons, mules, and elevated everyday silhouettes."
            ctaText="Shop Women"
            href="/women"
            imageSrc="/images/women-category.jpg"
            imageAlt="KNOOS Women's Footwear Collection"
            stats="Lightweight Cushioning"
            badge="New Curation"
            className="aspect-[3/4] sm:aspect-[4/5] md:aspect-[4/5]"
            delay={0.12}
          />
        </div>
      </StoreContainer>
    </section>
  );
}
