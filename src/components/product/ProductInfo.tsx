"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product, ProductVariant } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { loginWithGoogle } from "@/lib/auth-actions";
import { motion, AnimatePresence } from "framer-motion";
import { getVariantPrices, calculateDiscount } from "@/lib/pricing";
import { ColorSelector, ColorSibling } from "./ColorSelector";
import { Truck, RotateCcw, ShieldCheck, ArrowRight, X } from "lucide-react";

type ProductWithCategory = Product & {
  categoryRel?: { id: string; name: string; slug: string } | null;
};

interface ProductInfoProps {
  product: ProductWithCategory;
  variants: ProductVariant[];
  colorSiblings?: ColorSibling[];
}

function formatSpecValue(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .split("__")
    .map((part) =>
      part
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
    )
    .join(" / ");
}

export function ProductInfo({ product, variants, colorSiblings = [] }: ProductInfoProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const stockAvailable = selectedVariant ? selectedVariant.stock : 0;

  useEffect(() => {
    setSelectedVariantId(null);
    setQuantity(1);
    setError(null);
  }, [product.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSizeGuideOpen) {
        setIsSizeGuideOpen(false);
      }
    };

    if (isSizeGuideOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSizeGuideOpen]);

  const { mrp, selling } = getVariantPrices(product, selectedVariant ?? null);
  const discount = calculateDiscount(mrp, selling);

  const handleQuantityChange = (delta: number) => {
    if (delta > 0 && quantity < stockAvailable) {
      setQuantity((q) => q + 1);
    } else if (delta < 0 && quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariantId) return;

    if (!user) {
      await loginWithGoogle(window.location.pathname);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariantId,
          quantity,
        }),
      });

      let data: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch {
          data = {};
        }
      }

      if (!res.ok) {
        throw new Error(
          data?.error || "Unable to add this item to your cart. Please try again."
        );
      }

      setSuccess(true);
      router.refresh();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Unable to add this item to your cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (variants.length > 0 && !selectedVariantId) {
      setError("Please select a size first.");
      return;
    }

    if (selectedVariant && selectedVariant.stock <= 0) {
      setError("Selected size is currently out of stock.");
      return;
    }

    const buyNowVariantId = selectedVariantId || (variants[0]?.id ?? "");
    const targetUrl = `/checkout?mode=buy-now&productId=${product.id}&variantId=${buyNowVariantId}&quantity=${quantity}`;

    if (!user) {
      await loginWithGoogle(targetUrl);
      return;
    }

    router.push(targetUrl);
  };

  const handleVariantSelect = (id: string) => {
    setSelectedVariantId(id);
    setQuantity(1);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="flex flex-col">
      {/* Category Eyebrow & Title */}
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-blue font-medium mb-2.5">
          {product.categoryRel?.name
            ? `${product.categoryRel.name} • SIGNATURE SERIES`
            : "KNOOS FOOTWEAR • EDITION 2026"}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] text-brand-dark tracking-tight leading-[1.1] mb-4">
          {product.name}
        </h1>

        {/* Pricing Row */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <span className="text-3xl font-semibold text-neutral-950 font-serif">
            ₹{selling.toLocaleString("en-IN")}
          </span>
          {discount.hasDiscount && (
            <>
              <span className="text-neutral-400 line-through text-base font-light font-mono">
                MRP: ₹{mrp.toLocaleString("en-IN")}
              </span>
              <span className="bg-neutral-900 text-white px-2.5 py-0.5 text-[11px] font-mono tracking-widest uppercase rounded-full font-medium">
                {Math.round(discount.discountPercentage)}% OFF
              </span>
            </>
          )}
        </div>

        {/* Stock Status Indicator */}
        {selectedVariant && (
          <p
            className={`mt-3 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 ${
              selectedVariant.stock <= 2 ? "text-amber-700" : "text-emerald-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                selectedVariant.stock <= 2 ? "bg-amber-600" : "bg-emerald-600"
              }`}
            />
            <span>
              {selectedVariant.stock === 0
                ? "Out of stock"
                : selectedVariant.stock <= 2
                ? `Only ${selectedVariant.stock} left in stock`
                : "In stock and ready to dispatch"}
            </span>
          </p>
        )}
      </div>

      {/* Description */}
      <div className="mb-8 text-neutral-600 leading-relaxed max-w-prose text-sm sm:text-base font-light">
        {product.description ||
          "Engineered for fluid everyday movement with multi-density cushioning and handcrafted premium leathers."}
      </div>

      {/* Color Selector */}
      <ColorSelector
        currentProductId={product.id}
        currentColor={product.color}
        siblings={colorSiblings}
        currentHasStock={variants.some((variant) => variant.stock > 0)}
      />

      {/* Size Selector */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3.5">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-900 font-semibold">
            Select UK Size
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(true)}
              className="font-mono text-xs text-brand-blue hover:text-brand-navy underline underline-offset-2 flex items-center gap-1 transition-colors font-medium"
            >
              Size Guide
            </button>
            <span className="text-neutral-300">|</span>
            <span className="font-mono text-xs text-neutral-500">UK Sizing</span>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
          {variants.length > 0 ? (
            variants
              .sort((a, b) => Number(a.size) - Number(b.size))
              .map((variant) => {
                const isOutOfStock = variant.stock <= 0;
                const isSelected = selectedVariantId === variant.id;

                return (
                  <button
                    key={variant.id}
                    disabled={isOutOfStock}
                    onClick={() => handleVariantSelect(variant.id)}
                    className={`
                      py-3.5 text-xs font-mono font-medium transition-all duration-200 rounded-xl border text-center
                      ${
                        isOutOfStock
                          ? "opacity-35 cursor-not-allowed bg-neutral-100 border-neutral-200 line-through text-neutral-400"
                          : ""
                      }
                      ${
                        isSelected && !isOutOfStock
                          ? "border-neutral-900 bg-neutral-900 text-white shadow-md ring-2 ring-neutral-900/20 font-semibold"
                          : ""
                      }
                      ${
                        !isSelected && !isOutOfStock
                          ? "border-neutral-300 bg-neutral-50 hover:bg-white hover:border-neutral-900 text-neutral-900 shadow-xs"
                          : ""
                      }
                    `}
                  >
                    {variant.size}
                  </button>
                );
              })
          ) : (
            <p className="col-span-full text-xs font-mono text-neutral-400">Standard fit</p>
          )}
        </div>
      </div>

      {/* Quantity Selector */}
      {selectedVariantId && stockAvailable > 0 && (
        <div className="mb-8 flex items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-900 font-semibold">
            Quantity
          </span>
          <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="px-3.5 py-2 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 disabled:opacity-30 transition-colors text-sm font-mono"
            >
              -
            </button>
            <span className="px-4 py-2 font-mono text-xs w-10 text-center text-neutral-900 font-medium">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= stockAvailable}
              className="px-3.5 py-2 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 disabled:opacity-30 transition-colors text-sm font-mono"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Error & Success Feedback */}
      {error && (
        <p className="mb-4 text-xs font-mono text-red-600 bg-red-50 border border-red-200 p-3.5 rounded-xl">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl font-medium">
          Added to your shopping bag!
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={handleAddToCart}
          disabled={
            (variants.length > 0 && !selectedVariantId) ||
            loading ||
            (selectedVariantId && stockAvailable <= 0) ||
            authLoading
          }
          className={`
            flex-1 py-4 px-6 font-mono text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 rounded-xl border
            ${
              (variants.length > 0 && !selectedVariantId) ||
              loading ||
              (selectedVariantId && stockAvailable <= 0) ||
              authLoading
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-200"
                : "border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white shadow-xs active:scale-[0.99]"
            }
          `}
        >
          {authLoading
            ? "Loading..."
            : loading
            ? "Adding..."
            : variants.length > 0 && !selectedVariantId
            ? "Select a Size"
            : selectedVariantId && stockAvailable <= 0
            ? "Unavailable"
            : !user
            ? "Sign In to Add"
            : "Add to Bag"}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={
            (variants.length > 0 && !selectedVariantId) ||
            (selectedVariantId && stockAvailable <= 0) ||
            authLoading
          }
          className={`
            flex-1 py-4 px-6 font-mono text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 rounded-xl shadow-md
            ${
              (variants.length > 0 && !selectedVariantId) ||
              (selectedVariantId && stockAvailable <= 0) ||
              authLoading
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-200"
                : "bg-neutral-950 text-white hover:bg-brand-blue hover:shadow-xl active:scale-[0.99]"
            }
          `}
        >
          {authLoading
            ? "Loading..."
            : variants.length > 0 && !selectedVariantId
            ? "Select a Size"
            : selectedVariantId && stockAvailable <= 0
            ? "Unavailable"
            : !user
            ? "Sign In to Buy"
            : "Buy Now"}
        </button>
      </div>

      {/* Trust Micro-bar */}
      <div className="mt-8 pt-6 border-t border-neutral-200/70 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-neutral-600">
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-brand-blue shrink-0" />
          <span>Free Express Delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <RotateCcw size={16} className="text-brand-blue shrink-0" />
          <span>3-Day Easy Return</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand-blue shrink-0" />
          <span>Artisanal Quality</span>
        </div>
      </div>

      {/* Specifications Card */}
      <div className="mt-10 p-6 sm:p-7 rounded-2xl bg-white border border-brand-sky-border/60 shadow-xs">
        <h3 className="font-serif text-lg text-brand-dark mb-5 font-medium">Specifications</h3>
        <ul className="space-y-3.5 font-mono text-xs text-neutral-500 uppercase tracking-wider">
          {(product as any).categoryRel?.name && (
            <li className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
              <span>Category</span>
              <span className="text-neutral-900 font-medium text-right">
                {(product as any).categoryRel?.name}
              </span>
            </li>
          )}
          {product.subCategory && (
            <li className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
              <span>Sub Category</span>
              <span className="text-neutral-900 font-medium text-right">
                {formatSpecValue(product.subCategory)}
              </span>
            </li>
          )}
          {product.color && (
            <li className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
              <span>Color</span>
              <span className="text-neutral-900 font-medium text-right">
                {formatSpecValue(product.color)}
              </span>
            </li>
          )}
          {product.upperMaterial && (
            <li className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
              <span>Upper Material</span>
              <span className="text-neutral-900 font-medium text-right">
                {formatSpecValue(product.upperMaterial)}
              </span>
            </li>
          )}
          {product.innerMaterial && (
            <li className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
              <span>Inner Material</span>
              <span className="text-neutral-900 font-medium text-right">
                {formatSpecValue(product.innerMaterial)}
              </span>
            </li>
          )}
          {product.sole && (
            <li className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
              <span>Sole</span>
              <span className="text-neutral-900 font-medium text-right">
                {formatSpecValue(product.sole)}
              </span>
            </li>
          )}
          <li className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
            <span>Shipping</span>
            <span className="text-neutral-900 font-medium text-right">Free Standard Delivery</span>
          </li>
          <li className="flex justify-between items-center pt-1">
            <span>Return Policy</span>
            <Link
              href="/returns-refunds"
              className="text-brand-blue hover:text-brand-navy underline underline-offset-2 transition-colors font-medium flex items-center gap-1"
            >
              <span>3-Day Doorstep Exchange</span>
              <ArrowRight size={12} />
            </Link>
          </li>
        </ul>
      </div>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsSizeGuideOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
                <div>
                  <h3 id="size-guide-modal-title" className="font-serif text-xl text-neutral-900">
                    Size Guide
                  </h3>
                  <p className="font-mono text-xs text-neutral-500 mt-0.5">
                    Footwear Size Chart &amp; Conversion
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(false)}
                  aria-label="Close Size Guide"
                  className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] flex flex-col items-center">
                <div className="relative w-full aspect-[1750/3271] max-w-md bg-neutral-50 rounded-xl overflow-hidden shadow-xs border border-neutral-200">
                  <Image
                    src="/images/size-chart.webp"
                    alt="KNOOS Size Chart"
                    fill
                    sizes="(max-width: 640px) 90vw, 500px"
                    className="object-contain"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
