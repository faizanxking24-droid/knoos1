"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: shouldReduceMotion ? 0 : 0.3,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
}
