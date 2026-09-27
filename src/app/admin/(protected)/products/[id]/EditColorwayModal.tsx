"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface ColorwayData {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  sku: string;
  status: string;
  colorGroupKey: string | null;
}

interface EditColorwayModalProps {
  colorway: ColorwayData;
  onClose: () => void;
  onUpdated: () => void;
  submitting?: boolean;
}

export function EditColorwayModal({
  colorway,
  onClose,
  onUpdated,
  submitting = false,
}: EditColorwayModalProps) {
  const [color, setColor] = useState(colorway.color ?? "");
  const [name, setName] = useState(colorway.name);
  const [sku, setSku] = useState(colorway.sku);
  const [slug, setSlug] = useState(colorway.slug);
  const [status, setStatus] = useState(colorway.status);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!color.trim() || !name.trim() || !sku.trim() || !slug.trim()) {
      setError("All fields are required");
      setSaving(false);
      return;
    }

    if (!colorway.colorGroupKey) {
      setError("This colorway does not have a color group key");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/products/${colorway.colorGroupKey}/colorways`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            colorwayId: colorway.id,
            color: color.trim(),
            name: name.trim(),
            sku: sku.trim(),
            slug: slug.trim().toLowerCase(),
            status,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update color variant");
        setSaving(false);
        return;
      }

      onUpdated();
      onClose();
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  };

  const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim().toLowerCase());

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-brand-gray-100">
            <h3 className="font-serif text-lg">Edit Color Variant</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-brand-gray-400 hover:text-brand-dark transition-colors"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mt-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Color */}
            <div>
              <label className="block font-mono text-xs uppercase tracking-wide mb-2">
                Color <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Black"
                required
                maxLength={50}
                className="w-full border border-brand-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors"
              />
            </div>

            {/* Product Name */}
            <div>
              <label className="block font-mono text-xs uppercase tracking-wide mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name"
                required
                maxLength={255}
                className="w-full border border-brand-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block font-mono text-xs uppercase tracking-wide mb-2">
                Product SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. WAV-324-BL"
                required
                maxLength={100}
                className="w-full border border-brand-gray-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-black transition-colors"
              />
            </div>

            {/* Slug */}
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
                  slug && !slugValid ? "border-red-300" : "border-brand-gray-200"
                }`}
              />
              {slug && !slugValid && (
                <p className="text-red-600 text-xs mt-1">
                  Slug must be lowercase letters, numbers, and hyphens only
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block font-mono text-xs uppercase tracking-wide mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-brand-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Full editor link */}
            <div className="pt-3 border-t border-brand-gray-100">
              <Link
                href={`/admin/products/${colorway.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-brand-blue hover:text-brand-navy underline underline-offset-2"
              >
                Open Full Product Editor (images, stock, pricing, sizes)
              </Link>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-brand-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-mono border border-brand-gray-200 hover:border-brand-black transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !slugValid}
                className="px-4 py-2 text-sm font-mono bg-brand-black text-white hover:bg-brand-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
