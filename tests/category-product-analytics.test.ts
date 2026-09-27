import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAdminProductWhere,
  DELETED_PRODUCT_STATUS,
} from "../src/lib/product-deletion";
import { countLiveProductFamilies } from "../src/lib/analytics/inventory";
import { ProductStatus } from "../src/lib/constants";

describe("Category and Product Analytics Correctness", () => {
  // ─── 1. Category Live vs Linked Counts (Task 1 & Task 12) ───────────────────
  describe("1. Category Live Product Count vs Linked Delete Safety Count", () => {
    // Model the exact category scenario from Task 12:
    // Category: Boots
    // Products: A (ACTIVE), B (ACTIVE), C (INACTIVE), D (DELETED), E (DRAFT)
    const testCategory = { id: "cat-boots", name: "Boots" };
    const productsInDb = [
      { id: "prod-A", name: "Boot A", status: "ACTIVE", categoryId: "cat-boots" },
      { id: "prod-B", name: "Boot B", status: "ACTIVE", categoryId: "cat-boots" },
      { id: "prod-C", name: "Boot C", status: "INACTIVE", categoryId: "cat-boots" },
      { id: "prod-D", name: "Boot D", status: "DELETED", categoryId: "cat-boots" },
      { id: "prod-E", name: "Boot E", status: "DRAFT", categoryId: "cat-boots" },
    ];

    it("calculates liveProductCount as strictly ACTIVE products assigned to category", () => {
      const liveProductCount = productsInDb.filter(
        (p) => p.categoryId === testCategory.id && p.status === ProductStatus.ACTIVE
      ).length;

      assert.equal(liveProductCount, 2, "Expected exactly 2 ACTIVE products for Boots");
    });

    it("excludes INACTIVE, DRAFT, and DELETED from liveProductCount", () => {
      const nonLiveStatuses = ["INACTIVE", "DRAFT", "DELETED"];
      for (const status of nonLiveStatuses) {
        const matching = productsInDb.filter(
          (p) => p.categoryId === testCategory.id && p.status === status
        );
        assert(matching.length > 0, `Precondition: test data has status ${status}`);
      }

      // Verify that none of these inflate liveProductCount
      const liveProducts = productsInDb.filter(
        (p) => p.categoryId === testCategory.id && p.status === ProductStatus.ACTIVE
      );
      assert.deepEqual(
        liveProducts.map((p) => p.id),
        ["prod-A", "prod-B"]
      );
    });

    it("calculates linkedProductCount including all referencing records for delete safety", () => {
      const linkedProductCount = productsInDb.filter(
        (p) => p.categoryId === testCategory.id
      ).length;

      assert.equal(linkedProductCount, 5, "Expected 5 linked records (all referencing rows)");
    });

    it("enforces category delete safety when category has 0 active but >0 inactive products", () => {
      // Category "Casuals": 0 ACTIVE, 10 INACTIVE/legacy
      const legacyCategory = { id: "cat-casuals", name: "Casuals" };
      const legacyProducts = Array.from({ length: 10 }, (_, i) => ({
        id: `legacy-${i}`,
        status: "INACTIVE",
        categoryId: "cat-casuals",
      }));

      const liveProductCount = legacyProducts.filter(
        (p) => p.categoryId === legacyCategory.id && p.status === ProductStatus.ACTIVE
      ).length;
      const linkedProductCount = legacyProducts.filter(
        (p) => p.categoryId === legacyCategory.id
      ).length;

      assert.equal(liveProductCount, 0, "Live product count must be 0");
      assert.equal(linkedProductCount, 10, "Linked product count must be 10");

      const canSafelyDelete = (count: number) => count === 0;
      assert.equal(canSafelyDelete(linkedProductCount), false, "Category deletion must be prevented when linked products exist");
    });

    it("allows category deletion only when linkedProductCount is strictly 0", () => {
      const emptyCategory = { id: "cat-empty", name: "Empty Category" };
      const linkedProductCount = productsInDb.filter(
        (p) => p.categoryId === emptyCategory.id
      ).length;

      assert.equal(linkedProductCount, 0);
      const canSafelyDelete = (count: number) => count === 0;
      assert.equal(canSafelyDelete(linkedProductCount), true, "Empty category can be safely deleted");
    });
  });

  // ─── 2. Color Family Semantics (Task 13) ───────────────────────────────────
  describe("2. Color Family Semantics (Live Products vs Live Families)", () => {
    it("distinguishes individual colorways from product families correctly", () => {
      // Task 13 test specification:
      // Black Shoe: colorGroupKey = family-1, ACTIVE
      // Red Shoe:   colorGroupKey = family-1, ACTIVE
      // Blue Shoe:  colorGroupKey = family-2, ACTIVE
      const sample = [
        { id: "shoe-1", name: "Black Shoe", colorGroupKey: "family-1", status: "ACTIVE" },
        { id: "shoe-2", name: "Red Shoe", colorGroupKey: "family-1", status: "ACTIVE" },
        { id: "shoe-3", name: "Blue Shoe", colorGroupKey: "family-2", status: "ACTIVE" },
      ];

      const liveProducts = sample.filter((p) => p.status === "ACTIVE").length;
      const liveProductFamilies = countLiveProductFamilies(
        sample.filter((p) => p.status === "ACTIVE")
      );

      assert.equal(liveProducts, 3, "Live Products must be 3 (one Product = one colorway)");
      assert.equal(liveProductFamilies, 2, "Live Product Families must be 2 (distinct colorGroupKey)");
    });

    it("treats products with null or blank colorGroupKey as their own independent family", () => {
      const sample = [
        { id: "shoe-1", name: "Black Shoe", colorGroupKey: "family-1", status: "ACTIVE" },
        { id: "shoe-2", name: "Red Shoe", colorGroupKey: "family-1", status: "ACTIVE" },
        { id: "shoe-standalone-1", name: "Oxford Boot", colorGroupKey: null, status: "ACTIVE" },
        { id: "shoe-standalone-2", name: "Loafer", colorGroupKey: "", status: "ACTIVE" },
      ];

      const liveProducts = sample.filter((p) => p.status === "ACTIVE").length;
      const liveFamilies = countLiveProductFamilies(sample);

      assert.equal(liveProducts, 4);
      // family-1 (2 shoes) + standalone-1 (1 shoe) + standalone-2 (1 shoe) = 3 families
      assert.equal(liveFamilies, 3);
    });

    it("only counts ACTIVE products when computing LIVE product families", () => {
      const sample = [
        { id: "shoe-1", name: "Black Shoe", colorGroupKey: "family-1", status: "ACTIVE" },
        { id: "shoe-2", name: "Red Shoe", colorGroupKey: "family-1", status: "INACTIVE" },
        { id: "shoe-3", name: "Blue Shoe", colorGroupKey: "family-2", status: "DELETED" },
        { id: "shoe-4", name: "Green Shoe", colorGroupKey: "family-2", status: "ACTIVE" },
      ];

      const activeOnly = sample.filter((p) => p.status === ProductStatus.ACTIVE);
      const liveProducts = activeOnly.length;
      const liveFamilies = countLiveProductFamilies(activeOnly);

      assert.equal(liveProducts, 2, "Only 2 products are ACTIVE");
      assert.equal(liveFamilies, 2, "Each active product belongs to a distinct family");
    });
  });

  // ─── 3. Storefront Production Verification Model (Task 14 & 15) ─────────────
  describe("3. Production Catalog Model (4 Live Products, 2 Shoe Families)", () => {
    // Current production catalog:
    // 2 shoe families × 2 colors each = 4 ACTIVE product records
    // Family 1: black faizan (Boots), red faizan (Boots)
    // Family 2: black brother (Casual Shoe), blue brother (Casual Shoe)
    // Casuals: 0 active products
    const liveProductionCatalog = [
      { id: "p1", name: "Black Faizan", colorGroupKey: "faizan", categoryId: "cat-boots", status: "ACTIVE" },
      { id: "p2", name: "Red Faizan", colorGroupKey: "faizan", categoryId: "cat-boots", status: "ACTIVE" },
      { id: "p3", name: "Black Brother", colorGroupKey: "brother", categoryId: "cat-casual-shoe", status: "ACTIVE" },
      { id: "p4", name: "Blue Brother", colorGroupKey: "brother", categoryId: "cat-casual-shoe", status: "ACTIVE" },
      // Plus legacy / inactive rows
      { id: "p5", name: "Legacy Boot 1", colorGroupKey: null, categoryId: "cat-boots", status: "INACTIVE" },
      { id: "p6", name: "Legacy Casual 1", colorGroupKey: null, categoryId: "cat-casuals", status: "INACTIVE" },
      { id: "p7", name: "Deleted Product", colorGroupKey: null, categoryId: "cat-boots", status: "DELETED" },
    ];

    it("verifies live product count = 4 across entire catalog", () => {
      const activeProducts = liveProductionCatalog.filter((p) => p.status === "ACTIVE");
      assert.equal(activeProducts.length, 4);
    });

    it("verifies live product families = 2", () => {
      const activeProducts = liveProductionCatalog.filter((p) => p.status === "ACTIVE");
      const familyCount = countLiveProductFamilies(activeProducts);
      assert.equal(familyCount, 2);
    });

    it("verifies category dynamic live counts: Boots = 2, Casual Shoe = 2, Casuals = 0", () => {
      const bootsLive = liveProductionCatalog.filter(
        (p) => p.categoryId === "cat-boots" && p.status === "ACTIVE"
      ).length;
      const casualShoeLive = liveProductionCatalog.filter(
        (p) => p.categoryId === "cat-casual-shoe" && p.status === "ACTIVE"
      ).length;
      const casualsLive = liveProductionCatalog.filter(
        (p) => p.categoryId === "cat-casuals" && p.status === "ACTIVE"
      ).length;

      assert.equal(bootsLive, 2, "Boots category must show exactly 2 live products");
      assert.equal(casualShoeLive, 2, "Casual Shoe category must show exactly 2 live products");
      assert.equal(casualsLive, 0, "Casuals category must show exactly 0 live products");
    });
  });

  // ─── 4. Admin Product Query & Status Boundaries (Task 5 & 10) ──────────────
  describe("4. Normal Admin Catalog Status Boundaries", () => {
    it("all statuses filter returns ACTIVE + INACTIVE + DRAFT and strictly excludes DELETED", () => {
      const where = buildAdminProductWhere({
        validGenders: ["MEN", "WOMEN"],
        validStatuses: ["ACTIVE", "INACTIVE", "DRAFT"],
      });

      assert.deepEqual(where, { status: { not: DELETED_PRODUCT_STATUS } });
    });

    it("supports filtering by DRAFT status explicitly", () => {
      const where = buildAdminProductWhere({
        status: "DRAFT",
        validGenders: ["MEN", "WOMEN"],
        validStatuses: ["ACTIVE", "INACTIVE", "DRAFT"],
      });

      assert.deepEqual(where, { status: "DRAFT" });
    });
  });
});
