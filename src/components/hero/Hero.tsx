"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { StoreContainer } from "@/components/store/StoreContainer";

export function Hero() {
  return (
    <section className="relative min-h-[600px] lg:min-h-[740px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#FCFDFE] via-[#F4F8FB] to-[#EDF4F9]">
      {/* Subtle atmospheric ambient glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-brand-sky-light/80 rounded-full blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-brand-sky/20 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Background Subtle Watermark Wordmark */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      >
        <span className="font-serif font-black text-[22vw] text-brand-sky-border/25 leading-none tracking-tighter uppercase">
          KNOOS
        </span>
      </div>

      <StoreContainer className="relative z-10 w-full py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand Story & CTAs (Cols 1-7) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left z-20">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-brand-sky-border/60 shadow-xs mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
              <span className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-brand-dark font-medium">
                Modern Footwear &bull; Edition 2026
              </span>
            </div>

            {/* Editorial Headline */}
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem] xl:text-[6rem] text-brand-dark leading-[1.02] tracking-tight mb-6">
              Comfort in <br />
              <span className="italic font-light text-brand-navy">every step.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-brand-gray-600 text-base sm:text-lg max-w-lg font-light leading-relaxed mb-8 sm:mb-10">
              Architectural silhouettes, hand-burnished leathers, and engineered cushioning built for effortless everyday movement.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-5 w-full sm:w-auto">
              <Link
                href="/men"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-navy text-white font-mono text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-md hover:bg-brand-blue hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
              >
                <span>Shop Men</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/women"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/90 backdrop-blur-sm border border-brand-navy/30 text-brand-dark font-mono text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-xs hover:border-brand-navy hover:bg-white transition-all duration-300 active:scale-[0.98]"
              >
                <span>Shop Women</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>

            {/* Brand Reassurance Micro-bar */}
            <div className="mt-10 sm:mt-12 pt-6 border-t border-brand-sky-border/50 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-brand-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="text-brand-blue">&bull;</span> Free Domestic Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-brand-blue">&bull;</span> Hand-Finished Leathers
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-brand-blue">&bull;</span> 3-Day Easy Return Window
              </span>
            </div>
          </div>

          {/* Right Column: Hero Campaign Product Visual (Cols 8-12) */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex items-center justify-center">
            <div className="relative w-full max-w-lg lg:max-w-none aspect-square sm:aspect-[4/5] lg:aspect-[4/5]">
              {/* Product Card Stage */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/60 bg-gradient-to-b from-white/90 to-brand-sky/20">
                <Image
                  src="/images/hero-scroll-poster.webp"
                  alt="KNOOS Signature Footwear"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-center transition-transform duration-1000 ease-out hover:scale-105"
                />
                
                {/* Subtle soft gradient overlay at bottom of photo */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 via-transparent to-transparent pointer-events-none" />

                {/* Floating Campaign Badge */}
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white pointer-events-none">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-brand-sky/90 block">
                      Signature Series
                    </span>
                    <span className="font-serif text-lg sm:text-xl font-medium tracking-wide">
                      Chelsea Noir
                    </span>
                  </div>
                  <span className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                    Handmade
                  </span>
                </div>
              </div>

              {/* Floating Architectural Badge */}
              <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 bg-white/95 backdrop-blur-md border border-brand-sky-border/70 rounded-xl px-4 py-3 shadow-xl hidden sm:block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-brand-blue font-semibold block">
                  Ergonomic Insole
                </span>
                <span className="font-serif text-sm font-semibold text-brand-dark block mt-0.5">
                  Natural Stride Support
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint indicator */}
        <div className="hidden lg:flex items-center justify-center gap-2 mt-8 text-brand-gray-400 font-mono text-[11px] uppercase tracking-widest">
          <span>Scroll to explore</span>
          <ArrowDown size={12} className="animate-bounce" />
        </div>
      </StoreContainer>
    </section>
  );
}
