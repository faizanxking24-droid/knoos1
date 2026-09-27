import { Metadata } from "next";
import { getProducts } from "@/lib/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CollectionLayout } from "@/components/product/CollectionLayout";
import { WOMEN_SIZES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Women's Collection | KNOOS",
  description: "Shop the latest premium footwear for women.",
};

interface WomenPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function WomenPage({ searchParams }: WomenPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const params = {
    gender: "WOMEN", // Hardcode gender for this page
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
      title="Women's Collection" 
      count={products.length}
      description="Sculpted flats, effortless slip-ons, mules, and elevated low-profile silhouettes crafted for enduring distinction."
      sizes={WOMEN_SIZES}
    >
      <ProductGrid 
        products={products} 
        emptyMessage="No products available in the women's collection yet." 
      />
    </CollectionLayout>
  );
}
