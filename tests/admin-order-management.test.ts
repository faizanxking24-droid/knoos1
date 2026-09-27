import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
} from "../src/lib/constants";
import { orderStatusUpdateSchema } from "../src/lib/validation/admin";

describe("Admin Order & Payment Status Management Tests", () => {
  // ─── 1. Canonical Enums & Constants ─────────────────────────────────────
  it("OrderStatus enum contains all canonical values", () => {
    const expected = [
      "PENDING",
      "PAID",
      "PROCESSING",
      "PACKED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];
    assert.deepStrictEqual(Object.values(OrderStatus), expected);
  });

  it("PaymentStatus enum contains all canonical values", () => {
    const expected = ["PENDING", "PAID", "FAILED", "REFUNDED"];
    assert.deepStrictEqual(Object.values(PaymentStatus), expected);
  });

  it("All OrderStatus values have corresponding badge color classes", () => {
    for (const status of Object.values(OrderStatus)) {
      assert(
        ORDER_STATUS_COLORS[status],
        `Missing color class for OrderStatus.${status}`
      );
      assert(
        typeof ORDER_STATUS_COLORS[status] === "string" &&
          ORDER_STATUS_COLORS[status].length > 0
      );
    }
  });

  it("All PaymentStatus values have corresponding badge color classes", () => {
    for (const status of Object.values(PaymentStatus)) {
      assert(
        PAYMENT_STATUS_COLORS[status],
        `Missing color class for PaymentStatus.${status}`
      );
      assert(
        typeof PAYMENT_STATUS_COLORS[status] === "string" &&
          PAYMENT_STATUS_COLORS[status].length > 0
      );
    }
  });

  // ─── 2. Validation Schema (orderStatusUpdateSchema) ─────────────────────
  it("orderStatusUpdateSchema accepts ANY canonical order status independently", () => {
    for (const status of Object.values(OrderStatus)) {
      const result = orderStatusUpdateSchema.safeParse({ orderStatus: status });
      assert.strictEqual(result.success, true, `Failed for status ${status}`);
      if (result.success) {
        assert.strictEqual(result.data.orderStatus, status);
      }
    }
  });

  it("orderStatusUpdateSchema accepts ANY canonical payment status independently", () => {
    for (const status of Object.values(PaymentStatus)) {
      const result = orderStatusUpdateSchema.safeParse({ paymentStatus: status });
      assert.strictEqual(result.success, true, `Failed for payment status ${status}`);
      if (result.success) {
        assert.strictEqual(result.data.paymentStatus, status);
      }
    }
  });

  it("orderStatusUpdateSchema accepts combined orderStatus and paymentStatus", () => {
    const result = orderStatusUpdateSchema.safeParse({
      orderStatus: "DELIVERED",
      paymentStatus: "PAID",
    });
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.orderStatus, "DELIVERED");
      assert.strictEqual(result.data.paymentStatus, "PAID");
    }
  });

  it("orderStatusUpdateSchema rejects invalid order status string", () => {
    const result = orderStatusUpdateSchema.safeParse({
      orderStatus: "UNKNOWN_STATUS",
    });
    assert.strictEqual(result.success, false);
  });

  it("orderStatusUpdateSchema rejects invalid payment status string", () => {
    const result = orderStatusUpdateSchema.safeParse({
      paymentStatus: "COMPLETED", // non-canonical
    });
    assert.strictEqual(result.success, false);
  });

  it("orderStatusUpdateSchema rejects empty payload", () => {
    const result = orderStatusUpdateSchema.safeParse({});
    assert.strictEqual(result.success, false);
  });

  // ─── 3. Unrestricted Transitions (Simulation & Contract) ────────────────
  it("Simulated admin order update allows arbitrary transitions between all statuses", () => {
    const transitions: [string, string][] = [
      ["PENDING", "DELIVERED"],
      ["DELIVERED", "PROCESSING"],
      ["DELIVERED", "CANCELLED"],
      ["CANCELLED", "PROCESSING"],
      ["CANCELLED", "SHIPPED"],
      ["SHIPPED", "PENDING"],
      ["PACKED", "DELIVERED"],
      ["DELIVERED", "DELIVERED"], // same-value transition
      ["CANCELLED", "CANCELLED"],
    ];

    for (const [from, to] of transitions) {
      // Validate that target status passes schema
      const parseResult = orderStatusUpdateSchema.safeParse({ orderStatus: to });
      assert.strictEqual(
        parseResult.success,
        true,
        `Admin transition from ${from} to ${to} should be schema valid`
      );
    }
  });

  it("Simulated admin payment update allows arbitrary transitions between all payment statuses", () => {
    const transitions: [string, string][] = [
      ["PENDING", "PAID"],
      ["PAID", "PENDING"],
      ["FAILED", "PAID"],
      ["PAID", "REFUNDED"],
      ["REFUNDED", "PAID"],
      ["FAILED", "REFUNDED"],
    ];

    for (const [from, to] of transitions) {
      const parseResult = orderStatusUpdateSchema.safeParse({ paymentStatus: to });
      assert.strictEqual(
        parseResult.success,
        true,
        `Admin payment transition from ${from} to ${to} should be schema valid`
      );
    }
  });

  // ─── 4. Structural Code Inspection for Strict Adherence ─────────────────
  it("admin-order-update helper does not have lifecycle state locks", () => {
    const helperCode = fs.readFileSync("src/lib/admin-order-update.ts", "utf-8");
    // Ensure no hardcoded validTransitions table that restricts admin moves
    assert(!helperCode.includes("validTransitions"), "Admin update must NOT contain validTransitions restriction table");
    // Ensure audit log is present
    assert(helperCode.includes("[ADMIN_ORDER_OVERRIDE]"), "Must include structured audit logging");
    // Ensure orderStatus and paymentStatus are decoupled
    assert(!helperCode.includes("isCodDelivered"), "Must not couple COD delivery to payment status");
  });

  it("admin orders [id] PATCH route delegates to updateOrderAsAdmin helper and enforces requireAdmin", () => {
    const routeCode = fs.readFileSync("src/app/api/admin/orders/[id]/route.ts", "utf-8");
    assert(routeCode.includes("requireAdmin"), "Must enforce requireAdmin");
    assert(routeCode.includes("updateOrderAsAdmin"), "Must delegate to updateOrderAsAdmin");
    // Ensure old restrictive check is completely gone
    assert(!routeCode.includes("validTransitions"), "Old validTransitions check must be removed");
  });

  it("admin orders list PATCH route delegates to updateOrderAsAdmin helper and enforces requireAdmin", () => {
    const routeCode = fs.readFileSync("src/app/api/admin/orders/route.ts", "utf-8");
    assert(routeCode.includes("requireAdmin"), "Must enforce requireAdmin");
    assert(routeCode.includes("updateOrderAsAdmin"), "Must delegate to updateOrderAsAdmin");
  });

  // ─── 5. UI Freedom & Unlocked Controls ──────────────────────────────────
  it("AdminOrderDetail does not disable dropdown when status is DELIVERED or CANCELLED", () => {
    const uiCode = fs.readFileSync(
      "src/app/admin/(protected)/orders/[id]/OrderDetail.tsx",
      "utf-8"
    );
    // Previously: disabled={updating === "orderStatus" || order.orderStatus === "DELIVERED" || order.orderStatus === "CANCELLED"}
    assert(
      !uiCode.includes('order.orderStatus === "DELIVERED"'),
      "Dropdown must not be disabled on DELIVERED"
    );
    assert(
      !uiCode.includes('order.orderStatus === "CANCELLED"'),
      "Dropdown must not be disabled on CANCELLED"
    );
    assert(
      !uiCode.includes('currentOrder.orderStatus === "DELIVERED"'),
      "Dropdown must not be disabled on DELIVERED"
    );
    assert(
      !uiCode.includes('currentOrder.orderStatus === "CANCELLED"'),
      "Dropdown must not be disabled on CANCELLED"
    );
    // Ensure payment status select is present
    assert(
      uiCode.includes('handleStatusChange("paymentStatus"'),
      "OrderDetail must contain editable Payment Status control"
    );
    // Ensure disclaimer note is present
    assert(
      uiCode.includes("Manual status changes do not initiate payment capture or refunds"),
      "Must include payment disclaimer note"
    );
  });

  it("AdminOrdersPage list does not divide order total rupees by 100", () => {
    const uiCode = fs.readFileSync(
      "src/app/admin/(protected)/orders/page.tsx",
      "utf-8"
    );
    // Previously: const rupees = paise / 100;
    assert(
      !uiCode.includes("paise / 100"),
      "AdminOrdersPage must not divide stored rupees by 100"
    );
    assert(
      uiCode.includes("formatINR(rupees: number)"),
      "AdminOrdersPage formatINR must take rupees directly"
    );
  });

  // ─── 6. Razorpay Claim Key Protection ───────────────────────────────────
  it("finalizePaidOrder uses razorpayPaymentId: null as claim key instead of paymentStatus != PAID", () => {
    const finalizeCode = fs.readFileSync(
      "src/lib/finalize-paid-order.ts",
      "utf-8"
    );
    assert(
      finalizeCode.includes("razorpayPaymentId: null"),
      "finalizePaidOrder must claim order using razorpayPaymentId: null"
    );
    assert(
      !finalizeCode.includes('{ not: "PAID" }'),
      "finalizePaidOrder must not gate claim on paymentStatus != PAID"
    );
  });

  it("verify route uses razorpayPaymentId to check for existing finalization", () => {
    const verifyCode = fs.readFileSync(
      "src/app/api/orders/[id]/verify/route.ts",
      "utf-8"
    );
    assert(
      verifyCode.includes("order.razorpayPaymentId"),
      "Verify route must check order.razorpayPaymentId to determine previous finalization"
    );
  });

  // ─── 7. Customer Cancellation Independence ──────────────────────────────
  it("Customer cancellation endpoint enforces strict status lifecycle constraints", () => {
    const cancelCode = fs.readFileSync(
      "src/app/api/account/orders/[id]/cancel/route.ts",
      "utf-8"
    );
    // Customers can only cancel early states, not DELIVERED or CANCELLED
    assert(
      cancelCode.includes("cancellableStatuses"),
      "Customer cancellation must maintain strict cancellable status check"
    );
    assert(
      !cancelCode.includes("updateOrderAsAdmin"),
      "Customer cancel must never use admin override helper"
    );
  });
});
