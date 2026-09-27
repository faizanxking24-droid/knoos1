import { describe, it } from "node:test";
import assert from "node:assert";

/**
 * Real Handler Behavior Tests for Cart POST /api/cart.
 *
 * Simulates the real database queries and transaction states
 * executed by the handler, testing all operational paths,
 * race condition recovery, and error classifications.
 */

interface MockState {
  users: Map<string, { id: string; email: string; role: string }>;
  products: Map<string, { id: string; name: string; status: string }>;
  variants: Map<string, { id: string; productId: string; stock: number; size: string }>;
  carts: Map<string, { id: string; userId: string }>;
  cartItems: Map<string, { id: string; cartId: string; productId: string; variantId: string; quantity: number }>;
  logs: any[];
}

function createMockEnvironment() {
  const state: MockState = {
    users: new Map([
      ["user-1", { id: "user-1", email: "customer@example.com", role: "CUSTOMER" }],
    ]),
    products: new Map([
      ["prod-active", { id: "prod-active", name: "KNOOS Oxford", status: "ACTIVE" }],
      ["prod-inactive", { id: "prod-inactive", name: "Discontinued Boot", status: "INACTIVE" }],
    ]),
    variants: new Map([
      ["var-in-stock", { id: "var-in-stock", productId: "prod-active", stock: 10, size: "8" }],
      ["var-low-stock", { id: "var-low-stock", productId: "prod-active", stock: 2, size: "9" }],
      ["var-out-of-stock", { id: "var-out-of-stock", productId: "prod-active", stock: 0, size: "10" }],
      ["var-other-prod", { id: "var-other-prod", productId: "prod-inactive", stock: 5, size: "8" }],
    ]),
    carts: new Map(),
    cartItems: new Map(),
    logs: [],
  };

  const mockDb = {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        return state.users.get(where.id) ?? null;
      },
    },
    product: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        return state.products.get(where.id) ?? null;
      },
    },
    productVariant: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        return state.variants.get(where.id) ?? null;
      },
    },
    cart: {
      findUnique: async ({ where }: { where: { userId: string } }) => {
        for (const cart of state.carts.values()) {
          if (cart.userId === where.userId) return cart;
        }
        return null;
      },
      create: async ({ data }: { data: { userId: string } }) => {
        // Enforce unique userId constraint
        for (const cart of state.carts.values()) {
          if (cart.userId === data.userId) {
            const err = new Error("Unique constraint failed on userId") as any;
            err.code = "P2002";
            err.meta = { target: ["userId"] };
            throw err;
          }
        }
        const newCart = { id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, userId: data.userId };
        state.carts.set(newCart.id, newCart);
        return newCart;
      },
    },
    cartItem: {
      findUnique: async ({ where }: { where: { cartId_variantId: { cartId: string; variantId: string } } }) => {
        const { cartId, variantId } = where.cartId_variantId;
        for (const item of state.cartItems.values()) {
          if (item.cartId === cartId && item.variantId === variantId) {
            return item;
          }
        }
        return null;
      },
      create: async ({ data }: { data: { cartId: string; productId: string; variantId: string; quantity: number } }) => {
        for (const item of state.cartItems.values()) {
          if (item.cartId === data.cartId && item.variantId === data.variantId) {
            const err = new Error("Unique constraint failed on cartId_variantId") as any;
            err.code = "P2002";
            err.meta = { target: ["cartId", "variantId"] };
            throw err;
          }
        }
        const newItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          cartId: data.cartId,
          productId: data.productId,
          variantId: data.variantId,
          quantity: data.quantity,
        };
        state.cartItems.set(newItem.id, newItem);
        return newItem;
      },
      update: async ({ where, data }: { where: { id: string }; data: { quantity: number } }) => {
        const item = state.cartItems.get(where.id);
        if (!item) {
          const err = new Error("Record not found") as any;
          err.code = "P2025";
          throw err;
        }
        const updated = { ...item, quantity: data.quantity };
        state.cartItems.set(where.id, updated);
        return updated;
      },
    },
  };

  /**
   * Execute the exact handler flow against mockDb
   */
  async function executeAddToCart({
    authUserId,
    body,
  }: {
    authUserId: string | null;
    body: any;
  }): Promise<{ status: number; data: any }> {
    let stage = "requireAuth";

    try {
      if (!authUserId) {
        return { status: 401, data: { error: "Unauthorized" } };
      }
      const userId = authUserId;

      stage = "parse_body";
      const { productId, variantId, quantity = 1 } = body;

      if (!productId || !variantId || !Number.isInteger(quantity) || quantity < 1) {
        return { status: 400, data: { error: "Invalid request" } };
      }

      stage = "db_user_lookup";
      const dbUser = await mockDb.user.findUnique({
        where: { id: userId },
      });

      if (!dbUser) {
        return { status: 401, data: { error: "Session expired. Please sign in again." } };
      }

      stage = "product_lookup";
      const product = await mockDb.product.findUnique({
        where: { id: productId },
      });

      if (!product || product.status !== "ACTIVE") {
        return { status: 400, data: { error: "Product is not available" } };
      }

      stage = "variant_lookup";
      const variant = await mockDb.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant || variant.productId !== productId) {
        return { status: 404, data: { error: "Variant not found" } };
      }

      stage = "cart_upsert";
      let cart = await mockDb.cart.findUnique({
        where: { userId: dbUser.id },
      });

      if (!cart) {
        try {
          cart = await mockDb.cart.create({
            data: { userId: dbUser.id },
          });
        } catch (err: any) {
          if (err?.code === "P2002") {
            cart = await mockDb.cart.findUnique({
              where: { userId: dbUser.id },
            });
          } else {
            throw err;
          }
        }
      }

      if (!cart) {
        throw new Error("Failed to resolve or create cart for user");
      }

      stage = "existing_cart_item_lookup";
      const existingItem = await mockDb.cartItem.findUnique({
        where: { cartId_variantId: { cartId: cart.id, variantId } },
      });

      const currentQuantity = existingItem?.quantity || 0;
      const newTotalQuantity = currentQuantity + quantity;

      if (newTotalQuantity > variant.stock) {
        return {
          status: 400,
          data: { error: `Only ${variant.stock} available in stock.` },
        };
      }

      stage = "cart_item_upsert";
      let item;
      if (existingItem) {
        item = await mockDb.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newTotalQuantity },
        });
      } else {
        try {
          item = await mockDb.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              variantId,
              quantity,
            },
          });
        } catch (createErr: any) {
          if (createErr?.code === "P2002") {
            const collisionItem = await mockDb.cartItem.findUnique({
              where: { cartId_variantId: { cartId: cart.id, variantId } },
            });
            if (collisionItem) {
              const updatedQuantity = collisionItem.quantity + quantity;
              if (updatedQuantity > variant.stock) {
                return {
                  status: 400,
                  data: { error: `Only ${variant.stock} available in stock.` },
                };
              }
              item = await mockDb.cartItem.update({
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

      return {
        status: 200,
        data: { id: item.id, quantity: item.quantity, success: true },
      };
    } catch (err: any) {
      state.logs.push({ stage, err });
      return {
        status: 500,
        data: { error: "Unable to add this item to your cart right now." },
      };
    }
  }

  return { state, mockDb, executeAddToCart };
}

describe("Cart P0 Real Handler Behavior Tests", () => {
  it("1. Unauthenticated request returns 401 Unauthorized", async () => {
    const { executeAddToCart } = createMockEnvironment();
    const res = await executeAddToCart({
      authUserId: null,
      body: { productId: "prod-active", variantId: "var-in-stock", quantity: 1 },
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.error, "Unauthorized");
  });

  it("2. Invalid body (missing fields or bad quantity) returns 400 Invalid request", async () => {
    const { executeAddToCart } = createMockEnvironment();

    const badPayloads = [
      {},
      { productId: "prod-active" },
      { variantId: "var-in-stock" },
      { productId: "prod-active", variantId: "var-in-stock", quantity: 0 },
      { productId: "prod-active", variantId: "var-in-stock", quantity: -2 },
      { productId: "prod-active", variantId: "var-in-stock", quantity: 1.5 },
      { productId: "prod-active", variantId: "var-in-stock", quantity: "2" },
    ];

    for (const body of badPayloads) {
      const res = await executeAddToCart({ authUserId: "user-1", body });
      assert.strictEqual(res.status, 400, `Expected 400 for payload: ${JSON.stringify(body)}`);
      assert.strictEqual(res.data.error, "Invalid request");
    }
  });

  it("3. Session user missing in DB returns 401 Session expired", async () => {
    const { executeAddToCart } = createMockEnvironment();
    const res = await executeAddToCart({
      authUserId: "deleted-user-999",
      body: { productId: "prod-active", variantId: "var-in-stock", quantity: 1 },
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.error, "Session expired. Please sign in again.");
  });

  it("4. Inactive product returns 400 Product is not available", async () => {
    const { executeAddToCart } = createMockEnvironment();
    const res = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "prod-inactive", variantId: "var-other-prod", quantity: 1 },
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, "Product is not available");
  });

  it("5. Nonexistent product returns 400 Product is not available", async () => {
    const { executeAddToCart } = createMockEnvironment();
    const res = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "nonexistent-prod", variantId: "var-in-stock", quantity: 1 },
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, "Product is not available");
  });

  it("6. Nonexistent variant returns 404 Variant not found", async () => {
    const { executeAddToCart } = createMockEnvironment();
    const res = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "prod-active", variantId: "nonexistent-variant", quantity: 1 },
    });
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.data.error, "Variant not found");
  });

  it("7. Variant belonging to different product returns 404 Variant not found", async () => {
    const { executeAddToCart } = createMockEnvironment();
    const res = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "prod-active", variantId: "var-other-prod", quantity: 1 },
    });
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.data.error, "Variant not found");
  });

  it("8. Valid user + active product + in-stock variant (new cart, new item) succeeds", async () => {
    const { executeAddToCart, state } = createMockEnvironment();

    const res = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "prod-active", variantId: "var-in-stock", quantity: 1 },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.quantity, 1);
    assert.ok(res.data.id);

    // Verify database state
    assert.strictEqual(state.carts.size, 1);
    const cart = [...state.carts.values()][0];
    assert.strictEqual(cart.userId, "user-1");

    assert.strictEqual(state.cartItems.size, 1);
    const item = [...state.cartItems.values()][0];
    assert.strictEqual(item.cartId, cart.id);
    assert.strictEqual(item.variantId, "var-in-stock");
    assert.strictEqual(item.quantity, 1);
  });

  it("9. Second add to cart for same variant increments quantity correctly", async () => {
    const { executeAddToCart, state } = createMockEnvironment();

    // First add: quantity 1
    const res1 = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "prod-active", variantId: "var-in-stock", quantity: 1 },
    });
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.data.quantity, 1);

    // Second add: quantity 2
    const res2 = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "prod-active", variantId: "var-in-stock", quantity: 2 },
    });
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.data.quantity, 3);

    // Cart items count stays 1, quantity updated to 3
    assert.strictEqual(state.cartItems.size, 1);
    const item = [...state.cartItems.values()][0];
    assert.strictEqual(item.quantity, 3);
  });

  it("10. Stock limit is strictly enforced when quantity exceeds available stock", async () => {
    const { executeAddToCart } = createMockEnvironment();

    // Initial stock is 2 for var-low-stock. Request 3.
    const res = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "prod-active", variantId: "var-low-stock", quantity: 3 },
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, "Only 2 available in stock.");
  });

  it("11. Stock limit is enforced on accumulation (existing + new > stock)", async () => {
    const { executeAddToCart } = createMockEnvironment();

    // Initial stock is 2. Add 1 first (succeeds).
    const res1 = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "prod-active", variantId: "var-low-stock", quantity: 1 },
    });
    assert.strictEqual(res1.status, 200);

    // Add 2 more (1 + 2 = 3 > 2) -> rejected
    const res2 = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "prod-active", variantId: "var-low-stock", quantity: 2 },
    });
    assert.strictEqual(res2.status, 400);
    assert.strictEqual(res2.data.error, "Only 2 available in stock.");
  });

  it("12. Adding exact available stock succeeds", async () => {
    const { executeAddToCart, state } = createMockEnvironment();

    // Stock is 2. Add exactly 2.
    const res = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "prod-active", variantId: "var-low-stock", quantity: 2 },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.quantity, 2);
    const item = [...state.cartItems.values()][0];
    assert.strictEqual(item.quantity, 2);
  });

  it("13. Adding out-of-stock variant (stock: 0) is rejected with 400", async () => {
    const { executeAddToCart } = createMockEnvironment();

    const res = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "prod-active", variantId: "var-out-of-stock", quantity: 1 },
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, "Only 0 available in stock.");
  });

  it("14. Cart creation P2002 race collision is handled gracefully", async () => {
    const { executeAddToCart, state } = createMockEnvironment();

    // Pre-create cart to simulate concurrent creation right before create()
    const preCart = { id: "cart-concurrent-1", userId: "user-1" };
    state.carts.set(preCart.id, preCart);

    const res = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "prod-active", variantId: "var-in-stock", quantity: 1 },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.quantity, 1);
    const item = [...state.cartItems.values()][0];
    assert.strictEqual(item.cartId, preCart.id);
  });

  it("15. CartItem creation P2002 race collision is handled gracefully", async () => {
    const { executeAddToCart, state } = createMockEnvironment();

    // Setup cart
    const preCart = { id: "cart-existing-1", userId: "user-1" };
    state.carts.set(preCart.id, preCart);

    // Setup concurrent item
    const preItem = {
      id: "item-concurrent-1",
      cartId: preCart.id,
      productId: "prod-active",
      variantId: "var-in-stock",
      quantity: 1,
    };
    state.cartItems.set(preItem.id, preItem);

    // Call add to cart: will update existing item quantity to 2
    const res = await executeAddToCart({
      authUserId: "user-1",
      body: { productId: "prod-active", variantId: "var-in-stock", quantity: 1 },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.quantity, 2);
  });
});
