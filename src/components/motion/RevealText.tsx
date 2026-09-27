"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easings, durations, staggers } from "./constants";
import React from "react";

interface RevealTextProps {
  text: string;
  className?: string;
  lineClassName?: string;
  delay?: number;
  staggerDelay?: number;
  duration?: number;
  as?: React.ElementType;
}

export function RevealText({ 
  text, 
  className = "", 
  lineClassName = "",
  delay = 0, 
  staggerDelay = staggers.normal,
  duration = durations.reveal,
  as = "span" 
}: RevealTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const Component = as as any;
  
  // Split text by lines if it contains newlines, or treat as single line
  const lines = text.split("\n");

  if (shouldReduceMotion) {
    return (
      <Component className={className}>
        {lines.map((line: string, i: number) => (
          <React.Fragment key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </Component>
    );
  }

  return (
    <Component className={`${className} flex flex-col`}>
      {lines.map((line: string, i: number) => (
        <span key={i} className="overflow-hidden inline-block align-bottom py-0.5">
          <motion.span
            className={`inline-block whitespace-pre-wrap ${lineClassName}`}
            initial={{ y: "105%", opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration,
              delay: delay + i * staggerDelay,
              ease: easings.premium,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Component>
  );
}
