import { z } from "zod";
import { productImageSchema, productVariantSchema } from "./admin";

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();

export const productFamilySchema = z.object({
  baseName: z.string().trim().min(1, "Product name is required").max(255),
  gender: z.enum(["MEN", "WOMEN"]),
  categoryId: z.string().max(36).nullable().optional(),
  description: nullableText(5000),
  subCategory: nullableText(50),
  upperMaterial: nullableText(100),
  innerMaterial: nullableText(100),
  sole: nullableText(100),
  colors: z.array(z.object({
    id: z.string().optional(),
    color: z.string().trim().min(1, "Color is required").max(50)
      .refine((value) => !/[,;]/.test(value), "Enter one color only"),
    sku: z.string().trim().min(1, "Color SKU is required").max(100),
    name: z.string().trim().min(1, "Color product name is required").max(255),
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug").max(255),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    images: z.array(productImageSchema),
    variants: z.array(productVariantSchema.extend({ id: z.string().optional() })).min(1, "Add at least one size"),
  })).min(1, "Add at least one color"),
}).superRefine((family, ctx) => {
  const duplicate = (values: string[]) => new Set(values.map((value) => value.toLowerCase())).size !== values.length;
  if (duplicate(family.colors.map((color) => color.color))) ctx.addIssue({ code: "custom", path: ["colors"], message: "Duplicate color in this family" });
  if (duplicate(family.colors.map((color) => color.slug))) ctx.addIssue({ code: "custom", path: ["colors"], message: "Duplicate slug in this family" });
  if (duplicate(family.colors.flatMap((color) => [color.sku, ...color.variants.map((variant) => variant.sku)]))) ctx.addIssue({ code: "custom", path: ["colors"], message: "Duplicate SKU in this family" });
  family.colors.forEach((color, colorIndex) => {
    if (duplicate(color.variants.map((variant) => variant.size))) ctx.addIssue({ code: "custom", path: ["colors", colorIndex, "variants"], message: "Duplicate size in this color" });
    color.variants.forEach((variant, variantIndex) => {
      if (variant.salePrice != null && variant.salePrice > variant.price) ctx.addIssue({ code: "custom", path: ["colors", colorIndex, "variants", variantIndex, "salePrice"], message: "Selling price cannot exceed MRP" });
    });
  });
});

export type ProductFamilyInput = z.infer<typeof productFamilySchema>;
