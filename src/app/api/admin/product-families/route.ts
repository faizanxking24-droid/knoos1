import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { familyInclude, productFields, uniqueProductSlug } from "@/lib/product-family";
import { productFamilySchema } from "@/lib/validation/product-family";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const parsed = productFamilySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product family", issues: parsed.error.issues }, { status: 400 });
  try {
    const groupKey = `product-family-${randomUUID()}`;
    const products = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const color of parsed.data.colors) {
        const slug = await uniqueProductSlug(tx, color.slug);
        created.push(await tx.product.create({ data: {
          ...productFields(parsed.data, { ...color, slug }, groupKey),
          images: { create: color.images.map((image, index) => ({ imageUrl: image.imageUrl, sortOrder: index })) },
          variants: { create: color.variants.map(({ id: _id, ...variant }) => ({ ...variant, salePrice: variant.salePrice ?? null })) },
        }, include: familyInclude }));
      }
      return created;
    });
    return NextResponse.json({ groupKey, products }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ error: "A product slug or SKU is already in use" }, { status: 409 });
    throw error;
  }
}
