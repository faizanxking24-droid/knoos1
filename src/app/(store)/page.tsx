import { prisma } from "@/lib/db";
import { Hero } from "@/components/hero/Hero";
import Image from "next/image";
import Link from "next/link";
import { ProductWithImages } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { PromoBanners } from "@/components/home/PromoBanners";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { VideoSection } from "@/components/home/VideoSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { StoreContainer } from "@/components/store/StoreContainer";
import { SectionHeading } from "@/components/store/SectionHeading";
import { StaggerContainer, StaggerItem, Reveal, ParallaxImage } from "@/components/motion";
import { Sparkles, ShieldCheck, Feather, Compass, ArrowRight } from "lucide-react";

export const metadata = {
  title: "KNOOS - Premium Footwear",
  description: "KNOOS - Premium footwear for men and women.",
};

export const revalidate = 60;

export default async function HomePage() {
  let newArrivals: ProductWithImages[] = [];
  let bestSellers: ProductWithImages[] = [];
  let promoProduct: ProductWithImages | null = null;

  try {
    const [arrivalsData, bestSellersData, spotlightData] = await Promise.all([
      // Top 8 active products for the homepage carousel
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
          categoryRel: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      // Top 4 curated products for Best Sellers grid
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        take: 4,
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
          categoryRel: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      // Stable active product with an image for promotional spotlight
      prisma.product.findFirst({
        where: {
          status: "ACTIVE",
          images: { some: {} },
        },
        orderBy: { createdAt: "desc" },
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
          categoryRel: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
    ]);

    newArrivals = arrivalsData as ProductWithImages[];
    bestSellers = bestSellersData as ProductWithImages[];
    promoProduct = spotlightData as ProductWithImages | null;
  } catch (error) {
    console.error("Error loading homepage products:", error);
  }

  if (newArrivals.length === 0) {
    const { FALLBACK_PRODUCTS } = await import("@/lib/fallback-data");
    newArrivals = FALLBACK_PRODUCTS.slice(0, 8);
    bestSellers = FALLBACK_PRODUCTS.slice(0, 4);
    promoProduct = FALLBACK_PRODUCTS[0];
  }

  return (
    <main className="overflow-x-hidden">
      {/* 1. HERO */}
      <Hero />

      {/* 2. SHOP BY CATEGORY (MEN | WOMEN) */}
      <CategoryShowcase />

      {/* 3. PROMOTIONAL BANNERS / EDITORIAL SPOTLIGHT */}
      <PromoBanners featuredProduct={promoProduct} />

      {/* 4. HOMEPAGE CAROUSEL (NEW ARRIVALS) */}
      {newArrivals.length > 0 && (
        <FeaturedCarousel
          products={newArrivals}
          title="New Arrivals"
          eyebrow="SEASONAL DROP"
          subtitle="Our latest footwear arrivals, engineered for everyday movement and refined comfort."
          viewAllHref="/search?sort=Newest"
          viewAllText="View All New"
        />
      )}

      {/* 5. BEST SELLERS */}
      {bestSellers.length > 0 && (
        <section className="py-16 sm:py-20 lg:py-24 bg-brand-surface border-b border-brand-sky-border/40">
          <StoreContainer>
            <SectionHeading
              eyebrow="HIGH-DEMAND SILHOUETTES"
              title="Best Sellers"
              description="Our most celebrated styles, selected for enduring durability and quiet confidence."
              viewAllHref="/search"
              viewAllText="View All Best Sellers"
            />
            <StaggerContainer
              staggerDelay={0.06}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
            >
              {bestSellers.map((product) => (
                <StaggerItem key={product.id} yOffset={25}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </StoreContainer>
        </section>
      )}

      {/* 6. MADE WITH INTENT / BRAND PILLARS */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white border-b border-brand-sky-border/40">
        <StoreContainer>
          <SectionHeading
            eyebrow="THE KNOOS STANDARD"
            title="Made with Intent"
            description="Every pair is engineered around human anatomy, premium natural materials, and architectural balance."
            centered
          />

          <StaggerContainer
            staggerDelay={0.08}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-12"
          >
            <StaggerItem yOffset={25}>
              <div className="group p-8 h-full rounded-2xl bg-brand-surface border border-brand-sky-border/60 hover:border-brand-blue/50 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col items-start">
                <div className="w-12 h-12 rounded-xl bg-white border border-brand-sky-border flex items-center justify-center text-brand-blue shadow-xs mb-6 transition-transform duration-300 group-hover:scale-105">
                  <Feather size={22} />
                </div>
                <h3 className="font-serif text-xl text-brand-dark mb-2 font-medium group-hover:text-brand-blue transition-colors duration-200">Anatomical Fit</h3>
                <p className="text-brand-gray-600 text-sm leading-relaxed font-light">
                  Multi-density cushioned footbeds and ergonomic arches engineered for effortless 14-hour days on your feet.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem yOffset={25}>
              <div className="group p-8 h-full rounded-2xl bg-brand-surface border border-brand-sky-border/60 hover:border-brand-blue/50 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col items-start">
                <div className="w-12 h-12 rounded-xl bg-white border border-brand-sky-border flex items-center justify-center text-brand-blue shadow-xs mb-6 transition-transform duration-300 group-hover:scale-105">
                  <Sparkles size={22} />
                </div>
                <h3 className="font-serif text-xl text-brand-dark mb-2 font-medium group-hover:text-brand-blue transition-colors duration-200">Artisanal Leathers</h3>
                <p className="text-brand-gray-600 text-sm leading-relaxed font-light">
                  Full-grain and burnished hides that soften with time and develop a deep, personalized patina unique to your journey.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem yOffset={25}>
              <div className="group p-8 h-full rounded-2xl bg-brand-surface border border-brand-sky-border/60 hover:border-brand-blue/50 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col items-start">
                <div className="w-12 h-12 rounded-xl bg-white border border-brand-sky-border flex items-center justify-center text-brand-blue shadow-xs mb-6 transition-transform duration-300 group-hover:scale-105">
                  <Compass size={22} />
                </div>
                <h3 className="font-serif text-xl text-brand-dark mb-2 font-medium group-hover:text-brand-blue transition-colors duration-200">Versatile Modernism</h3>
                <p className="text-brand-gray-600 text-sm leading-relaxed font-light">
                  Understated silhouettes with pure lines that transition fluidly from client meetings to weekend travel.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem yOffset={25}>
              <div className="group p-8 h-full rounded-2xl bg-brand-surface border border-brand-sky-border/60 hover:border-brand-blue/50 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col items-start">
                <div className="w-12 h-12 rounded-xl bg-white border border-brand-sky-border flex items-center justify-center text-brand-blue shadow-xs mb-6 transition-transform duration-300 group-hover:scale-105">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="font-serif text-xl text-brand-dark mb-2 font-medium group-hover:text-brand-blue transition-colors duration-200">Built to Endure</h3>
                <p className="text-brand-gray-600 text-sm leading-relaxed font-light">
                  Reinforced stitching, vulcanized bonding, and durable anti-slip outsoles engineered for longevity.
                </p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </StoreContainer>
      </section>

      {/* 7. VIDEO SHOWCASE */}
      <VideoSection />

      {/* 8. QUALITY PROCESS */}
      <ProcessSection />
    </main>
  );
}
