import { prisma } from "@/lib/db";
import { Hero } from "@/components/hero/Hero";
import Image from "next/image";
import Link from "next/link";
import { ProductWithImages } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { PromoBanners } from "@/components/home/PromoBanners";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { StoreContainer } from "@/components/store/StoreContainer";
import { SectionHeading } from "@/components/store/SectionHeading";
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-12">
            <div className="p-8 rounded-2xl bg-brand-surface border border-brand-sky-border/60 flex flex-col items-start hover:border-brand-blue/40 transition-colors duration-300">
              <div className="w-12 h-12 rounded-xl bg-white border border-brand-sky-border flex items-center justify-center text-brand-blue shadow-xs mb-6">
                <Feather size={22} />
              </div>
              <h3 className="font-serif text-xl text-brand-dark mb-2 font-medium">Anatomical Fit</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed font-light">
                Multi-density cushioned footbeds and ergonomic arches engineered for effortless 14-hour days on your feet.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-brand-surface border border-brand-sky-border/60 flex flex-col items-start hover:border-brand-blue/40 transition-colors duration-300">
              <div className="w-12 h-12 rounded-xl bg-white border border-brand-sky-border flex items-center justify-center text-brand-blue shadow-xs mb-6">
                <Sparkles size={22} />
              </div>
              <h3 className="font-serif text-xl text-brand-dark mb-2 font-medium">Artisanal Leathers</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed font-light">
                Full-grain and burnished hides that soften with time and develop a deep, personalized patina unique to your journey.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-brand-surface border border-brand-sky-border/60 flex flex-col items-start hover:border-brand-blue/40 transition-colors duration-300">
              <div className="w-12 h-12 rounded-xl bg-white border border-brand-sky-border flex items-center justify-center text-brand-blue shadow-xs mb-6">
                <Compass size={22} />
              </div>
              <h3 className="font-serif text-xl text-brand-dark mb-2 font-medium">Versatile Modernism</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed font-light">
                Understated silhouettes with pure lines that transition fluidly from client meetings to weekend travel.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-brand-surface border border-brand-sky-border/60 flex flex-col items-start hover:border-brand-blue/40 transition-colors duration-300">
              <div className="w-12 h-12 rounded-xl bg-white border border-brand-sky-border flex items-center justify-center text-brand-blue shadow-xs mb-6">
                <ShieldCheck size={22} />
              </div>
              <h3 className="font-serif text-xl text-brand-dark mb-2 font-medium">Built to Endure</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed font-light">
                Reinforced stitching, vulcanized bonding, and durable anti-slip outsoles engineered for longevity.
              </p>
            </div>
          </div>
        </StoreContainer>
      </section>

      {/* 7. VIDEO SHOWCASE */}
      <section className="py-16 sm:py-20 lg:py-24 bg-neutral-950 text-white overflow-hidden">
        <StoreContainer>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-gold font-medium mb-2.5">
                MOTION &amp; PRECISION
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-[1.15]">
                Behind the Silhouette
              </h2>
            </div>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/80 hover:text-white pb-1 border-b border-white/20 hover:border-white transition-all duration-300"
            >
              <span>Our Philosophy</span>
              <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-2xl border border-white/10 bg-neutral-900">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster="/images/process-footwear.jpg"
            >
              <source src="/videos/22222.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </StoreContainer>
      </section>

      {/* 8. QUALITY PROCESS */}
      <section className="py-16 sm:py-20 lg:py-24 bg-brand-surface">
        <StoreContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative aspect-[4/3] lg:aspect-square bg-neutral-100 rounded-3xl overflow-hidden shadow-lg border border-brand-sky-border/40">
              <Image
                src="/images/process-footwear.jpg"
                alt="KNOOS Footwear Workshop"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-white/90 backdrop-blur-md border border-white/40 shadow-sm pointer-events-none">
                <span className="font-mono text-[10px] uppercase tracking-widest text-brand-blue font-semibold block">
                  Studio Archive
                </span>
                <p className="font-serif text-sm sm:text-base text-brand-dark mt-0.5">
                  Hand-burnishing each toe box before final inspection.
                </p>
              </div>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-blue font-medium mb-3">
                THE PROCESS
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark tracking-tight leading-[1.15] mb-8">
                Finished with Devotion
              </h2>

              <div className="space-y-6 sm:space-y-8">
                {[
                  {
                    step: "01",
                    title: "Raw Material Selection",
                    desc: "Hand-inspecting hides for tensile strength, grain consistency, and natural surface character.",
                  },
                  {
                    step: "02",
                    title: "Architectural Pattern Cutting",
                    desc: "Precision knife-cutting every vamp, quarter, and counter to ensure zero stretch distortion.",
                  },
                  {
                    step: "03",
                    title: "Dual-Density Bed Assembly",
                    desc: "Laminating memory foam cushioning over shock-absorbing cork midsoles for lasting bounce.",
                  },
                  {
                    step: "04",
                    title: "Artisanal Edge Finishing",
                    desc: "Wax-polishing edges and burnishing leather surfaces by hand prior to boxed delivery.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-5">
                    <span className="font-mono text-sm sm:text-base font-semibold text-brand-blue bg-brand-sky/40 border border-brand-sky-border w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <h4 className="font-serif text-lg sm:text-xl text-brand-dark mb-1 font-medium">
                        {item.title}
                      </h4>
                      <p className="text-brand-gray-600 text-sm sm:text-base leading-relaxed font-light">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </StoreContainer>
      </section>
    </main>
  );
}
