"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ProductWithImages } from "@/lib/products";
import { StoreContainer } from "@/components/store/StoreContainer";
import { SectionHeading } from "@/components/store/SectionHeading";
import { easings, durations } from "@/components/motion/constants";

export interface BannerItem {
  id: string;
  badge?: string;
  title: string;
  description: string;
  ctaText: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  priceTag?: string;
  highlightTag?: string;
}

export type FeaturedProductBannerData = ProductWithImages & {
  categoryRel?: { id: string; name: string; slug: string } | null;
};

interface PromoBannersProps {
  featuredProduct?: FeaturedProductBannerData | null;
  customBanners?: BannerItem[];
}

export function PromoBanners({ featuredProduct, customBanners }: PromoBannersProps) {
  const shouldReduceMotion = useReducedMotion();

  const defaultBanners: BannerItem[] = [
    {
      id: "artisan-craft",
      badge: "THE WORKSHOP",
      title: "Built with Intent",
      description: "Every pair undergoes 48 precise assembly steps, combining traditional cordwaining with modern anatomical cushioning.",
      ctaText: "Discover the Craft",
      href: "/about",
      imageSrc: "/images/process-footwear.jpg",
      imageAlt: "KNOOS Artisanal Handcrafted Process",
      highlightTag: "Philosophy",
    },
    featuredProduct
      ? {
          id: `spotlight-${featuredProduct.id}`,
          badge:
            featuredProduct.categoryRel?.name?.toUpperCase() ||
            (featuredProduct.gender === "MEN" ? "MEN'S SPOTLIGHT" : "WOMEN'S SPOTLIGHT"),
          title: featuredProduct.name,
          description:
            featuredProduct.description ||
            "Sculpted for effortless style and lasting all-day wear with premium hand-selected leathers.",
          ctaText: "Shop the Silhouette",
          href: `/product/${featuredProduct.slug}`,
          imageSrc: featuredProduct.images[0]?.imageUrl || "/images/hero-scroll-poster.webp",
          imageAlt: featuredProduct.name,
          priceTag: featuredProduct.salePrice
            ? `₹${featuredProduct.salePrice.toLocaleString("en-IN")}`
            : `₹${featuredProduct.price.toLocaleString("en-IN")}`,
          highlightTag: "Spotlight",
        }
      : {
          id: "signature-chelsea",
          badge: "ICON SERIES",
          title: "The Chelsea Noir",
          description: "Water-resistant oiled leather, memory-foam footbeds, and custom-molded soles for modern city exploration.",
          ctaText: "Explore Signature",
          href: "/search?q=Chelsea",
          imageSrc: "/images/hero-scroll-poster.webp",
          imageAlt: "KNOOS Chelsea Noir Footwear",
          priceTag: "₹3,999",
          highlightTag: "Iconic",
        },
  ];

  const banners = customBanners && customBanners.length > 0 ? customBanners : defaultBanners;

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-brand-surface border-b border-brand-sky-border/40 overflow-hidden">
      <StoreContainer>
        <SectionHeading
          eyebrow="Editorial Curation"
          title="Spotlight & Craft"
          description="A closer look into our material philosophy and standout footwear silhouettes."
          viewAllHref="/about"
          viewAllText="Read Brand Story"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {banners.map((banner, idx) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: durations.reveal, delay: idx * 0.12, ease: easings.premium }}
              className="h-full"
            >
              <Link
                href={banner.href}
                className="group relative flex flex-col justify-between h-full min-h-[420px] sm:min-h-[480px] lg:min-h-[520px] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-md hover:shadow-2xl transition-all duration-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {/* Background Image */}
                <div className="absolute inset-0 overflow-hidden">
                  <Image
                    src={banner.imageSrc}
                    alt={banner.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105 opacity-85 group-hover:opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 transition-opacity duration-500 group-hover:via-black/45" />
                </div>

                {/* Top Badges */}
                <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between pointer-events-none">
                  {banner.badge && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-brand-gold text-[10px] sm:text-xs font-mono uppercase tracking-widest">
                      {banner.badge}
                    </span>
                  )}
                  {banner.priceTag && (
                    <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white text-neutral-950 font-mono text-xs font-bold shadow-md">
                      {banner.priceTag}
                    </span>
                  )}
                  {!banner.priceTag && banner.highlightTag && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white font-mono text-[10px] sm:text-xs uppercase tracking-wider">
                      {banner.highlightTag}
                    </span>
                  )}
                </div>

                {/* Bottom Content Area */}
                <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col items-start transition-transform duration-500 ease-out group-hover:-translate-y-1">
                  <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-white font-normal tracking-tight mb-2 sm:mb-3">
                    {banner.title}
                  </h3>
                  <p className="text-white/75 text-sm sm:text-base leading-relaxed mb-6 font-light max-w-lg line-clamp-2">
                    {banner.description}
                  </p>
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-neutral-950 font-mono text-xs uppercase tracking-widest font-semibold shadow-md transition-all duration-300 group-hover:bg-brand-blue group-hover:text-white">
                    <span>{banner.ctaText}</span>
                    <ArrowRight
                      size={13}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </StoreContainer>
    </section>
  );
}
