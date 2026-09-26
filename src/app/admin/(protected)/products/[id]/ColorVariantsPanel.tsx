"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getColorSwatch } from "@/lib/colors";
import { ProductStatus } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Colorway {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  sku: string;
  status: string;
  colorGroupKey: string | null;
  image: string | null;
  variantCount: number;
  price: number;
  salePrice: number | null;
  isCurrent: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ColorVariantsPanel({ productId }: { productId: string }) {
  const [colorways, setColorways] = useState<Colorway[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadColorways = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/colorways`);
      if (res.ok) {
        const data = await res.json();
        setColorways(data.colorways);
      }
    } catch {
      // silently fail — panel will be empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColorways();
  }, [productId]);

  const handleAddColor = async (input: { color: string; name: string; slug: string; sku: string }) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/colorways`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create color variant");
        return;
      }

      setShowAddModal(false);
      await loadColorways();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (colorwayId: string) => {
    if (!confirm("Remove this color variant? The product will be deactivated.")) return;
    try {
      const res = await fetch(`/api/admin/products/${colorwayId}/colorways`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadColorways();
      }
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-brand-gray-200 p-6 mb-6">
        <h2 className="font-serif text-lg pb-4 border-b border-brand-gray-100">Color Variants</h2>
        <p className="text-brand-gray-400 font-mono text-sm mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-gray-200 p-6 mb-6">
      <h2 className="font-serif text-lg pb-4 border-b border-brand-gray-100">Color Variants</h2>

      {colorways.length > 0 ? (
        <div className="mt-4 space-y-3">
          {colorways.map((cw) => {
            const swatch = getColorSwatch(cw.color);
            const isActive = cw.status === ProductStatus.ACTIVE;

            return (
              <div
                key={cw.id}
                className={`flex items-center gap-4 p-4 border rounded-lg ${
                  cw.isCurrent
                    ? "border-brand-navy bg-brand-sky/10"
                    : "border-brand-gray-200 bg-gray-50/50"
                }`}
              >
                {/* Color swatch */}
                <div
                  className={`w-8 h-8 rounded-full flex-shrink-0 ${
                    swatch.isLight ? "border border-black/20" : ""
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                  title={swatch.label}
                />

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium truncate">
                      {swatch.label}
                    </span>
                    {cw.isCurrent && (
                      <span className="text-[10px] font-mono uppercase tracking-wider bg-brand-navy text-white px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                    {!isActive && (
                      <span className="text-[10px] font-mono uppercase tracking-wider bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-brand-gray-500 font-mono">
                    <span>SKU: {cw.sku}</span>
                    <span>{cw.variantCount} sizes</span>
                    {cw.image && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Has images
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/products/${cw.id}`}
                    className="text-xs font-mono uppercase tracking-wide border border-brand-gray-200 px-3 py-1.5 hover:border-brand-black transition-colors"
                  >
                    Edit
                  </Link>
                  {!cw.isCurrent && (
                    <button
                      onClick={() => handleRemove(cw.id)}
                      className="text-xs font-mono uppercase tracking-wide text-red-600 border border-red-200 px-3 py-1.5 hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-brand-gray-400 font-mono text-sm mt-4">
          No color variants yet. Add colors to create a product family.
        </p>
      )}

      {/* Add Color Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="mt-4 text-xs font-mono uppercase tracking-wide border border-brand-gray-200 px-4 py-2 hover:border-brand-black transition-colors"
      >
        + Add Color
      </button>

      {/* Add Color Modal */}
      {showAddModal && (
        <AddColorModal
          sourceProductId={productId}
          onClose={() => {
            setShowAddModal(false);
            setError(null);
          }}
          onSubmit={handleAddColor}
          submitting={submitting}
          error={error}
        />
      )}
    </div>
  );
}

// ─── Add Color Modal ─────────────────────────────────────────────────────────

function AddColorModal({
  sourceProductId,
  onClose,
  onSubmit,
  submitting,
  error,
}: {
  sourceProductId: string;
  onClose: () => void;
  onSubmit: (input: { color: string; name: string; slug: string; sku: string }) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [sourceProduct, setSourceProduct] = useState<{
    name: string;
    sku: string;
    slug: string;
    color: string | null;
  } | null>(null);
  const [color, setColor] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");

  useEffect(() => {
    async function loadSource() {
      try {
        const res = await fetch(`/api/admin/products/${sourceProductId}`);
        if (res.ok) {
          const data = await res.json();
          setSourceProduct({
            name: data.name,
            sku: data.sku,
            slug: data.slug,
            color: data.color,
          });

          // Pre-fill name: replace source color word with empty (admin will fill)
          const colorLabel = data.color
            ? data.color
                .split(/[_\s-]+/)
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(" ")
            : "";
          const suggestedName = colorLabel
            ? data.name.replace(
                new RegExp(`\\b${colorLabel}\\b`, "i"),
                ""
              )
            : `${data.name}`;
          setColor("");
          setName(suggestedName.trim());
          setSlug("");
          setSku("");
        }
      } catch {
        // silently fail
      }
    }
    loadSource();
  }, [sourceProductId]);

  // Update slug when name changes
  useEffect(() => {
    if (!name) return;
    const generated = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generated);
  }, [name]);

  // Update suggested name when color is entered
  useEffect(() => {
    if (!sourceProduct || !color) return;
    const colorLabel = color
      .split(/[_\s-]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    const sourceColorLabel = sourceProduct.color
      ? sourceProduct.color
          .split(/[_\s-]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
      : "";
    const sourceName = sourceProduct.name;
    if (sourceColorLabel) {
      const replaced = sourceName.replace(
        new RegExp(`\\b${sourceColorLabel}\\b`, "i"),
        colorLabel
      );
      setName(replaced);
    } else {
      setName(`${sourceName} ${colorLabel}`);
    }
  }, [color, sourceProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!color.trim() || !name.trim() || !slug.trim() || !sku.trim()) return;
    onSubmit({
      color: color.trim(),
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      sku: sku.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="font-serif text-lg pb-4 border-b border-brand-gray-100">
            Add Color Variant
          </h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mt-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wide mb-2">
                Color <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Black"
                required
                className="w-full border border-brand-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wide mb-2">
                Product SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. WAV-323-BL"
                required
                className="w-full border border-brand-gray-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-black transition-colors"
              />
              <p className="text-[11px] text-brand-gray-500 mt-1">
                Unique SKU for this color variant
              </p>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wide mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name for this color"
                required
                className="w-full border border-brand-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wide mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-friendly-slug"
                required
                className={`w-full border px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-black transition-colors ${
                  slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
                    ? "border-red-300"
                    : "border-brand-gray-200"
                }`}
              />
              {slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && (
                <p className="text-red-600 text-xs mt-1">
                  Slug must be lowercase letters, numbers, and hyphens only
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-brand-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-mono border border-brand-gray-200 hover:border-brand-black transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !color.trim() || !name.trim() || !slug.trim() || !sku.trim()}
                className="px-4 py-2 text-sm font-mono bg-brand-black text-white hover:bg-brand-gray-800 transition-colors disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Color Variant"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
