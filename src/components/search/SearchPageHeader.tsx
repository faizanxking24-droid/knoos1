"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

const SUGGESTIONS = ["Loafers", "Chelsea", "Sneakers", "Flats", "Black", "Brown"];

interface SearchPageHeaderProps {
  initialQuery?: string;
  totalCount: number;
}

export function SearchPageHeader({ initialQuery = "", totalCount }: SearchPageHeaderProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleChipClick = (suggestion: string) => {
    setQuery(suggestion);
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", suggestion);
    router.push(`/search?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-brand-sky-light/40 to-brand-sky/20 border border-brand-sky-border/50 p-6 sm:p-10 lg:p-14 mb-10 sm:mb-14 shadow-xs">
      <div className="max-w-3xl">
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-brand-blue font-semibold block mb-3">
          CATALOG SEARCH
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-brand-dark tracking-tight leading-[1.1] mb-6">
          {initialQuery ? `Results for “${initialQuery}”` : "Search the Collection"}
        </h1>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mb-5">
          <div className="relative flex items-center bg-white rounded-2xl border border-neutral-300 shadow-sm focus-within:border-brand-navy focus-within:ring-2 focus-within:ring-brand-navy/15 transition-all">
            <Search size={18} className="absolute left-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by silhouette, style, color, or leather..."
              className="w-full pl-11 pr-24 py-4 text-sm sm:text-base font-sans bg-transparent text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-20 p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
                aria-label="Clear search query"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 px-5 py-2.5 bg-brand-navy hover:bg-brand-blue text-white font-mono text-xs uppercase tracking-wider rounded-xl transition-colors font-medium shadow-xs"
            >
              Search
            </button>
          </div>
        </form>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-neutral-500 uppercase tracking-wider text-[11px]">Popular:</span>
          {SUGGESTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleChipClick(tag)}
              className="px-3 py-1 rounded-full bg-white/80 border border-neutral-200 text-neutral-700 hover:border-brand-navy hover:bg-neutral-50 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Count pill */}
        <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-brand-sky-border/70 text-xs font-mono text-brand-dark shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
          <span>{totalCount} {totalCount === 1 ? "Product" : "Products"} Found</span>
        </div>
      </div>
    </div>
  );
}
