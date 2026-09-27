import Image from "next/image";
import Link from "next/link";
import { ProductWithImages } from "@/lib/products";
import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import { RevealImage } from "@/components/motion/RevealImage";

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
  // Built-in banners referencing real routes and active product data or fallback assets
  const defaultBanners: BannerItem[] = [
    {
      id: "new-arrivals-editorial",
      badge: "NEW ARRIVALS",
      title: "Crafted For Daily Movement",
      description: "Ergonomic comfort, breathable construction, and timeless silhouettes made for everyday life.",
      ctaText: "Explore New Arrivals",
      href: "/search?sort=Newest",
      imageSrc: "/images/process-footwear.jpg",
      imageAlt: "KNOOS Handcrafted Footwear Process",
      highlightTag: "New Season",
    },
    featuredProduct
      ? {
          id: `product-spotlight-${featuredProduct.id}`,
          badge:
            featuredProduct.categoryRel?.name?.toUpperCase() ||
            (featuredProduct.gender === "MEN" ? "MEN'S SPOTLIGHT" : "WOMEN'S SPOTLIGHT"),
          title: featuredProduct.name,
          description:
            featuredProduct.description ||
            "Timeless design meets exceptional comfort and deliberate craftsmanship.",
          ctaText: "View Product",
          href: `/product/${featuredProduct.slug}`,
          imageSrc: featuredProduct.images[0]?.imageUrl || "/images/men-category.jpg",
          imageAlt: featuredProduct.name,
          priceTag: featuredProduct.salePrice
            ? `₹${featuredProduct.salePrice.toLocaleString("en-IN")}`
            : `₹${featuredProduct.price.toLocaleString("en-IN")}`,
          highlightTag: "Featured Shoe",
        }
      : {
          id: "men-editorial",
          badge: "SIGNATURE SERIES",
          title: "The Men's Collection",
          description: "From relaxed everyday slip-ons to refined lace-ups, constructed for enduring style.",
          ctaText: "Shop Men's Collection",
          href: "/men",
          imageSrc: "/images/men-category.jpg",
          imageAlt: "KNOOS Men's Collection",
          highlightTag: "Curated",
        },
  ];

  const banners = customBanners && customBanners.length > 0 ? customBanners : defaultBanners;

  return (
    <section className="py-16 md:py-20 lg:py-24 px-6 md:px-12 lg:px-24 bg-brand-sky/20 border-y border-brand-sky-border/30 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-12 gap-4">
          <div>
            <Reveal>
              <p className="font-mono text-xs md:text-sm uppercase tracking-widest text-brand-blue font-semibold mb-3">
                EDITORIAL
              </p>
            </Reveal>
            <RevealText
              as="h2"
              text="Featured Highlights"
              className="font-serif text-3xl md:text-4xl text-brand-dark"
            />
          </div>
          <Reveal delay={0.15}>
            <Link
              href="/search"
              className="group font-mono text-xs uppercase tracking-widest text-brand-navy hover:text-brand-blue transition-colors inline-flex items-center gap-2 pb-1 border-b border-transparent hover:border-brand-blue"
            >
              <span>View All Collections</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
            </Link>
          </Reveal>
        </div>

        <div className="flex md:grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-smooth touch-pan-x no-scrollbar pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="flex-none md:flex-initial snap-start w-[84vw] sm:w-[70vw] md:w-auto h-full"
            >
              <RevealImage
                delay={index * 0.12}
                scaleFrom={1.03}
                viewport={{ once: true, margin: "0px" }}
                className="h-full"
              >
                <Link
                  href={banner.href}
                  className="group relative flex flex-col justify-end min-h-[340px] sm:min-h-[420px] md:min-h-[480px] rounded-2xl overflow-hidden bg-brand-navy border border-brand-navy-light/40 shadow-md hover:shadow-2xl transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 h-full"
                >
                  {/* Responsive Next/Image with proper sizing */}
                  <Image
                    src={banner.imageSrc}
                    alt={banner.imageAlt}
                    fill
                    sizes="(max-width: 768px) 85vw, 50vw"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-90"
                  />

                  {/* Rich Multi-stop Gradient for Text Legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-95" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 sm:top-5 sm:left-5 sm:right-5 flex items-center justify-between pointer-events-none">
                    {banner.badge && (
                      <span className="inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-brand-navy/80 backdrop-blur-md border border-white/20 text-brand-gold text-[10px] sm:text-[11px] font-mono uppercase tracking-wider">
                        {banner.badge}
                      </span>
                    )}
                    {banner.priceTag && (
                      <span className="inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white text-brand-dark text-[11px] sm:text-xs font-mono font-bold shadow-md">
                        {banner.priceTag}
                      </span>
                    )}
                    {!banner.priceTag && banner.highlightTag && (
                      <span className="inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-mono uppercase tracking-wider">
                        {banner.highlightTag}
                      </span>
                    )}
                  </div>

                  {/* Bottom Content Container */}
                  <div className="relative z-10 p-5 sm:p-8 md:p-10 flex flex-col items-start transition-transform duration-500 ease-out group-hover:-translate-y-1">
                    <h3 className="font-serif text-xl sm:text-3xl lg:text-4xl text-white mb-2 sm:mb-3 tracking-tight drop-shadow-sm">
                      {banner.title}
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-base leading-relaxed mb-4 sm:mb-6 font-sans font-light max-w-lg line-clamp-2">
                      {banner.description}
                    </p>
                    <span className="inline-flex items-center gap-2 sm:gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white text-brand-dark font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-md transition-all duration-300 group-hover:bg-brand-blue group-hover:text-white group-hover:shadow-lg">
                      <span>{banner.ctaText}</span>
                      <span
                        className="text-brand-blue group-hover:text-white transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden="true"
                      >
                        &rarr;
                      </span>
                    </span>
                  </div>
                </Link>
              </RevealImage>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
