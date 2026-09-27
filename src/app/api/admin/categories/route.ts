"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";
import { ProductStatus } from "@/lib/constants";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name must be at most 50 characters"),
  sortOrder: z.number().int().nonnegative().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name must be at most 50 characters").optional(),
  slug: z.string().min(1, "Slug is required").max(50, "Slug must be at most 50 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, URL-friendly (letters, numbers, hyphens)").optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export async function GET(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  const where = includeInactive ? {} : { isActive: true };

  const [categories, total, activeCounts] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
    prisma.category.count({ where }),
    prisma.product.groupBy({
      by: ["categoryId"],
      where: {
        status: ProductStatus.ACTIVE,
        categoryId: { not: null },
      },
      _count: { id: true },
    }),
  ]);

  const activeCountMap = new Map<string, number>();
  for (const item of activeCounts) {
    if (item.categoryId) {
      activeCountMap.set(item.categoryId, item._count.id);
    }
  }

  const enrichedCategories = categories.map((cat) => {
    const liveProductCount = activeCountMap.get(cat.id) ?? 0;
    const linkedProductCount = cat._count?.products ?? 0;
    return {
      ...cat,
      liveProductCount,
      linkedProductCount,
      _count: {
        ...cat._count,
        products: liveProductCount,
      },
    };
  });

  return NextResponse.json({ categories: enrichedCategories, total });
}

export async function POST(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const body = await request.json();
  const parsed = createCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, sortOrder } = parsed.data;
  const trimmedName = name.trim();
  const baseSlug = slugify(trimmedName);

  // Ensure unique slug
  let finalSlug = baseSlug;
  let counter = 1;
  while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        slug: finalSlug,
        sortOrder: sortOrder ?? 0,
      },
    });
    return NextResponse.json(
      {
        ...category,
        liveProductCount: 0,
        linkedProductCount: 0,
        _count: { products: 0 },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === "P2002") {
      const target = error.meta?.target?.[0];
      if (target === "name") {
        return NextResponse.json(
          { error: `Category '${trimmedName}' already exists.`, fieldErrors: { name: `Category '${trimmedName}' already exists.` } },
          { status: 409 }
        );
      }
      if (target === "slug") {
        return NextResponse.json(
          { error: `A category with slug '${finalSlug}' already exists.`, fieldErrors: { slug: `Slug '${finalSlug}' already exists.` } },
          { status: 409 }
        );
      }
    }
    throw error;
  }
}
