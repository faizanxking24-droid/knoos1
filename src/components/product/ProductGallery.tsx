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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col-reverse md:flex-row gap-6 md:gap-8"
      >
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto hide-scrollbar md:w-24 lg:w-32 flex-shrink-0 pb-2 md:pb-0">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => scrollToSlide(index)}
                className={`relative aspect-[4/5] w-20 md:w-full flex-shrink-0 border transition-all duration-300 rounded-lg overflow-hidden bg-brand-sky/20 ${
                  activeIndex === index
                    ? "border-brand-navy ring-2 ring-brand-blue/30 opacity-100"
                    : "border-brand-sky-border/40 opacity-60 hover:opacity-100 hover:border-brand-blue/50"
                }`}
              >
                <FallbackImage
                  src={image.imageUrl}
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 80px, 128px"
                  className="object-contain p-2"
                />
              </button>
            ))}
          </div>
        )}

        {/* Mobile Swipeable Gallery (< md) */}
        <div className="relative w-full aspect-square bg-gradient-to-b from-brand-sky/30 to-brand-sky/10 border border-brand-sky-border/40 rounded-2xl overflow-hidden shadow-sm block md:hidden">
          <div
            ref={mobileSliderRef}
            onScroll={handleMobileScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar touch-pan-x"
          >
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative w-full h-full flex-shrink-0 snap-center snap-always cursor-zoom-in p-4"
                onClick={() => {
                  setActiveIndex(index);
                  setIsLightboxOpen(true);
                }}
              >
                <FallbackImage
                  src={image.imageUrl}
                  alt={`${productName} view ${index + 1}`}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-contain"
                />
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
                  aria-label={`Go to image ${index + 1}`}
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

        {/* Desktop Main Image Container (>= md) */}
        <div
          ref={imageContainerRef}
          className="relative w-full aspect-square md:aspect-[4/5] bg-gradient-to-b from-brand-sky/30 to-brand-sky/10 border border-brand-sky-border/40 overflow-hidden cursor-zoom-in group rounded-2xl shadow-sm hidden md:block"
          onClick={() => {
            setIsLightboxOpen(true);
            setIsMagnifying(false);
          }}
          onMouseEnter={() => setIsMagnifying(true)}
          onMouseLeave={() => setIsMagnifying(false)}
          onMouseMove={handleMouseMove}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 p-4 md:p-8"
            >
              <FallbackImage
                src={activeImage.imageUrl}
                alt={productName}
                fill
                priority
                sizes="60vw"
                className="object-contain"
              />
            </motion.div>
          </AnimatePresence>

          {/* Desktop Magnifier */}
          {isMagnifying && (
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
                aria-label="Previous Image"
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
                aria-label="Next Image"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            )}

            <div
              className="relative w-full max-w-6xl h-full max-h-[85vh] mx-4 md:mx-24"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <FallbackImage
                    src={activeImage.imageUrl}
                    alt={productName}
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto hide-scrollbar pointer-events-none">
                <div className="flex gap-2 pointer-events-auto bg-black/50 p-2 rounded-xl backdrop-blur-md">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
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
                      <FallbackImage
                        src={image.imageUrl}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
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
