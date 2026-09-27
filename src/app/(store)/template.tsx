"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easings } from "@/components/motion/constants";

export default function Template({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: shouldReduceMotion ? 0.05 : 0.28,
        ease: easings.premium
      }}
    >
      {children}
    </motion.div>
  );
}
