import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildInvoiceData,
  type RawOrderSnapshot,
} from "../src/lib/order-invoice";

describe("Order Item SKU Historical Snapshot & Invoice System", () => {
  const BASE_MOCK_ORDER: RawOrderSnapshot = {
    id: "cmujtak0a0001sku123",
    userId: "user_customer_456",
    createdAt: new Date("2026-10-02T12:00:00Z"),
    subtotal: 2999,
    discountAmount: 0,
    deliveryCharge: 0,
    total: 2999,
    paymentMethod: "ONLINE",
    paymentStatus: "PAID",
    orderStatus: "PROCESSING",
    items: [],
  };

  describe("1. Historical Immutability Test (Core Requirement)", () => {
    it("preserves snapshot SKU even if live ProductVariant SKU changes later", () => {
      // 1. Initial product variant at checkout
      const variantAtCheckout = {
        id: "var_black_8",
        productId: "prod_boot_1",
        size: "8",
        sku: "WAV-323-BLK-8",
        price: 2999,
      };

      // 2. OrderItem snapshot created at checkout
      const orderItemSnapshot = {
        id: "item_snap_1",
        productId: variantAtCheckout.productId,
        productName: "KNOOS Chelsea Boot",
        sku: variantAtCheckout.sku,
        size: variantAtCheckout.size,
        quantity: 1,
        price: variantAtCheckout.price,
        total: variantAtCheckout.price,
      };

      const order: RawOrderSnapshot = {
        ...BASE_MOCK_ORDER,
        items: [orderItemSnapshot],
      };

      // 3. First invoice generation
      const initialInvoice = buildInvoiceData(order);
      assert.strictEqual(initialInvoice.items[0].sku, "WAV-323-BLK-8");

      // 4. Later live variant SKU is modified in the database / admin catalog
      const updatedVariantInCatalog = {
        ...variantAtCheckout,
        sku: "NEW-SKU-999", // Admin updated SKU to new system
      };

      // 5. Historical invoice still uses the frozen OrderItem snapshot
      const laterInvoice = buildInvoiceData(order);
      assert.strictEqual(
        laterInvoice.items[0].sku,
        "WAV-323-BLK-8",
        "Invoice SKU must remain historical and must not change when catalog variant SKU is modified"
      );
      assert.notStrictEqual(laterInvoice.items[0].sku, updatedVariantInCatalog.sku);
    });
  });

  describe("2. Buy Now & Cart Checkout Snapshotting", () => {
    it("stores size-specific variant SKU from Buy Now flow", () => {
      const buyNowItem = {
        id: "item_buynow_1",
        productName: "Classic Oxford",
        sku: "OXF-BRN-8",
        size: "8",
        quantity: 1,
        price: 3499,
        total: 3499,
      };

      const invoice = buildInvoiceData({
        ...BASE_MOCK_ORDER,
        items: [buyNowItem],
      });

      assert.strictEqual(invoice.items[0].sku, "OXF-BRN-8");
      assert.strictEqual(invoice.items[0].size, "8");
    });

    it("stores size-specific variant SKU from Cart checkout with multiple sizes", () => {
      const cartItems = [
        {
          id: "item_cart_1",
          productName: "Derby Brogue",
          sku: "DRB-TAN-7",
          size: "7",
          quantity: 1,
          price: 2499,
          total: 2499,
        },
        {
          id: "item_cart_2",
          productName: "Derby Brogue",
          sku: "DRB-TAN-9",
          size: "9",
          quantity: 2,
          price: 2499,
          total: 4998,
        },
      ];

      const invoice = buildInvoiceData({
        ...BASE_MOCK_ORDER,
        subtotal: 7497,
        total: 7497,
        items: cartItems,
      });

      assert.strictEqual(invoice.items[0].sku, "DRB-TAN-7");
      assert.strictEqual(invoice.items[1].sku, "DRB-TAN-9");
      assert.notStrictEqual(invoice.items[0].sku, invoice.items[1].sku);
    });
  });

  describe("3. Payment Methods (COD and Online)", () => {
    it("COD order snapshot includes SKU and preserves financial totals", () => {
      const codOrder: RawOrderSnapshot = {
        ...BASE_MOCK_ORDER,
        paymentMethod: "COD",
        orderStatus: "PROCESSING",
        paymentStatus: "PENDING",
        deliveryCharge: 100,
        subtotal: 1999,
        total: 2099,
        items: [
          {
            id: "item_cod_1",
            productName: "Loafer Classic",
            sku: "LOA-SND-10",
            size: "10",
            quantity: 1,
            price: 1999,
            total: 1999,
          },
        ],
      };

      const invoice = buildInvoiceData(codOrder);
      assert.strictEqual(invoice.paymentMethod, "COD");
      assert.strictEqual(invoice.paymentMethodLabel, "Cash on Delivery");
      assert.strictEqual(invoice.items[0].sku, "LOA-SND-10");
      assert.strictEqual(invoice.total, 2099);
    });

    it("Online order snapshot includes SKU and preserves financial totals", () => {
      const onlineOrder: RawOrderSnapshot = {
        ...BASE_MOCK_ORDER,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        razorpayOrderId: "order_rp_999",
        razorpayPaymentId: "pay_rp_888",
        subtotal: 2999,
        total: 2999,
        items: [
          {
            id: "item_online_1",
            productName: "Monk Strap",
            sku: "MNK-BLK-8",
            size: "8",
            quantity: 1,
            price: 2999,
            total: 2999,
          },
        ],
      };

      const invoice = buildInvoiceData(onlineOrder);
      assert.strictEqual(invoice.paymentMethod, "ONLINE");
      assert.strictEqual(invoice.items[0].sku, "MNK-BLK-8");
      assert.strictEqual(invoice.razorpayOrderId, "order_rp_999");
    });
  });

  describe("4. Legacy Order Compatibility (sku = null)", () => {
    it("maps missing or undefined sku to null without crashing", () => {
      const legacyOrder: RawOrderSnapshot = {
        ...BASE_MOCK_ORDER,
        items: [
          {
            id: "item_legacy_1",
            productName: "Old Heritage Boot",
            size: "8",
            quantity: 1,
            price: 2199,
            total: 2199,
            // sku omitted (legacy order)
          },
        ],
      };

      const invoice = buildInvoiceData(legacyOrder);
      assert.strictEqual(invoice.items[0].sku, null);
      assert.notStrictEqual(invoice.items[0].sku, "null");
      assert.notStrictEqual(invoice.items[0].sku, "undefined");
      assert.notStrictEqual(invoice.items[0].sku, "N/A");
    });

    it("explicit sku: null is preserved cleanly as null", () => {
      const legacyOrderWithNull: RawOrderSnapshot = {
        ...BASE_MOCK_ORDER,
        items: [
          {
            id: "item_legacy_2",
            productName: "Old Sneaker",
            sku: null,
            size: "9",
            quantity: 1,
            price: 1599,
            total: 1599,
          },
        ],
      };

      const invoice = buildInvoiceData(legacyOrderWithNull);
      assert.strictEqual(invoice.items[0].sku, null);
    });
  });

  describe("5. Shared Architecture & UI Rendering Invariants", () => {
    it("InvoiceDocument.tsx omits SKU label when item.sku is null/falsy", () => {
      const invoiceDocPath = path.join(process.cwd(), "src/components/orders/InvoiceDocument.tsx");
      const invoiceDocCode = fs.readFileSync(invoiceDocPath, "utf8");

      // Verify conditional render {item.sku && ...}
      assert.strictEqual(
        invoiceDocCode.includes("item.sku &&"),
        true,
        "InvoiceDocument must conditionally render SKU only when present"
      );
      assert.strictEqual(
        invoiceDocCode.includes("SKU: {item.sku}"),
        true,
        "InvoiceDocument must display SKU: {item.sku}"
      );
    });

    it("Order APIs and interfaces include sku field", () => {
      const ordersRoutePath = path.join(process.cwd(), "src/app/api/orders/route.ts");
      const ordersRouteCode = fs.readFileSync(ordersRoutePath, "utf8");
      assert.strictEqual(ordersRouteCode.includes("sku: variant.sku"), true);
      assert.strictEqual(ordersRouteCode.includes("sku: item.variant.sku"), true);
      assert.strictEqual(ordersRouteCode.includes("sku: true"), true);

      const codOrderPath = path.join(process.cwd(), "src/lib/finalize-cod-order.ts");
      const codOrderCode = fs.readFileSync(codOrderPath, "utf8");
      assert.strictEqual(codOrderCode.includes("sku?: string | null;"), true);
    });
  });

  describe("6. Database Migration Invariance", () => {
    const migrationDir = path.join(process.cwd(), "prisma/migrations/20261002235900_add_order_item_sku");
    const migrationFile = path.join(migrationDir, "migration.sql");

    it("migration file exists and contains additive ALTER TABLE statement", () => {
      assert.strictEqual(fs.existsSync(migrationFile), true, "migration.sql must exist");
      const sql = fs.readFileSync(migrationFile, "utf8");

      assert.strictEqual(
        sql.includes("ALTER TABLE `OrderItem` ADD COLUMN `sku` VARCHAR(100) NULL;"),
        true,
        "Migration must add nullable sku column"
      );

      // Verify safety: must not drop, truncate, or recreate
      assert.strictEqual(/DROP/i.test(sql), false, "Migration must not DROP");
      assert.strictEqual(/TRUNCATE/i.test(sql), false, "Migration must not TRUNCATE");
      assert.strictEqual(/DELETE/i.test(sql), false, "Migration must not DELETE");
    });
  });
});
