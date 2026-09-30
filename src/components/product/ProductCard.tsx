import Link from "next/link";
import { Product, ProductImage } from "@prisma/client";
import { getProductPrices, calculateDiscount } from "@/lib/pricing";
import { FallbackImage } from "@/components/ui/FallbackImage";
import { ArrowUpRight } from "lucide-react";

type ProductWithImages = Product & {
  images: ProductImage[];
};

interface ProductCardProps {
  product: ProductWithImages;
  priority?: boolean;
  imageFit?: "cover" | "contain";
  compact?: boolean;
}

export function ProductCard({ 
  product, 
  priority = false,
  imageFit = "cover",
  compact = false,
}: ProductCardProps) {
  const sortedImages = [...(product.images || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const mainImage = sortedImages[0]?.imageUrl || "/images/men-category.jpg";
  const hoverImage = sortedImages.length > 1 ? sortedImages[1].imageUrl : null;
  const { mrp, selling } = getProductPrices(product);
  const discount = calculateDiscount(mrp, selling);
  const isContain = imageFit === "contain";

  return (
    <Link 
      href={`/product/${product.slug}`} 
      className="group block select-none sm:hover:-translate-y-[3px] transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F6F7F9] rounded-lg transition-shadow duration-[450ms] group-hover:shadow-sm">
        {/* Primary Image */}
        <FallbackImage
          src={mainImage}
          alt={product.name}
          fill
          priority={priority}
          sizes={compact ? "(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 280px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
          style={{ objectFit: imageFit }}
          className={`${
            isContain
              ? "object-contain p-4 sm:p-5 group-hover:scale-[1.04]"
              : "object-cover group-hover:scale-[1.04]"
          } object-center transition-all duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            hoverImage ? "group-hover:opacity-0 duration-[350ms]" : ""
          }`}
        />

        {/* Alternate Image on Hover (Crossfade ~350ms) */}
        {hoverImage && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[350ms] ease-out">
            <FallbackImage
              src={hoverImage}
              alt={`${product.name} alternate view`}
              fill
              sizes={compact ? "(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 280px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
              style={{ objectFit: imageFit }}
              className={`${
                isContain
                  ? "object-contain p-4 sm:p-5 group-hover:scale-[1.04]"
                  : "object-cover group-hover:scale-[1.04]"
              } object-center transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)]`}
            />
          </div>
        )}

        {/* Subtle Sale Indicator with scale transition */}
        {discount.hasDiscount && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-block bg-brand-navy/90 backdrop-blur-sm text-brand-gold text-[10px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 rounded-sm shadow-sm transition-transform duration-300 group-hover:scale-105">
              Sale
            </span>
          </div>
        )}

        {/* Hover View Action Pill */}
        <div className={`absolute bottom-3 right-3 z-10 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none hidden sm:flex items-center gap-1.5 ${compact ? "px-2.5 py-1" : "px-3 py-1.5"} bg-white/95 backdrop-blur-md rounded-full shadow-md text-brand-dark`}>
          <span className="font-mono text-[11px] uppercase tracking-wider font-medium">View</span>
          <ArrowUpRight size={12} className="text-brand-blue group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-250" />
        </div>
      </div>

      {/* Product Details */}
      <div className={`flex flex-col ${compact ? "mt-3 space-y-0.5" : "mt-3.5 space-y-1"}`}>
        {/* Category or Colorway hint */}
        <p className={`font-mono uppercase tracking-wider text-brand-gray-500 line-clamp-1 ${compact ? "text-[10px] sm:text-[11px]" : "text-[11px]"}`}>
          {product.color || product.subCategory || (product.gender === "MEN" ? "Men's Footwear" : "Women's Footwear")}
        </p>

        {/* Product Title */}
        <h3 className={`font-sans font-medium text-brand-dark group-hover:text-brand-blue transition-colors duration-300 line-clamp-1 ${compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}>
          {product.name}
        </h3>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 pt-0.5 flex-wrap">
          <span className={`font-medium text-brand-dark tracking-tight ${compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}>
            ₹{selling.toLocaleString("en-IN")}
          </span>
          {discount.hasDiscount && (
            <>
              <span className={`text-brand-gray-400 line-through ${compact ? "text-[11px] sm:text-xs" : "text-xs"}`}>
                ₹{mrp.toLocaleString("en-IN")}
              </span>
              <span className={`font-mono uppercase text-brand-blue font-semibold ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-[11px]"}`}>
                ({Math.round(discount.discountPercentage)}% off)
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
