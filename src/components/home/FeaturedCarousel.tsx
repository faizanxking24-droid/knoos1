"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductWithImages } from "@/lib/products";
import { motion, useReducedMotion } from "framer-motion";
import { StoreContainer } from "@/components/store/StoreContainer";
import { easings, durations } from "@/components/motion/constants";

interface FeaturedCarouselProps {
  products: ProductWithImages[];
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllText?: string;
}

export function FeaturedCarousel({
  products,
  title = "New Arrivals",
  eyebrow = "SEASONAL DROP",
  subtitle = "Our latest arrivals, engineered with anatomical comfort and premium finishes.",
  viewAllHref = "/search?sort=Newest",
  viewAllText = "View All",
}: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollPrev(scrollLeft > 10);
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, products.length]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white border-b border-brand-sky-border/30 overflow-hidden">
      <StoreContainer>
        {/* Header row with Title, Eyebrow & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div className="max-w-2xl">
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
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.12, ease: easings.premium }}
                className="mt-3 text-brand-gray-600 text-sm sm:text-base font-normal leading-relaxed"
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          <div className="flex items-center gap-4 self-start sm:self-end pt-2 sm:pt-0">
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brand-dark hover:text-brand-blue pb-1 border-b border-brand-dark/20 hover:border-brand-blue transition-all duration-300 mr-2"
              >
                <span>{viewAllText}</span>
                <ArrowRight
                  size={13}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            )}

            {/* Navigation Arrows */}
            <div className="flex items-center gap-2" role="group" aria-label="Carousel navigation">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollPrev}
                aria-label="Previous products"
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
                  canScrollPrev
                    ? "border-neutral-300 text-neutral-800 hover:border-brand-blue hover:text-brand-blue hover:bg-neutral-50 hover:scale-105 active:scale-95"
                    : "border-neutral-200 text-neutral-300 cursor-not-allowed opacity-40"
                }`}
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollNext}
                aria-label="Next products"
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
                  canScrollNext
                    ? "border-neutral-300 text-neutral-800 hover:border-brand-blue hover:text-brand-blue hover:bg-neutral-50 hover:scale-105 active:scale-95"
                    : "border-neutral-200 text-neutral-300 cursor-not-allowed opacity-40"
                }`}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Tracks */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: durations.reveal, delay: 0.15, ease: easings.premium }}
          ref={scrollRef}
          tabIndex={0}
          role="region"
          aria-label={`${title} carousel`}
          className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-6 pt-2 -mx-5 px-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10 focus:outline-none touch-pan-x"
        >
          {products.map((product) => (
            <div
              key={product.id}
              data-carousel-item
              className="flex-none w-[70vw] sm:w-[42vw] md:w-[32vw] lg:w-[calc(25%-1.5rem)] snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </motion.div>
      </StoreContainer>
    </section>
  );
}
