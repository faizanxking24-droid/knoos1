/**
 * KNOOS Inventory & Catalog Analytics
 *
 * Current snapshot metrics (independent of selected date range).
 *
 * Invariants:
 * 1. Low stock is strictly 1 <= stock <= 5.
 * 2. Out of stock is strictly stock = 0.
 * 3. Only ACTIVE products are included in inventory stock counts.
 * 4. Catalog products exclude DELETED soft-deleted products.
 */

import { prisma } from "@/lib/db";
import { ProductStatus } from "@/lib/constants";
import { InventorySnapshotMetrics } from "./definitions";

export async function getInventorySnapshot(limitVariants = 25): Promise<InventorySnapshotMetrics> {
  const [
    // Product counts by status
    catalogProductsCount,
    activeProductsCount,
    inactiveProductsCount,
    deletedProductsCount,

    // Active variant counts
    activeVariantsCount,

    // Total inventory units across active variants
    inventoryUnitsAgg,

    // Low stock count (1 to 5 units, ACTIVE product)
    lowStockCount,

    // Out of stock count (0 units, ACTIVE product)
    outOfStockCount,

    // Low stock variant list
    lowStockVariantsRaw,

    // Out of stock variant list
    outOfStockVariantsRaw,
  ] = await Promise.all([
    // Catalog Products: status != DELETED
    prisma.product.count({
      where: { status: { not: "DELETED" } },
    }),

    // Active Products: status = ACTIVE
    prisma.product.count({
      where: { status: ProductStatus.ACTIVE },
    }),

    // Inactive Products: status = INACTIVE
    prisma.product.count({
      where: { status: ProductStatus.INACTIVE },
    }),

    // Deleted Products: status = DELETED (for internal tracking/audit)
    prisma.product.count({
      where: { status: "DELETED" },
    }),

    // Active Variants count
    prisma.productVariant.count({
      where: { product: { status: ProductStatus.ACTIVE } },
    }),

    // Total Inventory Units: sum(stock) where product.status = ACTIVE
    prisma.productVariant.aggregate({
      _sum: { stock: true },
      where: { product: { status: ProductStatus.ACTIVE } },
    }),

    // Low Stock Count: 1 <= stock <= 5 (no double-counting with 0)
    prisma.productVariant.count({
      where: {
        stock: { gte: 1, lte: 5 },
        product: { status: ProductStatus.ACTIVE },
      },
    }),

    // Out of Stock Count: stock = 0
    prisma.productVariant.count({
      where: {
        stock: 0,
        product: { status: ProductStatus.ACTIVE },
      },
    }),

    // Low Stock Variants (sorted by stock ascending)
    prisma.productVariant.findMany({
      where: {
        stock: { gte: 1, lte: 5 },
        product: { status: ProductStatus.ACTIVE },
      },
      include: {
        product: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
      orderBy: { stock: "asc" },
      take: limitVariants,
    }),

    // Out of Stock Variants
    prisma.productVariant.findMany({
      where: {
        stock: 0,
        product: { status: ProductStatus.ACTIVE },
      },
      include: {
        product: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
      orderBy: { id: "asc" },
      take: limitVariants,
    }),
  ]);

  return {
    catalogProducts: catalogProductsCount,
    activeProducts: activeProductsCount,
    inactiveProducts: inactiveProductsCount,
    deletedProducts: deletedProductsCount,
    activeVariants: activeVariantsCount,
    inventoryUnits: inventoryUnitsAgg._sum.stock ?? 0,
    lowStockCount,
    outOfStockCount,
    lowStockVariants: lowStockVariantsRaw.map((v) => ({
      id: v.id,
      size: v.size,
      stock: v.stock,
      sku: v.sku,
      product: {
        id: v.product.id,
        name: v.product.name,
        slug: v.product.slug,
        status: v.product.status,
      },
    })),
    outOfStockVariants: outOfStockVariantsRaw.map((v) => ({
      id: v.id,
      size: v.size,
      stock: v.stock,
      sku: v.sku,
      product: {
        id: v.product.id,
        name: v.product.name,
        slug: v.product.slug,
        status: v.product.status,
      },
    })),
  };
}
