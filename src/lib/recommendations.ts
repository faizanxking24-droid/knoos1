import { prisma } from "@/lib/db";
import { ProductImage } from "@prisma/client";

export interface RecommendationOptions {
  currentProductId?: string;
  cartItemIds?: string[];
  category?: string;
  subCategory?: string;
  gender?: string;
  limit?: number;
}

export async function getRecommendations(options: RecommendationOptions) {
  const { currentProductId, cartItemIds = [], category, subCategory, gender, limit = 4 } = options;

  const excludeIds = [...cartItemIds];
  if (currentProductId) {
    excludeIds.push(currentProductId);
  }

  // Fetch a pool of active products to score
  let pool: any[] = [];
  try {
    pool = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        id: { notIn: excludeIds },
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        categoryRel: {
          select: { name: true },
        },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.warn("Could not query recommendations from database:", err instanceof Error ? err.message : err);
  }

  if (pool.length === 0) {
    const { FALLBACK_PRODUCTS } = await import("./fallback-data");
    pool = FALLBACK_PRODUCTS.filter((p) => !excludeIds.includes(p.id));
  }

  // If we don't have specific targeting, just return the most recent active products
  if (!category && !subCategory && !gender) {
    return pool.slice(0, limit);
  }

  // Score the pool
  const scoredProducts = pool.map((product) => {
    let score = 0;

    // Priority 1: Same subCategory (highest)
    if (subCategory && product.subCategory === subCategory) score += 3;

    // Priority 2: Same category name
    if (category && product.categoryRel?.name === category) score += 2;

    // Priority 3: Same gender
    if (gender && product.gender === gender) score += 1;

    return { product, score };
  });

  // Sort by score descending, then fallback to recent
  scoredProducts.sort((a, b) => b.score - a.score);

  return scoredProducts.slice(0, limit).map((s) => s.product);
}
