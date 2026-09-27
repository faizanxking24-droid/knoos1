"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id: id, userId: session.user.id },
    include: {
      items: {
        select: {
          id: true,
          orderId: true,
          productId: true,
          productName: true,
          size: true,
          quantity: true,
          price: true,
          total: true,
        },
      },
      address: true,
    },
  });

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json(order);
}