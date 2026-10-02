"use client";

import { useState, useEffect, useRef, MouseEvent } from "react";
import { ProductImage } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import { FallbackImage } from "@/components/ui/FallbackImage";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isMagnifying, setIsMagnifying] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const mobileSliderRef = useRef<HTMLDivElement>(null);

  const scrollToSlide = (index: number) => {
    setActiveIndex(index);
    if (mobileSliderRef.current) {
      const clientWidth = mobileSliderRef.current.clientWidth;
      mobileSliderRef.current.scrollTo({
        left: index * clientWidth,
        behavior: "smooth",
      });
    }
  };

  const handleMobileScroll = () => {
    if (!mobileSliderRef.current) return;
    const { scrollLeft, clientWidth } = mobileSliderRef.current;
    if (clientWidth === 0) return;
    const newIndex = Math.round(scrollLeft / clientWidth);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < images.length) {
      setActiveIndex(newIndex);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, activeIndex]);

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isLightboxOpen]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/5] bg-brand-sky/20 border border-brand-sky-border/30 rounded-2xl flex items-center justify-center">
        <span className="font-mono text-sm text-brand-gray-400">No Image Available</span>
      </div>
    );
  }

  const activeImage = images[activeIndex];

  const handleNext = () => {
    const nextIdx = activeIndex === images.length - 1 ? 0 : activeIndex + 1;
    scrollToSlide(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = activeIndex === 0 ? images.length - 1 : activeIndex - 1;
    scrollToSlide(prevIdx);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMagnifierPos({ x, y });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col-reverse md:flex-row gap-6 md:gap-8"
      >
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto hide-scrollbar md:w-24 lg:w-32 flex-shrink-0 pb-2 md:pb-0">
            {images.map((image, index) => (
              <button
                key={image.id || index}
                onClick={() => scrollToSlide(index)}
                className={`relative aspect-[4/5] w-20 md:w-full flex-shrink-0 border transition-all duration-300 rounded-lg overflow-hidden bg-brand-sky/20 hover:scale-[1.04] ${
                  activeIndex === index
                    ? "border-brand-navy ring-2 ring-brand-navy/40 shadow-xs opacity-100 ring-offset-1"
                    : "border-brand-sky-border/40 opacity-60 hover:opacity-100 hover:border-brand-blue/50"
                }`}
              >
                {image.isVideo ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video
                      src={image.imageUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow">
                        <svg className="w-3.5 h-3.5 text-brand-navy ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <FallbackImage
                    src={image.imageUrl}
                    alt={`${productName} thumbnail ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 80px, 128px"
                    className="object-contain p-2"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Mobile Swipeable Gallery (< md) */}
        <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-brand-sky/30 to-brand-sky/10 border border-brand-sky-border/40 rounded-2xl overflow-hidden shadow-sm block md:hidden">
          <div
            ref={mobileSliderRef}
            onScroll={handleMobileScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar touch-pan-x"
          >
            {images.map((image, index) => (
              <div
                key={image.id || index}
                className={`relative w-full h-full flex-shrink-0 snap-center snap-always flex items-center justify-center ${
                  image.isVideo ? "p-1.5 bg-black/90" : "cursor-zoom-in p-1"
                }`}
                onClick={() => {
                  if (!image.isVideo) {
                    setActiveIndex(index);
                    setIsLightboxOpen(true);
                  }
                }}
              >
                {image.isVideo ? (
                  <video
                    src={image.imageUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain rounded-xl"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <FallbackImage
                    src={image.imageUrl}
                    alt={`${productName} view ${index + 1}`}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-contain"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Mobile Pagination Indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1.5 pointer-events-none">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Go to item ${index + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToSlide(index);
                  }}
                  className={`pointer-events-auto h-1.5 transition-all duration-300 rounded-full ${
                    activeIndex === index
                      ? "w-6 bg-brand-navy shadow-xs"
                      : "w-1.5 bg-brand-navy/30 hover:bg-brand-navy/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop Main Media Container (>= md) */}
        <div
          ref={imageContainerRef}
          className={`relative w-full aspect-square md:aspect-[4/5] bg-[#F6F7F9] border border-neutral-200/80 overflow-hidden group rounded-3xl shadow-xs hidden md:block ${
            activeImage.isVideo ? "" : "cursor-zoom-in"
          }`}
          onClick={() => {
            if (!activeImage.isVideo) {
              setIsLightboxOpen(true);
              setIsMagnifying(false);
            }
          }}
          onMouseEnter={() => {
            if (!activeImage.isVideo) setIsMagnifying(true);
          }}
          onMouseLeave={() => setIsMagnifying(false)}
          onMouseMove={activeImage.isVideo ? undefined : handleMouseMove}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 1.015 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 p-4 md:p-8 flex items-center justify-center"
            >
              {activeImage.isVideo ? (
                <video
                  src={activeImage.imageUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <FallbackImage
                  src={activeImage.imageUrl}
                  alt={productName}
                  fill
                  priority
                  sizes="60vw"
                  className="object-contain"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Desktop Magnifier (Only for images) */}
          {!activeImage.isVideo && isMagnifying && (
            <div className="absolute inset-0 pointer-events-none hidden md:block overflow-hidden z-10 bg-brand-gray-50">
              <div
                className="w-full h-full relative"
                style={{
                  transformOrigin: `${magnifierPos.x}% ${magnifierPos.y}%`,
                  transform: "scale(2.2)",
                }}
              >
                <FallbackImage
                  src={activeImage.imageUrl}
                  alt={productName}
                  fill
                  sizes="60vw"
                  className="object-contain p-8"
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              className="absolute top-6 right-6 z-50 p-2 text-white/70 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(false);
              }}
              aria-label="Close Lightbox"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {images.length > 1 && (
              <button
                className="absolute left-4 md:left-12 z-50 p-4 text-white/50 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="Previous Media"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            )}

            {images.length > 1 && (
              <button
                className="absolute right-4 md:right-12 z-50 p-4 text-white/50 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next Media"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            )}

            <div
              className="relative w-full max-w-6xl h-full max-h-[85vh] mx-4 md:mx-24 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {activeImage.isVideo ? (
                    <video
                      src={activeImage.imageUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="max-w-full max-h-full object-contain rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <FallbackImage
                      src={activeImage.imageUrl}
                      alt={productName}
                      fill
                      sizes="100vw"
                      className="object-contain"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto hide-scrollbar pointer-events-none">
                <div className="flex gap-2 pointer-events-auto bg-black/50 p-2 rounded-xl backdrop-blur-md">
                  {images.map((image, index) => (
                    <button
                      key={image.id || index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveIndex(index);
                      }}
                      className={`relative w-12 h-16 md:w-16 md:h-20 flex-shrink-0 transition-all duration-300 rounded-md overflow-hidden ${
                        activeIndex === index
                          ? "border-2 border-white opacity-100"
                          : "border-2 border-transparent opacity-40 hover:opacity-100"
                      }`}
                    >
                      {image.isVideo ? (
                        <div className="relative w-full h-full bg-black flex items-center justify-center">
                          <video
                            src={image.imageUrl}
                            muted
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-cover pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center shadow">
                              <svg className="w-2.5 h-2.5 text-brand-navy ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <FallbackImage
                          src={image.imageUrl}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
