"use client";

import { motion, useReducedMotion, HTMLMotionProps } from "framer-motion";
import { easings, durations } from "./constants";

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  yOffset?: number;
  duration?: number;
}

export function StaggerItem({
  children,
  yOffset = 25,
  duration = durations.normal,
  ...props
}: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: shouldReduceMotion ? 0 : yOffset 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : duration,
        ease: easings.premium,
      }
    },
  };

  return (
    <motion.div variants={itemVariants} {...props}>
      {children}
    </motion.div>
  );
}
