"use client";

import { motion, useReducedMotion, HTMLMotionProps } from "framer-motion";
import { easings, durations } from "./constants";

interface RevealImageProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  scaleFrom?: number;
  clipReveal?: boolean | "vertical" | "horizontal";
  className?: string;
}

export function RevealImage({
  children,
  delay = 0,
  duration = durations.reveal,
  scaleFrom = 1.04,
  clipReveal = false,
  className = "",
  ...props
}: RevealImageProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={`overflow-hidden ${className}`} {...(props as any)}>
        {children}
      </div>
    );
  }

  const initialClip = 
    clipReveal === "horizontal"
      ? "inset(0 100% 0 0)"
      : clipReveal
      ? "inset(0 0 100% 0)"
      : undefined;

  const targetClip = clipReveal ? "inset(0 0 0% 0)" : undefined;

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: scaleFrom,
        ...(initialClip ? { clipPath: initialClip } : {})
      }}
      whileInView={{ 
        opacity: 1, 
        scale: 1,
        ...(targetClip ? { clipPath: targetClip } : {})
      }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ 
        duration, 
        delay, 
        ease: easings.premium 
      }}
      className={`overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
