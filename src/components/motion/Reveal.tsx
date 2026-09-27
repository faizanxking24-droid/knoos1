"use client";

import { motion, useReducedMotion, HTMLMotionProps } from "framer-motion";
import { easings, durations } from "./constants";

interface RevealProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  yOffset?: number;
  viewportMargin?: string;
  viewportAmount?: number | "some" | "all";
}

export function Reveal({ 
  children, 
  delay = 0, 
  duration = durations.reveal, 
  yOffset = 35,
  viewportMargin = "-60px",
  viewportAmount,
  ...props 
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ 
        once: true, 
        margin: viewportMargin,
        ...(viewportAmount !== undefined ? { amount: viewportAmount } : {})
      }}
      transition={{ 
        duration: shouldReduceMotion ? 0.05 : duration, 
        delay: shouldReduceMotion ? 0 : delay, 
        ease: easings.premium 
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
