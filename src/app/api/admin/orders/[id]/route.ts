import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { PaymentMethod } from "@/lib/constants";
import { orderStatusUpdateSchema, mapZodErrors } from "@/lib/validation/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      address: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json(order);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;
  const body = await request.json();
  const parsed = orderStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: mapZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const currentOrder = await prisma.order.findUnique({ where: { id } });
  if (!currentOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const validTransitions: Record<string, string[]> = {
    PENDING: ["PAID", "CANCELLED"],
    PAID: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["PACKED", "CANCELLED"],
    PACKED: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED", "CANCELLED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  const currentAllowed = validTransitions[currentOrder.orderStatus] || [];
  if (parsed.data.orderStatus && !currentAllowed.includes(parsed.data.orderStatus)) {
    return NextResponse.json(
      { error: `Invalid transition from ${currentOrder.orderStatus} to ${parsed.data.orderStatus}` },
      { status: 400 }
    );
  }

  const data: Record<string, string> = {};
  if (parsed.data.orderStatus) data.orderStatus = parsed.data.orderStatus;

  // For COD orders: auto-mark payment as PAID when delivered
  if (
    parsed.data.orderStatus === "DELIVERED" &&
    currentOrder.paymentMethod === PaymentMethod.COD
  ) {
    data.paymentStatus = "PAID";
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updateResult = await prisma.order.updateMany({
    where: { id, orderStatus: currentOrder.orderStatus },
    data,
  });

  if (updateResult.count === 0) {
    return NextResponse.json(
      { error: "Order status changed. Refresh and try again." },
      { status: 409 }
    );
  }

  const updated = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      address: true,
      user: { select: { name: true, email: true } },
    },
  });

  return Response.json(updated);
}
