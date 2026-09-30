"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { StoreContainer } from "@/components/store/StoreContainer";
import { easings } from "@/components/motion/constants";

export function VideoSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-neutral-950 text-white overflow-hidden">
      <StoreContainer>
        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <motion.p
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: easings.premium }}
              className="font-mono text-xs uppercase tracking-[0.2em] text-brand-gold font-medium mb-2.5"
            >
              MOTION &amp; PRECISION
            </motion.p>
            <div className="overflow-hidden py-0.5">
              <motion.h2
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : "100%" }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: 0.05, ease: easings.premium }}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-[1.15]"
              >
                Behind the Silhouette
              </motion.h2>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="self-start md:self-end shrink-0"
          >
            <Link
              href="/about"
              className="group relative inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/80 hover:text-white pb-1 transition-colors duration-300"
            >
              <span>Our Philosophy</span>
              <ArrowRight
                size={13}
                className="transition-transform duration-250 group-hover:translate-x-1"
              />
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none" />
            </Link>
          </motion.div>
        </div>

        {/* Video Stage with Task 30: opacity 0 -> 1, scale 0.98 -> 1, duration ~0.8s */}
        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: easings.premium }}
          className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-2xl border border-white/10 bg-neutral-900"
        >
          <video
            className="absolute inset-0 h-full w-full object-cover"
            controls
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/images/process-footwear.jpg"
          >
            <source src="/videos/22222.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </motion.div>
      </StoreContainer>
    </section>
  );
}
