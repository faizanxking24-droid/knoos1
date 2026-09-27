"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { getColorSwatch } from "@/lib/colors";

export interface ColorSibling {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  status?: string;
  price?: number;
  salePrice?: number | null;
  images?: { id: string; imageUrl: string }[];
  variants?: { stock: number }[];
}

interface ColorSelectorProps {
  currentProductId: string;
  currentColor: string | null;
  siblings?: ColorSibling[];
  currentHasStock?: boolean;
}

export function ColorSelector({
  currentProductId,
  currentColor,
  siblings = [],
  currentHasStock = false,
}: ColorSelectorProps) {
  const router = useRouter();
  const swatch = getColorSwatch(currentColor);

  // Build the color options list.
  // If siblings has entries (from colorGroupKey query), use them.
  // Otherwise, create a synthetic single entry from current product.
  const colorOptions: Array<{
    id: string;
    slug: string;
    label: string;
    isSelected: boolean;
    firstImage?: { id: string; imageUrl: string };
    soldOut: boolean;
  }> = [];

  if (siblings.length > 0) {
    for (const sibling of siblings) {
      colorOptions.push({
        id: sibling.id,
        slug: sibling.slug,
        label: getColorSwatch(sibling.color).label,
        isSelected: sibling.id === currentProductId,
        firstImage: sibling.images?.[0],
        soldOut: !(sibling.variants ?? []).some((variant) => variant.stock > 0),
      });
    }
  } else if (currentColor) {
    // Single color product — still show a selector with one selected option
    colorOptions.push({
      id: currentProductId,
      slug: "",
      label: swatch.label,
      isSelected: true,
      soldOut: !currentHasStock,
    });
  } else {
    return null;
  }

  const handleNavigate = (slug: string) => {
    if (slug) {
      router.push(`/product/${slug}`);
    }
  };

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs uppercase tracking-widest text-brand-dark font-semibold">
          SELECT COLOR
        </span>
        {colorOptions.length > 1 && (
          <span className="font-mono text-[11px] text-brand-gray-400">
            {colorOptions.length} colors
          </span>
        )}
      </div>

      {/* Swatch List: Horizontally swipeable on mobile, wrapping row on desktop */}
      <div
        className="flex items-center gap-2.5 overflow-x-auto snap-x snap-proximity touch-pan-x hide-scrollbar py-1 px-0.5 sm:flex-wrap sm:overflow-visible"
        role="radiogroup"
        aria-label="Color options"
      >
        {colorOptions.map((option) => {
          const optionSwatch = option.id === currentProductId
            ? swatch
            : getColorSwatch(
                siblings.find((s) => s.id === option.id)?.color ?? currentColor
              );

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleNavigate(option.slug)}
              role="radio"
              aria-checked={option.isSelected}
              aria-current={option.isSelected ? "page" : undefined}
              aria-label={`${option.label}${option.isSelected ? " (Selected)" : ""}`}
              disabled={!option.slug}
              className={`
                snap-start flex-shrink-0 group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2
                ${
                  option.isSelected
                    ? "border-brand-navy bg-brand-sky/25 ring-1 ring-brand-navy shadow-xs"
                    : "border-brand-gray-200 bg-white hover:border-brand-navy/50 hover:bg-brand-sky/10 cursor-pointer"
                }
                ${!option.slug ? "opacity-75 cursor-default" : ""}
                ${option.soldOut ? "opacity-60" : ""}
              `}
            >
              {/* Optional tiny product thumbnail */}
              {option.firstImage ? (
                <div className="relative w-8 h-8 rounded-md overflow-hidden bg-brand-sky/20 flex-shrink-0 border border-brand-sky-border/40">
                  <Image
                    src={option.firstImage.imageUrl}
                    alt={option.label}
                    fill
                    sizes="32px"
                    className="object-contain p-0.5"
                  />
                </div>
              ) : null}

              {/* Color swatch dot */}
              <span
                className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${
                  optionSwatch.isLight ? "border border-black/20" : ""
                }`}
                style={{ backgroundColor: optionSwatch.hex }}
                aria-hidden="true"
              />

              {/* Human-readable color label */}
              <span
                className={`font-mono text-xs tracking-wide capitalize ${
                  option.isSelected
                    ? "text-brand-dark font-semibold"
                    : "text-brand-gray-600 group-hover:text-brand-dark"
                }`}
              >
                {option.label}
              </span>

              {option.isSelected && <span className="sr-only">(Selected)</span>}
              {option.isSelected && <span aria-hidden="true" className="font-bold">✓</span>}
              {option.soldOut && <span className="font-mono text-[9px] uppercase text-red-700">Out of stock</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
