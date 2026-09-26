import { prisma } from "@/lib/db";
import { Hero } from "@/components/hero/Hero";
import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import { RevealImage } from "@/components/motion/RevealImage";
import { StaggerContainer } from "@/components/motion/StaggerContainer";
import { StaggerItem } from "@/components/motion/StaggerItem";
import Image from "next/image";
import Link from "next/link";
import { ProductWithImages } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { PromoBanners } from "@/components/home/PromoBanners";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";

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

  return (
    <main className="overflow-x-hidden">
      {/* 1. HERO (Phase 1 Owned Component) */}
      <Hero />

      {/* 2. SHOP BY CATEGORY (MEN | WOMEN) */}
      <CategoryShowcase />

      {/* 3. PROMOTIONAL BANNERS */}
      <PromoBanners featuredProduct={promoProduct} />

      {/* 4. HOMEPAGE CAROUSEL (NEW ARRIVALS) */}
      {newArrivals.length > 0 && (
        <FeaturedCarousel
          products={newArrivals}
          title="New Arrivals"
          eyebrow="JUST IN"
          subtitle="Our latest footwear arrivals, engineered for everyday movement and refined comfort."
          viewAllHref="/search?sort=Newest"
          viewAllText="View All"
        />
      )}

      {/* 5. BEST SELLERS */}
      {bestSellers.length > 0 && (
        <section className="py-16 md:py-20 lg:py-24 px-6 md:px-12 lg:px-24 bg-brand-sky/40 border-y border-brand-sky-border/40">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
              <div>
                <RevealText
                  as="h2"
                  text="BEST SELLERS"
                  className="font-serif text-3xl md:text-4xl uppercase mb-3 text-brand-dark"
                />
                <Reveal delay={0.15}>
                  <p className="text-brand-gray-600 text-sm md:text-base">
                    Our most-loved pairs, chosen for everyday comfort and style.
                  </p>
                </Reveal>
              </div>
              <Reveal delay={0.25}>
                <Link
                  href="/search"
                  className="font-mono text-xs uppercase tracking-widest text-brand-navy hover:text-brand-blue transition-colors group flex items-center gap-2 pb-1 border-b border-transparent hover:border-brand-blue"
                >
                  <span>View All</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </Reveal>
            </div>
            <StaggerContainer
              staggerDelay={0.1}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
            >
              {bestSellers.map((product) => (
                <StaggerItem key={product.id} yOffset={30}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* 6. MADE WITH INTENT */}
      <section className="py-16 md:py-20 lg:py-24 px-6 md:px-12 lg:px-24 bg-brand-cream/80 border-y border-brand-cream-border/60">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="font-mono text-xs md:text-sm uppercase tracking-widest text-brand-gold font-semibold mb-3">
              WHY KNOOS
            </p>
          </Reveal>
          <RevealText
            as="h2"
            text="MADE WITH INTENT"
            delay={0.1}
            className="font-serif text-3xl md:text-4xl mb-12 md:mb-16 uppercase text-brand-dark"
          />

          <StaggerContainer
            staggerDelay={0.08}
            delayChildren={0.2}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8"
          >
            <StaggerItem yOffset={25} className="flex flex-col items-start group">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl border border-brand-cream-border/70 mb-6 bg-white text-brand-navy shadow-sm group-hover:scale-105 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 8v4l3 3" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3 text-brand-dark">Comfort</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                Cushioned footbeds and considered fit for long days on your feet.
              </p>
            </StaggerItem>

            <StaggerItem yOffset={25} className="flex flex-col items-start group">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl border border-brand-cream-border/70 mb-6 bg-white text-brand-navy shadow-sm group-hover:scale-105 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l-7-7m7 7a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3 text-brand-dark">Craftsmanship</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                Clean lines, careful stitching and a finish you can feel.
              </p>
            </StaggerItem>

            <StaggerItem yOffset={25} className="flex flex-col items-start group">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl border border-brand-cream-border/70 mb-6 bg-white text-brand-navy shadow-sm group-hover:scale-105 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3 text-brand-dark">Everyday Style</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                Silhouettes that move easily from work to weekend.
              </p>
            </StaggerItem>

            <StaggerItem yOffset={25} className="flex flex-col items-start group">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl border border-brand-cream-border/70 mb-6 bg-white text-brand-navy shadow-sm group-hover:scale-105 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a.5.5 0 01.5-.5h5a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-5a.5.5 0 01-.5-.5v-4z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3 text-brand-dark">Quality Materials</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                Selected leathers, knits and durable rubber outsoles.
              </p>
            </StaggerItem>

            <StaggerItem yOffset={25} className="flex flex-col items-start group">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl border border-brand-cream-border/70 mb-6 bg-white text-brand-navy shadow-sm group-hover:scale-105 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3 text-brand-dark">Built To Move</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                Flexible construction designed around natural movement.
              </p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* 7. VIDEO */}
      <section className="relative bg-brand-navy py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-2xl border border-white/10">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/images/process-footwear.jpg"
            >
              <source src="/videos/22222.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* 8. OUR QUALITY PROCESS */}
      <section className="py-16 md:py-20 lg:py-24 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-brand-sky/30 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <RevealImage
              scaleFrom={1.05}
              className="relative aspect-square md:aspect-[4/3] lg:aspect-square bg-white border border-brand-sky-border/40 shadow-lg rounded-3xl overflow-hidden"
            >
              <Image
                src="/images/process-footwear.jpg"
                alt="Craftsmanship Process"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </RevealImage>
            <div>
              <RevealText
                as="p"
                text="PROCESS"
                className="font-mono text-xs md:text-sm uppercase tracking-widest text-brand-blue font-semibold mb-4"
              />
              <RevealText
                as="h2"
                text="Finished with care."
                delay={0.1}
                className="font-serif text-3xl md:text-4xl mb-8 md:mb-12 text-brand-dark"
              />
              <StaggerContainer delayChildren={0.2} staggerDelay={0.1} className="space-y-6 md:space-y-8">
                {[
                  "Material selection and inspection",
                  "Cutting and stitched construction",
                  "Comfort-focused footbed assembly",
                  "Finishing, cleaning and quality control",
                ].map((step, idx) => (
                  <StaggerItem key={idx} yOffset={20} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-brand-blue flex-shrink-0 flex items-center justify-center mt-1 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <p className="text-base md:text-lg text-brand-dark font-light">{step}</p>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
