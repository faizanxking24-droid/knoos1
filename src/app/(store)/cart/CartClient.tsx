"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { easings } from "@/components/motion/constants";
import { CouponEntry } from "@/components/cart/CouponEntry";
import { APPLIED_COUPON_STORAGE_KEY, type CouponApplication } from "@/lib/coupon";
import { FallbackImage } from "@/components/ui/FallbackImage";
import { ArrowRight, Trash2, ShoppingBag, ShieldCheck, Truck, RotateCcw } from "lucide-react";

interface CartItemData {
  id: string;
  productId: string;
  productName: string;
  slug: string;
  price: number;
  quantity: number;
  size: string;
  color: string | null;
  imageUrl: string | null;
  stock: number;
  productStatus: string;
  total: number;
}

interface CartClientProps {
  initialItems: CartItemData[];
  initialSubtotal: number;
  recommendationsSlot?: React.ReactNode;
}

export function CartClient({ initialItems, initialSubtotal, recommendationsSlot }: CartClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const [items, setItems] = useState(initialItems);
  const [subtotal, setSubtotal] = useState(initialSubtotal);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponApplication | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const router = useRouter();

  const validateCoupon = useCallback(async (code: string) => {
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to apply coupon");

      setCoupon(data);
      setCouponCode(data.code);
      localStorage.setItem(APPLIED_COUPON_STORAGE_KEY, data.code);
      return data as CouponApplication;
    } catch (validationError) {
      setCoupon(null);
      localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
      setCouponError(validationError instanceof Error ? validationError.message : "Unable to apply coupon");
      return null;
    } finally {
      setApplyingCoupon(false);
    }
  }, []);

  useEffect(() => {
    const storedCode = localStorage.getItem(APPLIED_COUPON_STORAGE_KEY);
    if (storedCode) {
      setCouponCode(storedCode);
      void validateCoupon(storedCode);
    }
  }, [validateCoupon]);

  const removeCoupon = () => {
    setCoupon(null);
    setCouponCode("");
    setCouponError(null);
    localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
  };

  const applyCoupon = (event: React.FormEvent) => {
    event.preventDefault();
    void validateCoupon(couponCode);
  };

  const handleQuantityUpdate = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    if (newQuantity > item.stock) {
      alert(`Only ${item.stock} available in stock.`);
      return;
    }

    setLoadingIds((prev) => new Set(prev).add(itemId));

    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId: itemId, quantity: newQuantity }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update quantity");
      }

      const nextItems = items.map((currentItem) =>
        currentItem.id === itemId
          ? { ...currentItem, quantity: newQuantity, total: currentItem.price * newQuantity }
          : currentItem
      );
      setItems(nextItems);
      setSubtotal(nextItems.reduce((sum, currentItem) => sum + currentItem.total, 0));
      if (coupon) await validateCoupon(coupon.code);
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    setLoadingIds((prev) => new Set(prev).add(itemId));

    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId: itemId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove item");
      }

      const nextItems = items.filter((currentItem) => currentItem.id !== itemId);
      setItems(nextItems);
      setSubtotal(nextItems.reduce((sum, currentItem) => sum + currentItem.total, 0));
      if (coupon && nextItems.length > 0) {
        await validateCoupon(coupon.code);
      } else if (coupon) {
        removeCoupon();
      }
      router.refresh();
    } catch (error: any) {
      alert(error.message);
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.4, ease: easings.premium }}
        className="bg-white border border-brand-sky-border/60 rounded-3xl p-10 sm:p-16 text-center max-w-2xl mx-auto shadow-xs"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-sky/40 border border-brand-sky-border flex items-center justify-center text-brand-blue mx-auto mb-6 shadow-2xs">
          <ShoppingBag size={28} />
        </div>
        <h2 className="font-serif text-3xl text-brand-dark mb-3">Your Bag is Empty</h2>
        <p className="text-neutral-500 font-light text-base mb-8 max-w-md mx-auto">
          Discover handcrafted leather silhouettes engineered for effortless everyday comfort.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/men"
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-navy hover:bg-brand-blue text-white font-mono text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 font-medium shadow-sm"
          >
            Explore Men
          </Link>
          <Link
            href="/women"
            className="w-full sm:w-auto px-8 py-3.5 border border-neutral-300 hover:border-neutral-900 bg-neutral-50 hover:bg-white text-neutral-800 font-mono text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 font-medium"
          >
            Explore Women
          </Link>
        </div>
      </motion.div>
    );
  }

  const estimatedSubtotal = subtotal - (coupon?.discountAmount ?? 0);

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Cart Items List (Cols 1-7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <AnimatePresence>
            {items.map((item, index) => {
              const isLoading = loadingIds.has(item.id);
              const isUnavailable = item.productStatus !== "ACTIVE";
              const isOutOfStock = item.stock <= 0;
              const exceedsStock = item.quantity > item.stock;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: prefersReducedMotion ? 1 : 0.96,
                    height: 0,
                    overflow: "hidden",
                    marginBottom: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    transition: { duration: prefersReducedMotion ? 0.01 : 0.28, ease: easings.premium },
                  }}
                  transition={{ duration: prefersReducedMotion ? 0.01 : 0.35, delay: prefersReducedMotion ? 0 : Math.min(index * 0.06, 0.3), ease: easings.premium }}
                  key={item.id}
                  className={`bg-white border border-brand-sky-border/60 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row gap-5 ${
                    isLoading ? "opacity-50" : ""
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-full sm:w-28 h-36 bg-[#F6F7F9] border border-neutral-200/70 rounded-xl overflow-hidden relative shrink-0">
                    {item.imageUrl ? (
                      <FallbackImage
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover p-2"
                        fallbackType="product"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 font-mono text-xs">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Info & Controls */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-1">
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-serif text-lg sm:text-xl text-brand-dark hover:text-brand-blue transition-colors font-medium"
                        >
                          {item.productName}
                        </Link>
                        <span className="font-mono text-base font-semibold text-neutral-900 shrink-0">
                          ₹{item.total.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider mb-4">
                        Size: {item.size} {item.color ? `• Color: ${item.color}` : ""}
                      </p>

                      {isUnavailable && (
                        <p className="text-red-600 text-xs font-mono mb-2">This product is no longer active.</p>
                      )}
                      {!isUnavailable && isOutOfStock && (
                        <p className="text-red-600 text-xs font-mono mb-2">Selected size is currently out of stock.</p>
                      )}
                      {!isUnavailable && !isOutOfStock && exceedsStock && (
                        <p className="text-amber-700 text-xs font-mono mb-2">
                          Quantity adjusted to available stock ({item.stock}).
                        </p>
                      )}
                    </div>

                    {/* Bottom Row: Stepper & Remove */}
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      {/* Stepper */}
                      <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                        <button
                          onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isLoading}
                          className="px-3 py-1 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 active:scale-95 disabled:opacity-30 transition-all text-xs font-mono"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-mono text-xs w-8 text-center text-neutral-900 font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock || isLoading}
                          className="px-3 py-1 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 active:scale-95 disabled:opacity-30 transition-all text-xs font-mono"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-red-600 active:scale-95 transition-all py-1 px-2 rounded-md hover:bg-red-50"
                        aria-label={`Remove ${item.productName} from bag`}
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Order Summary Card (Cols 8-12) */}
        <motion.div
          initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.45, ease: easings.premium }}
          className="lg:col-span-5 sticky top-28"
        >
          <div className="bg-white border border-brand-sky-border/60 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="font-serif text-2xl text-brand-dark mb-6 font-medium">Summary</h2>

            {/* Subtotal Rows */}
            <div className="space-y-3.5 pb-6 border-b border-neutral-100 font-mono text-xs">
              <div className="flex justify-between items-center text-neutral-600">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              {coupon && (
                <div className="flex justify-between items-center text-emerald-700">
                  <span>Coupon ({coupon.code})</span>
                  <span>-₹{coupon.discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-neutral-600">
                <span>Estimated Shipping</span>
                <span className="text-emerald-700 font-medium uppercase tracking-wider">Free</span>
              </div>
            </div>

            {/* Total Row */}
            <div className="flex justify-between items-baseline py-5 border-b border-neutral-100 mb-6">
              <span className="font-serif text-lg text-brand-dark font-medium">Total</span>
              <span className="font-serif text-2xl text-neutral-950 font-semibold">
                ₹{Math.max(0, estimatedSubtotal).toLocaleString("en-IN")}
              </span>
            </div>

            {/* Coupon Entry Component */}
            <div className="mb-6">
              <CouponEntry
                code={couponCode}
                onCodeChange={setCouponCode}
                onApply={applyCoupon}
                onRemove={removeCoupon}
                application={coupon}
                error={couponError}
                applying={applyingCoupon}
              />
            </div>

            {/* Primary Checkout CTA */}
            <Link
              href="/checkout"
              className="group w-full flex items-center justify-center gap-3 py-4 bg-brand-navy hover:bg-brand-blue text-white font-mono text-xs uppercase tracking-[0.2em] font-medium rounded-xl transition-all duration-200 shadow-md hover:-translate-y-[1px] active:scale-[0.98]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>

            {/* Reassurance Micro-items */}
            <div className="mt-6 pt-5 border-t border-neutral-100 space-y-2 text-xs font-mono text-neutral-500">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-brand-blue shrink-0" />
                <span>256-bit Encrypted Checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-brand-blue shrink-0" />
                <span>Complimentary Insured Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={14} className="text-brand-blue shrink-0" />
                <span>3-Day Hassle-Free Exchange Window</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {recommendationsSlot}
    </div>
  );
}
