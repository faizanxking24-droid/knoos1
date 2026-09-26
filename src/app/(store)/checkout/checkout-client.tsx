"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { motion } from "framer-motion";
import { loginWithGoogle } from "@/lib/auth-actions";
import { CouponEntry } from "@/components/cart/CouponEntry";
import { APPLIED_COUPON_STORAGE_KEY, type CouponApplication } from "@/lib/coupon";

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
  imageUrl: string | null;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
}

export function CheckoutClient() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] = useState<"STANDARD" | "FAST">("STANDARD");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponApplication | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">("ONLINE");

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: "", phone: "", address: "", city: "", state: "", pincode: "" });

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

  const removeCoupon = () => {
    setCoupon(null);
    setCouponCode("");
    setCouponError(null);
    localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [addressesRes, cartRes] = await Promise.all([
          fetch("/api/addresses"),
          fetch("/api/cart")
        ]);

        if (addressesRes.status === 401 || cartRes.status === 401) {
          await loginWithGoogle("/checkout");
          return;
        }

        const addressesData = await addressesRes.json();
        const cartData = await cartRes.json();

        setAddresses(addressesData);
        if (addressesData.length > 0) {
          setSelectedAddressId(addressesData[0].id);
        }

        setCart(cartData);

        const storedCouponCode = localStorage.getItem(APPLIED_COUPON_STORAGE_KEY);
        if (storedCouponCode && cartData?.items?.length > 0) {
          setCouponCode(storedCouponCode);
          await validateCoupon(storedCouponCode);
        }
      } catch (err) {
        setError("Failed to load checkout data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, validateCoupon]);

  const deliveryCharge = deliveryMethod === "FAST" ? 149 : 100;
  const discountAmount = coupon?.discountAmount ?? 0;
  const total = (cart?.subtotal || 0) - discountAmount + deliveryCharge;

  const applyCoupon = (event: React.FormEvent) => {
    event.preventDefault();
    void validateCoupon(couponCode);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add address");
      }
      const savedAddress = await res.json();
      setAddresses([savedAddress, ...addresses]);
      setSelectedAddressId(savedAddress.id);
      setIsAddingAddress(false);
      setNewAddress({ name: "", phone: "", address: "", city: "", state: "", pincode: "" });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePayment = async () => {
    if (!selectedAddressId) {
      setError("Please select a delivery address.");
      return;
    }
    if (!cart || cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMethod,
          addressId: selectedAddressId,
          couponCode: coupon?.code,
          paymentMethod,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        if (orderData.code && coupon) {
          setCoupon(null);
          localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
          setCouponError(orderData.error);
        }
        throw new Error(orderData.error || "Failed to create order");
      }

      // COD: no payment gateway needed — redirect directly to order confirmation
      if (orderData.paymentMethod === "COD") {
        localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
        router.push(`/account/orders/${orderData.orderId}`);
        return;
      }

      // ONLINE: existing Razorpay flow
      if (!(window as any).Razorpay) {
        throw new Error("Payment gateway is not ready yet. Please try again in a moment.");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "KNOOS",
        description: "Premium Shoes Checkout",
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
              setError(verifyData.error || "Payment verification failed.");
              setPaying(false);
            }
          } catch (err) {
            setError("Error verifying payment.");
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function() {
            setPaying(false);
          }
        },
        prefill: {
          name: addresses.find(a => a.id === selectedAddressId)?.name,
          contact: addresses.find(a => a.id === selectedAddressId)?.phone,
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(`Payment failed: ${response.error.description || "Unknown error"}`);
        setPaying(false);
      });
      rzp.open();

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during payment.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="py-24 text-center font-mono uppercase tracking-widest text-sm text-brand-gray-500"
      >
        Loading checkout...
      </motion.div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="py-24 text-center"
      >
        <p className="font-serif text-2xl mb-4">Your cart is empty.</p>
        <a href="/search" className="underline font-mono text-sm uppercase tracking-widest">
          Go shopping
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12 mb-24"
    >
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      
      <div className="lg:col-span-7 space-y-12">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 border border-red-200 rounded">
            {error}
          </div>
        )}

        <section>
          <h2 className="text-xl font-medium mb-6 uppercase tracking-wider border-b pb-2">Shipping Address</h2>
          
          {addresses.length > 0 && !isAddingAddress ? (
            <div className="space-y-4">
              {addresses.map((address) => (
                <label key={address.id} className={`block border p-4 rounded-xl cursor-pointer transition-all ${selectedAddressId === address.id ? 'border-brand-navy bg-brand-sky/25 ring-1 ring-brand-blue/30 shadow-xs' : 'border-brand-gray-200 hover:border-brand-sky-border/70 bg-white'}`}>
                  <div className="flex items-start">
                    <input 
                      type="radio" 
                      name="address" 
                      value={address.id} 
                      checked={selectedAddressId === address.id} 
                      onChange={() => setSelectedAddressId(address.id)}
                      className="mt-1 mr-3 accent-brand-blue"
                    />
                    <div>
                      <p className="font-medium text-brand-dark">{address.name}</p>
                      <p className="text-sm text-brand-gray-600">{address.address}, {address.city}, {address.state} {address.pincode}</p>
                      <p className="text-sm text-brand-gray-600">Phone: {address.phone}</p>
                    </div>
                  </div>
                </label>
              ))}
              <button 
                onClick={() => setIsAddingAddress(true)}
                className="text-sm underline mt-4 inline-block font-mono uppercase tracking-wider text-brand-navy hover:text-brand-blue transition-colors"
              >
                + Add new address
              </button>
            </div>
          ) : (
            <form onSubmit={handleAddAddress} className="space-y-4 border border-brand-sky-border/40 p-6 rounded-2xl bg-brand-sky/20">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Full Name" className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue" value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} />
                <input required placeholder="Phone Number" className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
              </div>
              <input required placeholder="Street Address" className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue" value={newAddress.address} onChange={e => setNewAddress({...newAddress, address: e.target.value})} />
              <div className="grid grid-cols-3 gap-4">
                <input required placeholder="City" className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                <input required placeholder="State" className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
                <input required placeholder="Pincode" className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} />
              </div>
              <div className="flex space-x-4 pt-2">
                <button type="submit" className="bg-brand-navy hover:bg-brand-blue text-white px-6 py-2.5 rounded-lg transition-colors font-mono text-sm uppercase tracking-wider shadow-sm">Save Address</button>
                {addresses.length > 0 && (
                  <button type="button" onClick={() => setIsAddingAddress(false)} className="px-6 py-2.5 border border-brand-gray-300 rounded-lg text-brand-dark hover:bg-white transition-colors font-mono text-sm uppercase tracking-wider">Cancel</button>
                )}
              </div>
            </form>
          )}
        </section>

        <section>
          <h2 className="text-xl font-medium mb-6 uppercase tracking-wider border-b pb-2 text-brand-dark">Delivery</h2>
          <div className="space-y-4">
            <label className={`block border p-4 rounded-xl cursor-pointer transition-all ${deliveryMethod === 'STANDARD' ? 'border-brand-navy bg-brand-sky/25 ring-1 ring-brand-blue/30 shadow-xs' : 'border-brand-gray-200 hover:border-brand-sky-border/70 bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    name="delivery" 
                    value="STANDARD" 
                    checked={deliveryMethod === 'STANDARD'}
                    onChange={() => setDeliveryMethod('STANDARD')}
                    className="mr-3 accent-brand-blue"
                  />
                  <span className="font-medium text-brand-dark">Standard Delivery</span>
                </div>
                <span className="font-mono text-brand-dark">₹100</span>
              </div>
            </label>
            <label className={`block border p-4 rounded-xl cursor-pointer transition-all ${deliveryMethod === 'FAST' ? 'border-brand-navy bg-brand-sky/25 ring-1 ring-brand-blue/30 shadow-xs' : 'border-brand-gray-200 hover:border-brand-sky-border/70 bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    name="delivery" 
                    value="FAST" 
                    checked={deliveryMethod === 'FAST'}
                    onChange={() => setDeliveryMethod('FAST')}
                    className="mr-3 accent-brand-blue"
                  />
                  <span className="font-medium text-brand-dark">Fast Delivery</span>
                </div>
                <span className="font-mono text-brand-dark">₹149</span>
              </div>
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium mb-6 uppercase tracking-wider border-b pb-2 text-brand-dark">Payment Method</h2>
          <div className="space-y-4">
            <label className={`block border p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === 'ONLINE' ? 'border-brand-navy bg-brand-sky/25 ring-1 ring-brand-blue/30 shadow-xs' : 'border-brand-gray-200 hover:border-brand-sky-border/70 bg-white'}`}>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                  className="mr-3 accent-brand-blue"
                />
                <div>
                  <span className="font-medium text-brand-dark block">Online Payment</span>
                  <span className="text-sm text-brand-gray-500">Pay securely using Razorpay</span>
                </div>
              </div>
            </label>
            <label className={`block border p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-brand-navy bg-brand-sky/25 ring-1 ring-brand-blue/30 shadow-xs' : 'border-brand-gray-200 hover:border-brand-sky-border/70 bg-white'}`}>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mr-3 accent-brand-blue"
                />
                <div>
                  <span className="font-medium text-brand-dark block">Cash on Delivery</span>
                  <span className="text-sm text-brand-gray-500">Pay in cash when your order is delivered.</span>
                </div>
              </div>
            </label>
          </div>
        </section>
      </div>

      <div className="lg:col-span-5">
        <div className="bg-gradient-to-b from-brand-sky/40 to-brand-sky/10 p-6 rounded-2xl border border-brand-sky-border/40 shadow-sm">
          <h2 className="text-xl font-medium mb-6 uppercase tracking-wider border-b border-brand-sky-border/40 pb-2 text-brand-dark">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-brand-gray-600">{item.productName} (Size: {item.size}) × {item.quantity}</span>
                <span className="font-mono text-brand-dark font-medium">₹{item.total.toLocaleString("en-IN")}</span>
              </div>
            ))}
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

          <div className="border-t border-brand-sky-border/40 pt-4 space-y-2 mb-6 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-gray-600">Subtotal</span>
              <span className="font-mono text-brand-dark">₹{cart.subtotal.toLocaleString("en-IN")}</span>
            </div>
            {coupon && (
              <div className="flex justify-between">
                <span className="text-brand-gray-600">Coupon discount</span>
                <span className="font-mono text-green-700 font-medium">-₹{discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-brand-gray-600">Delivery</span>
              <span className="font-mono text-brand-dark">₹{deliveryCharge.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="border-t border-brand-sky-border/40 pt-4 flex justify-between font-medium text-lg mb-8 text-brand-dark">
            <span>Total</span>
            <span className="font-semibold">₹{total.toLocaleString("en-IN")}</span>
          </div>

          <button
            onClick={handlePayment}
            disabled={paying || !selectedAddressId}
            className="w-full bg-brand-navy hover:bg-brand-blue text-white py-4 font-medium tracking-wide uppercase transition-all duration-300 rounded-lg shadow-md hover:shadow-lg disabled:bg-brand-gray-300 disabled:cursor-not-allowed"
          >
            {paying
              ? (paymentMethod === "COD" ? "Placing order..." : "Creating secure payment...")
              : (paymentMethod === "COD" ? "Place COD Order" : "Pay Securely")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
