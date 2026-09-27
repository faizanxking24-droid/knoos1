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
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const sortedImages = [...(product.images || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const mainImage = sortedImages[0]?.imageUrl || "/images/men-category.jpg";
  const hoverImage = sortedImages.length > 1 ? sortedImages[1].imageUrl : null;
  const { mrp, selling } = getProductPrices(product);
  const discount = calculateDiscount(mrp, selling);

  return (
    <Link href={`/product/${product.slug}`} className="group block select-none">
      {/* Product Image Stage */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F6F7F9] rounded-lg transition-all duration-500 group-hover:shadow-md">
        {/* Primary Image */}
        <FallbackImage
          src={mainImage}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover object-center transition-all duration-700 ease-out group-hover:scale-[1.03] ${
            hoverImage ? "group-hover:opacity-0" : ""
          }`}
        />

        {/* Alternate Image on Hover */}
        {hoverImage && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out">
            <FallbackImage
              src={hoverImage}
              alt={`${product.name} alternate view`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          </div>
        )}

        {/* Subtle Sale Indicator */}
        {discount.hasDiscount && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-block bg-brand-navy/90 backdrop-blur-sm text-brand-gold text-[10px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 rounded-sm shadow-sm">
              Sale
            </span>
          </div>
        )}

        {/* Hover View Action Pill */}
        <div className="absolute bottom-3 right-3 z-10 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full shadow-md text-brand-dark">
          <span className="font-mono text-[11px] uppercase tracking-wider font-medium">View</span>
          <ArrowUpRight size={12} className="text-brand-blue" />
        </div>
      </div>

      {/* Product Details */}
      <div className="mt-3.5 flex flex-col space-y-1">
        {/* Category or Colorway hint */}
        <p className="font-mono text-[11px] uppercase tracking-wider text-brand-gray-500 line-clamp-1">
          {product.color || product.subCategory || (product.gender === "MEN" ? "Men's Footwear" : "Women's Footwear")}
        </p>

        {/* Product Title */}
        <h3 className="font-sans font-medium text-sm sm:text-base text-brand-dark group-hover:text-brand-blue transition-colors duration-200 line-clamp-1">
          {product.name}
        </h3>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 pt-0.5 flex-wrap">
          <span className="font-medium text-sm sm:text-base text-brand-dark tracking-tight">
            ₹{selling.toLocaleString("en-IN")}
          </span>
          {discount.hasDiscount && (
            <>
              <span className="text-xs text-brand-gray-400 line-through">
                ₹{mrp.toLocaleString("en-IN")}
              </span>
              <span className="font-mono text-[10px] sm:text-[11px] uppercase text-brand-blue font-semibold">
                ({Math.round(discount.discountPercentage)}% off)
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
