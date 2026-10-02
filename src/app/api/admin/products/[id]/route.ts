"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { updateProductSchema, mapZodErrors } from "@/lib/validation/admin";
import { softDeleteProducts, visibleProductWhere } from "@/lib/product-deletion";

// @ts-ignore - Next.js 16 type compatibility
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: visibleProductWhere(id),
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { size: "asc" } },
      categoryRel: { select: { id: true, name: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return Response.json(product);
}

// @ts-ignore - Next.js 16 type compatibility
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;
  const existing = await prisma.product.findFirst({
    where: visibleProductWhere(id),
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateProductSchema.safeParse({ ...body, id });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: mapZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const { images, variants, ...productFields } = parsed.data;

  try {
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...productFields,
        ...(images !== undefined
          ? {
              images: {
                deleteMany: {},
                create: images.map((img) => ({
                  imageUrl: img.imageUrl,
                  isVideo: Boolean(img.isVideo),
                  sortOrder: img.sortOrder ?? 0,
                })),
              },
            }
          : {}),
        ...(variants !== undefined
          ? {
              variants: {
                deleteMany: {},
                create: variants.map((v) => ({
                  size: v.size,
                  stock: v.stock,
                  sku: v.sku,
                  price: v.price ?? 0,
                  salePrice: v.salePrice ?? null,
                })),
              },
            }
          : {}),
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { size: "asc" } },
        categoryRel: { select: { id: true, name: true } },
      },
    });

    return Response.json(updated);
  } catch (err) {
    if ((err as any).code === "P2002") {
      const target = (err as any).meta?.target;
      if (target?.includes("slug")) {
        return NextResponse.json(
          { error: "A product with this slug already exists" },
          { status: 409 }
        );
      }
      if (target?.includes("sku")) {
        return NextResponse.json(
          { error: "A product with this SKU already exists" },
          { status: 409 }
        );
      }
    }
    throw err;
  }
}

// @ts-ignore - Next.js 16 type compatibility
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;

  const result = await softDeleteProducts(prisma, [id]);
  if (result.count === 0) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return Response.json({ success: true, deleted: result.count });
}
