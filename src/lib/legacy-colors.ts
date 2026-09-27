/**
 * Utility functions for detecting, parsing, and mapping legacy color/SKU
 * storage formats that concatenate multiple values in a single string
 * separated by commas and/or semicolons.
 *
 * These helpers bridge the gap between older combined-color product data
 * and the current structured colorway model.
 */

/**
 * Detects whether a color string uses the legacy combined-format
 * (comma or semicolon separated values).
 *
 * @param color - Raw color value from the database or payload
 * @returns true when the trimmed value contains a comma or semicolon
 */
export function detectLegacyCombinedColors(
  color: string | null | undefined,
): boolean {
  if (!color) return false;
  return color.includes(",") || color.includes(";");
}

/**
 * Splits a legacy combined color string into an array of clean, deduped
 * color names.
 *
 * Delimiters: comma (`,`) and semicolon (`;`).
 * Whitespace around each token is trimmed. Deduplication is case-insensitive
 * while preserving the first-seen casing.
 *
 * @param color - Raw color value from the database or payload
 * @returns Array of unique color names, or an empty array for null/undefined/blank input
 */
export function parseLegacyColors(color: string | null | undefined): string[] {
  if (!color || color.trim() === "") return [];

  const tokens = color
    .split(/[,;]/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(token);
    }
  }

  return result;
}

/**
 * Detects whether a SKU string uses the legacy combined-format
 * (comma or semicolon separated values).
 *
 * @param sku - Raw SKU value from the database or payload
 * @returns true when the trimmed value contains a comma or semicolon
 */
export function detectLegacyCombinedSkus(
  sku: string | null | undefined,
): boolean {
  if (!sku) return false;
  return sku.includes(",") || sku.includes(";");
}

/**
 * Splits a legacy combined SKU string into an array of clean, deduped
 * SKU values.
 *
 * Delimiters: comma (`,`) and semicolon (`;`).
 * Whitespace around each token is trimmed. Deduplication is case-insensitive
 * while preserving the first-seen casing.
 *
 * @param sku - Raw SKU value from the database or payload
 * @returns Array of unique SKUs, or an empty array for null/undefined/blank input
 */
export function parseLegacySkus(sku: string | null | undefined): string[] {
  if (!sku || sku.trim() === "") return [];

  const tokens = sku
    .split(/[,;]/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(token);
    }
  }

  return result;
}

/**
 * Maps an array of colors to an array of SKUs.
 *
 * When both arrays have the same length, each color is paired with the
 * SKU at the matching index. When the lengths differ, every color is
 * mapped against a `null` SKU so callers can still enumerate colors
 * without producing phantom SKU entries.
 *
 * @param colors - Array of color names
 * @param skus - Array of SKU strings
 * @returns Array of `{ color, sku }` pairs with trimmed values
 */
export function mapColorsToSkus(
  colors: string[],
  skus: string[],
): { color: string; sku: string | null }[] {
  if (colors.length === 0) return [];

  return colors.map((color, index) => ({
    color: color.trim(),
    sku: index < skus.length ? skus[index].trim() : null,
  }));
}

/**
 * Builds a deterministic React `key` (or similar grouping identifier)
 * for a set of color variants belonging to a single product.
 *
 * @param productId - The parent product identifier
 * @returns A stable string of the form `color-group-{productId}`
 */
export function generateColorGroupKey(productId: string): string {
  return `color-group-${productId}`;
}
