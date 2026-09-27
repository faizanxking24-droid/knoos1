"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SEARCH_SIZES } from "@/lib/constants";
import { X, Check } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

const SORTS = [
  { value: "Featured", label: "Featured" },
  { value: "Newest", label: "Newest Arrivals" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

export interface ProductFiltersProps {
  sizes?: string[];
}

export function ProductFilters({ sizes = SEARCH_SIZES }: ProductFiltersProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch active categories from the database
  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setCategories(data?.categories ?? []);
          setCategoriesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Helper to create a new query string
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string) => {
    router.push(`?${createQueryString(name, value)}`, { scroll: false });
  };

  const clearAll = () => {
    const q = searchParams.get("q");
    if (q) {
      router.push(`?q=${encodeURIComponent(q)}`, { scroll: false });
    } else {
      router.push(`?`, { scroll: false });
    }
  };

  const [minPrice, setMinPrice] = useState(searchParams.get("min") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") || "");

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("min", minPrice);
    else params.delete("min");

    if (maxPrice) params.set("max", maxPrice);
    else params.delete("max");

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const activeCategory = searchParams.get("category");
  const activeSize = searchParams.get("size");
  const activeSort = searchParams.get("sort") || "Featured";

  const hasFilters =
    Boolean(activeCategory) ||
    Boolean(activeSize) ||
    Boolean(searchParams.get("min")) ||
    Boolean(searchParams.get("max")) ||
    (Boolean(searchParams.get("sort")) && searchParams.get("sort") !== "Featured");

  return (
    <aside className="w-full bg-white/90 backdrop-blur-md border border-brand-sky-border/60 rounded-2xl p-6 sm:p-7 shadow-xs space-y-8">
      {/* Active Filters Header */}
      {hasFilters && (
        <div className="pb-6 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-brand-dark font-semibold">
              Active Filters
            </h3>
            <button
              onClick={clearAll}
              className="text-[11px] font-mono uppercase tracking-wider text-brand-blue hover:text-brand-navy transition-colors underline-offset-2 hover:underline"
            >
              Reset
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeCategory && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-surface text-brand-dark border border-brand-sky-border text-xs font-mono rounded-full">
                {categories.find((c) => c.slug === activeCategory)?.name ?? activeCategory}
                <button
                  onClick={() => handleFilterChange("category", "")}
                  className="hover:text-red-500 transition-colors"
                  aria-label="Remove category filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {activeSize && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-surface text-brand-dark border border-brand-sky-border text-xs font-mono rounded-full">
                Size {activeSize}
                <button
                  onClick={() => handleFilterChange("size", "")}
                  className="hover:text-red-500 transition-colors"
                  aria-label="Remove size filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {(searchParams.get("min") || searchParams.get("max")) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-surface text-brand-dark border border-brand-sky-border text-xs font-mono rounded-full">
                ₹{searchParams.get("min") || "0"} - ₹{searchParams.get("max") || "Any"}
                <button
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("min");
                    params.delete("max");
                    router.push(`?${params.toString()}`, { scroll: false });
                  }}
                  className="hover:text-red-500 transition-colors"
                  aria-label="Remove price filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sort Section */}
      <div>
        <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-brand-gray-500 font-semibold mb-3.5">
          Sort By
        </h3>
        <div className="space-y-1.5">
          {SORTS.map((sort) => {
            const isSelected = activeSort === sort.value;
            return (
              <button
                key={sort.value}
                type="button"
                onClick={() => handleFilterChange("sort", sort.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all duration-200 active:scale-[0.98] text-left ${
                  isSelected
                    ? "bg-brand-sky/40 text-brand-navy font-semibold border border-brand-sky-border/70"
                    : "text-brand-gray-600 hover:bg-neutral-50 hover:text-brand-dark"
                }`}
              >
                <span>{sort.label}</span>
                {isSelected && <Check size={14} className="text-brand-blue" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories Section */}
      {categories.length > 0 && (
        <div className="pt-2 border-t border-neutral-100">
          <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-brand-gray-500 font-semibold mb-3.5 pt-4">
            Category
          </h3>
          <div className="space-y-1.5">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleFilterChange("category", isSelected ? "" : cat.slug)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all duration-200 active:scale-[0.98] text-left ${
                    isSelected
                      ? "bg-brand-sky/40 text-brand-navy font-semibold border border-brand-sky-border/70"
                      : "text-brand-gray-600 hover:bg-neutral-50 hover:text-brand-dark"
                  }`}
                >
                  <span>{cat.name}</span>
                  {isSelected && <Check size={14} className="text-brand-blue" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Filter */}
      <div className="pt-2 border-t border-neutral-100">
        <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-brand-gray-500 font-semibold mb-3.5 pt-4">
          UK Size
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {sizes.map((size) => {
            const isActive = activeSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => handleFilterChange("size", isActive ? "" : size)}
                className={`py-2 text-xs font-mono font-medium rounded-lg border transition-all duration-150 active:scale-[0.96] text-center ${
                  isActive
                    ? "bg-brand-navy text-white border-brand-navy shadow-xs font-semibold"
                    : "bg-white text-neutral-800 border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 shadow-2xs"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="pt-2 border-t border-neutral-100">
        <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-brand-gray-500 font-semibold mb-3.5 pt-4">
          Price Range
        </h3>
        <form onSubmit={handlePriceSubmit} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-brand-gray-400">
                ₹
              </span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full pl-6 pr-2 py-2 text-xs font-mono border border-neutral-200 rounded-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <span className="text-brand-gray-400 text-xs font-mono">-</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-brand-gray-400">
                ₹
              </span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full pl-6 pr-2 py-2 text-xs font-mono border border-neutral-200 rounded-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-brand-navy hover:bg-brand-blue text-white text-xs font-mono uppercase tracking-widest rounded-lg transition-all active:scale-[0.98] font-medium"
          >
            Apply Range
          </button>
        </form>
      </div>
    </aside>
  );
}
