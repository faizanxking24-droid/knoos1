import Image from "next/image";
import Link from "next/link";
import { RevealText } from "@/components/motion/RevealText";
import { RevealImage } from "@/components/motion/RevealImage";
import { Reveal } from "@/components/motion/Reveal";

interface CategoryCardProps {
  title: string;
  subtitle: string;
  ctaText: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  delay?: number;
}

function CategoryCard({
  title,
  subtitle,
  ctaText,
  href,
  imageSrc,
  imageAlt,
  delay = 0,
}: CategoryCardProps) {
  return (
    <RevealImage delay={delay} scaleFrom={1.03} className="h-full">
      <Link
        href={href}
        className="group relative block h-full min-h-[270px] sm:min-h-[460px] md:min-h-[500px] sm:aspect-[16/10] md:aspect-[4/5] bg-brand-sky/20 border border-brand-sky-border/40 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 50vw, 50vw"
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        {/* Ambient Gradient Overlays for Readability and Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/35 to-transparent opacity-85 transition-opacity duration-500 group-hover:opacity-95" />

        {/* Top subtle category pill tag */}
        <div className="absolute top-2.5 left-2.5 sm:top-5 sm:left-5 md:top-7 md:left-7">
          <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white/90 text-[10px] sm:text-xs font-mono uppercase tracking-wider">
            Collection
          </span>
        </div>

        {/* Content Box */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-8 md:p-10 flex flex-col items-start transition-transform duration-500 ease-out group-hover:-translate-y-1">
          <h3 className="font-serif text-xl sm:text-3xl md:text-4xl text-white mb-1 sm:mb-2 tracking-wide drop-shadow-sm">
            {title}
          </h3>
          <p className="hidden sm:block text-slate-200 text-sm sm:text-base mb-4 md:mb-5 font-sans font-light line-clamp-2 max-w-sm">
            {subtitle}
          </p>
          <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-white text-brand-dark font-mono text-[10px] sm:text-sm font-semibold uppercase tracking-wider shadow-md transition-all duration-300 group-hover:bg-brand-blue group-hover:text-white group-hover:shadow-lg">
            <span>{ctaText}</span>
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
  );
}

export function CategoryShowcase() {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-12 lg:px-24 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-12 gap-4">
          <div>
            <Reveal>
              <p className="font-mono text-xs md:text-sm uppercase tracking-widest text-brand-gold font-semibold mb-3">
                COLLECTIONS
              </p>
            </Reveal>
            <RevealText
              as="h2"
              text="Shop by Category"
              className="font-serif text-3xl md:text-4xl text-brand-dark"
            />
          </div>
          <Reveal delay={0.15}>
            <p className="text-brand-gray-500 text-sm md:text-base max-w-md">
              Refined silhouettes built for all-day comfort, crafted with premium materials.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:gap-8">
          <CategoryCard
            title="Men"
            subtitle="Loafers, sneakers, boots and everyday essentials built to move."
            ctaText="Shop Men"
            href="/men"
            imageSrc="/images/men-category.jpg"
            imageAlt="Men's Footwear Collection"
            delay={0}
          />
          <CategoryCard
            title="Women"
            subtitle="Contemporary flats, sandals and elevated everyday silhouettes."
            ctaText="Shop Women"
            href="/women"
            imageSrc="/images/women-category.jpg"
            imageAlt="Women's Footwear Collection"
            delay={0.1}
          />
        </div>
      </div>
    </section>
  );
}
