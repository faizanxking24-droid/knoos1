import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@/lib/constants";
import { orderStatusUpdateSchema, mapZodErrors } from "@/lib/validation/admin";

export async function GET(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const payment = searchParams.get("payment");
  const method = searchParams.get("method");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const q = searchParams.get("q");

  const where: Record<string, unknown> = {};
  if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
    where.orderStatus = status;
  }
  if (payment && Object.values(PaymentStatus).includes(payment as PaymentStatus)) {
    where.paymentStatus = payment;
  }
  if (method && Object.values(PaymentMethod).includes(method as PaymentMethod)) {
    where.paymentMethod = method;
  }
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { razorpayOrderId: { contains: q } },
      { razorpayPaymentId: { contains: q } },
      { user: { email: { contains: q } } },
      { user: { name: { contains: q } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        items: true,
        user: { select: { name: true, email: true, image: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return Response.json({
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function PATCH(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const parsed = orderStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: mapZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const data: Record<string, string> = {};
  if (parsed.data.orderStatus) data.orderStatus = parsed.data.orderStatus;
  if (parsed.data.paymentStatus) data.paymentStatus = parsed.data.paymentStatus;

  const updated = await prisma.order.update({
    where: { id },
    data,
    include: { items: true, user: { select: { name: true, email: true } } },
  });

  return Response.json(updated);
}
