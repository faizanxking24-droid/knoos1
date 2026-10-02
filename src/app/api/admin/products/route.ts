"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import {
  createProductSchema,
  updateProductSchema,
  productStatusSchema,
  mapZodErrors,
} from "@/lib/validation/admin";
import { Gender, ProductStatus } from "@/lib/constants";
import { buildAdminProductWhere, softDeleteProducts } from "@/lib/product-deletion";

// ─── GET: List products ──────────────────────────────────────────────────────

export async function GET(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const gender = searchParams.get("gender");
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const categoryId = searchParams.get("categoryId");

  const where = buildAdminProductWhere({
    gender,
    status,
    categoryId,
    q,
    validGenders: Object.values(Gender),
    validStatuses: Object.values(ProductStatus),
  });

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { size: "asc" } },
        categoryRel: { select: { id: true, name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return Response.json({
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

// ─── POST: Create product ────────────────────────────────────────────────────

export async function POST(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const body = await request.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: mapZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const { images, variants, ...productData } = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        ...productData,
        images: {
          create: images.map((img) => ({
            imageUrl: img.imageUrl,
            isVideo: Boolean(img.isVideo),
            sortOrder: img.sortOrder ?? 0,
          })),
        },
        variants: {
          create: variants.map((v) => ({
            size: v.size,
            stock: v.stock,
            sku: v.sku,
            price: v.price ?? 0,
            salePrice: v.salePrice ?? null,
          })),
        },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { size: "asc" } },
        categoryRel: { select: { id: true, name: true } },
      },
    });

    return Response.json(product, { status: 201 });
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

// ─── PATCH: Bulk status update ───────────────────────────────────────────────

export async function PATCH(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const body = await request.json();
  const { ids, status } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array is required" }, { status: 400 });
  }

  const parsedStatus = productStatusSchema.safeParse(status);
  if (!parsedStatus.success) {
    return NextResponse.json(
      { error: "Invalid status", fieldErrors: mapZodErrors(parsedStatus.error) },
      { status: 400 }
    );
  }

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { status: parsedStatus.data },
  });

  return Response.json({ success: true, count: ids.length, status: parsedStatus.data });
}

// ─── DELETE: Deactivate products ─────────────────────────────────────────────

export async function DELETE(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const body = await request.json();
  const { ids } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array is required" }, { status: 400 });
  }

  // Keep the row and its relations for historical orders and other business data.
  const result = await softDeleteProducts(prisma, ids);

  return Response.json({ success: true, deleted: result.count });
}
