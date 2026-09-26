import { z } from "zod";

// ─── Product validation schemas ──────────────────────────────────────────────

export const productNameSchema = z
  .string()
  .min(1, "Product name is required")
  .max(255, "Product name must be at most 255 characters");

export const productSlugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(255, "Slug must be at most 255 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, URL-friendly (letters, numbers, hyphens)");

export const productDescriptionSchema = z
  .string()
  .max(5000, "Description must be at most 5,000 characters")
  .optional()
  .nullable();

export const GenderEnum = ["MEN", "WOMEN"] as const;
export const productGenderSchema = z.enum(GenderEnum);

export const productPriceSchema = z
  .number()
  .int("Price must be a whole number (rupees)")
  .positive("Price must be greater than zero");

export const productSalePriceSchema = z
  .number()
  .int("Sale price must be a whole number (rupees)")
  .nonnegative("Sale price cannot be negative")
  .optional()
  .nullable();

export const productSkuSchema = z
  .string()
  .min(1, "SKU is required")
  .max(100, "SKU must be at most 100 characters");

export const ProductStatusEnum = ["ACTIVE", "INACTIVE"] as const;
export const productStatusSchema = z.enum(ProductStatusEnum);

// Product variant
export const productVariantSchema = z.object({
  size: z
    .string()
    .min(1, "Size is required")
    .max(10, "Size must be at most 10 characters"),
  stock: z
    .number()
    .int("Stock must be a whole number")
    .nonnegative("Stock cannot be negative"),
  sku: z
    .string()
    .min(1, "Variant SKU is required")
    .max(100, "Variant SKU must be at most 100 characters"),
  price: z
    .number()
    .int("Price must be a whole number")
    .nonnegative("Price cannot be negative"),
  salePrice: z
    .number()
    .int("Sale price must be a whole number")
    .nonnegative("Sale price cannot be negative")
    .optional()
    .nullable(),
});

export type ProductVariantInput = z.infer<typeof productVariantSchema>;

// Product image — accepts local media paths, legacy local paths, or absolute http(s) URLs
// New uploads produce /media/products/<filename> URLs. Legacy /uploads/... and http(s) are
// accepted for backward compatibility only. data:, javascript:, file:, vbscript:, and
// protocol-relative URLs are rejected.
export const productImageSchema = z.object({
  imageUrl: z.string().refine(
    (val) => {
      const trimmed = val.trim();
      // Reject unsafe schemes
      const lower = trimmed.toLowerCase();
      if (
        lower.startsWith("data:") ||
        lower.startsWith("javascript:") ||
        lower.startsWith("file:") ||
        lower.startsWith("vbscript:") ||
        trimmed.startsWith("//")
      ) {
        return false;
      }
      // Accept /media/products/... (new Hostinger storage)
      if (trimmed.startsWith("/media/products/")) return true;
      // Accept /uploads/... (legacy local, backward compat)
      if (trimmed.startsWith("/uploads/")) return true;
      // Accept absolute http(s) URLs (legacy remote)
      if (lower.startsWith("http://") || lower.startsWith("https://")) return true;
      return false;
    },
    { message: "Invalid image URL. Use /media/products/... URLs, legacy /uploads/..., or absolute http(s) URLs." }
  ),
  sortOrder: z.number().int().nonnegative().optional(),
});

// Product color group key (for grouping sibling colorways of the same product)
export const colorGroupKeySchema = z
  .preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    if (typeof val === "string") {
      const trimmed = val.trim();
      return trimmed === "" ? null : trimmed.toLowerCase();
    }
    return val;
  }, z.string().max(100, "Color group key must be at most 100 characters").nullable().optional())
  .optional()
  .nullable();

// Combined create product schema
export const createProductSchema = z
  .object({
    name: productNameSchema,
    slug: productSlugSchema,
    description: productDescriptionSchema,
    gender: productGenderSchema,
    categoryId: z.string().max(36, "Category ID must be at most 36 characters").optional().nullable(),
    color: z.string().max(50, "Color must be at most 50 characters").optional().nullable(),
    colorGroupKey: colorGroupKeySchema,
    subCategory: z.string().max(50, "Sub category must be at most 50 characters").optional().nullable(),
    upperMaterial: z.string().max(100, "Upper material must be at most 100 characters").optional().nullable(),
    innerMaterial: z.string().max(100, "Inner material must be at most 100 characters").optional().nullable(),
    sole: z.string().max(100, "Sole must be at most 100 characters").optional().nullable(),
    price: productPriceSchema,
    salePrice: productSalePriceSchema,
    sku: productSkuSchema,
    status: productStatusSchema.default("ACTIVE"),
    images: z.array(productImageSchema).default([]),
    variants: z.array(productVariantSchema).default([]),
  })
  .refine(
    (data) => {
      if (data.salePrice !== null && data.salePrice !== undefined && data.salePrice > data.price) {
        return false;
      }
      return true;
    },
    { message: "Sale price cannot exceed regular price", path: ["salePrice"] }
  );

// Update product schema — all fields optional except id
export const updateProductSchema = z
  .object({
    id: z.string().min(1, "Product ID is required"),
    name: productNameSchema.optional(),
    slug: productSlugSchema.optional(),
    description: productDescriptionSchema,
    gender: productGenderSchema.optional(),
    categoryId: z.string().max(36, "Please select a valid category.").optional().nullable(),
    color: z.string().max(50).optional().nullable(),
    colorGroupKey: colorGroupKeySchema,
    subCategory: z.string().max(50).optional().nullable(),
    upperMaterial: z.string().max(100).optional().nullable(),
    innerMaterial: z.string().max(100).optional().nullable(),
    sole: z.string().max(100).optional().nullable(),
    price: productPriceSchema.optional(),
    salePrice: productSalePriceSchema,
    sku: productSkuSchema.optional(),
    status: productStatusSchema.optional(),
    images: z.array(productImageSchema).optional(),
    variants: z.array(productVariantSchema).optional(),
  })
  .refine(
    (data) => {
      if (
        data.salePrice !== undefined &&
        data.salePrice !== null &&
        data.price !== undefined &&
        data.salePrice > data.price
      ) {
        return false;
      }
      return true;
    },
    { message: "Sale price cannot exceed regular price", path: ["salePrice"] }
  );

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Order status update
export const orderStatusUpdateSchema = z
  .object({
    orderStatus: z
      .enum(["PENDING", "PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"])
      .optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
  })
  .refine(
    (data) => data.orderStatus !== undefined || data.paymentStatus !== undefined,
    { message: "At least one status field must be provided" }
  );

export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

// ─── Helper: map Zod errors to field → message pairs ─────────────────────────

export function mapZodErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!result[path]) {
      result[path] = issue.message;
    }
  }
  return result;
}
