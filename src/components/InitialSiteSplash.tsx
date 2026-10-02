"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/**
 * Visual asset used for the initial site opening experience.
 * To change the opening artwork in the future, replace this single constant.
 */
export const SPLASH_IMAGE = "/knoos-logo-sm.webp";

/**
 * Storage key to track whether the splash has already been shown in this browsing session.
 * Uses sessionStorage so it persists across hard reloads and navigations within the same tab,
 * but re-triggers on a new tab or fresh browser session.
 */
export const SPLASH_STORAGE_KEY = "knoos-initial-splash-seen";

/**
 * Timing constants for the initial opening splash experience:
 * - Enter animation: ~300ms
 * - Hold duration: ~400ms
 * - Exit animation: ~250ms
 * Total visible duration: ~950ms (~900ms target)
 */
export const SPLASH_HOLD_MS = 700;
export const SPLASH_EXIT_DURATION_S = 0.25;

export interface SplashStateHelperOptions {
  storage?: Storage | null;
  storageKey?: string;
}

export function shouldShowInitialSplash(options?: SplashStateHelperOptions): boolean {
  try {
    const storage = options?.storage ?? (typeof window !== "undefined" ? window.sessionStorage : null);
    if (!storage) return false;
    const key = options?.storageKey ?? SPLASH_STORAGE_KEY;
    return storage.getItem(key) !== "true";
  } catch {
    return false;
  }
}

export function markInitialSplashSeen(options?: SplashStateHelperOptions): void {
  try {
    const storage = options?.storage ?? (typeof window !== "undefined" ? window.sessionStorage : null);
    if (!storage) return;
    const key = options?.storageKey ?? SPLASH_STORAGE_KEY;
    storage.setItem(key, "true");
  } catch {
    // Gracefully handle environments with restricted storage access
  }
}

export function InitialSiteSplash() {
  const [visible, setVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Only display on the initial website opening of the session
    if (!shouldShowInitialSplash()) {
      return;
    }

    // Mark as seen immediately so any rapid navigation or reload will not display it again
    markInitialSplashSeen();
    setVisible(true);

    // Prevent background scrolling while the splash is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Hold the opening screen briefly, then transition out
    const timer = setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = originalOverflow;
    }, SPLASH_HOLD_MS);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <AnimatePresence
      onExitComplete={() => {
        // Guarantee body overflow is completely restored after exit animation finishes
        if (typeof document !== "undefined") {
          document.body.style.overflow = "";
        }
      }}
    >
      {visible && (
        <motion.div
          key="knoos-initial-splash"
          role="presentation"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0.2 : SPLASH_EXIT_DURATION_S,
            ease: "easeInOut",
          }}
          className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-white pointer-events-auto select-none"
        >
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.97 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.015 }}
            transition={
              shouldReduceMotion
                ? { duration: 0.2 }
                : {
                    duration: 0.35,
                    ease: [0.16, 1, 0.3, 1], // Smooth fashion brand cubic-bezier
                  }
            }
            className="relative flex items-center justify-center"
          >
            <div className="relative w-40 sm:w-48 md:w-52 h-20 max-w-[220px] flex items-center justify-center">
              <Image
                src={SPLASH_IMAGE}
                alt=""
                fill
                sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, 208px"
                className="object-contain"
                priority
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
