import "server-only";

import { prisma } from "@/lib/db";

interface FinalizePaidOrderInput {
  orderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
}

/**
 * Claims the unpaid order with one conditional update before applying side effects.
 * Only the caller that changes paymentStatus to PAID decrements stock and records coupon usage.
 */
export async function finalizePaidOrder({
  orderId,
  razorpayPaymentId,
  razorpaySignature,
}: FinalizePaidOrderInput) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Use razorpayPaymentId: null as the atomic claim condition.
    // This ensures real gateway capture / verification executes side-effects exactly once,
    // even if an admin previously adjusted paymentStatus or orderStatus.
    const nextOrderStatus = order.orderStatus === "PENDING" ? "PROCESSING" : order.orderStatus;

    const claimed = await tx.order.updateMany({
      where: { id: orderId, razorpayPaymentId: null },
      data: {
        paymentStatus: "PAID",
        orderStatus: nextOrderStatus,
        couponReservationActive: false,
        razorpayPaymentId,
        ...(razorpaySignature ? { razorpaySignature } : {}),
      },
    });

    if (claimed.count === 0) {
      return false;
    }

    for (const item of order.items) {
      if (!item.productId) continue;

      const variant = await tx.productVariant.findFirst({
        where: { productId: item.productId, size: item.size },
      });

      if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    if (order.couponCode) {
      let couponUpdate;
      if (order.couponReservationActive) {
        couponUpdate = await tx.coupon.updateMany({
          where: { code: order.couponCode, reservedCount: { gt: 0 } },
          data: { 
            usageCount: { increment: 1 },
            reservedCount: { decrement: 1 },
          },
        });
      } else {
        couponUpdate = await tx.coupon.updateMany({
          where: { code: order.couponCode },
          data: { usageCount: { increment: 1 } },
        });
      }

      if (couponUpdate.count === 0) {
        throw new Error(`Failed to update usage count for coupon ${order.couponCode}`);
      }
    }

    if (order.checkoutMode === "CART") {
      await tx.cart.deleteMany({ where: { userId: order.userId } });
    }
    return true;
  });
}
