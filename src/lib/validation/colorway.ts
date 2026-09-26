/**
 * Colorway field validation (no Zod dependency).
 */

export interface NewColorwayInput {
  color: string;
  name: string;
  slug: string;
  sku: string;
  status?: string;
}

export function validateNewColorway(input: unknown): NewColorwayInput {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid input");
  }

  const data = input as Record<string, unknown>;

  const color = typeof data.color === "string" ? data.color.trim() : "";
  if (!color) {
    throw new Error("Color is required");
  }
  if (color.length > 50) {
    throw new Error("Color must be 50 characters or fewer");
  }

  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) {
    throw new Error("Name is required");
  }

  const sku = typeof data.sku === "string" ? data.sku.trim() : "";
  if (!sku) {
    throw new Error("SKU is required");
  }

  const rawSlug = typeof data.slug === "string" ? data.slug.trim() : "";
  if (!rawSlug) {
    throw new Error("Slug is required");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawSlug)) {
    throw new Error(
      "Slug must be lowercase letters, numbers, and hyphens only"
    );
  }
  const slug = rawSlug.toLowerCase();

  const rawStatus = typeof data.status === "string" ? data.status.trim().toUpperCase() : "ACTIVE";
  const validStatuses = ["ACTIVE", "INACTIVE"];
  if (!validStatuses.includes(rawStatus)) {
    throw new Error("Status must be ACTIVE or INACTIVE");
  }

  return {
    color,
    name,
    slug,
    sku,
    status: rawStatus,
  };
}
