import Link from "next/link";
import type { Product, ProductImage } from "@prisma/client";
import { getProductPrices } from "@/lib/pricing";
import { ProductCard } from "./ProductCard";
import { FallbackImage } from "@/components/ui/FallbackImage";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/motion";

type ProductWithImages = Product & { images: ProductImage[] };

interface ProductRecommendationsProps {
  title?: string;
  products: ProductWithImages[];
  mode?: "product-page" | "cart" | "checkout";
}

export function ProductRecommendations({ 
  title = "YOU MAY ALSO LIKE", 
  products, 
  mode = "product-page" 
}: ProductRecommendationsProps) {
  if (!products || products.length === 0) return null;

  if (mode === "checkout") {
    return (
      <section className="mt-6 w-full border-t border-brand-sky-border/60 pt-5">
        <h2 className="mb-4 text-xs font-mono uppercase tracking-widest text-brand-blue font-medium">{title}</h2>
        <div className="space-y-3">
          {products.slice(0, 3).map((product) => {
            const image = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.imageUrl || "/placeholder-shoe.jpg";
            const { mrp, selling } = getProductPrices(product);

            return (
              <Link key={product.id} href={`/product/${product.slug}`} className="group flex items-center gap-3">
                <div className="relative h-[90px] w-[90px] shrink-0 overflow-hidden bg-brand-sky/25 border border-brand-sky-border/40 rounded-xl">
                  <FallbackImage
                    src={image}
                    alt={product.name}
                    fill
                    sizes="90px"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  {product.salePrice && (
                    <span className="absolute left-1.5 top-1.5 bg-brand-navy text-brand-gold px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide rounded font-medium">Sale</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brand-dark group-hover:text-brand-blue transition-colors">{product.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-brand-navy">₹{selling.toLocaleString("en-IN")}</span>
                    {selling < mrp && <span className="text-brand-gray-400 line-through text-xs">₹{mrp.toLocaleString("en-IN")}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  if (mode === "cart") {
    return (
      <section className="mt-10 w-full">
        <Reveal>
          <h2 className="mb-6 text-center font-serif text-2xl text-brand-navy uppercase tracking-widest">{title}</h2>
        </Reveal>
        <StaggerContainer className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
          {products.slice(0, 4).map((product) => (
            <StaggerItem key={product.id} className="min-w-0 max-w-[280px]">
              <ProductCard product={product} imageFit="contain" compact />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>
    );
  }

  const displayedProducts = products.slice(0, 4);

  return (
    <section className="w-full border-t border-brand-sky-border/60 py-12 md:py-16">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <h2 className="font-serif text-2xl md:text-3xl mb-7 md:mb-9 text-center text-brand-navy uppercase tracking-widest">
            {title}
          </h2>
        </Reveal>
        
        {/* Mobile scrollable row (snap-start, max-w 260px), Tablet 3-col, Desktop 4-col */}
        <StaggerContainer className="flex overflow-x-auto snap-x snap-mandatory gap-5 sm:gap-6 pb-4 md:pb-0 -mx-5 px-5 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 no-scrollbar hide-scrollbar md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible md:snap-none">
          {displayedProducts.map((product) => (
            <StaggerItem 
              key={product.id} 
              className="w-[72vw] max-w-[260px] shrink-0 snap-start md:w-auto md:max-w-none md:shrink"
            >
              <ProductCard 
                product={product} 
                imageFit="contain" 
                compact 
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
