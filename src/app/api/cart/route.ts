import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getEffectiveSellingPrice } from "@/lib/pricing";
import { NextResponse } from "next/server";

/**
 * Safe structured stage logging for P0 cart diagnosis.
 * NEVER logs DATABASE_URL, passwords, tokens, cookies, secrets, or customer PII.
 */
function logCartP0(
  stage: string,
  err?: unknown,
  meta?: { productId?: string; variantId?: string; [key: string]: unknown }
) {
  const safeMeta: Record<string, unknown> = {};
  if (meta?.productId) safeMeta.productId = meta.productId;
  if (meta?.variantId) safeMeta.variantId = meta.variantId;

  const errorObj = err as any;
  console.error(
    "[CART_P0]",
    JSON.stringify({
      stage,
      name: errorObj?.name || (err instanceof Error ? err.name : undefined),
      code: errorObj?.code,
      meta: errorObj?.meta,
      ...safeMeta,
    })
  );
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
  let stage = "requireAuth";
  let reqProductId: string | undefined;
  let reqVariantId: string | undefined;

  try {
    const authResult = await requireAuth();
    if (authResult instanceof Response) {
      logCartP0("requireAuth", undefined, { result: "unauthorized" });
      return authResult;
    }
    const userId = authResult.user.id;

    stage = "parse_body";
    const body = await request.json();
    const { productId, variantId, quantity = 1 } = body;
    reqProductId = typeof productId === "string" ? productId : undefined;
    reqVariantId = typeof variantId === "string" ? variantId : undefined;

    if (!productId || !variantId || !Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    stage = "db_user_lookup";
    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
    } catch (err) {
      logCartP0("db_user_lookup", err, { productId, variantId });
      throw err;
    }

    if (!dbUser) {
      logCartP0("db_user_lookup", { code: "USER_NOT_FOUND" }, { productId, variantId });
      return NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 }
      );
    }

    stage = "product_lookup";
    let product;
    try {
      product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, status: true },
      });
    } catch (err) {
      logCartP0("product_lookup", err, { productId, variantId });
      throw err;
    }

    if (!product || product.status !== "ACTIVE") {
      logCartP0("product_lookup", { code: "PRODUCT_UNAVAILABLE", status: product?.status }, { productId, variantId });
      return NextResponse.json(
        { error: "Product is not available" },
        { status: 400 }
      );
    }

    stage = "variant_lookup";
    let variant;
    try {
      variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { id: true, productId: true, stock: true },
      });
    } catch (err) {
      logCartP0("variant_lookup", err, { productId, variantId });
      throw err;
    }

    if (!variant || variant.productId !== productId) {
      logCartP0("variant_lookup", { code: "VARIANT_NOT_FOUND" }, { productId, variantId });
      return NextResponse.json(
        { error: "Variant not found" },
        { status: 404 }
      );
    }

    stage = "cart_upsert";
    let cart = await prisma.cart.findUnique({
      where: { userId: dbUser.id },
    });

    if (!cart) {
      try {
        cart = await prisma.cart.create({
          data: { userId: dbUser.id },
        });
      } catch (err: any) {
        if (err?.code === "P2002") {
          // Race condition: concurrent creation
          logCartP0("cart_upsert_collision_retry", err, { productId, variantId });
          cart = await prisma.cart.findUnique({
            where: { userId: dbUser.id },
          });
        } else if (err?.code === "P2003") {
          // A valid user was resolved immediately above, so a Cart.userId FK
          // violation indicates production schema drift rather than bad input.
          // The repair migration recreates this constraint. Keep the response
          // explicit if a host has not applied migrations yet.
          logCartP0("cart_user_fk", err, { productId, variantId });

          try {
            const dbNameRes: any[] = await prisma.$queryRaw`SELECT DATABASE() AS db;`;
            const fkInfoRes: any[] = await prisma.$queryRaw`
              SELECT
                CONSTRAINT_NAME,
                TABLE_SCHEMA,
                REFERENCED_TABLE_SCHEMA,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
              FROM information_schema.KEY_COLUMN_USAGE
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'Cart'
                AND COLUMN_NAME = 'userId'
                AND REFERENCED_TABLE_NAME IS NOT NULL;
            `;
            const userCheckRes: any[] = await prisma.$queryRaw`
              SELECT COUNT(*) AS c
              FROM User
              WHERE id = ${dbUser.id};
            `;
            const columnsRes: any[] = await prisma.$queryRaw`
              SELECT
                COLUMN_NAME,
                COLUMN_TYPE,
                IS_NULLABLE,
                COLLATION_NAME
              FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME IN ('Cart', 'User')
                AND (
                  (TABLE_NAME = 'Cart' AND COLUMN_NAME = 'userId')
                  OR
                  (TABLE_NAME = 'User' AND COLUMN_NAME = 'id')
                );
            `;
            const triggersRes: any[] = await prisma.$queryRaw`
              SELECT
                TRIGGER_NAME,
                EVENT_MANIPULATION,
                ACTION_TIMING
              FROM information_schema.TRIGGERS
              WHERE TRIGGER_SCHEMA = DATABASE()
                AND EVENT_OBJECT_TABLE = 'Cart';
            `;

            const userExists = Number(userCheckRes[0]?.c ?? 0);

            console.error(
              "[CART_RUNTIME_DIAG]",
              JSON.stringify(
                {
                  runtimeMarker: "cart-runtime-diag-104e1da-v1",
                  database: dbNameRes[0]?.db ?? null,
                  fk: fkInfoRes,
                  userExists,
                  columns: columnsRes,
                  triggers: triggersRes,
                },
                (_key, val) => (typeof val === "bigint" ? Number(val) : val)
              )
            );
          } catch (diagErr: any) {
            console.error("[CART_RUNTIME_DIAG_ERROR]", diagErr?.message || diagErr);
          }

          return NextResponse.json(
            {
              error: "Cart storage is being updated. Please retry after the deployment finishes.",
              code: "CART_USER_LINK_UNAVAILABLE",
            },
            { status: 503 }
          );
        } else {
          logCartP0("cart_upsert", err, { productId, variantId });
          throw err;
        }
      }
    }

    if (!cart) {
      throw new Error("Failed to resolve or create cart for user");
    }

    stage = "existing_cart_item_lookup";
    let existingItem;
    try {
      existingItem = await prisma.cartItem.findUnique({
        where: { cartId_variantId: { cartId: cart.id, variantId } },
      });
    } catch (err) {
      logCartP0("existing_cart_item_lookup", err, { productId, variantId });
      throw err;
    }

    const currentQuantity = existingItem?.quantity || 0;
    const newTotalQuantity = currentQuantity + quantity;

    if (newTotalQuantity > variant.stock) {
      logCartP0("stock_check", { code: "INSUFFICIENT_STOCK", available: variant.stock }, { productId, variantId });
      return NextResponse.json(
        { error: `Only ${variant.stock} available in stock.` },
        { status: 400 }
      );
    }

    stage = "cart_item_upsert";
    let item;
    try {
      if (existingItem) {
        item = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newTotalQuantity },
        });
      } else {
        try {
          item = await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              variantId,
              quantity,
            },
          });
        } catch (createErr: any) {
          if (createErr?.code === "P2002") {
            logCartP0("cart_item_upsert_collision_retry", createErr, { productId, variantId });
            const collisionItem = await prisma.cartItem.findUnique({
              where: { cartId_variantId: { cartId: cart.id, variantId } },
            });
            if (collisionItem) {
              const updatedQuantity = collisionItem.quantity + quantity;
              if (updatedQuantity > variant.stock) {
                return NextResponse.json(
                  { error: `Only ${variant.stock} available in stock.` },
                  { status: 400 }
                );
              }
              item = await prisma.cartItem.update({
                where: { id: collisionItem.id },
                data: { quantity: updatedQuantity },
              });
            } else {
              throw createErr;
            }
          } else {
            throw createErr;
          }
        }
      }
    } catch (err) {
      logCartP0("cart_item_upsert", err, { productId, variantId });
      throw err;
    }

    return NextResponse.json({ id: item.id, quantity: item.quantity, success: true });
  } catch (err: any) {
    logCartP0(stage, err, { productId: reqProductId, variantId: reqVariantId });

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
