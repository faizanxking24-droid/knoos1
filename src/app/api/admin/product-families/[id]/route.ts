import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { familyInclude, findFamilyByProductId, productFields, uniqueProductSlug } from "@/lib/product-family";
import { productFamilySchema } from "@/lib/validation/product-family";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const family = await findFamilyByProductId((await params).id);
  if (!family) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ legacyCombined: /[,;]/.test(family.source.color ?? "") || /[,;]/.test(family.source.sku), products: family.products });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const family = await findFamilyByProductId((await params).id);
  if (!family) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const parsed = productFamilySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product family", issues: parsed.error.issues }, { status: 400 });
  try {
    const groupKey = family.source.colorGroupKey ?? `product-family-${family.source.id}`;
    const currentIds = new Set(family.products.map((product) => product.id));
    const submittedIds = new Set(parsed.data.colors.flatMap((color) => color.id ? [color.id] : []));
    const products = await prisma.$transaction(async (tx) => {
      const removedProducts = [...currentIds].filter((id) => !submittedIds.has(id));
      if (removedProducts.length) await tx.product.updateMany({ where: { id: { in: removedProducts } }, data: { status: "INACTIVE", colorGroupKey: null } });
      const saved = [];
      for (const color of parsed.data.colors) {
        if (color.id && currentIds.has(color.id)) {
          const slug = await uniqueProductSlug(tx, color.slug, color.id);
          const existing = family.products.find((product) => product.id === color.id)!;
          const submittedExisting = new Set(color.variants.flatMap((variant) => variant.id ? [variant.id] : []));
          for (const oldVariant of existing.variants.filter((variant) => !submittedExisting.has(variant.id) && !color.variants.some((item) => !item.id && item.size.toLowerCase() === variant.size.toLowerCase()))) {
            const referenced = await tx.cartItem.count({ where: { variantId: oldVariant.id } });
            if (referenced) await tx.productVariant.update({ where: { id: oldVariant.id }, data: { stock: 0 } });
            else await tx.productVariant.delete({ where: { id: oldVariant.id } });
          }
          await tx.productImage.deleteMany({ where: { productId: color.id } });
          await tx.product.update({ where: { id: color.id }, data: { ...productFields(parsed.data, { ...color, slug }, groupKey), images: { create: color.images.map((image, index) => ({ imageUrl: image.imageUrl, sortOrder: index })) } } });
          for (const variant of color.variants) {
            const data = { size: variant.size, stock: variant.stock, sku: variant.sku, price: variant.price, salePrice: variant.salePrice ?? null };
            const match = variant.id ? existing.variants.find((item) => item.id === variant.id) : existing.variants.find((item) => item.size.toLowerCase() === variant.size.toLowerCase());
            if (match) await tx.productVariant.update({ where: { id: match.id }, data });
            else await tx.productVariant.create({ data: { productId: color.id, ...data } });
          }
          saved.push(await tx.product.findUniqueOrThrow({ where: { id: color.id }, include: familyInclude }));
        } else {
          const slug = await uniqueProductSlug(tx, color.slug);
          saved.push(await tx.product.create({ data: {
            ...productFields(parsed.data, { ...color, slug }, groupKey),
            images: { create: color.images.map((image, index) => ({ imageUrl: image.imageUrl, sortOrder: index })) },
            variants: { create: color.variants.map(({ id: _id, ...variant }) => ({ ...variant, salePrice: variant.salePrice ?? null })) },
          }, include: familyInclude }));
        }
      }
      return saved;
    });
    return NextResponse.json({ groupKey, products });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ error: "A product slug or SKU is already in use" }, { status: 409 });
    throw error;
  }
}
