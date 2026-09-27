import { Metadata } from "next";
import Link from "next/link";
import { signIn } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getEffectiveSellingPrice } from "@/lib/pricing";
import { CartClient } from "./CartClient";
import { getRecommendations } from "@/lib/recommendations";
import { ProductRecommendations } from "@/components/product/ProductRecommendations";

export const metadata: Metadata = {
  title: "Your Cart — KNOOS",
};

export default async function CartPage() {
  const authResult = await requireAuth();

  if (authResult instanceof Response) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-24 min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="font-serif text-3xl mb-4 uppercase tracking-widest text-center">Your Cart</h1>
        <p className="text-brand-gray-500 font-mono text-sm uppercase tracking-widest mb-8">
          Sign in to view your cart
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {process.env.NEXT_PUBLIC_OTP_ENABLED === "true" && (
            <Link
              href="/login?callbackUrl=/cart"
              className="bg-brand-navy text-white px-8 py-3.5 font-mono text-xs uppercase tracking-widest hover:bg-brand-blue rounded-xl transition-colors shadow-sm text-center min-w-[200px]"
            >
              Sign In with Mobile OTP
            </Link>
          )}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/cart" });
            }}
          >
            <button
              type="submit"
              className={`${
                process.env.NEXT_PUBLIC_OTP_ENABLED === "true"
                  ? "border border-brand-sky-border/80 bg-white text-brand-dark hover:bg-brand-sky/20"
                  : "bg-brand-navy text-white hover:bg-brand-blue"
              } px-8 py-3.5 font-mono text-xs uppercase tracking-widest rounded-xl transition-colors shadow-sm text-center min-w-[200px]`}
            >
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
    );
  }

  const userId = authResult.user.id;

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          variant: true,
        },
      },
    },
  });

  const cartItems = cart?.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    variantId: item.variant.id,
    size: item.variant.size,
    color: item.product.color,
    productId: item.product.id,
    productName: item.product.name,
    productStatus: item.product.status,
    stock: item.variant.stock,
    imageUrl: item.product.images[0]?.imageUrl ?? null,
    price: getEffectiveSellingPrice(item.product, item.variant),
    total: getEffectiveSellingPrice(item.product, item.variant) * item.quantity,
    slug: item.product.slug,
  })) || [];

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);

  const cartProductIds = cartItems.map(item => item.productId);
  const firstItemGender = cart?.items[0]?.product?.gender;
  
  const recommendedProducts = await getRecommendations({
    cartItemIds: cartProductIds,
    gender: firstItemGender,
    limit: 4
  });

  return (
    <main className="pt-24 px-6 md:px-12 lg:px-24 min-h-[70vh]">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl mb-12">Your Cart</h1>
        <CartClient 
          initialItems={cartItems} 
          initialSubtotal={subtotal} 
          recommendationsSlot={
            <ProductRecommendations 
              title="COMPLETE YOUR LOOK" 
              products={recommendedProducts} 
              mode="cart" 
            />
          }
        />
      </div>
    </main>
  );
}
