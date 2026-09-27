import type { Prisma } from "@prisma/client";

export const DELETED_PRODUCT_STATUS = "DELETED";

export function visibleProductWhere(id: string): Prisma.ProductWhereInput {
  return { id, status: { not: DELETED_PRODUCT_STATUS } };
}

export function visibleFamilyWhere(source: {
  id: string;
  status: string;
  colorGroupKey: string | null;
}): Prisma.ProductWhereInput | null {
  if (source.status === DELETED_PRODUCT_STATUS) return null;
  return source.colorGroupKey
    ? { colorGroupKey: source.colorGroupKey, status: { not: DELETED_PRODUCT_STATUS } }
    : visibleProductWhere(source.id);
}

type ProductDeleteStore = {
  product: {
    updateMany(args: {
      where: { id: { in: string[] }; status: { not: string } };
      data: { status: string };
    }): Promise<{ count: number }>;
  };
};

export function buildAdminProductWhere(filters: {
  gender?: string | null;
  status?: string | null;
  categoryId?: string | null;
  q?: string | null;
  validGenders: readonly string[];
  validStatuses: readonly string[];
}): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: { not: DELETED_PRODUCT_STATUS } };

  if (filters.gender && filters.validGenders.includes(filters.gender)) where.gender = filters.gender;
  if (filters.status && filters.status !== DELETED_PRODUCT_STATUS && filters.validStatuses.includes(filters.status)) {
    where.status = filters.status;
  }
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { sku: { contains: filters.q } },
      { slug: { contains: filters.q } },
    ];
  }
  return where;
}

export async function softDeleteProducts(store: ProductDeleteStore, ids: string[]) {
  return store.product.updateMany({
    where: { id: { in: ids }, status: { not: DELETED_PRODUCT_STATUS } },
    data: { status: DELETED_PRODUCT_STATUS },
  });
}
