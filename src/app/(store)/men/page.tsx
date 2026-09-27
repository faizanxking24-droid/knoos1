import { Metadata } from "next";
import { getProducts } from "@/lib/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CollectionLayout } from "@/components/product/CollectionLayout";
import { MEN_SIZES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Men's Collection | KNOOS",
  description: "Shop the latest premium footwear for men.",
};

interface MenPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MenPage({ searchParams }: MenPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const params = {
    gender: "MEN", // Hardcode gender for this page
    q: typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined,
    category: typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : undefined,
    size: typeof resolvedSearchParams.size === "string" ? resolvedSearchParams.size : undefined,
    min: typeof resolvedSearchParams.min === "string" ? resolvedSearchParams.min : undefined,
    max: typeof resolvedSearchParams.max === "string" ? resolvedSearchParams.max : undefined,
    stock: typeof resolvedSearchParams.stock === "string" ? resolvedSearchParams.stock : undefined,
    sort: typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : undefined,
  };

  const products = await getProducts(params);

  return (
    <CollectionLayout 
      title="Men's Collection" 
      count={products.length}
      description="Architectural silhouettes, hand-burnished leathers, and engineered cushioning built for effortless everyday movement."
      sizes={MEN_SIZES}
    >
      <ProductGrid 
        products={products} 
        emptyMessage="No products available in the men's collection yet." 
      />
    </CollectionLayout>
  );
}
