import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getEffectiveSellingPrice } from "@/lib/pricing";
import { NextResponse } from "next/server";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
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

  if (!cart) {
    return NextResponse.json({ id: null, items: [], subtotal: 0 });
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = getEffectiveSellingPrice(item.product, item.variant);
    return sum + price * item.quantity;
  }, 0);

  return NextResponse.json({
    id: cart.id,
    items: cart.items.map((item) => {
      const price = getEffectiveSellingPrice(item.product, item.variant);
      return {
        id: item.id,
        quantity: item.quantity,
        variantId: item.variant.id,
        size: item.variant.size,
        productId: item.product.id,
        productName: item.product.name,
        productStatus: item.product.status,
        stock: item.variant.stock,
        imageUrl: item.product.images[0]?.imageUrl ?? null,
        price,
        total: price * item.quantity,
      };
    }),
    subtotal,
  });
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const userId = authResult.user.id;

  try {
    const body = await request.json();
    const { productId, variantId, quantity = 1 } = body;

    if (!productId || !variantId || !Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Validate the authenticated user exists in the database.
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || product.status !== "ACTIVE") {
        throw { code: "PRODUCT_UNAVAILABLE" as const };
      }

      const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
      if (!variant || variant.productId !== productId) {
        throw { code: "VARIANT_NOT_FOUND" as const };
      }

      const cart = await tx.cart.upsert({
        where: { userId: dbUser.id },
        create: { userId: dbUser.id },
        update: { updatedAt: new Date() },
      });

      const existingItem = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: cart.id, variantId } },
      });

      const currentQuantity = existingItem?.quantity || 0;
      const newTotalQuantity = currentQuantity + quantity;

      if (newTotalQuantity > variant.stock) {
        throw {
          code: "INSUFFICIENT_STOCK" as const,
          available: variant.stock,
        };
      }

      const item = await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId: cart.id, variantId } },
        create: { cartId: cart.id, productId, variantId, quantity },
        update: { quantity: newTotalQuantity },
      });

      return item;
    });

    return NextResponse.json({ id: result.id, quantity: result.quantity, success: true });
  } catch (err: any) {
    console.error("[CART][POST] Unexpected error:", err);

    if (err?.code === "PRODUCT_UNAVAILABLE") {
      return NextResponse.json({ error: "Product is not available" }, { status: 400 });
    }
    if (err?.code === "VARIANT_NOT_FOUND") {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }
    if (err?.code === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: `Only ${err.available} available in stock.` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unable to add this item to your cart right now." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const userId = authResult.user.id;

  const body = await request.json();
  const { cartItemId, quantity } = body;

  if (!cartItemId || !Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  const itemToUpdate = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cartId: cart.id },
    include: { variant: true, product: true },
  });

  if (!itemToUpdate) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (itemToUpdate.product.status !== "ACTIVE") {
     return NextResponse.json({ error: "Product is no longer available" }, { status: 400 });
  }

  if (quantity > itemToUpdate.variant.stock) {
    return NextResponse.json({ error: `Only ${itemToUpdate.variant.stock} available in stock.` }, { status: 400 });
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const userId = authResult.user.id;

  const body = await request.json();
  const { cartItemId } = body;

  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  await prisma.cartItem.deleteMany({ where: { id: cartItemId, cartId: cart.id } });
  return NextResponse.json({ success: true });
}
