"use server";

import { prisma } from "@/lib/db";
import { CouponValidationError } from "@/lib/coupon";
import { validateCouponForSubtotal } from "@/lib/coupon-service";
import { calculateFinalTotal } from "@/lib/coupon";

interface CodOrderInput {
  userId: string;
  subtotal: number;
  couponCode: string | null;
  deliveryCharge: number;
  deliveryMethod: string;
  checkoutMode: "CART" | "BUY_NOW";
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  itemsToCreate: Array<{
    productId: string;
    productName: string;
    size: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  inventoryToCommit: Array<{ variantId: string; quantity: number }>;
}

interface CodOrderResult {
  success: boolean;
  orderId: string;
  paymentMethod: "COD";
  paymentStatus: "PENDING";
  orderStatus: "PROCESSING";
  total: number;
  discountAmount: number;
  couponCode: string | null;
}

/**
 * Finalizes a COD order: creates the order, commits stock, consumes coupon, clears cart.
 * All side-effects run inside a single transaction.
 */
export async function finalizeCodOrder(
  input: CodOrderInput
): Promise<CodOrderResult> {
  return prisma.$transaction(async (tx) => {
    // 1. Re-validate coupon inside the transaction (authoritative)
    let couponApplication = null;
    if (input.couponCode?.trim()) {
      try {
        couponApplication = await validateCouponForSubtotal(
          input.couponCode,
          input.subtotal
        );
      } catch (error) {
        if (error instanceof CouponValidationError) {
          throw error;
        }
        throw new Error("Unable to validate coupon right now");
      }
    }

    const effectiveCouponCode = couponApplication?.code ?? input.couponCode;
    const discountAmount = couponApplication?.discountAmount ?? 0;
    const total = calculateFinalTotal(input.subtotal, discountAmount, input.deliveryCharge);

    // 2. Atomically commit stock for all items
    for (const inv of input.inventoryToCommit) {
      const updated = await tx.productVariant.updateMany({
        where: {
          id: inv.variantId,
          stock: { gte: inv.quantity },
        },
        data: {
          stock: { decrement: inv.quantity },
        },
      });

      if (updated.count === 0) {
        // Find the variant name for the error message
        const variant = await tx.productVariant.findUnique({
          where: { id: inv.variantId },
          include: { product: { select: { name: true } } },
        });
        const productName = variant?.product?.name ?? "Product";
        const size = variant?.size ?? "?";
        throw new Error(
          `Insufficient stock for ${productName} (size ${size}). Only ${variant?.stock ?? 0} remaining.`
        );
      }
    }

    // 3. Create the order
    const order = await tx.order.create({
      data: {
        userId: input.userId,
        subtotal: input.subtotal,
        couponCode: effectiveCouponCode,
        discountAmount,
        couponReservationActive: false,
        deliveryCharge: input.deliveryCharge,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        orderStatus: "PROCESSING",
        total,
        deliveryMethod: input.deliveryMethod,
        checkoutMode: input.checkoutMode,
        items: {
          create: input.itemsToCreate,
        },
        address: {
          create: {
            name: input.fullName,
            phone: input.phone,
            address: input.addressLine1,
            city: input.city,
            state: input.state,
            pincode: input.pincode,
          },
        },
      },
    });

    // 4. Finalize coupon usage (reservedCount -> usageCount)
    if (effectiveCouponCode) {
      const coupon = await tx.coupon.findUnique({
        where: { code: effectiveCouponCode },
      });

      if (coupon) {
        if (coupon.reservedCount > 0) {
          // Reservation was active: convert reservation to usage
          await tx.coupon.update({
            where: { code: effectiveCouponCode },
            data: {
              usageCount: { increment: 1 },
              reservedCount: { decrement: 1 },
            },
          });
        } else {
          // No reservation: just increment usage
          await tx.coupon.update({
            where: { code: effectiveCouponCode },
            data: {
              usageCount: { increment: 1 },
            },
          });
        }
      }
    }

    // 5. Clear cart for CART mode only (BUY_NOW preserves cart)
    if (input.checkoutMode === "CART") {
      await tx.cart.deleteMany({ where: { userId: input.userId } });
    }

    return {
      success: true,
      orderId: order.id,
      paymentMethod: "COD" as const,
      paymentStatus: "PENDING" as const,
      orderStatus: "PROCESSING" as const,
      total,
      discountAmount,
      couponCode: effectiveCouponCode,
    };
  });
}
