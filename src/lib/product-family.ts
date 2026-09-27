import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ProductFamilyInput } from "@/lib/validation/product-family";
import { visibleFamilyWhere } from "@/lib/product-deletion";

export const familyInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: { orderBy: { size: "asc" as const } },
} satisfies Prisma.ProductInclude;

export async function findFamilyByProductId(productId: string) {
  const source = await prisma.product.findUnique({ where: { id: productId } });
  if (!source) return null;
  const where = visibleFamilyWhere(source);
  if (!where) return null;
  const products = await prisma.product.findMany({
    where,
    include: familyInclude,
    orderBy: { createdAt: "asc" },
  });
  return { source, products };
}

export function productFields(input: ProductFamilyInput, color: ProductFamilyInput["colors"][number], groupKey: string) {
  const firstVariant = color.variants[0];
  return {
    name: color.name, slug: color.slug, description: input.description ?? null,
    gender: input.gender, categoryId: input.categoryId ?? null, color: color.color,
    colorGroupKey: groupKey, subCategory: input.subCategory ?? null,
    upperMaterial: input.upperMaterial ?? null, innerMaterial: input.innerMaterial ?? null,
    sole: input.sole ?? null, price: firstVariant.price, salePrice: firstVariant.salePrice ?? null,
    sku: color.sku, status: color.status,
  };
}

export async function uniqueProductSlug(tx: Prisma.TransactionClient, requested: string, excludeId?: string) {
  let slug = requested;
  let suffix = 2;
  while (await tx.product.findFirst({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } })) {
    slug = `${requested}-${suffix++}`;
  }
  return slug;
}
