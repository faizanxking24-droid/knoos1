"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

interface ParallaxImageProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // positive moves opposite to scroll, default subtle (e.g. 25px)
  scaleEffect?: boolean;
}

export function ParallaxImage({
  children,
  className = "",
  speed = 25,
  scaleEffect = false,
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
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
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-speed, speed]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1]);

  if (shouldReduceMotion || isMobile) {
    return (
      <div ref={ref} className={`overflow-hidden relative ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={`overflow-hidden relative ${className}`}>
      <motion.div
        style={{
          y,
          ...(scaleEffect ? { scale } : {}),
        }}
        className="w-full h-full relative"
      >
        {children}
      </motion.div>
    </div>
  );
}
