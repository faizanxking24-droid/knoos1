import { Metadata } from "next";
import Link from "next/link";
import { signIn } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getEffectiveSellingPrice } from "@/lib/pricing";
import { CartClient } from "./CartClient";
import { getRecommendations } from "@/lib/recommendations";
import { ProductRecommendations } from "@/components/product/ProductRecommendations";
import { StoreContainer } from "@/components/store/StoreContainer";
import { Reveal } from "@/components/motion";
import { ShoppingBag, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Your Shopping Bag — KNOOS",
  description: "Review your selected footwear silhouettes and proceed to secure checkout.",
};

export default async function CartPage() {
  const authResult = await requireAuth();

  if (authResult instanceof Response) {
    return (
      <main className="bg-brand-surface min-h-[75vh] flex items-center justify-center py-16 sm:py-24">
        <StoreContainer>
          <div className="max-w-md mx-auto bg-white border border-brand-sky-border/60 rounded-3xl p-8 sm:p-10 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-brand-sky/40 border border-brand-sky-border flex items-center justify-center text-brand-blue mx-auto mb-6 shadow-2xs">
              <ShoppingBag size={24} />
            </div>

            <h1 className="font-serif text-3xl text-brand-dark mb-3">Your Shopping Bag</h1>
            <p className="text-neutral-500 text-sm font-light leading-relaxed mb-8">
              Sign in to view your preserved cart items, saved addresses, and express checkout.
            </p>

            <div className="flex flex-col gap-3">
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/cart" });
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-brand-navy hover:bg-brand-blue text-white font-mono text-xs uppercase tracking-widest rounded-xl transition-colors font-medium shadow-sm"
                >
                  <span>Sign In with Google</span>
                  <ArrowRight size={14} />
                </button>
              </form>

              {process.env.NEXT_PUBLIC_OTP_ENABLED === "true" && (
                <Link
                  href="/login?callbackUrl=/cart"
                  className="w-full py-3.5 px-6 border border-neutral-300 hover:border-neutral-900 bg-neutral-50 hover:bg-white text-neutral-800 font-mono text-xs uppercase tracking-widest rounded-xl transition-colors font-medium text-center"
                >
                  Sign In with Mobile OTP
                </Link>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100">
              <Link
                href="/search"
                className="text-xs font-mono uppercase tracking-wider text-brand-blue hover:text-brand-navy underline underline-offset-2 transition-colors"
              >
                Continue Exploring Footwear
              </Link>
            </div>
          </div>
        </StoreContainer>
      </main>
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

  const cartItems =
    cart?.items.map((item) => ({
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
  const cartProductIds = cartItems.map((item) => item.productId);
  const firstItemGender = cart?.items[0]?.product?.gender;

  const recommendedProducts = await getRecommendations({
    cartItemIds: cartProductIds,
    gender: firstItemGender,
    limit: 4,
  });

  return (
    <main className="bg-brand-surface min-h-[75vh] py-10 sm:py-16">
      <StoreContainer>
        <div className="mb-10">
          <Reveal>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-blue font-semibold block mb-2">
              ORDER SUMMARY
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark tracking-tight">
              Your Shopping Bag
            </h1>
          </Reveal>
        </div>

        <CartClient
          initialItems={cartItems}
          initialSubtotal={subtotal}
          recommendationsSlot={
            <div className="mt-16 pt-12 border-t border-brand-sky-border/40">
              <ProductRecommendations
                title="Curated Recommendations"
                products={recommendedProducts}
                mode="cart"
              />
            </div>
          }
        />
      </StoreContainer>
    </main>
  );
}
