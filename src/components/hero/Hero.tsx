"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { StoreContainer } from "@/components/store/StoreContainer";
import { easings } from "@/components/motion/constants";

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const headlineScrollY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : -20]);
  const productScrollY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : 20]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, shouldReduceMotion ? 1 : 1.025]);

  return (
    <section 
      ref={heroRef}
      className="relative min-h-[600px] lg:min-h-[740px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#FCFDFE] via-[#F4F8FB] to-[#EDF4F9]"
    >
      {/* Subtle atmospheric ambient glow */}
      <motion.div
        style={{ scale: bgScale }}
        aria-hidden="true"
        className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-brand-sky-light/80 rounded-full blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-brand-sky/20 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Background Subtle Watermark Wordmark */}
      <motion.div
        style={{ scale: bgScale }}
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      >
        <span className="font-serif font-black text-[22vw] text-brand-sky-border/25 leading-none tracking-tighter uppercase">
          KNOOS
        </span>
      </motion.div>

      <StoreContainer className="relative z-10 w-full py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand Story & CTAs (Cols 1-7) */}
          <motion.div 
            style={{ y: headlineScrollY }}
            className="lg:col-span-7 flex flex-col items-start text-left z-20"
          >
            {/* 100ms: Eyebrow badge */}
            <motion.div 
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.1, ease: easings.premium }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-brand-sky-border/60 shadow-xs mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
              <span className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-brand-dark font-medium">
                Modern Footwear &bull; Edition 2026
              </span>
            </motion.div>

            {/* Editorial Masked Headline: 180ms line 1, 260ms line 2 */}
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem] xl:text-[6rem] text-brand-dark leading-[1.02] tracking-tight mb-6 flex flex-col">
              <span className="overflow-hidden inline-block py-0.5">
                <motion.span
                  className="inline-block"
                  initial={{ y: shouldReduceMotion ? 0 : "105%", opacity: shouldReduceMotion ? 1 : 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: shouldReduceMotion ? 0 : 0.18, ease: easings.premium }}
                >
                  Comfort in
                </motion.span>
              </span>
              <span className="overflow-hidden inline-block py-0.5">
                <motion.span
                  className="inline-block italic font-light text-brand-navy"
                  initial={{ y: shouldReduceMotion ? 0 : "105%", opacity: shouldReduceMotion ? 1 : 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.85, delay: shouldReduceMotion ? 0 : 0.26, ease: easings.premium }}
                >
                  every step.
                </motion.span>
              </span>
            </h1>

            {/* 400ms: Supporting Copy */}
            <motion.p 
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: shouldReduceMotion ? 0 : 0.4, ease: easings.premium }}
              className="text-brand-gray-600 text-base sm:text-lg max-w-lg font-light leading-relaxed mb-8 sm:mb-10"
            >
              Architectural silhouettes, hand-burnished leathers, and engineered cushioning built for effortless everyday movement.
            </motion.p>

            {/* 480ms: CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: shouldReduceMotion ? 0 : 0.48, ease: easings.premium }}
              className="flex flex-wrap items-center gap-4 sm:gap-5 w-full sm:w-auto"
            >
              <Link
                href="/men"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-navy text-white font-mono text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-md hover:bg-brand-blue hover:shadow-lg hover:-translate-y-[1px] transition-all duration-250 active:scale-[0.98]"
              >
                <span>Shop Men</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-250 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/women"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/90 backdrop-blur-sm border border-brand-navy/30 text-brand-dark font-mono text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-xs hover:border-brand-navy hover:bg-white hover:-translate-y-[1px] transition-all duration-250 active:scale-[0.98]"
              >
                <span>Shop Women</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-250 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>

            {/* Brand Reassurance Micro-bar */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: shouldReduceMotion ? 0 : 0.6, ease: easings.premium }}
              className="mt-10 sm:mt-12 pt-6 border-t border-brand-sky-border/50 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-brand-gray-500"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-brand-blue">&bull;</span> Free Domestic Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-brand-blue">&bull;</span> Hand-Finished Leathers
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-brand-blue">&bull;</span> 3-Day Easy Return Window
              </span>
            </motion.div>
          </motion.div>

          {/* Right Column: Hero Campaign Product Visual (Cols 8-12) */}
          <motion.div 
            style={{ y: productScrollY }}
            className="lg:col-span-5 relative mt-6 lg:mt-0 flex items-center justify-center"
          >
            {/* 550–700ms: Entrance Reveal for the visual */}
            <motion.div 
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.85, delay: shouldReduceMotion ? 0 : 0.58, ease: easings.premium }}
              className="relative w-full max-w-lg lg:max-w-none aspect-square sm:aspect-[4/5] lg:aspect-[4/5]"
            >
              {/* Subtle living motion floating container (desktop only, disabled on reduced motion) */}
              <motion.div
                animate={shouldReduceMotion || isMobile ? {} : { y: [0, -5, 0] }}
                transition={{
                  duration: 6,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "mirror",
                }}
                className="w-full h-full relative"
              >
                {/* Product Card Stage */}
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/60 bg-gradient-to-b from-white/90 to-brand-sky/20 group">
                  <Image
                    src="/images/hero-scroll-poster.webp"
                    alt="KNOOS Signature Footwear"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
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
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.8, ease: easings.premium }}
                  className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 bg-white/95 backdrop-blur-md border border-brand-sky-border/70 rounded-xl px-4 py-3 shadow-xl hidden sm:block"
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-brand-blue font-semibold block">
                    Ergonomic Insole
                  </span>
                  <span className="font-serif text-sm font-semibold text-brand-dark block mt-0.5">
                    Natural Stride Support
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll hint indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="hidden lg:flex items-center justify-center gap-2 mt-8 text-brand-gray-400 font-mono text-[11px] uppercase tracking-widest pointer-events-none"
        >
          <span>Scroll to explore</span>
          <ArrowDown size={12} className="animate-bounce" />
        </motion.div>
      </StoreContainer>
    </section>
  );
}
