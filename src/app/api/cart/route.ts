import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getEffectiveSellingPrice } from "@/lib/pricing";
import { NextResponse } from "next/server";

/**
 * Structured diagnostic logging for cart failures.
 * Safe fields only — no credentials, tokens, PII.
 */
function logCartFailure(stage: string, err: unknown, context: Record<string, unknown>) {
  const safeContext = Object.fromEntries(
    Object.entries(context).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );
  console.error("[CART_POST_FAILURE]", JSON.stringify({
    stage,
    name: err instanceof Error ? err.name : "Unknown",
    code: (err as any)?.code,
    meta: (err as any)?.meta,
    ...safeContext,
  }));
}

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

    // --- Step 1: Validate product ---
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    });

    if (!product || product.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Product is not available" },
        { status: 400 }
      );
    }

    // --- Step 2: Validate variant ---
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, productId: true, stock: true, size: true },
    });

    if (!variant || variant.productId !== productId) {
      return NextResponse.json(
        { error: "Variant not found" },
        { status: 404 }
      );
    }

    // --- Step 3: Ensure cart exists ---
    let cart = await prisma.cart.findUnique({
      where: { userId: dbUser.id },
    });

    if (!cart) {
      try {
        cart = await prisma.cart.create({
          data: { userId: dbUser.id },
        });
      } catch (err: any) {
        // P2003 = FK constraint (user not found — race with deletion)
        if (err.code === "P2003") {
          logCartFailure("cart_create_fk_violation", err, { userId: dbUser.id });
          return NextResponse.json(
            { error: "Session expired. Please sign in again." },
            { status: 401 }
          );
        }
        throw err;
      }
    }

    // --- Step 4: Check stock ---
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      select: { quantity: true },
    });

    const currentQuantity = existingItem?.quantity ?? 0;
    const newTotalQuantity = currentQuantity + quantity;

    if (newTotalQuantity > variant.stock) {
      return NextResponse.json(
        { error: `Only ${variant.stock} available in stock.` },
        { status: 400 }
      );
    }

    // --- Step 5: Upsert cart item ---
    let item;
    try {
      item = await prisma.cartItem.upsert({
        where: { cartId_variantId: { cartId: cart.id, variantId } },
        create: {
          cartId: cart.id,
          productId,
          variantId,
          quantity,
        },
        update: {
          quantity: newTotalQuantity,
        },
      });
    } catch (err: any) {
      // P2002 = unique constraint violation (shouldn't happen with upsert, but handle defensively)
      if (err.code === "P2002") {
        logCartFailure("cartitem_upsert_unique_violation", err, {
          cartId: cart.id,
          variantId,
          productId,
          userId: dbUser.id,
        });
        // Re-read the item that caused the collision
        const retryItem = await prisma.cartItem.findUnique({
          where: { cartId_variantId: { cartId: cart.id, variantId } },
        });
        if (retryItem) {
          item = retryItem;
        } else {
          throw err;
        }
      } else if (err.code === "P2003") {
        // FK violation — stale cart or variant
        logCartFailure("cartitem_upsert_fk_violation", err, {
          cartId: cart.id,
          variantId,
          productId,
          userId: dbUser.id,
        });
        return NextResponse.json(
          { error: "Unable to add this item to your cart right now." },
          { status: 500 }
        );
      } else {
        throw err;
      }
    }

    return NextResponse.json({
      id: item.id,
      quantity: item.quantity,
      success: true,
    });
  } catch (err: any) {
    logCartFailure("unexpected", err, {
      userId: authResult.user.id,
      productId: (err as any)?.productId,
      variantId: (err as any)?.variantId,
    });

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
