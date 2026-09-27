"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

function LoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // When the route or search params change, navigation has finished rendering.
    setIsLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const startLoading = () => {
      setIsLoading(true);
      // Fallback timeout to clear loader if navigation fails or gets stuck
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 5000);
    };

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target || !target.href) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      if (target.target === "_blank") return;

      try {
        const url = new URL(target.href);
        const currentUrl = new URL(window.location.href);

        if (url.origin !== currentUrl.origin) return;
        // Ignore same page navigation (e.g. hash links or just query changes)
        if (url.pathname === currentUrl.pathname) return;
        // Exclude specific static assets
        if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|pdf|zip)$/i)) return;

        startLoading();
      } catch (err) {
        // Ignored
      }
    };

    const handlePopState = () => {
      // Browser back/forward
      startLoading();
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (data, unused, url) {
      if (url) {
        try {
          const targetUrl = new URL(url.toString(), window.location.origin);
          if (targetUrl.pathname !== window.location.pathname) {
            startLoading();
          }
        } catch (e) {}
      }
      return originalPushState.apply(this, [data, unused, url]);
    };

    window.history.replaceState = function (data, unused, url) {
      if (url) {
        try {
          const targetUrl = new URL(url.toString(), window.location.origin);
          if (targetUrl.pathname !== window.location.pathname) {
            startLoading();
          }
        } catch (e) {}
      }
      return originalReplaceState.apply(this, [data, unused, url]);
    };

    document.addEventListener("click", handleAnchorClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearTimeout(timeoutId);
    };
  }, []);

  // Debounce display: only show loader if navigation genuinely takes > 180ms
  useEffect(() => {
    let delayTimer: NodeJS.Timeout;
    if (isLoading) {
      delayTimer = setTimeout(() => {
        setVisible(true);
      }, 180);
    } else {
      setVisible(false);
    }
    return () => {
      clearTimeout(delayTimer);
    };
  }, [isLoading]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/75 backdrop-blur-md"
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
