"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export const LOADER_DEBOUNCE_MS = 300;
export const LOADER_FALLBACK_TIMEOUT_MS = 2000;

export interface ShouldTriggerLoaderOptions {
  targetHref: string;
  targetAttr?: string | null;
  hasDownload?: boolean;
  currentHref: string;
  button?: number;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  defaultPrevented?: boolean;
}

export function shouldTriggerNavigationLoader(options: ShouldTriggerLoaderOptions): boolean {
  const {
    targetHref,
    targetAttr,
    hasDownload,
    currentHref,
    button = 0,
    ctrlKey = false,
    metaKey = false,
    shiftKey = false,
    altKey = false,
    defaultPrevented = false,
  } = options;

  // Ignore non-primary click or modified clicks
  if (button !== 0 || ctrlKey || metaKey || shiftKey || altKey) {
    return false;
  }

  // Ignore already prevented events
  if (defaultPrevented) {
    return false;
  }

  // Ignore target="_blank", "_parent", "_top", etc.
  if (targetAttr && targetAttr !== "_self") {
    return false;
  }

  // Ignore download links
  if (hasDownload) {
    return false;
  }

  if (!targetHref) {
    return false;
  }

  // Ignore hash links and non-HTTP protocols
  const trimmedHref = targetHref.trim();
  if (
    trimmedHref.startsWith("#") ||
    trimmedHref.startsWith("mailto:") ||
    trimmedHref.startsWith("tel:") ||
    trimmedHref.startsWith("javascript:") ||
    trimmedHref.startsWith("sms:")
  ) {
    return false;
  }

  try {
    const url = new URL(trimmedHref, currentHref);
    const currentUrl = new URL(currentHref);

    // Cross-origin navigations are handled natively by browser
    if (url.origin !== currentUrl.origin) {
      return false;
    }

    // Ignore API routes
    if (url.pathname.startsWith("/api/") || url.pathname === "/api") {
      return false;
    }

    // Ignore static files and media downloads
    if (url.pathname.match(/\.(png|jpe?g|webp|gif|svg|pdf|zip|mp4|webm|ico|json|txt|xml)$/i)) {
      return false;
    }

    // Ignore same-page navigations (same path and query string)
    if (url.pathname === currentUrl.pathname && url.search === currentUrl.search) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function LoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  // Immediate clearing when route or search params change
  useEffect(() => {
    clearTimers();
    setVisible(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href") || target.href;
      if (!href) return;

      const shouldLoad = shouldTriggerNavigationLoader({
        targetHref: href,
        targetAttr: target.getAttribute("target"),
        hasDownload: target.hasAttribute("download"),
        currentHref: window.location.href,
        button: e.button,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        defaultPrevented: e.defaultPrevented,
      });

      if (!shouldLoad) return;

      clearTimers();

      // Debounce: only show loader if forward navigation takes > 300ms
      debounceTimerRef.current = setTimeout(() => {
        setVisible(true);
      }, LOADER_DEBOUNCE_MS);

      // Defensive fallback: dismiss after 2000ms if navigation fails or aborts
      fallbackTimerRef.current = setTimeout(() => {
        setVisible(false);
        clearTimers();
      }, LOADER_FALLBACK_TIMEOUT_MS);
    };

    document.addEventListener("click", handleAnchorClick, true);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      clearTimers();
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/75 backdrop-blur-md pointer-events-none"
        >
          <div className="relative flex items-center justify-center">
            {/* Animated outer ring */}
            <div 
              className="absolute w-32 h-32 rounded-full border border-brand-sky-border/40 border-t-brand-blue animate-spin motion-reduce:hidden" 
              style={{ animationDuration: '1s' }} 
            />
            
            {/* Soft pulsing glow */}
            <div 
              className="absolute w-24 h-24 rounded-full bg-brand-blue/10 animate-pulse motion-reduce:hidden blur-2xl" 
              style={{ animationDuration: '2s' }} 
            />
            
            {/* Logo container */}
            <div 
              className="relative w-20 h-20 flex items-center justify-center animate-pulse motion-reduce:animate-none" 
              style={{ animationDuration: '2s' }}
            >
              <Image
                src="/knoos-logo-sm.webp"
                alt="Loading..."
                fill
                sizes="80px"
                className="object-contain p-2"
                priority
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PageTransitionLoader() {
  return (
    <Suspense fallback={null}>
      <LoaderContent />
    </Suspense>
  );
}
