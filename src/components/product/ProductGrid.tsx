import { Product, ProductImage } from "@prisma/client";
import { ProductCard } from "./ProductCard";

type ProductWithImages = Product & {
  images: ProductImage[];
};

interface ProductGridProps {
  products: ProductWithImages[];
  emptyMessage?: string;
  columns?: 3 | 4;
}

export function ProductGrid({
  products,
  emptyMessage = "No products found in this selection.",
  columns = 3,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-20 sm:py-28 text-center px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-sky/30 border border-brand-sky-border/40 flex items-center justify-center text-brand-blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="font-serif text-2xl text-brand-dark mb-2">No Footwear Found</h3>
        <p className="text-sm text-brand-gray-500 max-w-md mx-auto mb-6">
          {emptyMessage}
        </p>
      </div>
    );
  }

  const colClasses =
    columns === 4
      ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
      : "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8";

  return (
    <div className={colClasses}>
      {products.map((product, idx) => (
        <ProductCard key={product.id} product={product} priority={idx < 4} />
      ))}
    </div>
  );
}
