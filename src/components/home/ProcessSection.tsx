"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { StoreContainer } from "@/components/store/StoreContainer";
import { ParallaxImage, StaggerContainer, StaggerItem, Reveal } from "@/components/motion";
import { easings, durations } from "@/components/motion/constants";

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Raw Material Selection",
    desc: "Hand-inspecting hides for tensile strength, grain consistency, and natural surface character.",
  },
  {
    step: "02",
    title: "Architectural Pattern Cutting",
    desc: "Precision knife-cutting every vamp, quarter, and counter to ensure zero stretch distortion.",
  },
  {
    step: "03",
    title: "Dual-Density Bed Assembly",
    desc: "Laminating memory foam cushioning over shock-absorbing cork midsoles for lasting bounce.",
  },
  {
    step: "04",
    title: "Artisanal Edge Finishing",
    desc: "Wax-polishing edges and burnishing leather surfaces by hand prior to boxed delivery.",
  },
];

export function ProcessSection() {
  const shouldReduceMotion = useReducedMotion();

  const stepItemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.55,
        ease: easings.premium,
      },
    },
  };

  const numberVariants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.5,
        ease: easings.premium,
      },
    },
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-brand-surface">
      <StoreContainer>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Workshop image with Parallax */}
          <Reveal duration={0.8} yOffset={30}>
            <div className="relative aspect-[4/3] lg:aspect-square bg-neutral-100 rounded-3xl overflow-hidden shadow-lg border border-brand-sky-border/40">
              <ParallaxImage speed={20} className="w-full h-full">
                <Image
                  src="/images/process-footwear.jpg"
                  alt="KNOOS Footwear Workshop"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </ParallaxImage>
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-white/90 backdrop-blur-md border border-white/40 shadow-sm pointer-events-none z-10">
                <span className="font-mono text-[10px] uppercase tracking-widest text-brand-blue font-semibold block">
                  Studio Archive
                </span>
                <p className="font-serif text-sm sm:text-base text-brand-dark mt-0.5">
                  Hand-burnishing each toe box before final inspection.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Right: Sequential steps */}
          <div>
            <div className="mb-8">
              <motion.p
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, ease: easings.premium }}
                className="font-mono text-xs uppercase tracking-[0.2em] text-brand-blue font-medium mb-3"
              >
                THE PROCESS
              </motion.p>
              <div className="overflow-hidden py-0.5">
                <motion.h2
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : "100%" }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: durations.reveal, delay: 0.05, ease: easings.premium }}
                  className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark tracking-tight leading-[1.15]"
                >
                  Finished with Devotion
                </motion.h2>
              </div>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                staggerChildren: shouldReduceMotion ? 0 : 0.08,
                delayChildren: shouldReduceMotion ? 0 : 0.1,
              }}
              className="space-y-6 sm:space-y-8"
            >
              {PROCESS_STEPS.map((item) => (
                <motion.div
                  key={item.step}
                  variants={stepItemVariants}
                  className="flex items-start gap-5 group"
                >
                  <motion.span
                    variants={numberVariants}
                    className="font-mono text-sm sm:text-base font-semibold text-brand-blue bg-brand-sky/40 border border-brand-sky-border w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-brand-blue/50 transition-transform duration-200"
                  >
                    {item.step}
                  </motion.span>
                  <div>
                    <h4 className="font-serif text-lg sm:text-xl text-brand-dark mb-1 font-medium group-hover:text-brand-blue transition-colors duration-200">
                      {item.title}
                    </h4>
                    <p className="text-brand-gray-600 text-sm sm:text-base leading-relaxed font-light">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </StoreContainer>
    </section>
  );
}
