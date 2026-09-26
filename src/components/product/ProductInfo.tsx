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

  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const stockAvailable = selectedVariant ? selectedVariant.stock : 0;

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

  // When a variant is selected, variant pricing is authoritative.
  // When no variant is selected (or no variant pricing exists), fall back to product pricing.
  const { mrp, selling } = getVariantPrices(product, selectedVariant ?? null);
  const discount = calculateDiscount(mrp, selling);

  const handleQuantityChange = (delta: number) => {
    if (delta > 0 && quantity < stockAvailable) {
      setQuantity(q => q + 1);
    } else if (delta < 0 && quantity > 1) {
      setQuantity(q => q - 1);
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

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col"
    >
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="font-serif text-3xl lg:text-4xl mb-3 tracking-tight text-brand-dark">{product.name}</h1>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl font-semibold text-brand-dark">₹{selling.toLocaleString('en-IN')}</span>
          {discount.hasDiscount && (
            <>
              <span className="text-brand-gray-400 line-through text-base">MRP: ₹{mrp.toLocaleString('en-IN')}</span>
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 text-xs font-mono tracking-widest uppercase rounded font-semibold">
                {Math.round(discount.discountPercentage)}% OFF
              </span>
            </>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-8 text-brand-gray-600 leading-relaxed max-w-prose text-[15px]">
        {product.description || "No description available."}
      </motion.div>

      {/* Color Selector / Swatches */}
      <motion.div variants={itemVariants}>
        <ColorSelector
          currentProductId={product.id}
          currentColor={product.color}
          siblings={colorSiblings}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-dark font-semibold">Select Size</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(true)}
              className="font-mono text-xs text-brand-blue hover:text-brand-navy underline underline-offset-2 flex items-center gap-1 transition-colors font-medium"
            >
              Size Guide
            </button>
            <span className="text-brand-gray-300">|</span>
            <span className="font-mono text-xs text-brand-gray-500">UK Sizing</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
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
                    py-3 text-sm font-mono border transition-all duration-300 rounded-lg
                    ${isOutOfStock ? "opacity-40 cursor-not-allowed bg-brand-gray-50 border-brand-gray-100 line-through" : ""}
                    ${isSelected && !isOutOfStock ? "border-brand-navy bg-brand-navy text-white shadow-md ring-2 ring-brand-blue/30" : ""}
                    ${!isSelected && !isOutOfStock ? "border-brand-gray-200 hover:border-brand-blue text-brand-dark hover:bg-brand-sky/30 hover:text-brand-navy" : ""}
                  `}
                >
                  {variant.size}
                </button>
              );
            })
          ) : (
            <p className="col-span-full text-sm text-brand-gray-400">One size</p>
          )}
        </div>
      </motion.div>

      {/* Quantity Selector */}
      {selectedVariantId && stockAvailable > 0 && (
        <motion.div variants={itemVariants} className="mb-8 flex items-center gap-6">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-dark font-semibold">Quantity</span>
          <div className="flex items-center border border-brand-gray-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="px-4 py-2 text-brand-gray-500 hover:text-brand-navy hover:bg-brand-sky/40 disabled:opacity-30 transition-colors"
            >
              -
            </button>
            <span className="px-4 py-2 font-mono text-sm w-12 text-center text-brand-dark">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= stockAvailable}
              className="px-4 py-2 text-brand-gray-500 hover:text-brand-navy hover:bg-brand-sky/40 disabled:opacity-30 transition-colors"
            >
              +
            </button>
          </div>
        </motion.div>
      )}

      {error && <motion.p variants={itemVariants} className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</motion.p>}
      {success && <motion.p variants={itemVariants} className="mb-4 text-sm text-green-800 bg-green-50 border border-green-200 p-3 rounded-lg font-medium">Added to cart successfully!</motion.p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          variants={itemVariants}
          onClick={handleAddToCart}
          disabled={variants.length > 0 && !selectedVariantId || loading || (selectedVariantId && stockAvailable <= 0) || authLoading}
          className={`
            flex-1 py-4 font-mono text-sm uppercase tracking-widest transition-all duration-300 rounded-lg border
            ${(variants.length > 0 && !selectedVariantId) || loading || (selectedVariantId && stockAvailable <= 0) || authLoading
              ? "bg-brand-gray-100 text-brand-gray-400 cursor-not-allowed border-brand-gray-200" 
              : "border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white shadow-xs hover:shadow-sm"}
          `}
        >
          {authLoading ? "Loading..." :
           loading ? "Adding..." :
           variants.length > 0 && !selectedVariantId ? "Select a Size" :
           selectedVariantId && stockAvailable <= 0 ? "Unavailable" :
           !user ? "Sign in to Add" :
           "Add to Cart"}
        </motion.button>

        <motion.button
          variants={itemVariants}
          onClick={handleBuyNow}
          disabled={variants.length > 0 && !selectedVariantId || (selectedVariantId && stockAvailable <= 0) || authLoading}
          className={`
            flex-1 py-4 font-mono text-sm uppercase tracking-widest transition-all duration-300 rounded-lg shadow-md
            ${(variants.length > 0 && !selectedVariantId) || (selectedVariantId && stockAvailable <= 0) || authLoading
              ? "bg-brand-gray-100 text-brand-gray-400 cursor-not-allowed border border-brand-gray-200" 
              : "bg-brand-navy text-white hover:bg-brand-blue hover:shadow-xl transform hover:-translate-y-0.5"}
          `}
        >
          {authLoading ? "Loading..." :
           variants.length > 0 && !selectedVariantId ? "Select a Size" :
           selectedVariantId && stockAvailable <= 0 ? "Unavailable" :
           !user ? "Sign in to Buy" :
           "Buy Now"}
        </motion.button>
      </div>

      <motion.div variants={itemVariants} className="mt-12 p-6 rounded-2xl bg-brand-sky/20 border border-brand-sky-border/30">
        <h3 className="font-serif text-xl mb-6 text-brand-dark">Specifications</h3>
        <ul className="space-y-4 font-mono text-[11px] sm:text-xs text-brand-gray-500 uppercase tracking-widest">
          {(product as any).categoryRel?.name ? (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>Category</span>
              <span className="text-brand-dark font-medium text-right">
                {(product as any).categoryRel?.name}
              </span>
            </li>
          ) : null}
          {product.subCategory && (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>Sub Category</span>
              <span className="text-brand-dark font-medium text-right">{formatSpecValue(product.subCategory)}</span>
            </li>
          )}
          {product.color && (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>Color</span>
              <span className="text-brand-dark font-medium text-right">{formatSpecValue(product.color)}</span>
            </li>
          )}
          {product.upperMaterial && (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>Upper Material</span>
              <span className="text-brand-dark font-medium text-right">{formatSpecValue(product.upperMaterial)}</span>
            </li>
          )}
          {product.innerMaterial && (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>Inner Material</span>
              <span className="text-brand-dark font-medium text-right">{formatSpecValue(product.innerMaterial)}</span>
            </li>
          )}
          {product.sole && (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>Sole</span>
              <span className="text-brand-dark font-medium text-right">{formatSpecValue(product.sole)}</span>
            </li>
          )}
          {product.sku && (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>SKU</span>
              <span className="text-brand-dark font-medium text-right">{product.sku}</span>
            </li>
          )}
          <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
            <span>Shipping</span>
            <span className="text-brand-dark font-medium text-right">Free Standard Delivery</span>
          </li>
          <li className="flex justify-between items-center pb-3">
            <span>Return &amp; Exchange Policy</span>
            <Link
              href="/returns-refunds"
              className="text-brand-blue hover:text-brand-navy hover:underline transition-colors font-medium flex items-center gap-1"
            >
              View Policy &rarr;
            </Link>
          </li>
        </ul>
      </motion.div>

      {/* Size Guide Modal / Bottom Sheet */}
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
              className="relative w-full max-w-xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-brand-sky-border/40 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-sky-border/40 bg-brand-sky/15">
                <div>
                  <h3 id="size-guide-modal-title" className="font-serif text-xl text-brand-dark">Size Guide</h3>
                  <p className="font-mono text-xs text-brand-gray-500 mt-0.5">Footwear Size Chart &amp; Conversion</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(false)}
                  aria-label="Close Size Guide"
                  className="p-2 text-brand-gray-400 hover:text-brand-dark hover:bg-brand-sky/30 rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] flex flex-col items-center">
                <div className="relative w-full aspect-[1750/3271] max-w-md bg-brand-sky/10 rounded-xl overflow-hidden shadow-xs border border-brand-sky-border/30">
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
    </motion.div>
  );
}
