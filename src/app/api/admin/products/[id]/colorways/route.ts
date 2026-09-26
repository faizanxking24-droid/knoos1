"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { newColorwaySchema } from "@/lib/validation/colorway";

// ─── GET: List all colorways (siblings) for a product ───────────────────────

// @ts-ignore - Next.js 16 type compatibility
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;

  const sourceProduct = await prisma.product.findUnique({
    where: { id },
    select: { colorGroupKey: true },
  });

  if (!sourceProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let colorways: any[];

  if (sourceProduct.colorGroupKey) {
    colorways = await prisma.product.findMany({
      where: { colorGroupKey: sourceProduct.colorGroupKey },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { imageUrl: true } },
        variants: { select: { id: true } },
      },
    });
  } else {
    colorways = await prisma.product.findMany({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { imageUrl: true } },
        variants: { select: { id: true } },
      },
    });
  }

  // Order: source product first, then others
  colorways.sort((a: any, b: any) => (a.id === id ? -1 : b.id === id ? 1 : 0));

  const formatted = colorways.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    color: p.color,
    sku: p.sku,
    status: p.status,
    colorGroupKey: p.colorGroupKey,
    image: p.images[0]?.imageUrl ?? null,
    variantCount: p.variants.length,
    price: p.price,
    salePrice: p.salePrice,
    isCurrent: p.id === id,
  }));

  return Response.json({ colorways: formatted });
}

// ─── POST: Create a new colorway ─────────────────────────────────────────────

// @ts-ignore - Next.js 16 type compatibility
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;
  const body = await request.json();
  const parsed = newColorwaySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: mapZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const { color, name, slug, sku } = parsed.data;
  const trimmedColor = color.trim();
  const trimmedSlug = slug.trim().toLowerCase();
  const trimmedSku = sku.trim();
  const trimmedName = name.trim();

  const sourceProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { size: "asc" } },
    },
  });

  if (!sourceProduct) {
    return NextResponse.json({ error: "Source product not found" }, { status: 404 });
  }

  // Determine or create the group key
  let groupKey = sourceProduct.colorGroupKey;

  if (!groupKey) {
    groupKey = `color-group-${sourceProduct.id}`;
  }

  // Check for duplicate color within the group (case-insensitive)
  const allGroupProducts = await prisma.product.findMany({
    where: { colorGroupKey: groupKey, NOT: { id } },
    select: { color: true },
  });
  const hasDuplicateColor = allGroupProducts.some(
    (p: any) => p.color && p.color.toLowerCase() === trimmedColor.toLowerCase()
  );

  if (hasDuplicateColor) {
    return NextResponse.json(
      { error: `"${trimmedColor}" already exists in this product family.` },
      { status: 409 }
    );
  }

  // Check SKU uniqueness
  const skuExists = await prisma.product.findUnique({
    where: { sku: trimmedSku },
  });

  if (skuExists) {
    return NextResponse.json(
      { error: "A product with this SKU already exists" },
      { status: 409 }
    );
  }

  // Check slug uniqueness
  const slugExists = await prisma.product.findUnique({
    where: { slug: trimmedSlug },
  });

  if (slugExists) {
    return NextResponse.json(
      { error: "A product with this slug already exists" },
      { status: 409 }
    );
  }

  // Check variant SKU uniqueness (new product SKU + size)
  const sourceSizes = sourceProduct.variants.map((v: any) => v.size);
  const potentialVariantSkus: string[] = sourceSizes.map((s: string) => `${trimmedSku}-${s}`);
  const conflictingVariantSkus = await prisma.productVariant.findMany({
    where: { sku: { in: potentialVariantSkus } },
    select: { sku: true },
  });

  if (conflictingVariantSkus.length > 0) {
    return NextResponse.json(
      {
        error: `Variant SKU conflict: ${conflictingVariantSkus.map((v: any) => v.sku).join(", ")} already exists`,
      },
      { status: 409 }
    );
  }

  try {
    // @ts-ignore - Prisma transaction callback type inference
    const result = await prisma.$transaction(async (tx: any) => {
      // If source product has no group, assign it
      if (!sourceProduct.colorGroupKey) {
        await tx.product.update({
          where: { id: sourceProduct.id },
          data: { colorGroupKey: groupKey },
        });
      }

      // Create the new colorway product
      const newProduct = await tx.product.create({
        data: {
          name: trimmedName,
          slug: trimmedSlug,
          color: trimmedColor,
          sku: trimmedSku,
          colorGroupKey: groupKey,
          status: "INACTIVE",
          description: sourceProduct.description,
          gender: sourceProduct.gender,
          categoryId: sourceProduct.categoryId,
          subCategory: sourceProduct.subCategory,
          upperMaterial: sourceProduct.upperMaterial,
          innerMaterial: sourceProduct.innerMaterial,
          sole: sourceProduct.sole,
          price: sourceProduct.price,
          salePrice: sourceProduct.salePrice,
          costPrice: sourceProduct.costPrice,
          hsnCode: sourceProduct.hsnCode,
          gstPercentage: sourceProduct.gstPercentage,
          packagingLength: sourceProduct.packagingLength,
          packagingBreadth: sourceProduct.packagingBreadth,
          packagingHeight: sourceProduct.packagingHeight,
          packagingWeight: sourceProduct.packagingWeight,
          attributes: sourceProduct.attributes,
          images: { create: [] },
          variants: {
            create: sourceProduct.variants.map((v: any) => ({
              size: v.size,
              stock: 0,
              sku: `${trimmedSku}-${v.size}`,
              price: v.price,
              salePrice: v.salePrice,
            })),
          },
        },
        include: {
          images: true,
          variants: true,
        },
      });

      return newProduct;
    });

    return Response.json(
      {
        product: result,
        message: `${trimmedColor} color variant created. Add images, set stock, then activate it.`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to create colorway:", err);
    return NextResponse.json(
      { error: "Failed to create color variant. Please try again." },
      { status: 500 }
    );
  }
}

// ─── DELETE: Remove a colorway from the group ────────────────────────────────

// @ts-ignore - Next.js 16 type compatibility
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, colorGroupKey: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.colorGroupKey) {
    return NextResponse.json(
      { error: "Cannot remove: product is not part of a color group" },
      { status: 400 }
    );
  }

  // Count remaining siblings
  const remainingCount = await prisma.product.count({
    where: { colorGroupKey: product.colorGroupKey, NOT: { id } },
  });

  try {
    // @ts-ignore - Prisma transaction callback type inference
    await prisma.$transaction(async (tx: any) => {
      // Deactivate the product (preserve history)
      await tx.product.update({
        where: { id },
        data: { status: "INACTIVE", colorGroupKey: null },
      });

      // If this was the last sibling, clear the group key from remaining products
      if (remainingCount === 0) {
        await tx.product.updateMany({
          where: { colorGroupKey: product.colorGroupKey },
          data: { colorGroupKey: null },
        });
      }
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Failed to remove colorway:", err);
    return NextResponse.json(
      { error: "Failed to remove color variant" },
      { status: 500 }
    );
  }
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function mapZodErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  const issues = (error as any)?.issues;
  if (!Array.isArray(issues)) return result;
  for (const issue of issues) {
    const path = issue.path?.join(".");
    if (path && !result[path]) {
      result[path] = issue.message;
    }
  }
  return result;
}
