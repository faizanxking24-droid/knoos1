/**
 * KNOOS Product Import Data — single source of truth
 *
 * Consumed by:
 *   - scripts/import-products.mjs  (offline validation)
 *
 * This file has ZERO external imports. Pure data.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS (self-contained, no external deps)
// ═══════════════════════════════════════════════════════════════════════════════

const Gender = Object.freeze({ MEN: "MEN", WOMEN: "WOMEN" });
const ProductStatus = Object.freeze({ ACTIVE: "ACTIVE", INACTIVE: "INACTIVE" });

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY MAPPING
// ═══════════════════════════════════════════════════════════════════════════════
// Source "Casual" → canonical "Casuals" per project convention.
// Slugs use the project's slugify() convention: "Casual Shoe" → "casual-shoe"

const SOURCE_CATEGORY_NORMALIZE = Object.freeze({ casual: "casuals" });

function normalizeCategoryName(raw) {
  const trimmed = raw.trim().toLowerCase();
  return SOURCE_CATEGORY_NORMALIZE[trimmed] ?? trimmed;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESCRIPTION AUDIT FLAGS
// ═══════════════════════════════════════════════════════════════════════════════

export const ROADSTER_DESCRIPTION_SKUS = Object.freeze(new Set([
  "WAV-324-BL", "WAV-324-BLU", "WAV-324-PINK",
  "UD-6000-BL", "UD-6000-BR", "UD-6004-BL", "UD-6004-BR",
]));

export const COLOR_DESCRIPTION_MISMATCHES = Object.freeze([
  { sku: "UD-6000-BR", productColor: "Brown", descriptionColor: "Black" },
  { sku: "UD-6004-BR", productColor: "Brown", descriptionColor: "Black" },
  { sku: "KT-219-PINK", productColor: "Pink", descriptionColor: "grey, black and silver" },
  { sku: "WD-301-BL", productColor: "Black", descriptionColor: "tan" },
  { sku: "WD-302-BL", productColor: "Black", descriptionColor: "tan" },
]);

export const BLANK_DESCRIPTION_SKUS = Object.freeze(new Set([
  "UD-5101-BR", "UD-5101-TAN", "UD-5200-BL", "UD-5200-BLU", "UD-5200-GREY",
]));

export const BLANK_SALEPRICE_SKUS = Object.freeze(new Set([
  "WD-301-BL", "WD-301-TAN", "WD-302-BL", "WD-302-TAN",
]));

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT DATASET — 31 PARENTS, 155 VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════
// Each entry = 1 parent product. Variants are derived from the `sizes` array.

export const PRODUCTS = Object.freeze([
  // 01
  { parentSku: "WAV-323-BR", gender: Gender.WOMEN, color: "Brown", sizes: [4,5,6,7,8], sole: "Tpr", upperMaterial: "Synthetic", category: "Boots", subCategory: "Chelsea Boots", price: 3999, salePrice: 999, description: "A pair of dark brown, heeled Chelsea boots with elastic side panels and a rounded toe, suitable for casual and formal wear." },
  // 02
  { parentSku: "WAV-324-BL", gender: Gender.WOMEN, color: "Black", sizes: [4,5,6,7,8], sole: "Rubber", upperMaterial: "Synthetic", category: "Boots", subCategory: "Casual", price: 3999, salePrice: 999, description: "Step up your style with these Roadster women's black high-top boots, designed for a trendy and contemporary look. Featuring a sleek silhouette, lace-up closure, soft-textured finish and a contrasting white lugged sole, these boots add a bold edge to everyday outfits. The padded collar and cushioned interior provide a comfortable feel, while the sturdy sole offers reliable traction. Pair them with jeans, dresses, skirts or casual outfits for stylish everyday, weekend and winter-ready looks." },
  // 03
  { parentSku: "WAV-324-BLU", gender: Gender.WOMEN, color: "Blue", sizes: [4,5,6,7,8], sole: "Rubber", upperMaterial: "Synthetic", category: "Boots", subCategory: "Casual", price: 3999, salePrice: 999, description: "Step up your style with these Roadster women's blue high-top boots, designed for a trendy and contemporary look. Featuring a sleek silhouette, lace-up closure, soft-textured finish and a contrasting white lugged sole, these boots add a bold edge to everyday outfits. The padded collar and cushioned interior provide a comfortable feel, while the sturdy sole offers reliable traction. Pair them with jeans, dresses, skirts or casual outfits for stylish everyday, weekend and winter-ready looks." },
  // 04
  { parentSku: "WAV-324-PINK", gender: Gender.WOMEN, color: "Pink", sizes: [4,5,6,7,8], sole: "Rubber", upperMaterial: "Synthetic", category: "Boots", subCategory: "Casual", price: 3999, salePrice: 999, description: "Step up your style with these Roadster women's pink high-top boots, designed for a trendy and contemporary look. Featuring a sleek silhouette, lace-up closure, soft-textured finish and a contrasting white lugged sole, these boots add a bold edge to everyday outfits. The padded collar and cushioned interior provide a comfortable feel, while the sturdy sole offers reliable traction. Pair them with jeans, dresses, skirts or casual outfits for stylish everyday, weekend and winter-ready looks." },
  // 05
  { parentSku: "BP-5111-WT", gender: Gender.MEN, color: "White", sizes: [6,7,8,9,10], sole: "Rubber", upperMaterial: "Synthetic", category: "Casual", subCategory: "High Top Shoes", price: 3999, salePrice: 999, description: "A pair of high-top sneakers featuring a lace-up closure with an ankle strap for extra support and stability. The design includes a padded collar and soft insole for all-day comfort, a durable high-grip rubber outsole for superior traction, and premium craftsmanship with precision stitching. The shoes are suitable for casual wear and everyday use." },
  // 06
  { parentSku: "BP-5111-CR", gender: Gender.MEN, color: "Cream", sizes: [6,7,8,9,10], sole: "Rubber", upperMaterial: "Synthetic", category: "Casual", subCategory: "High Top Shoes", price: 3999, salePrice: 999, description: "A pair of high-top sneakers featuring a lace-up closure with an ankle strap for extra support and stability. The design includes a padded collar and soft insole for all-day comfort, a durable high-grip rubber outsole for superior traction, and premium craftsmanship with precision stitching. The shoes are suitable for casual wear and everyday use." },
  // 07
  { parentSku: "BP-5111-BR", gender: Gender.MEN, color: "Brown", sizes: [6,7,8,9,10], sole: "Rubber", upperMaterial: "Synthetic", category: "Casual", subCategory: "High Top Shoes", price: 3999, salePrice: 999, description: "A pair of high-top sneakers featuring a lace-up closure with an ankle strap for extra support and stability. The design includes a padded collar and soft insole for all-day comfort, a durable high-grip rubber outsole for superior traction, and premium craftsmanship with precision stitching. The shoes are suitable for casual wear and everyday use." },
  // 08
  { parentSku: "DMD-411-WT", gender: Gender.MEN, color: "White", sizes: [6,7,8,9,10], sole: "Rubber", upperMaterial: "Synthetic Leather", category: "Casual", subCategory: "High Tops", price: 4999, salePrice: 999, description: "A pair of high-top sneakers featuring a white mesh upper with olive green suede overlays on the toe and heel, a tan suede collar, a white midsole, and a gum-colored outsole. The shoe has a grey 'K' logo on the side and the brand name 'Knoos' on the tongue." },
  // 09
  { parentSku: "DMD-412-BL", gender: Gender.MEN, color: "Black", sizes: [6,7,8,9,10], sole: "Rubber", upperMaterial: "Synthetic", category: "Casual", subCategory: "High Tops", price: 3999, salePrice: 999, description: "A stylish high-top sneaker boot from the brand 'Knoos', featuring a grey, black, and white color scheme with a thick white platform sole. It includes a padded collar, secure lacing system, durable toe cap, cushioned midsole, and anti-skid outsole for all-day comfort and support." },
  // 10
  { parentSku: "DMD-412-GREY", gender: Gender.MEN, color: "Grey", sizes: [6,7,8,9,10], sole: "Rubber", upperMaterial: "Synthetic", category: "Casual", subCategory: "High Tops", price: 3999, salePrice: 999, description: "A stylish high-top sneaker boot from the brand 'Knoos', featuring a grey, black, and white color scheme with a thick white platform sole. It includes a padded collar, secure lacing system, durable toe cap, cushioned midsole, and anti-skid outsole for all-day comfort and support." },
  // 11
  { parentSku: "DMD-412-TAN", gender: Gender.MEN, color: "Tan", sizes: [6,7,8,9,10], sole: "Rubber", upperMaterial: "Synthetic", category: "Casual", subCategory: "High Tops", price: 3999, salePrice: 999, description: "A stylish high-top sneaker boot from the brand 'Knoos', featuring a tan, black, and white color scheme with a thick white platform sole. It includes a padded collar, secure lacing system, durable toe cap, cushioned midsole, and anti-skid outsole for all-day comfort and support." },
  // 12
  { parentSku: "DMD-413-BL", gender: Gender.MEN, color: "Black", sizes: [6,7,8,9,10], sole: "Rubber", upperMaterial: "Synthetic", category: "Casual", subCategory: "High Tops", price: 3999, salePrice: 1299, description: "Men's high-top sneakers featuring a breathable mesh upper, premium synthetic overlays, a padded collar for comfort, and a cushioned midsole for shock absorption. The durable rubber outsole offers excellent grip and traction. These sneakers are designed for all-day comfort and stylish everyday wear." },
  // 13
  { parentSku: "DMD-413-BLU", gender: Gender.MEN, color: "Blue", sizes: [6,7,8,9,10], sole: "Rubber", upperMaterial: "Synthetic", category: "Casual", subCategory: "High Tops", price: 3999, salePrice: 1299, description: "Men's high-top sneakers featuring a breathable mesh upper, premium synthetic overlays, a padded collar for comfort, and a cushioned midsole for shock absorption. The durable rubber outsole offers excellent grip and traction. These sneakers are designed for all-day comfort and stylish everyday wear." },
  // 14
  { parentSku: "DMD-413-TAN", gender: Gender.MEN, color: "Tan", sizes: [6,7,8,9,10], sole: "Rubber", upperMaterial: "Synthetic", category: "Casual", subCategory: "High Tops", price: 3999, salePrice: 1299, description: "Men's high-top sneakers featuring a breathable mesh upper, premium synthetic overlays, a padded collar for comfort, and a cushioned midsole for shock absorption. The durable rubber outsole offers excellent grip and traction. These sneakers are designed for all-day comfort and stylish everyday wear." },
  // 15
  { parentSku: "LD-114-CR", gender: Gender.WOMEN, color: "Cream", sizes: [4,5,6,7,8], sole: "Pu", upperMaterial: "Synthetic", category: "Casual", subCategory: "Sneakers", price: 2999, salePrice: 899, description: "A pair of cream-coloured sneakers made from PU leather with a cushioned, comfortable sole. Features a lace-up closure, sleek low-top design, and a soft, lightweight construction. Perfect for casual, everyday wear with a minimalist style." },
  // 16
  { parentSku: "KT-219-BL", gender: Gender.WOMEN, color: "Black", sizes: [4,5,6,7,8], sole: "Rubber", upperMaterial: "Synthetic", category: "Casual", subCategory: "Hightop Chunky Sneaker", price: 3999, salePrice: 999, description: "A pair of women's high-top chunky sneakers featuring a thick platform sole, padded collar for extra comfort, and a bold, statement-making silhouette. The lace-up design with metal eyelets adds a stylish touch, while the rugged outsole provides excellent traction. Perfect for street-style fashion and casual outings." },
  // 17
  { parentSku: "KT-219-GREY", gender: Gender.WOMEN, color: "Grey", sizes: [4,5,6,7,8], sole: "Rubber", upperMaterial: "Synthetic", category: "Casual", subCategory: "Hightop Chunky Sneaker", price: 3999, salePrice: 999, description: "A pair of women's high-top chunky sneakers featuring a thick platform sole, padded collar for extra comfort, and a bold, statement-making silhouette. The lace-up design with metal eyelets adds a stylish touch, while the rugged outsole provides excellent traction. Perfect for street-style fashion and casual outings." },
  // 18
  { parentSku: "KT-219-PINK", gender: Gender.WOMEN, color: "Pink", sizes: [4,5,6,7,8], sole: "Rubber", upperMaterial: "Synthetic", category: "Casual", subCategory: "Hightop Chunky Sneaker", price: 3999, salePrice: 999, description: "A pair of women's high-top chunky sneakers featuring a thick platform sole, padded collar for extra comfort, and a bold, statement-making silhouette. The lace-up design with metal eyelets adds a stylish touch, while the rugged outsole provides excellent traction. Perfect for street-style fashion and casual outings." },
  // 19
  { parentSku: "UD-6000-BL", gender: Gender.MEN, color: "Black", sizes: [6,7,8,9,10], sole: "Tpr", upperMaterial: "Synthetic Leather", category: "Boots", subCategory: "Casuals", price: 4999, salePrice: 1399, description: "A pair of men's casual ankle-length boots from the brand 'Roadster', crafted with a soft synthetic leather upper and a comfortable TPR sole. Featuring a sleek pull-on design with side elastic panels for easy wear, these boots are ideal for both casual and semi-formal occasions." },
  // 20
  { parentSku: "UD-6000-BR", gender: Gender.MEN, color: "Brown", sizes: [6,7,8,9,10], sole: "Tpr", upperMaterial: "Synthetic Leather", category: "Boots", subCategory: "Casuals", price: 4999, salePrice: 1399, description: "A pair of men's casual ankle-length boots from the brand 'Roadster', crafted with a soft synthetic leather upper and a comfortable TPR sole. Featuring a sleek pull-on design with side elastic panels for easy wear, these boots are ideal for both casual and semi-formal occasions." },
  // 21
  { parentSku: "UD-6004-BL", gender: Gender.MEN, color: "Black", sizes: [6,7,8,9,10], sole: "Tpr", upperMaterial: "Synthetic Leather", category: "Boots", subCategory: "Casuals", price: 3999, salePrice: 1399, description: "A pair of men's casual ankle-length boots from the brand 'Roadster', crafted with a soft synthetic leather upper and a comfortable TPR sole. Featuring a sleek pull-on design with side elastic panels for easy wear, these boots are ideal for both casual and semi-formal occasions." },
  // 22
  { parentSku: "UD-6004-BR", gender: Gender.MEN, color: "Brown", sizes: [6,7,8,9,10], sole: "Tpr", upperMaterial: "Synthetic Leather", category: "Boots", subCategory: "Casuals", price: 3999, salePrice: 1399, description: "A pair of men's casual ankle-length boots from the brand 'Roadster', crafted with a soft synthetic leather upper and a comfortable TPR sole. Featuring a sleek pull-on design with side elastic panels for easy wear, these boots are ideal for both casual and semi-formal occasions." },
  // 23
  { parentSku: "UD-5101-BR", gender: Gender.MEN, color: "Brown", sizes: [6,7,8,9,10], sole: "Tpr", upperMaterial: "Synthetic", category: "Boots", subCategory: "Chelsea Boots", price: 3999, salePrice: 1299, description: null },
  // 24
  { parentSku: "UD-5101-TAN", gender: Gender.MEN, color: "Tan", sizes: [6,7,8,9,10], sole: "Tpr", upperMaterial: "Synthetic", category: "Boots", subCategory: "Chelsea Boots", price: 3999, salePrice: 1299, description: null },
  // 25
  { parentSku: "UD-5200-BL", gender: Gender.MEN, color: "Black", sizes: [6,7,8,9,10], sole: "Tpr", upperMaterial: "Synthetic", category: "Boots", subCategory: "Chelsea Boots", price: 3999, salePrice: 1299, description: null },
  // 26
  { parentSku: "UD-5200-BLU", gender: Gender.MEN, color: "Blue", sizes: [6,7,8,9,10], sole: "Tpr", upperMaterial: "Synthetic", category: "Boots", subCategory: "Chelsea Boots", price: 3999, salePrice: 1299, description: null },
  // 27
  { parentSku: "UD-5200-GREY", gender: Gender.MEN, color: "Grey", sizes: [6,7,8,9,10], sole: "Tpr", upperMaterial: "Synthetic", category: "Boots", subCategory: "Chelsea Boots", price: 3999, salePrice: 1299, description: null },
  // 28
  { parentSku: "WD-301-BL", gender: Gender.MEN, color: "Black", sizes: [6,7,8,9,10], sole: "Tpr", upperMaterial: "Leather", category: "Casual Shoe", subCategory: "Casual Shoe", price: 3999, salePrice: null, description: "A pair of men's casual shoes crafted from genuine leather with a soft, supple feel and a comfortable TPR sole. The tan leather upper gives a classic, timeless look with a lace-up closure for a secure fit. The cushioned insole and padded collar provide all-day comfort, while the durable outsole ensures reliable traction on various surfaces." },
  // 29
  { parentSku: "WD-301-TAN", gender: Gender.MEN, color: "Tan", sizes: [6,7,8,9,10], sole: "Tpr", upperMaterial: "Leather", category: "Casual Shoe", subCategory: "Casual Shoe", price: 3999, salePrice: null, description: "A pair of men's casual shoes crafted from genuine leather with a soft, supple feel and a comfortable TPR sole. The tan leather upper gives a classic, timeless look with a lace-up closure for a secure fit. The cushioned insole and padded collar provide all-day comfort, while the durable outsole ensures reliable traction on various surfaces." },
  // 30
  { parentSku: "WD-302-BL", gender: Gender.MEN, color: "Black", sizes: [6,7,8,9,10], sole: "Tpr", upperMaterial: "Leather", category: "Casual Shoe", subCategory: "Casual Shoe", price: 3999, salePrice: null, description: "A pair of men's casual shoes crafted from genuine leather with a soft, supple feel and a comfortable TPR sole. The tan leather upper gives a classic, timeless look with a lace-up closure for a secure fit. The cushioned insole and padded collar provide all-day comfort, while the durable outsole ensures reliable traction on various surfaces." },
  // 31
  { parentSku: "WD-302-TAN", gender: Gender.MEN, color: "Tan", sizes: [6,7,8,9,10], sole: "Tpr", upperMaterial: "Leather", category: "Casual Shoe", subCategory: "Casual Shoe", price: 3999, salePrice: null, description: "A pair of men's casual shoes crafted from genuine leather with a soft, supple feel and a comfortable TPR sole. The tan leather upper gives a classic, timeless look with a lace-up closure for a secure fit. The cushioned insole and padded collar provide all-day comfort, while the durable outsole ensures reliable traction on various surfaces." },
]);

// ═══════════════════════════════════════════════════════════════════════════════
// DERIVED CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const IMPORT_TOTAL_PARENTS = PRODUCTS.length; // 31
export const IMPORT_TOTAL_VARIANTS = PRODUCTS.reduce((sum, p) => sum + p.sizes.length, 0); // 155

export const IMPORT_REQUIRED_CATEGORIES = Object.freeze([
  { source: "Boots", canonical: "boots", slug: "boots" },
  { source: "Casual", canonical: "casuals", slug: "casuals" },
  { source: "Casual Shoe", canonical: "casual-shoe", slug: "casual-shoe" },
]);

export { Gender, ProductStatus, normalizeCategoryName, slugify };
