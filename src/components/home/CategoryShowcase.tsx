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
}: CategoryCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: durations.reveal, delay, ease: easings.premium }}
      className="h-full"
    >
      <Link
        href={href}
        className={`group relative block h-full overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-md hover:shadow-2xl transition-all duration-700 focus:outline-none focus:ring-2 focus:ring-brand-blue ${className}`}
      >
        {/* Background Image with subtle zoom on hover */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-95"
          />
          {/* Editorial Gradients for Depth & Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 transition-opacity duration-500 group-hover:from-black/90 group-hover:via-black/40" />
        </div>

        {/* Top Meta Bar */}
        <div className="relative z-10 p-6 sm:p-8 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/80 font-medium">
              {eyebrow}
            </span>
            {stats && (
              <span className="font-mono text-[10px] text-white/60 tracking-wider">
                {stats}
              </span>
            )}
          </div>

          {badge ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white font-mono text-[10px] sm:text-xs uppercase tracking-wider">
              {badge}
            </span>
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all duration-300 group-hover:bg-white group-hover:text-neutral-950 group-hover:scale-110">
              <ArrowUpRight size={16} />
            </div>
          )}
        </div>

        {/* Bottom Content Area */}
        <div className="relative z-10 mt-auto p-6 sm:p-8 md:p-10 flex flex-col justify-end">
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-white font-normal tracking-tight mb-2 sm:mb-3">
            {title}
          </h3>
          <p className="text-white/75 text-sm sm:text-base font-light leading-relaxed mb-6 max-w-md line-clamp-2">
            {subtitle}
          </p>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-neutral-900 font-mono text-xs uppercase tracking-widest font-semibold shadow-md transition-all duration-300 group-hover:bg-brand-blue group-hover:text-white">
              <span>{ctaText}</span>
              <ArrowRight
                size={13}
                className="transition-transform duration-300 group-hover:translate-x-1"
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
    <section className="py-16 sm:py-20 lg:py-24 bg-brand-surface border-b border-brand-sky-border/40">
      <StoreContainer>
        <SectionHeading
          eyebrow="The KNOOS Collections"
          title="Curated by Silhouette"
          description="Handcrafted footwear tailored for all-day comfort, architectural proportions, and enduring distinction."
          viewAllHref="/search"
          viewAllText="Explore All"
        />

        {/* 2-Column Responsive Luxury Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
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
            className="aspect-[4/5] sm:aspect-[16/11] md:aspect-[4/5]"
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
            className="aspect-[4/5] sm:aspect-[16/11] md:aspect-[4/5]"
            delay={0.12}
          />
        </div>
      </StoreContainer>
    </section>
  );
}
