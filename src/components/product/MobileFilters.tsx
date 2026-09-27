"use client";

import { useState, Suspense } from "react";
import { ProductFilters } from "./ProductFilters";
import { SlidersHorizontal, X } from "lucide-react";

interface MobileFiltersProps {
  sizes?: string[];
}

export function MobileFilters({ sizes }: MobileFiltersProps = {}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden mb-6">
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-5 py-3.5 border border-brand-sky-border/70 bg-white/95 rounded-xl font-mono text-xs uppercase tracking-widest text-brand-dark hover:border-brand-navy transition-colors shadow-2xs"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-brand-blue" />
          <span>Filter &amp; Sort</span>
        </span>
        <span className="text-[11px] text-brand-gray-400 font-mono">Refine Results</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-neutral-900/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-brand-blue" />
                <h2 className="font-serif text-xl text-brand-dark">Filter &amp; Sort</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-brand-dark transition-colors"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="[&>aside]:border-0 [&>aside]:p-0 [&>aside]:shadow-none [&>aside]:bg-transparent">
                <Suspense fallback={<div className="h-40 flex items-center justify-center text-xs font-mono text-neutral-400">Loading filters...</div>}>
                  <ProductFilters sizes={sizes} />
                </Suspense>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-neutral-100 bg-white">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3.5 bg-brand-navy hover:bg-brand-blue text-white font-mono text-xs uppercase tracking-widest transition-colors rounded-xl font-medium shadow-md active:scale-[0.99]"
              >
                Apply Filters &amp; View Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
