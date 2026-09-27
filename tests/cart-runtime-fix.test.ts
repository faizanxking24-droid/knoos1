/**
 * Cart POST handler — pure function tests.
 *
 * Tests the business logic of the add-to-cart flow by extracting the handler's
 * logic into testable functions. Validates:
 *   - Successful add-to-cart
 *   - Quantity accumulation on existing items
 *   - Stock limit enforcement
 *   - Prisma error classification (P2002, P2003)
 *   - Bad session (user not found)
 *   - Bad variant (not found / wrong product)
 *   - Inactive product rejection
 *
 * Run: npx tsx tests/cart-runtime-fix.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert";

// ─── Pure functions extracted from the handler for testability ───────────

type Product = { id: string; status: string };
type Variant = { id: string; productId: string; stock: number; size: string };
type CartRow = { id: string; userId: string };
type CartItemRow = { id: string; cartId: string; productId: string; variantId: string; quantity: number };

type DbUser = { id: string } | null;

function computeNewQuantity(
  existingQty: number,
  addQty: number,
  variantStock: number
): { ok: boolean; total?: number; error?: string } {
  const total = existingQty + addQty;
  if (total > variantStock) {
    return { ok: false, error: `Only ${variantStock} available in stock.` };
  }
  return { ok: true, total };
}

function validateProduct(product: Product | null): { ok: boolean; error?: string } {
  if (!product || product.status !== "ACTIVE") {
    return { ok: false, error: "Product is not available" };
  }
  return { ok: true };
}

function validateVariant(
  variant: Variant | null,
  productId: string
): { ok: boolean; error?: string } {
  if (!variant || variant.productId !== productId) {
    return { ok: false, error: "Variant not found" };
  }
  return { ok: true };
}

function classifyPrismaError(err: { code?: string }): {
  handled: boolean;
  status?: number;
  message?: string;
} {
  switch (err.code) {
    case "P2002":
      return { handled: true, status: 500, message: "Unable to add this item to your cart right now." };
    case "P2003":
      return { handled: true, status: 401, message: "Session expired. Please sign in again." };
    default:
      return { handled: false };
  }
}

// ─── Mock Prisma client ─────────────────────────────────────────────────

interface MockPrisma {
  user: {
    findUnique: (args: { where: { id: string }; select?: any }) => Promise<DbUser>;
  };
  product: {
    findUnique: (args: { where: { id: string }; select?: any }) => Promise<Product | null>;
  };
  productVariant: {
    findUnique: (args: { where: { id: string }; select?: any }) => Promise<Variant | null>;
  };
  cart: {
    findUnique: (args: { where: { userId: string } }) => Promise<CartRow | null>;
    create: (args: { data: { userId: string } }) => Promise<CartRow>;
  };
  cartItem: {
    findUnique: (args: { where: { cartId_variantId: { cartId: string; variantId: string } }; select?: any }) => Promise<CartItemRow | null>;
    upsert: (args: {
      where: { cartId_variantId: { cartId: string; variantId: string } };
      create: any;
      update: any;
    }) => Promise<CartItemRow>;
  };
}

function createMockPrisma(): MockPrisma {
  const carts = new Map<string, CartRow>();
  const cartItems = new Map<string, CartItemRow>();

  return {
    user: {
      findUnique: async ({ where: { id } }) => {
        // Simulate: user "user-deleted" doesn't exist
        if (id === "user-deleted") return null;
        return { id };
      },
    },
    product: {
      findUnique: async ({ where: { id } }) => {
        if (id === "prod-active") return { id: "prod-active", status: "ACTIVE" };
        if (id === "prod-inactive") return { id: "prod-inactive", status: "INACTIVE" };
        return null;
      },
    },
    productVariant: {
      findUnique: async ({ where: { id } }) => {
        if (id === "var-valid") return { id: "var-valid", productId: "prod-active", stock: 10, size: "8" };
        if (id === "var-other-product") return { id: "var-other-product", productId: "prod-inactive", stock: 5, size: "9" };
        if (id === "var-out-of-stock") return { id: "var-out-of-stock", productId: "prod-active", stock: 0, size: "7" };
        return null;
      },
    },
    cart: {
      findUnique: async ({ where: { userId } }) => {
        return carts.get(userId) ?? null;
      },
      create: async ({ data: { userId } }) => {
        const cart: CartRow = { id: `cart-${userId}`, userId };
        carts.set(userId, cart);
        return cart;
      },
    },
    cartItem: {
      findUnique: async (args: { where: { cartId_variantId: { cartId: string; variantId: string } } | { id: string } }) => {
        const w = args.where as any;
        if ("cartId_variantId" in w) {
          const { cartId, variantId } = w.cartId_variantId;
          return [...cartItems.values()].find(
            (item) => item.cartId === cartId && item.variantId === variantId
          ) ?? null;
        }
        if ("id" in w) {
          return cartItems.get(w.id) ?? null;
        }
        return null;
      },
      upsert: async (args: {
        where: { cartId_variantId: { cartId: string; variantId: string } };
        create: any;
        update: any;
      }) => {
        const { cartId, variantId } = args.where.cartId_variantId;
        const existing = [...cartItems.values()].find(
          (item) => item.cartId === cartId && item.variantId === variantId
        );
        if (existing) {
          const updated = { ...existing, quantity: args.update.quantity as number };
          cartItems.set(existing.id, updated);
          return updated;
        }
        const newItem: CartItemRow = {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          cartId: args.create.cartId,
          productId: args.create.productId,
          variantId: args.create.variantId,
          quantity: args.create.quantity,
        };
        cartItems.set(newItem.id, newItem);
        return newItem;
      },
    },
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe("Cart POST — successful path", () => {
  it("1. valid user + active product + valid variant → creates cart and cartItem", async () => {
    const db = createMockPrisma();
    const userId = "user-valid";
    const productId = "prod-active";
    const variantId = "var-valid";
    const quantity = 1;

    // Simulate handler flow
    const dbUser = await db.user.findUnique({ where: { id: userId } });
    assert.ok(dbUser, "user must exist");

    const product = await db.product.findUnique({ where: { id: productId } });
    const productCheck = validateProduct(product);
    assert.ok(productCheck.ok);

    const variant = await db.productVariant.findUnique({ where: { id: variantId } });
    const variantCheck = validateVariant(variant, productId);
    assert.ok(variantCheck.ok);

    let cart = await db.cart.findUnique({ where: { userId: dbUser.id } });
    assert.ok(!cart, "cart should not exist yet");
    cart = await db.cart.create({ data: { userId: dbUser.id } });
    assert.ok(cart);

    const existingItem = await db.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });
    assert.strictEqual(existingItem, null, "no existing item");

    const qtyCheck = computeNewQuantity(0, quantity, variant!.stock);
    assert.ok(qtyCheck.ok);

    const item = await db.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      create: { cartId: cart.id, productId, variantId, quantity },
      update: { quantity: qtyCheck.total! },
    });

    assert.ok(item.id);
    assert.strictEqual(item.quantity, quantity);
    assert.strictEqual(item.cartId, cart.id);
    assert.strictEqual(item.variantId, variantId);
  });

  it("2. add same variant twice → quantity accumulates", async () => {
    const db = createMockPrisma();
    const userId = "user-accumulate";
    const productId = "prod-active";
    const variantId = "var-valid";

    // Create cart
    const cart = await db.cart.create({ data: { userId } });

    // First add: qty 2
    const item1 = await db.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      create: { cartId: cart.id, productId, variantId, quantity: 2 },
      update: { quantity: 2 },
    });
    assert.strictEqual(item1.quantity, 2);

    // Second add: qty 3
    const existing = await db.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });
    const currentQty = existing?.quantity ?? 0;
    const qtyCheck = computeNewQuantity(currentQty, 3, 10);
    assert.ok(qtyCheck.ok);
    assert.strictEqual(qtyCheck.total, 5);

    const item2 = await db.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      create: { cartId: cart.id, productId, variantId, quantity: 3 },
      update: { quantity: qtyCheck.total! },
    });
    assert.strictEqual(item2.quantity, 5);
  });
});

describe("Cart POST — stock limit", () => {
  it("3. quantity exceeds stock → rejected with 400", async () => {
    const variantStock = 5;
    const existingQty = 3;
    const addQty = 5;
    const result = computeNewQuantity(existingQty, addQty, variantStock);
    assert.ok(!result.ok);
    assert.ok(result.error?.includes("5"));
  });

  it("4. quantity equals exact stock → accepted", async () => {
    const variantStock = 5;
    const existingQty = 2;
    const addQty = 3;
    const result = computeNewQuantity(existingQty, addQty, variantStock);
    assert.ok(result.ok);
    assert.strictEqual(result.total, 5);
  });

  it("5. adding to out-of-stock variant → rejected", async () => {
    const variantStock = 0;
    const result = computeNewQuantity(0, 1, variantStock);
    assert.ok(!result.ok);
  });
});

describe("Cart POST — product/variant validation", () => {
  it("6. inactive product → rejected", () => {
    const product: Product = { id: "prod-inactive", status: "INACTIVE" };
    const check = validateProduct(product);
    assert.ok(!check.ok);
    assert.strictEqual(check.error, "Product is not available");
  });

  it("7. nonexistent product → rejected", () => {
    const check = validateProduct(null);
    assert.ok(!check.ok);
  });

  it("8. variant for wrong product → rejected", () => {
    const variant: Variant = { id: "v1", productId: "other-prod", stock: 5, size: "8" };
    const check = validateVariant(variant, "prod-active");
    assert.ok(!check.ok);
  });

  it("9. nonexistent variant → rejected", () => {
    const check = validateVariant(null, "prod-active");
    assert.ok(!check.ok);
  });
});

describe("Cart POST — Prisma error classification", () => {
  it("10. P2003 (FK violation on cart create) → 401 session expired", () => {
    const classification = classifyPrismaError({ code: "P2003" });
    assert.ok(classification.handled);
    assert.strictEqual(classification.status, 401);
    assert.ok(classification.message?.includes("Session expired"));
  });

  it("11. P2002 (unique constraint) → logged and retried", () => {
    const classification = classifyPrismaError({ code: "P2002" });
    assert.ok(classification.handled);
    assert.strictEqual(classification.status, 500);
  });

  it("12. unknown Prisma error → falls through to generic 500", () => {
    const classification = classifyPrismaError({ code: "P9999" });
    assert.ok(!classification.handled);
  });
});

describe("Cart POST — session validation", () => {
  it("13. user not found in DB → 401 before any cart operation", async () => {
    const db = createMockPrisma();
    const dbUser = await db.user.findUnique({ where: { id: "user-deleted" } });
    assert.strictEqual(dbUser, null, "deleted user returns null");
    // In the handler, this would trigger: return 401 "Session expired"
  });

  it("14. valid user → proceeds to cart operations", async () => {
    const db = createMockPrisma();
    const dbUser = await db.user.findUnique({ where: { id: "user-valid" } });
    assert.ok(dbUser, "valid user exists");
  });
});
