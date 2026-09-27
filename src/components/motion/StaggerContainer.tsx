"use client";

import { motion, useReducedMotion, HTMLMotionProps } from "framer-motion";
import { staggers } from "./constants";

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  staggerDelay?: number;
  delayChildren?: number;
  viewportMargin?: string;
  viewportAmount?: number | "some" | "all";
}

export function StaggerContainer({
  children,
  staggerDelay = staggers.normal,
  delayChildren = 0,
  viewportMargin = "-50px",
  viewportAmount,
  ...props
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
        delayChildren: shouldReduceMotion ? 0 : delayChildren,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ 
        once: true, 
        margin: viewportMargin,
        ...(viewportAmount !== undefined ? { amount: viewportAmount } : {})
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
