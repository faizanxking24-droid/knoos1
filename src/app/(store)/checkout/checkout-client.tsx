"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Check, 
  MapPin, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  Lock, 
  Plus, 
  Pencil, 
  AlertCircle, 
  Phone, 
  Mail, 
  Banknote, 
  X,
  Zap,
  ShoppingBag
} from "lucide-react";
import { FallbackImage } from "@/components/ui/FallbackImage";
import { CouponEntry } from "@/components/cart/CouponEntry";
import { APPLIED_COUPON_STORAGE_KEY, type CouponApplication } from "@/lib/coupon";
import { normalizeIndianMobile, formatPhoneDisplay } from "@/lib/phone";

export interface Address {
  id: string;
  userId?: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CheckoutItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
  imageUrl: string | null;
  stock: number;
  productStatus?: string;
  slug?: string;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
] as const;

const LABELS = ["HOME", "WORK", "OTHER"] as const;

const emptyAddressForm = () => ({
  label: "HOME",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
});

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode detection
  const modeParam = searchParams.get("mode");
  const isBuyNow = modeParam === "buy-now";
  const productId = searchParams.get("productId") || "";
  const variantId = searchParams.get("variantId") || "";
  const rawQuantity = searchParams.get("quantity");
  const quantity = rawQuantity ? Math.max(1, parseInt(rawQuantity, 10) || 1) : 1;

  // Checkout data states
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);

  // Method states
  const [deliveryMethod, setDeliveryMethod] = useState<"STANDARD" | "FAST">("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">("ONLINE");

  // Address form management
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm());
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressFormError, setAddressFormError] = useState<string | null>(null);

  // Contact phone editing
  const [editingContactPhone, setEditingContactPhone] = useState(false);
  const [contactPhoneInput, setContactPhoneInput] = useState("");
  const [savingContactPhone, setSavingContactPhone] = useState(false);

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponApplication | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Order placement & general error states
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockWarning, setStockWarning] = useState<string | null>(null);

  // Coupon validation
  const validateCoupon = useCallback(
    async (code: string) => {
      setApplyingCoupon(true);
      setCouponError(null);
      try {
        const payload: Record<string, unknown> = {
          code,
          mode: isBuyNow ? "BUY_NOW" : "CART",
        };
        if (isBuyNow) {
          payload.productId = productId;
          payload.variantId = variantId;
          payload.quantity = quantity;
        }

        const response = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to apply coupon");
        }

        setCoupon(data);
        setCouponCode(data.code);
        localStorage.setItem(APPLIED_COUPON_STORAGE_KEY, data.code);
        return data as CouponApplication;
      } catch (err) {
        setCoupon(null);
        localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
        setCouponError(err instanceof Error ? err.message : "Unable to apply coupon");
        return null;
      } finally {
        setApplyingCoupon(false);
      }
    },
    [isBuyNow, productId, variantId, quantity]
  );

  const removeCoupon = () => {
    setCoupon(null);
    setCouponCode("");
    setCouponError(null);
    localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
  };

  // Revalidate items / stock
  const loadItems = useCallback(async () => {
    if (isBuyNow) {
      if (!productId || !variantId) {
        setError("Invalid Buy Now details. Please choose a product size.");
        return { items: [], subtotal: 0 };
      }

      const res = await fetch(
        `/api/checkout/buy-now?productId=${encodeURIComponent(productId)}&variantId=${encodeURIComponent(variantId)}&quantity=${quantity}`
      );
      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return null;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load product details.");
      }

      const item: CheckoutItem = {
        id: data.variantId,
        productId: data.productId,
        variantId: data.variantId,
        productName: data.productName,
        size: data.size,
        quantity: data.quantity,
        price: data.price,
        total: data.total,
        imageUrl: data.imageUrl,
        stock: data.stock,
        productStatus: "ACTIVE",
      };

      setItems([item]);
      setSubtotal(item.total);

      if (item.stock < item.quantity) {
        setStockWarning(`Only ${item.stock} item(s) currently available in stock.`);
      } else {
        setStockWarning(null);
      }

      return { items: [item], subtotal: item.total };
    } else {
      const res = await fetch("/api/cart");
      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return null;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load cart.");
      }

      const loadedItems: CheckoutItem[] = (data.items || []).map((i: any) => ({
        id: i.id,
        productId: i.productId,
        variantId: i.variantId,
        productName: i.productName,
        size: i.size,
        quantity: i.quantity,
        price: i.price,
        total: i.total,
        imageUrl: i.imageUrl,
        stock: i.stock,
        productStatus: i.productStatus,
        slug: i.slug,
      }));

      setItems(loadedItems);
      setSubtotal(data.subtotal || 0);

      const oos = loadedItems.filter((i) => i.stock < i.quantity || i.productStatus !== "ACTIVE");
      if (oos.length > 0) {
        setStockWarning(
          `Some items in your cart have limited or no stock: ${oos.map((i) => `${i.productName} (size ${i.size})`).join(", ")}. Please adjust your cart.`
        );
      } else {
        setStockWarning(null);
      }

      return { items: loadedItems, subtotal: data.subtotal || 0 };
    }
  }, [isBuyNow, productId, variantId, quantity, router]);

  // Initial load
  useEffect(() => {
    let isCancelled = false;

    async function initializeCheckout() {
      setLoading(true);
      setError(null);

      try {
        const [profileRes, addressesRes] = await Promise.all([
          fetch("/api/account/profile"),
          fetch("/api/addresses"),
        ]);

        if (profileRes.status === 401 || addressesRes.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }

        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (!isCancelled) {
            setUserProfile(profile);
            setContactPhoneInput(profile.phone || "");
          }
        }

        let loadedAddresses: Address[] = [];
        if (addressesRes.ok) {
          loadedAddresses = await addressesRes.json();
          if (!isCancelled) {
            setAddresses(loadedAddresses);
            if (loadedAddresses.length > 0) {
              const defaultAddr = loadedAddresses.find((a) => a.isDefault);
              setSelectedAddressId(defaultAddr ? defaultAddr.id : loadedAddresses[0].id);
            } else {
              setShowAddressForm(true);
            }
          }
        }

        const itemsResult = await loadItems();
        if (!itemsResult) return;

        // Restore coupon if saved in localStorage
        const storedCoupon = localStorage.getItem(APPLIED_COUPON_STORAGE_KEY);
        if (storedCoupon && itemsResult.items.length > 0) {
          setCouponCode(storedCoupon);
          await validateCoupon(storedCoupon);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Failed to load checkout details.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void initializeCheckout();

    return () => {
      isCancelled = true;
    };
  }, [loadItems, router, validateCoupon]);

  // Calculations
  const deliveryCharge = deliveryMethod === "FAST" ? 149 : 100;
  const discountAmount = coupon?.discountAmount ?? 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryCharge);
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || null;

  // Contact phone save
  const handleSaveContactPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContactPhone(true);
    setError(null);

    const validation = normalizeIndianMobile(contactPhoneInput);
    if (!validation.isValid || !validation.digits) {
      setError(validation.error || "Please enter a valid 10-digit Indian phone number.");
      setSavingContactPhone(false);
      return;
    }

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: validation.digits }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update phone number");

      setUserProfile((prev) => (prev ? { ...prev, phone: validation.digits || null } : null));
      setEditingContactPhone(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save contact phone.");
    } finally {
      setSavingContactPhone(false);
    }
  };

  // Open edit address
  const handleStartEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || "HOME",
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      landmark: addr.landmark || "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || "India",
      isDefault: addr.isDefault,
    });
    setAddressFormError(null);
    setShowAddressForm(true);
  };

  // Cancel address form
  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm());
    setAddressFormError(null);
  };

  // Save address (Add or Edit)
  const handleSubmitAddressForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressFormError(null);
    setSavingAddress(true);

    const trimmedFullName = addressForm.fullName.trim();
    const trimmedPhone = addressForm.phone.trim();
    const trimmedLine1 = addressForm.addressLine1.trim();
    const trimmedCity = addressForm.city.trim();
    const trimmedState = addressForm.state.trim();
    const trimmedPin = addressForm.postalCode.trim();

    if (!trimmedFullName || !trimmedPhone || !trimmedLine1 || !trimmedCity || !trimmedState || !trimmedPin) {
      setAddressFormError("Please fill all required address fields.");
      setSavingAddress(false);
      return;
    }

    const phoneVal = normalizeIndianMobile(trimmedPhone);
    if (!phoneVal.isValid || !phoneVal.digits) {
      setAddressFormError(phoneVal.error || "Please enter a valid 10-digit Indian mobile number.");
      setSavingAddress(false);
      return;
    }

    if (!/^\d{6}$/.test(trimmedPin)) {
      setAddressFormError("Please enter a valid 6-digit PIN code.");
      setSavingAddress(false);
      return;
    }

    const payload = {
      label: addressForm.label,
      fullName: trimmedFullName,
      phone: phoneVal.digits,
      addressLine1: trimmedLine1,
      addressLine2: addressForm.addressLine2.trim() || undefined,
      landmark: addressForm.landmark.trim() || undefined,
      city: trimmedCity,
      state: trimmedState,
      postalCode: trimmedPin,
      country: "India",
      isDefault: addressForm.isDefault,
    };

    try {
      if (editingAddressId) {
        const res = await fetch(`/api/addresses/${editingAddressId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update address");

        setAddresses((prev) =>
          prev.map((a) => (a.id === editingAddressId ? data : payload.isDefault ? { ...a, isDefault: false } : a))
        );
        setSelectedAddressId(data.id);
      } else {
        const res = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save address");

        setAddresses((prev) => {
          if (payload.isDefault) {
            return [data, ...prev.map((a) => ({ ...a, isDefault: false }))];
          }
          return [data, ...prev];
        });
        setSelectedAddressId(data.id);
      }

      // If user profile has no phone, sync the contact phone
      if (!userProfile?.phone && phoneVal.digits) {
        void fetch("/api/account/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneVal.digits }),
        })
          .then((r) => r.json())
          .then((p) => {
            if (p.id) setUserProfile((prev) => (prev ? { ...prev, phone: p.phone || null } : null));
          })
          .catch(() => {});
      }

      handleCancelAddressForm();
    } catch (err) {
      setAddressFormError(err instanceof Error ? err.message : "Something went wrong while saving address.");
    } finally {
      setSavingAddress(false);
    }
  };

  // Place Order handler
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select or add a shipping address to proceed.");
      return;
    }

    if (items.length === 0) {
      setError("Your checkout items are empty.");
      return;
    }

    const hasUnavailable = items.some((i) => i.stock < i.quantity || i.productStatus === "INACTIVE");
    if (hasUnavailable) {
      setError("Some items in your checkout are out of stock. Please review before proceeding.");
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const orderPayload: Record<string, unknown> = {
        mode: isBuyNow ? "BUY_NOW" : "CART",
        deliveryMethod,
        addressId: selectedAddressId,
        couponCode: coupon?.code || undefined,
        paymentMethod,
      };

      if (isBuyNow) {
        orderPayload.productId = productId;
        orderPayload.variantId = variantId;
        orderPayload.quantity = quantity;
      }

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        // Stock insufficiency handling
        if (orderRes.status === 400 && orderData.error?.toLowerCase().includes("stock")) {
          setStockWarning(orderData.error);
          void loadItems();
        }

        // Coupon issue handling
        if (orderData.code && coupon) {
          removeCoupon();
        }

        throw new Error(orderData.error || "Order creation failed. Please try again.");
      }

      // COD order flow
      if (orderData.paymentMethod === "COD") {
        localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
        router.push(`/account/orders/${orderData.orderId}`);
        return;
      }

      // ONLINE (Razorpay) order flow
      if (!(window as any).Razorpay) {
        throw new Error("Payment gateway is initializing. Please try again in a few seconds.");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "KNOOS",
        description: `Order #${orderData.orderId.slice(-8).toUpperCase()}`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`/api/orders/${orderData.orderId}/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
              router.push(`/account/orders/${orderData.orderId}`);
            } else {
              setError(verifyData.error || "Payment verification failed. Please contact support.");
              setPaying(false);
            }
          } catch {
            setError("Network error while verifying payment. Your order is recorded in your account.");
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
        prefill: {
          name: selectedAddress?.fullName || userProfile?.name || "",
          contact: selectedAddress?.phone || userProfile?.phone || "",
          email: userProfile?.email || "",
        },
        theme: {
          color: "#102A43",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(`Payment failed: ${response.error?.description || "Transaction declined"}`);
        setPaying(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during order placement.");
      setPaying(false);
    }
  };

  // Loading view
  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-brand-navy border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-brand-gray-500">
          Preparing secure checkout...
        </p>
      </div>
    );
  }

  // Empty view
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-20 text-center max-w-md mx-auto"
      >
        <div className="w-16 h-16 rounded-full bg-brand-sky/40 border border-brand-sky-border/60 flex items-center justify-center mx-auto mb-6 text-brand-navy">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl text-brand-navy mb-3">Your checkout is empty</h2>
        <p className="text-brand-gray-500 font-mono text-xs uppercase tracking-wider mb-8">
          Add items to your cart to proceed with checkout.
        </p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 bg-brand-navy hover:bg-brand-blue text-white px-8 py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest transition-colors shadow-sm"
        >
          Explore Collection
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
    >
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      {/* Main Form Column (7 cols) */}
      <div className="lg:col-span-7 space-y-8">
        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3 text-sm shadow-xs"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-700 p-1"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        {/* Stock Warning Banner */}
        {stockWarning && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-start gap-3 text-sm shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{stockWarning}</p>
            </div>
          </div>
        )}

        {/* Section 1: Customer Contact */}
        <section className="bg-white border border-brand-sky-border/70 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-5 border-b border-brand-sky-border/30 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-brand-navy text-white text-xs font-mono font-medium flex items-center justify-center">
                1
              </span>
              <h2 className="font-serif text-xl text-brand-navy">Contact Information</h2>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Account</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 bg-brand-sky/20 border border-brand-sky-border/40 rounded-xl flex items-center gap-3">
              <Mail className="w-4 h-4 text-brand-blue shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-wider text-brand-gray-400">Account Email</p>
                <p className="font-medium text-brand-dark truncate">{userProfile?.email || "Account"}</p>
              </div>
            </div>

            <div className="p-3.5 bg-brand-sky/20 border border-brand-sky-border/40 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Phone className="w-4 h-4 text-brand-blue shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-brand-gray-400">Contact Mobile</p>
                  <p className="font-medium text-brand-dark truncate">
                    {userProfile?.phone ? formatPhoneDisplay(userProfile.phone) : selectedAddress?.phone ? formatPhoneDisplay(selectedAddress.phone) : "Not set"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingContactPhone(!editingContactPhone)}
                className="text-xs font-mono uppercase tracking-wider text-brand-blue hover:text-brand-navy transition-colors shrink-0 underline"
              >
                {editingContactPhone ? "Close" : userProfile?.phone ? "Edit" : "Set Phone"}
              </button>
            </div>
          </div>

          {editingContactPhone && (
            <form onSubmit={handleSaveContactPhone} className="mt-4 pt-4 border-t border-brand-sky-border/30 flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-brand-gray-400">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={contactPhoneInput}
                  onChange={(e) => setContactPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile"
                  className="w-full pl-12 pr-3 py-2 text-sm border border-brand-gray-300 rounded-lg outline-none focus:border-brand-blue bg-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={savingContactPhone}
                className="px-4 py-2 bg-brand-navy hover:bg-brand-blue text-white font-mono text-xs uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
              >
                {savingContactPhone ? "Saving..." : "Save"}
              </button>
            </form>
          )}
        </section>

        {/* Section 2: Shipping Address */}
        <section className="bg-white border border-brand-sky-border/70 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-5 border-b border-brand-sky-border/30 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-brand-navy text-white text-xs font-mono font-medium flex items-center justify-center">
                2
              </span>
              <h2 className="font-serif text-xl text-brand-navy">Delivery Address</h2>
            </div>
            {!showAddressForm && addresses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setEditingAddressId(null);
                  setAddressForm(emptyAddressForm());
                  setShowAddressForm(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-brand-navy hover:text-brand-blue transition-colors"
              >
                <Plus size={15} />
                <span>Add New Address</span>
              </button>
            )}
          </div>

          {/* Address List */}
          {!showAddressForm && addresses.length > 0 && (
            <div className="space-y-3.5">
              {addresses.map((address) => {
                const isSelected = selectedAddressId === address.id;
                return (
                  <label
                    key={address.id}
                    className={`block relative border rounded-xl p-4.5 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-brand-navy bg-brand-sky/25 ring-1 ring-brand-blue/35 shadow-xs"
                        : "border-brand-gray-200 hover:border-brand-sky-border/80 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <input
                        type="radio"
                        name="shippingAddress"
                        value={address.id}
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mt-1 accent-brand-blue w-4 h-4"
                      />
                      <div className="flex-1 min-w-0 pr-12">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-brand-dark text-base">{address.fullName}</span>
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-brand-sky/60 text-brand-blue border border-brand-sky-border/50">
                            {address.label || "HOME"}
                          </span>
                          {address.isDefault && (
                            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                              Default
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-brand-gray-600 leading-relaxed">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                          {address.landmark && ` (Near ${address.landmark})`}
                        </p>
                        <p className="text-sm text-brand-gray-600 font-medium mt-0.5">
                          {address.city}, {address.state} — <span className="font-mono text-brand-dark">{address.postalCode}</span>
                        </p>
                        <p className="text-xs text-brand-gray-500 font-mono mt-1">
                          Phone: <span className="text-brand-dark">{formatPhoneDisplay(address.phone)}</span>
                        </p>
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleStartEditAddress(address);
                        }}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-gray-400 hover:text-brand-navy hover:bg-brand-sky/30 transition-colors"
                        aria-label="Edit address"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* Add / Edit Address Form */}
          {showAddressForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmitAddressForm}
              className="border border-brand-sky-border/60 rounded-xl bg-brand-sky/15 p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-brand-sky-border/40">
                <h3 className="font-serif text-lg text-brand-navy">
                  {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                </h3>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCancelAddressForm}
                    className="text-brand-gray-400 hover:text-brand-navy p-1"
                    aria-label="Close address form"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {addressFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{addressFormError}</span>
                </div>
              )}

              {/* Label selector */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-brand-gray-500 mb-2">
                  Address Type
                </label>
                <div className="flex gap-2">
                  {LABELS.map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                      className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded-lg border transition-colors ${
                        addressForm.label === lbl
                          ? "bg-brand-navy text-white border-brand-navy shadow-xs"
                          : "bg-white text-brand-dark border-brand-gray-300 hover:border-brand-navy"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="addr-fullName" className="block text-xs font-mono uppercase tracking-wider text-brand-gray-500 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="addr-fullName"
                    name="name"
                    autoComplete="name"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    placeholder="Recipient's Name"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-brand-gray-300 rounded-lg outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label htmlFor="addr-phone" className="block text-xs font-mono uppercase tracking-wider text-brand-gray-500 mb-1">
                    Mobile Phone *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-brand-gray-400">+91</span>
                    <input
                      id="addr-phone"
                      name="tel"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      required
                      maxLength={10}
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      placeholder="10-digit mobile"
                      className="w-full pl-11 pr-3.5 py-2.5 text-sm bg-white border border-brand-gray-300 rounded-lg outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label htmlFor="addr-line1" className="block text-xs font-mono uppercase tracking-wider text-brand-gray-500 mb-1">
                  Street Address / House No. / Building *
                </label>
                <input
                  id="addr-line1"
                  name="address-line1"
                  autoComplete="address-line1"
                  required
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  placeholder="House / Flat / Block No., Apartment or Street Name"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-brand-gray-300 rounded-lg outline-none focus:border-brand-blue"
                />
              </div>

              {/* Address Line 2 & Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="addr-line2" className="block text-xs font-mono uppercase tracking-wider text-brand-gray-500 mb-1">
                    Apartment / Suite / Area (Optional)
                  </label>
                  <input
                    id="addr-line2"
                    name="address-line2"
                    autoComplete="address-line2"
                    value={addressForm.addressLine2}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                    placeholder="Floor, Sector, Colony"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-brand-gray-300 rounded-lg outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label htmlFor="addr-landmark" className="block text-xs font-mono uppercase tracking-wider text-brand-gray-500 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    id="addr-landmark"
                    value={addressForm.landmark}
                    onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                    placeholder="Near Apollo Hospital, Metro Station"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-brand-gray-300 rounded-lg outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              {/* City, State, PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="addr-city" className="block text-xs font-mono uppercase tracking-wider text-brand-gray-500 mb-1">
                    City / Town *
                  </label>
                  <input
                    id="addr-city"
                    name="city"
                    autoComplete="address-level2"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-brand-gray-300 rounded-lg outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label htmlFor="addr-state" className="block text-xs font-mono uppercase tracking-wider text-brand-gray-500 mb-1">
                    State *
                  </label>
                  <input
                    id="addr-state"
                    name="state"
                    autoComplete="address-level1"
                    list="indian-states-list"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="Select State"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-brand-gray-300 rounded-lg outline-none focus:border-brand-blue"
                  />
                  <datalist id="indian-states-list">
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label htmlFor="addr-postalCode" className="block text-xs font-mono uppercase tracking-wider text-brand-gray-500 mb-1">
                    PIN Code (6 digits) *
                  </label>
                  <input
                    id="addr-postalCode"
                    name="postal-code"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    required
                    maxLength={6}
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    placeholder="e.g. 110001"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-brand-gray-300 rounded-lg outline-none focus:border-brand-blue font-mono"
                  />
                </div>
              </div>

              {/* Default checkbox */}
              <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 accent-brand-blue rounded"
                />
                <span className="text-xs text-brand-gray-700">Set as my default shipping address</span>
              </label>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="bg-brand-navy hover:bg-brand-blue text-white px-6 py-2.5 font-mono text-xs uppercase tracking-wider rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {savingAddress ? "Saving Address..." : editingAddressId ? "Update Address" : "Save & Deliver Here"}
                </button>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCancelAddressForm}
                    className="border border-brand-gray-300 hover:bg-white text-brand-dark px-5 py-2.5 font-mono text-xs uppercase tracking-wider rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </motion.form>
          )}
        </section>

        {/* Section 3: Delivery Speed */}
        <section className="bg-white border border-brand-sky-border/70 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-3 mb-5 border-b border-brand-sky-border/30 pb-4">
            <span className="w-7 h-7 rounded-full bg-brand-navy text-white text-xs font-mono font-medium flex items-center justify-center">
              3
            </span>
            <h2 className="font-serif text-xl text-brand-navy">Delivery Options</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`block border p-4.5 rounded-xl cursor-pointer transition-all duration-200 ${
                deliveryMethod === "STANDARD"
                  ? "border-brand-navy bg-brand-sky/25 ring-1 ring-brand-blue/35 shadow-xs"
                  : "border-brand-gray-200 hover:border-brand-sky-border/80 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="STANDARD"
                  checked={deliveryMethod === "STANDARD"}
                  onChange={() => setDeliveryMethod("STANDARD")}
                  className="mt-1 accent-brand-blue w-4 h-4"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-brand-dark">Standard Delivery</span>
                    <span className="font-mono text-sm font-semibold text-brand-navy">₹100</span>
                  </div>
                  <p className="text-xs text-brand-gray-500 font-mono">Estimated delivery: 4–7 business days</p>
                </div>
              </div>
            </label>

            <label
              className={`block border p-4.5 rounded-xl cursor-pointer transition-all duration-200 ${
                deliveryMethod === "FAST"
                  ? "border-brand-navy bg-brand-sky/25 ring-1 ring-brand-blue/35 shadow-xs"
                  : "border-brand-gray-200 hover:border-brand-sky-border/80 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="FAST"
                  checked={deliveryMethod === "FAST"}
                  onChange={() => setDeliveryMethod("FAST")}
                  className="mt-1 accent-brand-blue w-4 h-4"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-brand-dark">Express Delivery</span>
                      <Zap className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" />
                    </div>
                    <span className="font-mono text-sm font-semibold text-brand-navy">₹149</span>
                  </div>
                  <p className="text-xs text-brand-gray-500 font-mono">Estimated delivery: 2–3 business days</p>
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* Section 4: Payment Method */}
        <section className="bg-white border border-brand-sky-border/70 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-3 mb-5 border-b border-brand-sky-border/30 pb-4">
            <span className="w-7 h-7 rounded-full bg-brand-navy text-white text-xs font-mono font-medium flex items-center justify-center">
              4
            </span>
            <h2 className="font-serif text-xl text-brand-navy">Payment Method</h2>
          </div>

          <div className="space-y-4">
            {/* Online Payment */}
            <label
              className={`block border p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                paymentMethod === "ONLINE"
                  ? "border-brand-navy bg-brand-sky/25 ring-1 ring-brand-blue/35 shadow-xs"
                  : "border-brand-gray-200 hover:border-brand-sky-border/80 bg-white"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                  className="mt-1 accent-brand-blue w-4 h-4"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-brand-blue" />
                      <span className="font-medium text-brand-dark text-base">Online Payment</span>
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-brand-blue bg-brand-sky px-2 py-0.5 rounded border border-brand-sky-border/60">
                      Instant & Recommended
                    </span>
                  </div>
                  <p className="text-xs text-brand-gray-600 mb-3">
                    Pay securely using UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, or Wallets.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-brand-gray-400 uppercase tracking-wider">
                    <Lock className="w-3 h-3 text-brand-blue" />
                    <span>256-Bit Encrypted via Razorpay</span>
                  </div>
                </div>
              </div>
            </label>

            {/* Cash on Delivery */}
            <label
              className={`block border p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                paymentMethod === "COD"
                  ? "border-brand-navy bg-brand-sky/25 ring-1 ring-brand-blue/35 shadow-xs"
                  : "border-brand-gray-200 hover:border-brand-sky-border/80 bg-white"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="mt-1 accent-brand-blue w-4 h-4"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="w-4 h-4 text-brand-navy" />
                    <span className="font-medium text-brand-dark text-base">Cash on Delivery (COD)</span>
                  </div>
                  <p className="text-xs text-brand-gray-600">
                    Pay with cash or UPI QR scan when your footwear arrives at your delivery doorstep.
                  </p>
                </div>
              </div>
            </label>
          </div>
        </section>
      </div>

      {/* Sticky Order Summary Sidebar (5 cols) */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
        <div className="bg-white border border-brand-sky-border/80 rounded-2xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-brand-sky-border/40 mb-5">
            <h2 className="font-serif text-xl text-brand-navy">Order Summary</h2>
            <span className="text-xs font-mono uppercase tracking-wider text-brand-gray-400 bg-brand-sky/50 px-2 py-0.5 rounded">
              {items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? "Item" : "Items"}
            </span>
          </div>

          {/* Items List */}
          <div className="space-y-4 mb-6 max-h-[360px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3.5 items-center justify-between py-2 border-b border-brand-gray-100 last:border-b-0">
                <div className="relative w-16 h-16 rounded-xl bg-brand-sky/20 border border-brand-sky-border/50 shrink-0 overflow-hidden">
                  <FallbackImage
                    src={item.imageUrl || "/placeholder-shoe.jpg"}
                    alt={item.productName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-brand-dark truncate">{item.productName}</h4>
                  <p className="text-xs font-mono text-brand-gray-500 mt-0.5">
                    Size: UK {item.size} • Qty: {item.quantity}
                  </p>
                  {item.stock <= 3 && item.stock > 0 && (
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded mt-1 inline-block">
                      Only {item.stock} left in stock
                    </span>
                  )}
                  {item.stock === 0 && (
                    <span className="text-[10px] font-mono text-red-700 bg-red-50 px-1.5 py-0.2 rounded mt-1 inline-block">
                      Out of Stock
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-sm font-semibold text-brand-navy">
                    ₹{item.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Entry Component */}
          <CouponEntry
            code={couponCode}
            application={coupon}
            error={couponError}
            applying={applyingCoupon}
            onCodeChange={(code) => {
              setCouponCode(code);
              setCouponError(null);
            }}
            onApply={(e) => {
              e.preventDefault();
              void validateCoupon(couponCode);
            }}
            onRemove={removeCoupon}
          />

          {/* Pricing Breakdown */}
          <div className="space-y-3 py-4 border-t border-brand-sky-border/40 text-sm">
            <div className="flex justify-between text-brand-gray-600">
              <span>Subtotal</span>
              <span className="font-mono font-medium text-brand-dark">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            {coupon && (
              <div className="flex justify-between text-emerald-700">
                <span className="flex items-center gap-1.5">
                  <span>Coupon ({coupon.code})</span>
                </span>
                <span className="font-mono font-semibold">-₹{discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="flex justify-between text-brand-gray-600">
              <span className="flex items-center gap-1">
                <span>Delivery Charge</span>
                <span className="text-xs font-mono text-brand-gray-400">({deliveryMethod === "FAST" ? "Express" : "Standard"})</span>
              </span>
              <span className="font-mono font-medium text-brand-dark">₹{deliveryCharge.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Total Payable */}
          <div className="pt-4 pb-6 border-t border-brand-sky-border/40 flex justify-between items-baseline">
            <div>
              <span className="text-base font-semibold text-brand-dark">Total Amount</span>
              <p className="text-[11px] font-mono text-brand-gray-400 uppercase tracking-wider">Inclusive of all taxes</p>
            </div>
            <span className="font-serif text-2xl font-bold text-brand-navy">
              ₹{finalTotal.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Place Order CTA Button */}
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={paying || !selectedAddressId || items.some((i) => i.stock < i.quantity)}
            className="w-full bg-brand-navy hover:bg-brand-blue text-white py-4 font-mono text-xs uppercase tracking-widest transition-all duration-300 rounded-xl shadow-md hover:shadow-lg disabled:bg-brand-gray-300 disabled:cursor-not-allowed text-center"
          >
            {paying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{paymentMethod === "COD" ? "Placing Order..." : "Opening Gateway..."}</span>
              </span>
            ) : paymentMethod === "COD" ? (
              `Place Order (COD) • ₹${finalTotal.toLocaleString("en-IN")}`
            ) : (
              `Pay ₹${finalTotal.toLocaleString("en-IN")} via Razorpay`
            )}
          </button>

          {!selectedAddressId && (
            <p className="text-xs text-amber-700 font-mono text-center mt-2.5">
              * Please select a delivery address above to place your order.
            </p>
          )}

          {/* Trust badges */}
          <div className="mt-6 pt-5 border-t border-brand-sky-border/30 grid grid-cols-2 gap-3 text-[11px] font-mono text-brand-gray-500 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0" />
              <span>100% Genuine KNOOS</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-blue shrink-0" />
              <span>Free Exchanges</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
