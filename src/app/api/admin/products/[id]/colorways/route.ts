"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { validateNewColorway } from "@/lib/validation/colorway";
import {
  colorGroupKeySchema,
  productNameSchema,
  productSlugSchema,
  productSkuSchema,
  productStatusSchema,
} from "@/lib/validation/admin";

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
        variants: { select: { id: true, stock: true, size: true } },
      },
    });
  } else {
    colorways = await prisma.product.findMany({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { imageUrl: true } },
        variants: { select: { id: true, stock: true, size: true } },
      },
    });
  }

  // Order: source product first, then others
  colorways.sort((a: any, b: any) => (a.id === id ? -1 : b.id === id ? 1 : 0));

  const formatted = colorways.map((p: any) => {
    const totalStock = p.variants.reduce((sum: number, v: any) => sum + (v.stock ?? 0), 0);
    const uniqueSizes = new Set(p.variants.map((v: any) => v.size));
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      color: p.color,
      sku: p.sku,
      status: p.status,
      colorGroupKey: p.colorGroupKey,
      image: p.images[0]?.imageUrl ?? null,
      variantCount: p.variants.length,
      sizeLabel: `${uniqueSizes.size} sizes`,
      totalStock,
      stockLabel: `${uniqueSizes.size} sizes · ${totalStock} units`,
      price: p.price,
      salePrice: p.salePrice,
      isCurrent: p.id === id,
    };
  });

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

  // Validate input
  let validated;
  try {
    validated = validateNewColorway(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 400 }
    );
  }

  const { color, name, slug, sku } = validated;
  const trimmedColor = color;
  const trimmedSlug = slug;
  const trimmedSku = sku;
  const trimmedName = name;

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

  // Check for duplicate color within the group (case-insensitive, trimmed)
  // Compare against ALL products in the group, including the source product
  const allGroupProducts = await prisma.product.findMany({
    where: { colorGroupKey: groupKey },
    select: { color: true },
  });
  const normalizedNewColor = trimmedColor.toLowerCase();
  const hasDuplicateColor = allGroupProducts.some(
    (p: any) => p.color && p.color.trim().toLowerCase() === normalizedNewColor
  );

  if (hasDuplicateColor) {
    const conflictingColor = allGroupProducts.find(
      (p: any) => p.color && p.color.trim().toLowerCase() === normalizedNewColor
    )?.color;
    return NextResponse.json(
      {
        error: `"${trimmedColor}" already exists in this product family (conflicts with "${conflictingColor}"). Each color in a family must be unique.`,
      },
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
  const sourceVariantSkus = sourceProduct.variants.map((v: any) => `${trimmedSku}-${v.size}`);
  const existingVariantSkus = await prisma.productVariant.findMany({
    where: { sku: { in: sourceVariantSkus } },
    select: { sku: true },
  });
  if (existingVariantSkus.length > 0) {
    return NextResponse.json(
      {
        error: `Variant SKU conflict: ${existingVariantSkus.map((v: any) => v.sku).join(", ")} already exists`,
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

// ─── PATCH: Update a colorway ────────────────────────────────────────────────

// @ts-ignore - Next.js 16 type compatibility
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;
  const body = await request.json();

  const {
    colorwayId,
    color,
    name,
    sku,
    slug,
    status,
  }: {
    colorwayId: string;
    color?: string;
    name?: string;
    sku?: string;
    slug?: string;
    status?: string;
  } = body;

  if (!colorwayId) {
    return NextResponse.json({ error: "colorwayId is required" }, { status: 400 });
  }

  // Load the colorway to update
  const colorway = await prisma.product.findUnique({
    where: { id: colorwayId },
    select: { id: true, color: true, sku: true, slug: true, colorGroupKey: true },
  });

  if (!colorway) {
    return NextResponse.json({ error: "Colorway not found" }, { status: 404 });
  }

  // Build a group key reference — use existing or fallback
  const groupKey = colorway.colorGroupKey;

  // ─── Validate and check uniqueness for each provided field ─────────────────

  // Color validation & uniqueness
  if (color !== undefined) {
    const trimmedColor = typeof color === "string" ? color.trim() : "";
    if (!trimmedColor) {
      return NextResponse.json({ error: "Color is required" }, { status: 400 });
    }
    if (trimmedColor.length > 50) {
      return NextResponse.json(
        { error: "Color must be 50 characters or fewer" },
        { status: 400 }
      );
    }

    if (groupKey) {
      const allGroupProducts = await prisma.product.findMany({
        where: { colorGroupKey: groupKey, NOT: { id: colorwayId } },
        select: { id: true, color: true },
      });
      const duplicate = allGroupProducts.find(
        (p: any) => p.color && p.color.trim().toLowerCase() === trimmedColor.toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json(
          {
            error: `"${trimmedColor}" already exists in this product family (conflicts with "${duplicate.color}"). Each color must be unique.`,
          },
          { status: 409 }
        );
      }
    }
  }

  // SKU validation & uniqueness
  if (sku !== undefined) {
    const trimmedSku = typeof sku === "string" ? sku.trim() : "";
    const skuParse = productSkuSchema.safeParse(trimmedSku);
    if (!skuParse.success) {
      return NextResponse.json(
        { error: skuParse.error.issues[0]?.message || "Invalid SKU" },
        { status: 400 }
      );
    }

    const existingSku = await prisma.product.findFirst({
      where: { sku: trimmedSku, NOT: { id: colorwayId } },
    });
    if (existingSku) {
      return NextResponse.json(
        { error: "A product with this SKU already exists" },
        { status: 409 }
      );
    }
  }

  // Slug validation & uniqueness
  if (slug !== undefined) {
    const trimmedSlug = typeof slug === "string" ? slug.trim().toLowerCase() : "";
    const slugParse = productSlugSchema.safeParse(trimmedSlug);
    if (!slugParse.success) {
      return NextResponse.json(
        { error: slugParse.error.issues[0]?.message || "Invalid slug" },
        { status: 400 }
      );
    }

    const existingSlug = await prisma.product.findFirst({
      where: { slug: trimmedSlug, NOT: { id: colorwayId } },
    });
    if (existingSlug) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 }
      );
    }
  }

  // Status validation
  if (status !== undefined) {
    const statusParse = productStatusSchema.safeParse(status);
    if (!statusParse.success) {
      return NextResponse.json(
        { error: "Status must be ACTIVE or INACTIVE" },
        { status: 400 }
      );
    }
  }

  // Name validation
  if (name !== undefined) {
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const nameParse = productNameSchema.safeParse(trimmedName);
    if (!nameParse.success) {
      return NextResponse.json(
        { error: nameParse.error.issues[0]?.message || "Invalid name" },
        { status: 400 }
      );
    }
  }

  // ─── Build update data ─────────────────────────────────────────────────────

  const updateData: Record<string, unknown> = {};
  if (color !== undefined) updateData.color = typeof color === "string" ? color.trim() : color;
  if (name !== undefined) updateData.name = typeof name === "string" ? name.trim() : name;
  if (sku !== undefined) updateData.sku = typeof sku === "string" ? sku.trim() : sku;
  if (slug !== undefined) updateData.slug = typeof slug === "string" ? slug.trim().toLowerCase() : slug;
  if (status !== undefined) updateData.status = status;

  try {
    const updated = await prisma.product.update({
      where: { id: colorwayId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        sku: true,
        status: true,
        colorGroupKey: true,
        price: true,
        salePrice: true,
      },
    });

    return Response.json({ colorway: updated });
  } catch (err) {
    console.error("Failed to update colorway:", err);
    return NextResponse.json(
      { error: "Failed to update color variant. Please try again." },
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
