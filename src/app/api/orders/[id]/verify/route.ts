import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { PaymentMethod } from "@/lib/constants";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { finalizePaidOrder } from "@/lib/finalize-paid-order";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const { id } = resolvedParams;
  const body = await request.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing Razorpay details" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id, userId: session.user.id },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  if (order.paymentMethod !== "ONLINE") {
    return NextResponse.json({ error: "This order does not use online payment." }, { status: 400 });
  }

  // Already marked as PAID via webhook or previous call
  if (order.paymentStatus === "PAID") {
    if (order.checkoutMode === "CART") {
      await prisma.cart.deleteMany({ where: { userId: session.user.id } });
    }
    return NextResponse.json({ success: true, orderId: order.id });
  }

  const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 401 });
  }

  try {
    await finalizePaidOrder({
      orderId: order.id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json({ error: "Error processing payment confirmation" }, { status: 500 });
  }
}
