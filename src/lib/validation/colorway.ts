import { z } from "zod";

// ─── Color variant (colorway) creation validation ─────────────────────────────

export const newColorwaySchema = z.object({
  color: z
    .string()
    .min(1, "Color is required")
    .max(50, "Color must be at most 50 characters"),
  name: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Product name must be at most 255 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255, "Slug must be at most 255 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase, URL-friendly (letters, numbers, hyphens)"
    ),
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(100, "SKU must be at most 100 characters"),
});

export type NewColorwayInput = z.infer<typeof newColorwaySchema>;
