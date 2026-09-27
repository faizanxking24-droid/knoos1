import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { Product, ProductImage } from "@prisma/client";

export type ProductWithImages = Product & {
  images: ProductImage[];
};

export interface ProductSearchParams {
  q?: string;
  gender?: string;
  category?: string;
  size?: string;
  min?: string;
  max?: string;
  stock?: string;
  sort?: string;
  page?: string;
  limit?: number;
}

export async function getProducts(params: ProductSearchParams): Promise<ProductWithImages[]> {
  try {
    const { q, gender, category, size, min, max, stock, sort, limit } = params;

    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
    };

    // 1. Search Query (q)
    if (q) {
      const searchStr = q.trim();
      if (searchStr.length > 0) {
        where.OR = [
          { name: { contains: searchStr } },
          { sku: { contains: searchStr } },
        ];
      }
    }

    // 2. Gender
    if (gender === "MEN" || gender === "WOMEN") {
      where.gender = gender;
    }

    // 3. Category — resolve slug to categoryId via the Category model
    if (category) {
      const categoryRecord = await prisma.category.findFirst({
        where: { slug: category.toLowerCase().trim(), isActive: true },
        select: { id: true },
      });
      if (categoryRecord) {
        where.categoryId = categoryRecord.id;
      }
    }

    // 4. Size & Stock availability combined
    if (size || stock) {
      const variantConditions: Prisma.ProductVariantWhereInput = {};

      if (size) {
        variantConditions.size = size;
      }

      if (stock === "In Stock") {
        variantConditions.stock = { gt: 0 };
      }

      // Only apply the variant filter if we actually have conditions
      if (Object.keys(variantConditions).length > 0) {
        where.variants = { some: variantConditions };
      }

      if (stock === "Out of Stock") {
        where.variants = { every: { stock: 0 } };
      }
    }

    // 5. Price filtering
    if (min || max) {
      const minVal = min ? parseInt(min, 10) : undefined;
      const maxVal = max ? parseInt(max, 10) : undefined;

      if ((minVal !== undefined && !isNaN(minVal)) || (maxVal !== undefined && !isNaN(maxVal))) {
        const priceCondition: any = {};
        if (minVal !== undefined && !isNaN(minVal)) priceCondition.gte = minVal;
        if (maxVal !== undefined && !isNaN(maxVal)) priceCondition.lte = maxVal;

        where.AND = [
          ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
          {
            OR: [
              { salePrice: { not: null, ...priceCondition } },
              { salePrice: null, price: priceCondition },
            ],
          },
        ];
      }
    }

    // 6. Base Prisma query
    const products = await prisma.product.findMany({
      where,
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        categoryRel: {
          select: { id: true, name: true, slug: true },
        },
      },
      // Push take to DB if we do not need client-side price sorting
      take: limit && sort !== "price-low" && sort !== "price-high" ? limit : undefined,
      // Preliminary sorting
      orderBy: sort === "Newest" ? { createdAt: "desc" } : { createdAt: "desc" },
    });

    // 7. Client-side Sorting for effective price
    if (sort) {
      products.sort((a, b) => {
        const priceA = a.salePrice ?? a.price;
        const priceB = b.salePrice ?? b.price;

        switch (sort) {
          case "price-low":
            return priceA - priceB;
          case "price-high":
            return priceB - priceA;
          case "Newest":
            return b.createdAt.getTime() - a.createdAt.getTime();
          case "Featured":
          default:
            return 0; // Maintain default order
        }
      });
    }

    return limit ? products.slice(0, limit) : products;
  } catch (error) {
    console.warn("Database unavailable in getProducts, using fallback catalog:", error instanceof Error ? error.message : error);
    const { FALLBACK_PRODUCTS } = await import("./fallback-data");
    let filtered = [...FALLBACK_PRODUCTS];
    if (params.gender === "MEN" || params.gender === "WOMEN") {
      filtered = filtered.filter(p => p.gender === params.gender);
    }
    if (params.q) {
      const query = params.q.toLowerCase().trim();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
    }
    if (params.category) {
      const cat = params.category.toLowerCase().trim();
      filtered = filtered.filter(p => p.category?.toLowerCase() === cat || p.categoryRel?.slug === cat);
    }
    return params.limit ? filtered.slice(0, params.limit) : filtered;
  }
}
