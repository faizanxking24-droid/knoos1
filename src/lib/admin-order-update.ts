import "server-only";

import { prisma } from "@/lib/db";
import { orderStatusUpdateSchema, mapZodErrors } from "@/lib/validation/admin";

export interface AdminOrderUpdateInput {
  orderId: string;
  orderStatus?: string;
  paymentStatus?: string;
}

export interface AdminOrderUpdateResult {
  success: boolean;
  order?: any;
  error?: string;
  fieldErrors?: Record<string, string>;
  status: number;
}

/**
 * Authoritative admin order update helper.
 * Admins are the final authority and may change ANY valid orderStatus or paymentStatus
 * to ANY other valid status.
 * Order status and payment status remain strictly independent controls.
 * Does NOT secretly manipulate stock, coupons, or payment gateways.
 */
export async function updateOrderAsAdmin({
  orderId,
  orderStatus,
  paymentStatus,
}: AdminOrderUpdateInput): Promise<AdminOrderUpdateResult> {
  if (!orderId || typeof orderId !== "string") {
    return {
      success: false,
      error: "Order ID is required",
      status: 400,
    };
  }

  // Validate incoming fields against canonical enums
  const parsed = orderStatusUpdateSchema.safeParse({ orderStatus, paymentStatus });
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: mapZodErrors(parsed.error),
      status: 400,
    };
  }

  const currentOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!currentOrder) {
    return {
      success: false,
      error: "Order not found",
      status: 404,
    };
  }

  const data: Record<string, string> = {};
  if (parsed.data.orderStatus !== undefined) {
    data.orderStatus = parsed.data.orderStatus;
  }
  if (parsed.data.paymentStatus !== undefined) {
    data.paymentStatus = parsed.data.paymentStatus;
  }

  if (Object.keys(data).length === 0) {
    return {
      success: false,
      error: "No valid fields to update",
      status: 400,
    };
  }

  // Structured audit log for admin manual changes (no customer PII)
  console.log(
    "[ADMIN_ORDER_OVERRIDE]",
    JSON.stringify({
      orderId,
      oldOrderStatus: currentOrder.orderStatus,
      newOrderStatus: data.orderStatus ?? currentOrder.orderStatus,
      oldPaymentStatus: currentOrder.paymentStatus,
      newPaymentStatus: data.paymentStatus ?? currentOrder.paymentStatus,
      timestamp: new Date().toISOString(),
    })
  );

  // Atomic update returning complete order with relations
  const updated = await prisma.order.update({
    where: { id: orderId },
    data,
    include: {
      items: true,
      address: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return {
    success: true,
    order: updated,
    status: 200,
  };
}
