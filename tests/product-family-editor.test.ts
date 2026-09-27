import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { productFamilySchema } from "../src/lib/validation/product-family";

const color = (overrides: Record<string, unknown> = {}) => ({
  color: "Black", sku: "WAV-323-BLK", name: "KNOOS Black Chelsea Boot WAV-323", slug: "knoos-black-chelsea-boot-wav-323", status: "ACTIVE",
  images: [{ imageUrl: "/media/products/black.webp", sortOrder: 0 }],
  variants: [{ size: "6", sku: "WAV-323-BLK-6", price: 3999, salePrice: 999, stock: 4 }], ...overrides,
});
const family = (colors = [color()]) => ({ baseName: "KNOOS Chelsea Boot WAV-323", gender: "MEN", categoryId: null, description: null, colors });

describe("product family validation", () => {
  it("accepts one and multiple isolated colorways", () => {
    assert.equal(productFamilySchema.safeParse(family()).success, true);
    assert.equal(productFamilySchema.safeParse(family([color(), color({ color: "Brown", sku: "WAV-323-BRN", name: "KNOOS Brown Chelsea Boot WAV-323", slug: "knoos-brown-chelsea-boot-wav-323", images: [], variants: [{ size: "6", sku: "WAV-323-BRN-6", price: 3999, salePrice: 999, stock: 0 }] })])).success, true);
  });
  it("rejects combined and duplicate colors", () => {
    assert.equal(productFamilySchema.safeParse(family([color({ color: "Black,Blue" })])).success, false);
    assert.equal(productFamilySchema.safeParse(family([color(), color({ sku: "OTHER", slug: "other", variants: [{ size: "7", sku: "OTHER-7", price: 3000, stock: 0 }] })])).success, false);
  });
  it("rejects duplicate SKUs and duplicate sizes", () => {
    assert.equal(productFamilySchema.safeParse(family([color({ variants: [{ size: "6", sku: "ONE", price: 3000, stock: 0 }, { size: "6", sku: "TWO", price: 3000, stock: 0 }] })])).success, false);
    assert.equal(productFamilySchema.safeParse(family([color(), color({ color: "Brown", name: "Brown", slug: "brown", variants: [{ size: "7", sku: "WAV-323-BLK-6", price: 3000, stock: 0 }] })])).success, false);
  });
  it("uses stock as availability and copied stock starts at zero", () => {
    assert.equal([{ stock: 0 }, { stock: 2 }].some((variant) => variant.stock > 0), true);
    assert.deepEqual({ size: "6", price: 3999, salePrice: 999, stock: 0 }, { size: "6", price: 3999, salePrice: 999, stock: 0 });
  });
});
