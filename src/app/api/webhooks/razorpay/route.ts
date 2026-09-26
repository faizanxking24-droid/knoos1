import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { prisma } from "@/lib/db";
import { PaymentMethod } from "@/lib/constants";
import { finalizePaidOrder } from "@/lib/finalize-paid-order";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const { event: eventType, payload } = event;

  switch (eventType) {
    case "payment.captured": {
      const payment = payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      const order = await prisma.order.findFirst({
        where: { razorpayOrderId },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Only finalize online orders via webhook
      if (order.paymentMethod === PaymentMethod.COD) {
        return NextResponse.json({ received: true });
      }

      await finalizePaidOrder({
        orderId: order.id,
        razorpayPaymentId,
      });

      return NextResponse.json({ received: true });
    }

    case "payment.failed": {
      const payment = payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      const order = await prisma.order.findFirst({ where: { razorpayOrderId } });
      if (order && order.paymentMethod === PaymentMethod.ONLINE && order.paymentStatus !== "PAID") {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "FAILED" },
        });
      }
      return NextResponse.json({ received: true });
    }

    case "order.paid": {
      const orderEntity = payload.order.entity;
      const razorpayOrderId = orderEntity.id;

      const order = await prisma.order.findFirst({ where: { razorpayOrderId } });
      if (order && order.paymentMethod === PaymentMethod.ONLINE && order.paymentStatus !== "PAID") {
         await prisma.order.update({
           where: { id: order.id },
           data: { orderStatus: "PROCESSING" },
         });
      }
      return NextResponse.json({ received: true });
    }

    default:
      return NextResponse.json({ received: true });
  }
}
