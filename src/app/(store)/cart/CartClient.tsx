"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CouponEntry } from "@/components/cart/CouponEntry";
import { APPLIED_COUPON_STORAGE_KEY, type CouponApplication } from "@/lib/coupon";
import { FallbackImage } from "@/components/ui/FallbackImage";

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
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    if (newQuantity > item.stock) {
      alert(`Only ${item.stock} available in stock.`);
      return;
    }

    setLoadingIds(prev => new Set(prev).add(itemId));

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
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    setLoadingIds(prev => new Set(prev).add(itemId));

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
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (items.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <h2 className="font-serif text-3xl mb-4">YOUR CART IS EMPTY</h2>
        <p className="text-brand-gray-500 font-mono text-sm uppercase tracking-widest mb-10">
          Discover something worth walking in.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/men" className="bg-brand-navy hover:bg-brand-blue text-white px-8 py-4 font-mono text-sm uppercase tracking-widest transition-colors rounded-lg shadow-md text-center">
            Shop Men
          </Link>
          <Link href="/women" className="border border-brand-navy text-brand-navy hover:bg-brand-sky/30 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-colors rounded-lg text-center">
            Shop Women
          </Link>
        </div>
      </motion.div>
    );
  }

  const estimatedSubtotal = subtotal - (coupon?.discountAmount ?? 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 flex flex-col gap-8">
        <AnimatePresence>
          {items.map((item) => {
            const isLoading = loadingIds.has(item.id);
            const isUnavailable = item.productStatus !== "ACTIVE";
            const isOutOfStock = item.stock <= 0;
            const exceedsStock = item.quantity > item.stock;
            
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                key={item.id} 
                className={`flex flex-col sm:flex-row gap-6 border-b border-brand-sky-border/25 pb-8 ${isLoading ? 'opacity-50' : ''}`}
              >
                <div className="w-full sm:w-32 h-40 bg-brand-sky/20 border border-brand-sky-border/30 rounded-xl overflow-hidden relative shrink-0">
                  {item.imageUrl ? (
                    <FallbackImage
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      fallbackType="product"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-gray-400 font-mono text-xs">No image</div>
                  )}
                </div>
                <div className="flex flex-col flex-grow justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Link href={`/product/${item.slug}`} className="font-serif text-xl text-brand-dark hover:text-brand-blue transition-colors">
                        {item.productName}
                      </Link>
                      <span className="font-mono text-sm text-brand-dark font-medium">₹{item.price.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="font-mono text-xs text-brand-gray-500 uppercase tracking-widest mb-4">
                      Color: {item.color || "Not specified"} · Size: {item.size}
                    </p>
                    
                    {isUnavailable && <p className="text-red-600 text-sm mb-2 font-medium">This product is no longer available.</p>}
                    {!isUnavailable && isOutOfStock && <p className="text-red-600 text-sm mb-2 font-medium">Selected size is unavailable.</p>}
                    {!isUnavailable && !isOutOfStock && exceedsStock && (
                      <p className="text-amber-700 text-sm mb-2 font-medium">
                        Only {item.stock} available. Please reduce your quantity.
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-brand-gray-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isLoading}
                        className="px-3 py-1 text-brand-gray-500 hover:text-brand-navy hover:bg-brand-sky/40 disabled:opacity-30 transition-colors"
                      >
                        -
                      </button>
                      <motion.span 
                        key={item.quantity} 
                        initial={{ opacity: 0.5, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-3 py-1 font-mono text-sm w-10 text-center text-brand-dark"
                      >
                        {item.quantity}
                      </motion.span>
                      <button
                        onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock || isLoading}
                        className="px-3 py-1 text-brand-gray-500 hover:text-brand-navy hover:bg-brand-sky/40 disabled:opacity-30 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={isLoading}
                      className="font-mono text-xs text-brand-gray-400 hover:text-red-600 uppercase tracking-widest transition-colors underline underline-offset-4"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {recommendationsSlot && (
          <div className="mt-8">
            {recommendationsSlot}
          </div>
        )}
      </div>
      
      <div>
        <div className="bg-gradient-to-b from-brand-sky/40 to-brand-sky/10 border border-brand-sky-border/40 p-8 rounded-2xl sticky top-24 shadow-sm">
          <h3 className="font-serif text-2xl mb-6 text-brand-dark">Summary</h3>
          <div className="flex justify-between items-center mb-6 font-mono text-sm text-brand-dark">
            <span className="uppercase tracking-widest text-brand-gray-600">Subtotal</span>
            <motion.span
              key={subtotal}
              initial={{ opacity: 0.5, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="font-medium"
            >
              ₹{subtotal.toLocaleString('en-IN')}
            </motion.span>
          </div>

          <CouponEntry
            code={couponCode}
            application={coupon}
            error={couponError}
            applying={applyingCoupon}
            onCodeChange={(code) => {
              setCouponCode(code);
              setCouponError(null);
            }}
            onApply={applyCoupon}
            onRemove={removeCoupon}
          />

          {coupon && (
            <div className="mb-6 space-y-3 border-t border-brand-sky-border/40 pt-5 font-mono text-sm text-brand-dark">
              <div className="flex justify-between">
                <span className="text-brand-gray-600">Coupon discount</span>
                <span className="text-green-700 font-medium">-₹{coupon.discountAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase tracking-widest text-brand-gray-600">Estimated subtotal</span>
                <motion.span key={estimatedSubtotal} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} className="font-medium">
                  ₹{estimatedSubtotal.toLocaleString("en-IN")}
                </motion.span>
              </div>
            </div>
          )}
          
          <Link href="/checkout" className="block w-full bg-brand-navy hover:bg-brand-blue text-white py-4 font-mono text-sm uppercase tracking-widest text-center transition-all duration-300 rounded-lg shadow-md hover:shadow-lg mb-4">
            Checkout
          </Link>
          
          <p className="text-xs text-brand-gray-500 font-mono uppercase tracking-widest text-center">
            Shipping & taxes calculated at checkout
          </p>
        </div>
      </div>
    </div>
  );
}

