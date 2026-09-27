"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { easings } from "@/components/motion/constants";
import type { PublicReview } from "@/lib/reviews";

interface ReviewCarouselProps {
  reviews: PublicReview[];
  title?: string;
  subtitle?: string;
}

export function ReviewCarousel({ reviews, title, subtitle }: ReviewCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Calculate approx active card index for pagination dots
    const cardWidth = el.firstElementChild?.clientWidth || 320;
    const gap = 24;
    const index = Math.round(scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(Math.max(index, 0), reviews.length - 1));
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [reviews]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const cardWidth = el.firstElementChild?.clientWidth || 320;
    const scrollAmount = cardWidth + 24; // card width + gap

    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollToCard = (index: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const cardWidth = el.firstElementChild?.clientWidth || 320;
    el.scrollTo({
      left: index * (cardWidth + 24),
      behavior: "smooth",
    });
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="py-12 text-center bg-brand-sky/10 border border-brand-sky-border/30 rounded-2xl p-8">
        <p className="font-serif text-xl text-brand-dark mb-2">No reviews yet</p>
        <p className="text-sm font-mono text-brand-gray-400">
          Be the first verified customer to share feedback on this product.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Optional section header */}
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            {title && <h3 className="font-serif text-2xl md:text-3xl text-brand-dark">{title}</h3>}
            {subtitle && <p className="text-sm text-brand-gray-500 font-mono mt-1">{subtitle}</p>}
          </div>

          {/* Desktop Navigation Arrows */}
          {reviews.length > 1 && (
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                aria-label="Previous reviews"
                className="w-10 h-10 rounded-full border border-brand-gray-200 bg-white flex items-center justify-center text-brand-dark hover:border-brand-navy hover:text-brand-navy hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xs"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                aria-label="Next reviews"
                className="w-10 h-10 rounded-full border border-brand-gray-200 bg-white flex items-center justify-center text-brand-dark hover:border-brand-navy hover:text-brand-navy hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xs"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reviews Carousel Track (Horizontal swipe on mobile, smooth scroll snap) */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 pt-1 px-1 -mx-1 scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {reviews.map((review, idx) => {
          const formattedDate = review.createdAt
            ? format(new Date(review.createdAt), "MMM d, yyyy")
            : "";

          return (
            <div
              key={review.id || idx}
              className="w-[85vw] sm:w-[350px] md:w-[380px] shrink-0 snap-start bg-white border border-brand-gray-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                {/* Header: Customer Info & Rating */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {review.customerPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxImage({
                            url: review.customerPhotoUrl!,
                            title: `${review.displayName}'s Customer Photo`,
                          })
                        }
                        className="relative w-11 h-11 rounded-full overflow-hidden border border-brand-gray-200 shrink-0 hover:ring-2 hover:ring-brand-blue/50 transition-all cursor-zoom-in"
                        title="Click to view photo"
                      >
                        <Image
                          src={review.customerPhotoUrl}
                          alt={review.displayName}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </button>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-brand-sky/40 border border-brand-sky-border/40 text-brand-navy flex items-center justify-center font-mono text-sm font-semibold shrink-0">
                        {review.displayName?.charAt(0)?.toUpperCase() || "C"}
                      </div>
                    )}

                    <div>
                      <div className="font-serif text-base text-brand-dark leading-snug">
                        {review.displayName}
                      </div>
                      <div className="font-mono text-[11px] text-brand-gray-400 tracking-wider">
                        {formattedDate}
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div
                    className="flex items-center text-amber-500 text-sm tracking-tighter shrink-0"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {"★".repeat(review.rating)}
                    <span className="text-brand-gray-200">
                      {"★".repeat(5 - review.rating)}
                    </span>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-brand-gray-600 text-sm leading-relaxed mb-4 line-clamp-4">
                  {review.reviewText}
                </p>
              </div>

              {/* Product Review Photo (If present) */}
              {review.productPhotoUrl && (
                <div className="pt-3 border-t border-brand-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-brand-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <ImageIcon size={12} /> Customer product photo
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxImage({
                        url: review.productPhotoUrl!,
                        title: `Product photo by ${review.displayName}`,
                      })
                    }
                    className="mt-2 relative w-full h-36 rounded-xl overflow-hidden border border-brand-gray-100 bg-brand-gray-50 hover:opacity-95 transition-opacity cursor-zoom-in"
                  >
                    <Image
                      src={review.productPhotoUrl}
                      alt={`Product review by ${review.displayName}`}
                      fill
                      sizes="(max-width: 640px) 85vw, 360px"
                      className="object-cover"
                    />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Swipe Pagination Dots & Controls */}
      {reviews.length > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          {/* Mobile navigation arrows */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous"
              className="w-8 h-8 rounded-full border border-brand-gray-200 bg-white flex items-center justify-center text-brand-dark hover:border-brand-navy transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              aria-label="Next"
              className="w-8 h-8 rounded-full border border-brand-gray-200 bg-white flex items-center justify-center text-brand-dark hover:border-brand-navy active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Dots */}
          <div className="flex items-center gap-1.5 mx-auto md:mx-0">
            {reviews.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToCard(i)}
                aria-label={`Go to review ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  i === activeIndex
                    ? "w-6 h-2 bg-brand-navy"
                    : "w-2 h-2 bg-brand-gray-300 hover:bg-brand-gray-400"
                }`}
              />
            ))}
          </div>

          <div className="text-xs font-mono text-brand-gray-400">
            {activeIndex + 1} of {reviews.length}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Photo Inspection */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.24, ease: easings.premium }}
              className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex justify-between items-center text-white mb-3 px-2">
                <span className="font-mono text-xs uppercase tracking-wider">{lightboxImage.title}</span>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all active:scale-95"
                  aria-label="Close photo preview"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="relative w-full h-[65vh] rounded-xl overflow-hidden bg-black/50">
                <Image
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
