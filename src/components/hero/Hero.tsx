"use client";

import Image from "next/image";
import { motion, useScroll, useSpring, useMotionValueEvent, useReducedMotion, useTransform } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";

function isVideoValid(video: HTMLVideoElement | null): video is HTMLVideoElement {
  return (
    video !== null &&
    video.readyState >= 1 &&
    Number.isFinite(video.duration) &&
    video.duration > 0
  );
}

function calculateClampedTarget(video: HTMLVideoElement, progress: number): number {
  const duration = video.duration;
  if (!Number.isFinite(duration) || duration <= 0) return 0;

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const maxSeek = duration > 0.1 ? duration - 0.05 : 0;
  return Math.min(Math.max(clampedProgress * duration, 0), maxSeek);
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const latestTargetRef = useRef<number>(0);
  const dispatchedTargetRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);

  // Video visibility state: only true once a real decoded frame is confirmed ready
  const [videoReady, setVideoReady] = useState(false);

  // Track the scroll progress of the entire 400vh section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Smooth the scroll progress for a cinematic scrubbing feel.
  const smoothProgress = useSpring(scrollYProgress, { 
    stiffness: 100, 
    damping: 30, 
    restDelta: 0.001 
  });

  const applyVideoSeek = useCallback(() => {
    const video = videoRef.current;
    if (!isVideoValid(video)) return;

    // If browser is actively decoding/seeking previous frame, defer to 'seeked' event
    if (video.seeking) return;

    const target = latestTargetRef.current;
    const maxSeek = video.duration > 0.1 ? video.duration - 0.05 : 0;
    const clampedTarget = Math.min(Math.max(target, 0), maxSeek);

    // Only seek if change is significant (> 1 frame at 24fps ≈ 0.04s)
    if (Math.abs(video.currentTime - clampedTarget) > 0.03) {
      try {
        video.currentTime = clampedTarget;
        dispatchedTargetRef.current = clampedTarget;
      } catch {
        // Ignore seek abort / DOM exceptions during cleanup or fast scrubbing
      }
    }
  }, []);

  // Coalesce video seeking via requestAnimationFrame to avoid decoder thrashing
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (shouldReduceMotion) return; // Respect prefers-reduced-motion

    const video = videoRef.current;
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      latestTargetRef.current = calculateClampedTarget(video, latest);
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          applyVideoSeek();
        });
      }
    }
  });

  // Lifecycle listeners for video decoding readiness, seeking, and error fallback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleMetadata = () => {
      if (isVideoValid(video)) {
        const target = calculateClampedTarget(video, smoothProgress.get());
        latestTargetRef.current = target;
        applyVideoSeek();
      }
    };

    const handleReady = () => {
      setVideoReady(true);
    };

    const handleSeeked = () => {
      setVideoReady(true);
      if (!isVideoValid(video)) return;

      const target = latestTargetRef.current;
      const maxSeek = video.duration > 0.1 ? video.duration - 0.05 : 0;
      const clampedTarget = Math.min(Math.max(target, 0), maxSeek);

      // Re-apply latest scroll target if meaningfully different from dispatched
      if (
        Math.abs(latestTargetRef.current - dispatchedTargetRef.current) > 0.03 &&
        Math.abs(video.currentTime - clampedTarget) > 0.03
      ) {
        try {
          video.currentTime = clampedTarget;
          dispatchedTargetRef.current = clampedTarget;
        } catch {
          // Ignore seek abort / DOM exceptions
        }
      }
    };

    const handleError = () => {
      // In case of playback or decode failure, gracefully hide video to reveal persistent poster
      setVideoReady(false);
    };

    const handleStalled = () => {
      // If stalled before initial frame is decoded, keep video hidden
      if (video.readyState < 2) {
        setVideoReady(false);
      }
    };

    // Immediate sync for already cached / ready media
    if (isVideoValid(video)) {
      handleMetadata();
    }
    if (video.readyState >= 2) {
      handleReady();
    }

    video.addEventListener("loadedmetadata", handleMetadata);
    video.addEventListener("loadeddata", handleReady);
    video.addEventListener("canplay", handleReady);
    video.addEventListener("playing", handleReady);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);
    video.addEventListener("stalled", handleStalled);
    video.addEventListener("abort", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleMetadata);
      video.removeEventListener("loadeddata", handleReady);
      video.removeEventListener("canplay", handleReady);
      video.removeEventListener("playing", handleReady);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
      video.removeEventListener("stalled", handleStalled);
      video.removeEventListener("abort", handleError);

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [applyVideoSeek, smoothProgress]);

  // Message 1: 0% to 25%
  const opacity1 = useTransform(smoothProgress, [0, 0.05, 0.2, 0.25], [1, 1, 1, 0]);
  const y1 = useTransform(smoothProgress, [0, 0.2, 0.25], [0, 0, -30]);

  // Message 2: 25% to 50%
  const opacity2 = useTransform(smoothProgress, [0.2, 0.25, 0.45, 0.5], [0, 1, 1, 0]);
  const y2 = useTransform(smoothProgress, [0.2, 0.25, 0.45, 0.5], [30, 0, 0, -30]);

  // Message 3: 50% to 75%
  const opacity3 = useTransform(smoothProgress, [0.45, 0.5, 0.7, 0.75], [0, 1, 1, 0]);
  const y3 = useTransform(smoothProgress, [0.45, 0.5, 0.7, 0.75], [30, 0, 0, -30]);

  // Message 4: 75% to 100%
  const opacity4 = useTransform(smoothProgress, [0.7, 0.75, 1, 1], [0, 1, 1, 1]);
  const y4 = useTransform(smoothProgress, [0.7, 0.75, 1, 1], [30, 0, 0, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[400vh] bg-brand-black"
    >
      {/* Sticky Container keeps the hero visual pinned while the user scrolls through the 400vh section */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col justify-center">
        {/* Persistent poster background layer: permanently mounted behind video at z-0 */}
        <Image
          src="/images/hero-poster.webp"
          alt="KNOOS Hero Background"
          fill
          priority
          sizes="100vw"
          className="object-cover pointer-events-none z-0"
        />

        {/* Video Background: mounted at z-[1], only visible when decoded frame is ready */}
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover z-[1] transition-opacity duration-500 ease-out ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          muted
          playsInline
          preload="auto"
          poster="/images/hero-poster.webp"
        >
          <source src="/videos/video-optimized.mp4" type="video/mp4" />
          <source src="/videos/video.mp4" type="video/mp4" />
        </video>

        {/* Subtle Overlay for text readability & atmospheric soft-sky/navy tone */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/60 via-brand-navy/20 to-transparent pointer-events-none z-[2]" />
        
        {/* Secondary atmospheric gradient for gentle bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none z-[2]" />

        {/* Content Layers */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-24 h-full pointer-events-none flex items-center">
          
          {/* Message 1 */}
          <motion.div style={{ opacity: opacity1, y: y1 }} className="absolute max-w-xl pointer-events-auto">
            <p className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-brand-sky/90 mb-4 drop-shadow-md">
              KNOOS Original
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight drop-shadow-lg">
              Redefining <br/>
              everyday wear.
            </h1>
            <p className="text-white/90 mb-12 max-w-md text-sm md:text-base leading-relaxed drop-shadow-md font-medium">
              We started with a simple idea: comfort should not compromise style. Welcome to the new standard.
            </p>
          </motion.div>

          {/* Message 2 */}
          <motion.div style={{ opacity: opacity2, y: y2 }} className="absolute max-w-xl pointer-events-auto">
            <p className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-brand-sky/90 mb-4 drop-shadow-md">
              Craftsmanship
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight drop-shadow-lg">
              Materials <br/>
              that matter.
            </h1>
            <p className="text-white/90 mb-12 max-w-md text-sm md:text-base leading-relaxed drop-shadow-md font-medium">
              Sourced globally, assembled with precision. Our premium leather and responsive soles work together seamlessly.
            </p>
          </motion.div>

          {/* Message 3 */}
          <motion.div style={{ opacity: opacity3, y: y3 }} className="absolute max-w-xl pointer-events-auto">
            <p className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-brand-sky/90 mb-4 drop-shadow-md">
              Movement
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight drop-shadow-lg">
              Engineered <br/>
              for motion.
            </h1>
            <p className="text-white/90 mb-12 max-w-md text-sm md:text-base leading-relaxed drop-shadow-md font-medium">
              Whether commuting through the city or standing all day, experience dynamic support that adapts to you.
            </p>
          </motion.div>

          {/* Message 4 & CTA */}
          <motion.div style={{ opacity: opacity4, y: y4 }} className="absolute max-w-xl pointer-events-auto">
            <p className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-brand-sky/90 mb-4 drop-shadow-md">
              Collection
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight drop-shadow-lg">
              Find your <br/>
              perfect fit.
            </h1>
            <p className="text-white/90 mb-10 max-w-md text-sm md:text-base leading-relaxed drop-shadow-md font-medium">
              Explore the latest arrivals. Comfort and elegance, now available for men and women.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/men"
                className="inline-block bg-brand-navy border border-brand-blue/50 px-8 py-3.5 font-mono text-xs uppercase tracking-widest text-white hover:bg-brand-blue shadow-lg hover:shadow-brand-blue/20 transition-all duration-300 rounded-sm"
              >
                Shop Men
              </a>
              <a
                href="/women"
                className="inline-block border border-white/60 bg-white/10 backdrop-blur-md px-8 py-3.5 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-brand-navy transition-all duration-300 rounded-sm"
              >
                Shop Women
              </a>
            </div>
          </motion.div>
          
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-6 md:left-12 lg:left-24 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/50" style={{ writingMode: 'vertical-rl' }}>Scroll</span>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
