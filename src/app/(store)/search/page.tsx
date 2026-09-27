import { Metadata } from "next";
import { Suspense } from "react";
import { getProducts } from "@/lib/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters } from "@/components/product/ProductFilters";
import { MobileFilters } from "@/components/product/MobileFilters";
import { SearchPageHeader } from "@/components/search/SearchPageHeader";
import { StoreContainer } from "@/components/store/StoreContainer";
import { SEARCH_SIZES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Search Catalog — KNOOS",
  description: "Search and explore handcrafted leather footwear by KNOOS.",
};

interface SearchPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const params = {
    q: typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined,
    gender: typeof resolvedSearchParams.gender === "string" ? resolvedSearchParams.gender : undefined,
    category: typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : undefined,
    size: typeof resolvedSearchParams.size === "string" ? resolvedSearchParams.size : undefined,
    min: typeof resolvedSearchParams.min === "string" ? resolvedSearchParams.min : undefined,
    max: typeof resolvedSearchParams.max === "string" ? resolvedSearchParams.max : undefined,
    stock: typeof resolvedSearchParams.stock === "string" ? resolvedSearchParams.stock : undefined,
    sort: typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : undefined,
  };

  const products = await getProducts(params);

  return (
    <main className="bg-brand-surface min-h-screen py-8 sm:py-12 lg:py-16">
      <StoreContainer>
        <Suspense fallback={null}>
          <SearchPageHeader initialQuery={params.q} totalCount={products.length} />
        </Suspense>

        <Suspense fallback={null}>
          <MobileFilters sizes={SEARCH_SIZES} />
        </Suspense>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          <div className="hidden lg:block w-64 lg:w-72 flex-shrink-0 sticky top-28 self-start">
            <Suspense fallback={<div className="w-full h-96 bg-white/40 rounded-2xl animate-pulse" />}>
              <ProductFilters sizes={SEARCH_SIZES} />
            </Suspense>
          </div>
          <div className="flex-1 min-w-0 w-full">
            <ProductGrid
              products={products}
              emptyMessage={
                params.q
                  ? `No footwear silhouettes found matching "${params.q}". Try searching for loafers, boots, or trainers.`
                  : "No products found matching your active filters."
              }
            />
          </div>
        </div>
      </StoreContainer>
    </main>
  );
}
