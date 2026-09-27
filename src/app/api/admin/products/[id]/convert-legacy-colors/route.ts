"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────

const skuMapEntrySchema = z.object({
  color: z.string().min(1, "Color is required").max(50, "Color must be at most 50 characters"),
  sku: z.string().max(100, "SKU must be at most 100 characters").optional(),
});

const convertLegacyColorsSchema = z.object({
  colors: z
    .array(z.string().min(1, "Color cannot be empty").max(50, "Color must be at most 50 characters"))
    .min(1, "At least one color is required"),
  skuMap: z.array(skuMapEntrySchema),
});

// ─── Helper: map Zod errors to field → message pairs ──────────────────────────

function mapZodErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!result[path]) {
      result[path] = issue.message;
    }
  }
  return result;
}

// ─── Helper: generate a short suffix from a color name ────────────────────────

function colorToSuffix(color: string): string {
  // Remove spaces and non-alphanumeric, uppercase
  const cleaned = color.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  // Take up to 4 characters
  const suffix = cleaned.slice(0, 4);
  return suffix || "CLR";
}

// ─── POST: Convert legacy combined colors into proper colorway products ────────

// @ts-ignore - Next.js 16 type compatibility
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;
  const body = await request.json();
  const parsed = convertLegacyColorsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: mapZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const { colors, skuMap } = parsed.data;

  // Load the source product with its variants and images
  const sourceProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { size: "asc" } },
      images: true,
    },
  });

  if (!sourceProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Trim colors
  const trimmedColors = colors.map((c) => c.trim());
  const trimmedColorsLower = trimmedColors.map((c) => c.toLowerCase());

  // Build a lookup map from skuMap: color (lowercase) -> sku
  const skuMapLookup = new Map<string, string>();
  for (const entry of skuMap) {
    const entryColor = entry.color.trim();
    if (entry.sku && entry.sku.trim()) {
      skuMapLookup.set(entryColor.toLowerCase(), entry.sku.trim());
    }
  }

  // Determine the group key
  let groupKey = sourceProduct.colorGroupKey;
  if (!groupKey) {
    groupKey = `color-group-${sourceProduct.id}`;
  }

  // ─── Pre-validation: check for duplicates within the group ──────────────────

  // Check for duplicate colors in the request itself
  const seenColors = new Set<string>();
  for (const color of trimmedColorsLower) {
    if (seenColors.has(color)) {
      return NextResponse.json(
        { error: `Duplicate color "${color}" in the request. Each color must be unique.` },
        { status: 409 }
      );
    }
    seenColors.add(color);
  }

  // Check for duplicate colors against existing products in the group
  const existingGroupProducts = await prisma.product.findMany({
    where: { colorGroupKey: groupKey },
    select: { color: true },
  });

  for (const existing of existingGroupProducts) {
    if (existing.color) {
      const existingColorLower = existing.color.trim().toLowerCase();
      if (trimmedColorsLower.includes(existingColorLower)) {
        return NextResponse.json(
          {
            error: `"${existing.color}" already exists in this product family. Each color in a family must be unique.`,
          },
          { status: 409 }
        );
      }
    }
  }

  // ─── Determine SKUs for each color ──────────────────────────────────────────

  const baseSku = sourceProduct.sku;
  const colorSkus: string[] = [];

  for (let i = 0; i < trimmedColors.length; i++) {
    const color = trimmedColors[i];
    const colorLower = trimmedColorsLower[i];

    const mappedSku = skuMapLookup.get(colorLower);
    if (mappedSku) {
      colorSkus.push(mappedSku);
    } else if (i === 0) {
      // First color uses the source product's SKU
      colorSkus.push(baseSku);
    } else {
      // Generate SKU by appending suffix to base SKU
      const suffix = colorToSuffix(color);
      colorSkus.push(`${baseSku}-${suffix}`);
    }
  }

  // Check SKU uniqueness for all SKUs (existing + new)
  const allSkusToCheck = [...colorSkus];
  const existingSkus = await prisma.product.findMany({
    where: { sku: { in: allSkusToCheck } },
    select: { id: true, sku: true },
  });

  if (existingSkus.length > 0) {
    const conflicting = existingSkus.map((p) => p.sku).join(", ");
    return NextResponse.json(
      { error: `A product with SKU(s) "${conflicting}" already exists` },
      { status: 409 }
    );
  }

  // ─── Check variant SKU uniqueness for new products ──────────────────────────

  const sourceVariants = sourceProduct.variants;
  const variantSkusToCheck: string[] = [];
  for (let i = 1; i < colorSkus.length; i++) {
    const productSku = colorSkus[i];
    for (const variant of sourceVariants) {
      variantSkusToCheck.push(`${productSku}-${variant.size}`);
    }
  }

  if (variantSkusToCheck.length > 0) {
    const conflictingVariantSkus = await prisma.productVariant.findMany({
      where: { sku: { in: variantSkusToCheck } },
      select: { sku: true },
    });

    if (conflictingVariantSkus.length > 0) {
      return NextResponse.json(
        {
          error: `Variant SKU conflict: ${conflictingVariantSkus.map((v) => v.sku).join(", ")} already exists`,
        },
        { status: 409 }
      );
    }
  }

  // ─── Check slug uniqueness ──────────────────────────────────────────────────

  // Generate slugs from color names
  const generateSlug = (color: string): string => {
    return color
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const newSlugs = trimmedColors.map((c) => generateSlug(c));

  const existingSlugs = await prisma.product.findMany({
    where: { slug: { in: newSlugs } },
    select: { id: true, slug: true },
  });

  if (existingSlugs.length > 0) {
    const conflicting = existingSlugs.map((p) => p.slug).join(", ");
    return NextResponse.json(
      { error: `A product with slug(s) "${conflicting}" already exists` },
      { status: 409 }
    );
  }

  // ─── Build the transaction ──────────────────────────────────────────────────

  try {
    // @ts-ignore - Prisma transaction callback type inference
    const result = await prisma.$transaction(async (tx: any) => {
      const createdProducts: any[] = [];

      for (let i = 0; i < trimmedColors.length; i++) {
        const color = trimmedColors[i];
        const sku = colorSkus[i];
        const slug = newSlugs[i];
        const isSource = i === 0;

        const productData: any = {
          name: sourceProduct.name,
          slug,
          color,
          sku,
          colorGroupKey: groupKey,
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
        };

        if (isSource) {
          // Update source product in place
          const updated = await tx.product.update({
            where: { id: sourceProduct.id },
            data: productData,
            include: {
              images: true,
              variants: true,
            },
          });
          createdProducts.push(updated);
        } else {
          // Create a new product for additional colors
          productData.status = "INACTIVE";

          const newProduct = await tx.product.create({
            data: {
              ...productData,
              images: { create: [] },
              variants: {
                create: sourceVariants.map((v: any) => ({
                  size: v.size,
                  stock: 0,
                  sku: `${sku}-${v.size}`,
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
          createdProducts.push(newProduct);
        }
      }

      return createdProducts;
    });

    return Response.json(
      {
        products: result,
        message: `Successfully converted ${trimmedColors.length} color(s). ${result.length - 1} new product(s) created as INACTIVE.`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to convert legacy colors:", err);
    return NextResponse.json(
      { error: "Failed to convert legacy colors. Please try again." },
      { status: 500 }
    );
  }
}
