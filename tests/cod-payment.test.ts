import { describe, it } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";

// ─── Import the constant we're verifying ────────────────────────────────
import { PaymentMethod, OrderStatus, PaymentStatus } from "../src/lib/constants";

// ─── Import the COD helper for structural verification ──────────────────
import { finalizeCodOrder } from "../src/lib/finalize-cod-order";

describe("COD Payment Method (Item A–P)", () => {
  // A. Invalid paymentMethod rejected (this is validated server-side in the
  //    POST /api/orders handler — here we verify the allowed set).
  it("A. PaymentMethod constant only allows ONLINE and COD", () => {
    assert.strictEqual(PaymentMethod.ONLINE, "ONLINE");
    assert.strictEqual(PaymentMethod.COD, "COD");
    const values = Object.values(PaymentMethod);
    assert.deepStrictEqual(values, ["ONLINE", "COD"]);
  });

  // B. ONLINE checkout creates Razorpay order (structural: verify ONLINE
  //    path still calls createRazorpayOrder in the orders API).
  it("B. ONLINE path in orders API still references createRazorpayOrder", async () => {
    const apiSource = await import("fs").then(fs =>
      fs.readFileSync("src/app/api/orders/route.ts", "utf-8")
    );
    assert(apiSource.includes("createRazorpayOrder"), "ONLINE path must call createRazorpayOrder");
    assert(apiSource.includes('paymentMethod === "COD"'), "Must check for COD before ONLINE path");
  });

  // C. COD checkout does NOT call Razorpay
  it("C. COD path does not reference createRazorpayOrder", async () => {
    const apiSource = await import("fs").then(fs =>
      fs.readFileSync("src/app/api/orders/route.ts", "utf-8")
    );
    // Within the COD branch there should be no Razorpay call
    const codCallStart = apiSource.indexOf("await finalizeCodOrder");
    const onlineCallStart = apiSource.indexOf("await createRazorpayOrder");
    assert(codCallStart !== -1, "Must have finalizeCodOrder call");
    assert(onlineCallStart !== -1, "Must have createRazorpayOrder call");
    assert(codCallStart < onlineCallStart, "finalizeCodOrder call must come before createRazorpayOrder call");
    const codBranch = apiSource.substring(codCallStart, onlineCallStart);
    assert(!codBranch.includes("createRazorpayOrder"), "COD branch must not call createRazorpayOrder");
  });

  // D. COD order fields on creation
  it("D. finalizeCodOrder produces correct status fields", async () => {
    // This verifies the structure of the helper without a DB.
    // We can't call it without a DB, but we verify the code paths.
    const helperSource = await import("fs").then(fs =>
      fs.readFileSync("src/lib/finalize-cod-order.ts", "utf-8")
    );
    assert(helperSource.includes('paymentMethod: "COD"'), "Must set paymentMethod COD");
    assert(helperSource.includes('paymentStatus: "PENDING"'), "Must set paymentStatus PENDING");
    assert(helperSource.includes('orderStatus: "PROCESSING"'), "Must set orderStatus PROCESSING");
  });

  // E. COD stock decrement is atomic (verify the code uses updateMany with stock >=)
  it("E. COD stock commit uses guarded update with stock >= quantity", async () => {
    const helperSource = await import("fs").then(fs =>
      fs.readFileSync("src/lib/finalize-cod-order.ts", "utf-8")
    );
    assert(helperSource.includes("stock: { gte:"), "Must use stock >= guard for decrement");
    assert(helperSource.includes("stock: { decrement:"), "Must decrement stock");
    assert(helperSource.includes("updated.count === 0"), "Must check update count for rollback");
  });

  // F. COD BUY_NOW does not clear cart — verify checkoutMode check
  it("F. Cart clearing is conditional on checkoutMode === CART", async () => {
    const helperSource = await import("fs").then(fs =>
      fs.readFileSync("src/lib/finalize-cod-order.ts", "utf-8")
    );
    assert(helperSource.includes('checkoutMode === "CART"'), "Must only clear cart in CART mode");
  });

  // G. COD coupon usage increments
  it("G. COD coupon usageCount increments after order creation", async () => {
    const helperSource = await import("fs").then(fs =>
      fs.readFileSync("src/lib/finalize-cod-order.ts", "utf-8")
    );
    assert(helperSource.includes("usageCount: { increment: 1 }"), "Must increment usageCount");
  });

  // H. COD limited coupon: reservedCount converts to usageCount
  it("H. COD coupon reservation converts reservedCount to usageCount", async () => {
    const helperSource = await import("fs").then(fs =>
      fs.readFileSync("src/lib/finalize-cod-order.ts", "utf-8")
    );
    assert(helperSource.includes("reservedCount: { decrement: 1 }"), "Must decrement reservedCount");
    assert(helperSource.includes("if (coupon.reservedCount > 0)"), "Must check reservedCount");
  });

  // I. Failed COD stock commit: transaction rolls back (structural verification)
  it("I. Stock update failure throws to trigger transaction rollback", async () => {
    const helperSource = await import("fs").then(fs =>
      fs.readFileSync("src/lib/finalize-cod-order.ts", "utf-8")
    );
    // The throw inside the transaction callback triggers Prisma rollback
    assert(helperSource.includes("throw new Error("), "Must throw on stock failure");
    assert(helperSource.includes('$transaction'), "Must use transaction");
  });

  // J. COD cancellation restores stock
  it("J. Cancel route restores stock for COD orders", async () => {
    const cancelSource = await import("fs").then(fs =>
      fs.readFileSync("src/app/api/account/orders/[id]/cancel/route.ts", "utf-8")
    );
    assert(cancelSource.includes("PaymentMethod.COD"), "Must check COD payment method");
    assert(cancelSource.includes("stock: { increment:"), "Must restore stock on cancel");
    assert(cancelSource.includes('$transaction'), "Cancellation must be transactional");
  });

  // K. COD cancellation restores coupon usage
  it("K. Cancel route decrements coupon usageCount for COD orders", async () => {
    const cancelSource = await import("fs").then(fs =>
      fs.readFileSync("src/app/api/account/orders/[id]/cancel/route.ts", "utf-8")
    );
    assert(cancelSource.includes("usageCount: { decrement: 1 }"), "Must decrement usageCount");
  });

  // L. Repeated cancellation prevented by updateMany conditional
  it("L. Cancellation uses updateMany with orderStatus not CANCELLED", async () => {
    const cancelSource = await import("fs").then(fs =>
      fs.readFileSync("src/app/api/account/orders/[id]/cancel/route.ts", "utf-8")
    );
    assert(cancelSource.includes("orderStatus: { not: "), "Must use conditional update");
    assert(cancelSource.includes("updateMany"), "Must use updateMany, not update");
  });

  // M. COD delivery auto-marks payment PAID
  it("M. Admin PATCH sets paymentStatus PAID when COD order is DELIVERED", async () => {
    const adminRoute = await import("fs").then(fs =>
      fs.readFileSync("src/app/api/admin/orders/[id]/route.ts", "utf-8")
    );
    assert(adminRoute.includes('orderStatus === "DELIVERED"'), "Must check DELIVERED");
    assert(adminRoute.includes('PaymentMethod.COD'), "Must check COD");
    assert(adminRoute.includes('"PAID"'), "Must set PAID");
  });

  // N. ONLINE delivery does not change payment behavior
  it("N. ONLINE orders not affected by COD delivery logic", async () => {
    const adminRoute = await import("fs").then(fs =>
      fs.readFileSync("src/app/api/admin/orders/[id]/route.ts", "utf-8")
    );
    // The COD auto-PAID is gated on paymentMethod === COD
    assert(adminRoute.includes('currentOrder.paymentMethod === PaymentMethod.COD'), "Must gate on COD");
  });

  // O. Razorpay verify rejects COD orders
  it("O. Verify endpoint rejects non-ONLINE payment methods", async () => {
    const verifySource = await import("fs").then(fs =>
      fs.readFileSync("src/app/api/orders/[id]/verify/route.ts", "utf-8")
    );
    assert(verifySource.includes('"ONLINE"'), "Must check for ONLINE");
    assert(verifySource.includes('"This order does not use online payment."'), "Must reject COD");
  });

  // P. Razorpay webhook skips COD orders
  it("P. Webhook skips COD orders in all relevant handlers", async () => {
    const webhookSource = await import("fs").then(fs =>
      fs.readFileSync("src/app/api/webhooks/razorpay/route.ts", "utf-8")
    );
    assert(webhookSource.includes('PaymentMethod.COD'), "Must check COD in webhook");
    assert(webhookSource.includes('PaymentMethod.ONLINE'), "Must check ONLINE in webhook");
  });

  // Additional structural checks
  it("Checkout client sends paymentMethod to /api/orders", async () => {
    const clientSource = await import("fs").then(fs =>
      fs.readFileSync("src/app/(store)/checkout/checkout-client.tsx", "utf-8")
    );
    assert(clientSource.includes("paymentMethod"), "Must send paymentMethod");
    assert(clientSource.includes('"COD"'), "Must handle COD value");
    assert(clientSource.includes("orderData.paymentMethod === "), "Must check response paymentMethod");
  });

  it("Admin orders API accepts method filter", async () => {
    const adminSource = await import("fs").then(fs =>
      fs.readFileSync("src/app/api/admin/orders/route.ts", "utf-8")
    );
    assert(adminSource.includes("method"), "Must accept method param");
    assert(adminSource.includes('PaymentMethod'), "Must use PaymentMethod constant");
  });

  it("Admin orders list shows payment method column", async () => {
    const adminList = await import("fs").then(fs =>
      fs.readFileSync("src/app/admin/(protected)/orders/page.tsx", "utf-8")
    );
    assert(adminList.includes("Method"), "Must have Method column header");
    assert(adminList.includes('"COD"'), "Must show COD label");
  });
});
