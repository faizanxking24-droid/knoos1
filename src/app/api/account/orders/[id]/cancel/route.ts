"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { PaymentMethod } from "@/lib/constants";

/**
 * Cancels an order if it's still in a cancellable state.
 * Allowed: PENDING, PAID, PROCESSING, PACKED, SHIPPED
 * NOT allowed: DELIVERED, CANCELLED
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order || order.userId !== session.user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isCod = order.paymentMethod === PaymentMethod.COD;
    const cancellableOnline = ["PENDING", "PAID"];
    const cancellableCod = ["PROCESSING", "PACKED", "SHIPPED"];
    const cancellableStatuses = isCod ? cancellableCod : cancellableOnline;

    if (!cancellableStatuses.includes(order.orderStatus)) {
      return NextResponse.json(
        { error: `Order cannot be cancelled at this stage (${order.orderStatus}).` },
        { status: 400 }
      );
    }

    // Use conditional update to atomically check cancellable state and transition to CANCELLED
    const cancelResult = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.order.updateMany({
        where: {
          id,
          userId: session.user.id,
          AND: [
            { orderStatus: { in: cancellableStatuses } },
            { orderStatus: { not: "CANCELLED" } },
          ],
        },
        data: { orderStatus: "CANCELLED" },
      });

      if (updateResult.count === 0) {
        // Race: order was not in a cancellable state at update time
        return null;
      }

      // For COD orders: restore stock that was deducted at order placement
      if (order.paymentMethod === PaymentMethod.COD) {
        for (const item of order.items) {
          if (!item.productId) continue;

          const variant = await tx.productVariant.findFirst({
            where: { productId: item.productId, size: item.size },
          });

          if (variant) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      // For COD orders: decrement coupon usageCount since the coupon was consumed at order placement
      if (
        order.paymentMethod === PaymentMethod.COD &&
        order.couponCode
      ) {
        const coupon = await tx.coupon.findUnique({
          where: { code: order.couponCode },
        });

        if (coupon && coupon.usageCount > 0) {
          await tx.coupon.update({
            where: { code: order.couponCode },
            data: { usageCount: { decrement: 1 } },
          });
        }
      }

      return { success: true };
    });

    if (cancelResult === null) {
      return NextResponse.json(
        { error: "Order cannot be cancelled. It may have already been shipped or delivered." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
