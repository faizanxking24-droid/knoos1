import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildInvoiceNumber,
  buildInvoiceData,
  formatInvoiceINR,
  type RawOrderSnapshot,
} from "../src/lib/order-invoice";
import { INVOICE_BUSINESS_CONFIG } from "../src/lib/invoice-config";

describe("KNOOS Invoice & Bill System", () => {
  // 1. INVOICE NUMBER FORMAT & DETERMINISM
  describe("Invoice Number Generation", () => {
    test("generates stable, deterministic invoice numbers with INV-KNOOS prefix", () => {
      const orderId1 = "cmujtak0a0001xyz123";
      const invoiceNum1 = buildInvoiceNumber(orderId1);
      const invoiceNum2 = buildInvoiceNumber(orderId1);

      assert.equal(invoiceNum1, invoiceNum2, "Same order must produce identical invoice number");
      assert.match(invoiceNum1, /^INV-KNOOS-[A-Z0-9]{8}$/);
      assert.equal(invoiceNum1, "INV-KNOOS-CMUJTAK0");
    });

    test("handles short order IDs gracefully with uppercase deterministic padding", () => {
      const shortId = "abc1";
      const invoiceNum = buildInvoiceNumber(shortId);
      assert.equal(invoiceNum, "INV-KNOOS-ABC10000");
    });
  });

  // 2. CURRENCY FORMATTING (WHOLE INR RUPEES)
  describe("INR Currency Formatting", () => {
    test("formats whole INR rupees without dividing by 100", () => {
      assert.equal(formatInvoiceINR(2499).replace(/\s/g, ""), "₹2,499");
      assert.equal(formatInvoiceINR(100).replace(/\s/g, ""), "₹100");
      assert.equal(formatInvoiceINR(2350).replace(/\s/g, ""), "₹2,350");
      assert.equal(formatInvoiceINR(0).replace(/\s/g, ""), "₹0");
    });
  });

  // 3. CALCULATION SPEC TEST
  describe("Calculation Invariant & Financial Snapshot Display", () => {
    test("Invoice matches exact prompt calculation scenario: 2500 - 250 + 100 = 2350", () => {
      const mockOrder: RawOrderSnapshot = {
        id: "cmujtak0a0001calc999",
        userId: "cust_123",
        createdAt: new Date("2026-09-30T10:00:00Z"),
        subtotal: 2500,
        couponCode: "SAVE10",
        discountAmount: 250,
        deliveryCharge: 100,
        total: 2350,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        orderStatus: "DELIVERED",
        razorpayOrderId: "order_rp_123",
        razorpayPaymentId: "pay_rp_456",
        user: {
          name: "Faizan King",
          email: "faizan@example.com",
          phone: "9876543210",
        },
        address: {
          name: "Faizan King",
          phone: "9876543210",
          address: "123 Fashion Street",
          city: "Agra",
          state: "Uttar Pradesh",
          pincode: "282001",
        },
        items: [
          {
            id: "item_a",
            productName: "Shoe A",
            size: "8",
            quantity: 2,
            price: 1000,
            total: 2000,
          },
          {
            id: "item_b",
            productName: "Shoe B",
            size: "9",
            quantity: 1,
            price: 500,
            total: 500,
          },
        ],
      };

      const invoice = buildInvoiceData(mockOrder);

      // Financial values
      assert.equal(invoice.subtotal, 2500);
      assert.equal(invoice.discountAmount, 250);
      assert.equal(invoice.couponCode, "SAVE10");
      assert.equal(invoice.deliveryCharge, 100);
      assert.equal(invoice.total, 2350);

      // Formatted representations
      assert.equal(formatInvoiceINR(invoice.subtotal).replace(/\s/g, ""), "₹2,500");
      assert.equal(formatInvoiceINR(invoice.discountAmount).replace(/\s/g, ""), "₹250");
      assert.equal(formatInvoiceINR(invoice.deliveryCharge).replace(/\s/g, ""), "₹100");
      assert.equal(formatInvoiceINR(invoice.total).replace(/\s/g, ""), "₹2,350");

      // Items snapshot
      assert.equal(invoice.items.length, 2);
      assert.equal(invoice.items[0].productName, "Shoe A");
      assert.equal(invoice.items[0].quantity, 2);
      assert.equal(invoice.items[0].unitPrice, 1000);
      assert.equal(invoice.items[0].total, 2000);
      assert.equal(invoice.items[1].productName, "Shoe B");
      assert.equal(invoice.items[1].unitPrice, 500);
      assert.equal(invoice.items[1].total, 500);
    });
  });

  // 4. HISTORICAL SNAPSHOT TEST
  describe("Historical Snapshot Integrity", () => {
    test("Invoice uses snapshot values and does not depend on current product state", () => {
      const historicalOrder: RawOrderSnapshot = {
        id: "cmujtak0a0001hist111",
        userId: "cust_hist",
        createdAt: new Date("2026-01-15T08:30:00Z"),
        subtotal: 1999,
        discountAmount: 0,
        couponCode: null,
        deliveryCharge: 0,
        total: 1999,
        paymentMethod: "COD",
        paymentStatus: "PAID",
        orderStatus: "DELIVERED",
        address: {
          name: "Original Recipient",
          phone: "7088808882",
          address: "Old Address Line 1",
          city: "Agra",
          state: "Uttar Pradesh",
          pincode: "282010",
        },
        items: [
          {
            id: "hist_item_1",
            productName: "Vintage Leather Oxford (Archived)",
            size: "10",
            quantity: 1,
            price: 1999,
            total: 1999,
          },
        ],
      };

      const invoice = buildInvoiceData(historicalOrder);

      assert.equal(invoice.items[0].productName, "Vintage Leather Oxford (Archived)");
      assert.equal(invoice.items[0].unitPrice, 1999);
      assert.equal(invoice.deliveryAddress?.address, "Old Address Line 1");
      assert.equal(invoice.deliveryAddress?.recipientName, "Original Recipient");
    });
  });

  // 5. MOBILE-ONLY CUSTOMER WITH NULL EMAIL
  describe("Mobile-Only Customer Support", () => {
    test("renders correctly when customer email is null without printing 'null' or 'undefined'", () => {
      const mobileOnlyOrder: RawOrderSnapshot = {
        id: "cmujtak0a0001mob001",
        userId: "phone_user_1",
        createdAt: new Date("2026-09-30T11:00:00Z"),
        subtotal: 1200,
        discountAmount: 0,
        deliveryCharge: 100,
        total: 1300,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        orderStatus: "PROCESSING",
        user: {
          name: "Mobile Shopper",
          email: null,
          phone: "9876543210",
        },
        address: {
          name: "Mobile Shopper",
          phone: "9876543210",
          address: "Shop 12, Market Rd",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
        },
        items: [
          {
            id: "item_mob",
            productName: "Sneaker Flow",
            size: "8",
            quantity: 1,
            price: 1200,
            total: 1200,
          },
        ],
      };

      const invoice = buildInvoiceData(mobileOnlyOrder);

      assert.equal(invoice.customer.email, null);
      assert.notEqual(invoice.customer.email, "null");
      assert.notEqual(invoice.customer.email, "undefined");
      assert.equal(invoice.customer.name, "Mobile Shopper");
      assert.equal(invoice.customer.phone, "9876543210");
    });
  });

  // 6. CANCELLED ORDER SUPPORT
  describe("Cancelled Order Handling", () => {
    test("keeps invoice accessible with CANCELLED status displayed", () => {
      const cancelledOrder: RawOrderSnapshot = {
        id: "cmujtak0a0001canc001",
        createdAt: new Date("2026-09-30T09:00:00Z"),
        subtotal: 3000,
        discountAmount: 0,
        deliveryCharge: 100,
        total: 3100,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        orderStatus: "CANCELLED",
        items: [],
      };

      const invoice = buildInvoiceData(cancelledOrder);

      assert.equal(invoice.orderStatus, "CANCELLED");
      assert.equal(invoice.orderStatusLabel, "Cancelled");
      assert.equal(invoice.total, 3100);
    });
  });

  // 7. REFUNDED ORDER SUPPORT
  describe("Refunded Order Handling", () => {
    test("displays Refunded status without modifying authoritative total", () => {
      const refundedOrder: RawOrderSnapshot = {
        id: "cmujtak0a0001ref001",
        createdAt: new Date("2026-09-30T09:00:00Z"),
        subtotal: 4500,
        discountAmount: 500,
        couponCode: "SUPER500",
        deliveryCharge: 0,
        total: 4000,
        paymentMethod: "ONLINE",
        paymentStatus: "REFUNDED",
        orderStatus: "CANCELLED",
        razorpayOrderId: "order_refund_123",
        razorpayPaymentId: "pay_refund_456",
        items: [],
      };

      const invoice = buildInvoiceData(refundedOrder);

      assert.equal(invoice.paymentStatus, "REFUNDED");
      assert.equal(invoice.paymentStatusLabel, "Refunded");
      assert.equal(invoice.total, 4000);
    });
  });

  // 8. COD ORDER SUPPORT
  describe("COD Order Handling", () => {
    test("displays Cash on Delivery and accurate collection status", () => {
      const codOrder: RawOrderSnapshot = {
        id: "cmujtak0a0001cod001",
        createdAt: new Date("2026-09-30T09:00:00Z"),
        subtotal: 1500,
        discountAmount: 0,
        deliveryCharge: 100,
        total: 1600,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        orderStatus: "SHIPPED",
        items: [],
      };

      const invoice = buildInvoiceData(codOrder);

      assert.equal(invoice.paymentMethod, "COD");
      assert.equal(invoice.paymentMethodLabel, "Cash on Delivery");
      assert.equal(invoice.paymentStatus, "PENDING");
      assert.equal(invoice.paymentStatusLabel, "Pending");
    });
  });

  // 9. ONLINE ORDER & RAZORPAY IDS
  describe("Online Order & Gateway ID Handling", () => {
    test("displays gateway IDs for online orders and does not expose secrets", () => {
      const onlineOrder: RawOrderSnapshot = {
        id: "cmujtak0a0001onl001",
        createdAt: new Date("2026-09-30T09:00:00Z"),
        subtotal: 2500,
        deliveryCharge: 0,
        total: 2500,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        orderStatus: "PACKED",
        razorpayOrderId: "order_ABC123456",
        razorpayPaymentId: "pay_XYZ987654",
        items: [],
      };

      const invoice = buildInvoiceData(onlineOrder);

      assert.equal(invoice.paymentMethodLabel, "Online Payment");
      assert.equal(invoice.razorpayOrderId, "order_ABC123456");
      assert.equal(invoice.razorpayPaymentId, "pay_XYZ987654");
      // @ts-expect-error Ensure secrets are never part of InvoiceData type
      assert.equal(invoice.razorpaySignature, undefined);
    });
  });

  // 10. MISSING RAZORPAY IDS
  describe("Missing Razorpay IDs Safety", () => {
    test("does not crash when online order has null Razorpay IDs", () => {
      const nullGatewayOrder: RawOrderSnapshot = {
        id: "cmujtak0a0001null001",
        createdAt: new Date("2026-09-30T09:00:00Z"),
        subtotal: 999,
        deliveryCharge: 100,
        total: 1099,
        paymentMethod: "ONLINE",
        paymentStatus: "FAILED",
        orderStatus: "PENDING",
        razorpayOrderId: null,
        razorpayPaymentId: null,
        items: [],
      };

      const invoice = buildInvoiceData(nullGatewayOrder);

      assert.equal(invoice.razorpayOrderId, null);
      assert.equal(invoice.razorpayPaymentId, null);
      assert.equal(invoice.paymentStatusLabel, "Failed");
    });
  });

  // 11. BUSINESS DETAILS SANITY
  describe("Invoice Business Details", () => {
    test("business config contains required KNOOS information", () => {
      assert.equal(INVOICE_BUSINESS_CONFIG.businessName, "KNOOS");
      assert.equal(INVOICE_BUSINESS_CONFIG.legalEntityName, "KRIPA KIRAN SHOE COMPANY");
      assert.ok(INVOICE_BUSINESS_CONFIG.supportEmail.includes("@"));
      assert.ok(INVOICE_BUSINESS_CONFIG.supportPhone.replace(/\D/g, "").includes("7088808882"));
      assert.ok(INVOICE_BUSINESS_CONFIG.businessAddress.includes("Agra"));
    });
  });

  // 12. SECURITY & AUTHORIZATION SIMULATION
  describe("Security & Ownership Verification Logic", () => {
    const mockDbOrders = [
      {
        id: "order_alice_1",
        userId: "user_alice",
        total: 1000,
        subtotal: 1000,
        deliveryCharge: 0,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
        createdAt: new Date(),
        items: [],
      },
      {
        id: "order_bob_1",
        userId: "user_bob",
        total: 2000,
        subtotal: 2000,
        deliveryCharge: 0,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        orderStatus: "DELIVERED",
        createdAt: new Date(),
        items: [],
      },
    ];

    // Customer query simulation: where { id: orderId, userId: sessionUserId }
    function simulateCustomerInvoiceQuery(orderId: string, sessionUserId: string | null) {
      if (!sessionUserId) return null; // unauthenticated
      const order = mockDbOrders.find((o) => o.id === orderId && o.userId === sessionUserId);
      if (!order) return null;
      return buildInvoiceData(order);
    }

    // Admin query simulation: where { id: orderId } (after requireAdmin check)
    function simulateAdminInvoiceQuery(orderId: string, userRole: string | null) {
      if (userRole !== "ADMIN") return null; // forbidden
      const order = mockDbOrders.find((o) => o.id === orderId);
      if (!order) return null;
      return buildInvoiceData(order);
    }

    test("1. Customer can access their own invoice", () => {
      const invoice = simulateCustomerInvoiceQuery("order_alice_1", "user_alice");
      assert.ok(invoice);
      assert.equal(invoice.orderId, "order_alice_1");
    });

    test("2. Customer cannot access another customer's invoice", () => {
      // Bob tries to access Alice's order
      const invoice = simulateCustomerInvoiceQuery("order_alice_1", "user_bob");
      assert.equal(invoice, null, "Should return null (leading to safe 404 in UI)");
    });

    test("3. Unauthenticated customer gets denied", () => {
      const invoice = simulateCustomerInvoiceQuery("order_alice_1", null);
      assert.equal(invoice, null, "Unauthenticated access must be denied");
    });

    test("4. Admin can access any invoice", () => {
      const invoiceAlice = simulateAdminInvoiceQuery("order_alice_1", "ADMIN");
      const invoiceBob = simulateAdminInvoiceQuery("order_bob_1", "ADMIN");

      assert.ok(invoiceAlice);
      assert.equal(invoiceAlice.orderId, "order_alice_1");

      assert.ok(invoiceBob);
      assert.equal(invoiceBob.orderId, "order_bob_1");
    });

    test("5. Non-admin cannot use admin invoice query", () => {
      const invoice = simulateAdminInvoiceQuery("order_alice_1", "CUSTOMER");
      assert.equal(invoice, null, "Non-admin must be denied");
    });
  });
});
