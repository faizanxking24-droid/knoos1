import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  shouldTriggerNavigationLoader,
  LOADER_DEBOUNCE_MS,
  LOADER_FALLBACK_TIMEOUT_MS,
} from "../src/components/PageTransitionLoader";

describe("PageTransitionLoader & Navigation Timing", () => {
  const CURRENT_HREF = "https://knoos.in/products";

  describe("1. Timing Constants", () => {
    it("uses 300ms debounce to prevent flashing on fast page transitions", () => {
      assert.strictEqual(LOADER_DEBOUNCE_MS, 300);
    });

    it("uses 2000ms defensive fallback timeout to dismiss loader if navigation aborts", () => {
      assert.strictEqual(LOADER_FALLBACK_TIMEOUT_MS, 2000);
    });
  });

  describe("2. Navigation Trigger Logic", () => {
    it("triggers loader on internal forward page transition", () => {
      const result = shouldTriggerNavigationLoader({
        targetHref: "https://knoos.in/products/classic-derby",
        currentHref: CURRENT_HREF,
      });
      assert.strictEqual(result, true);
    });

    it("triggers loader on relative internal link", () => {
      const result = shouldTriggerNavigationLoader({
        targetHref: "/collections/men",
        currentHref: CURRENT_HREF,
      });
      assert.strictEqual(result, true);
    });

    it("triggers loader on query parameter transition", () => {
      const result = shouldTriggerNavigationLoader({
        targetHref: "/products?category=loafers",
        currentHref: CURRENT_HREF,
      });
      assert.strictEqual(result, true);
    });

    it("does not trigger loader on identical page and query navigation", () => {
      const result = shouldTriggerNavigationLoader({
        targetHref: "https://knoos.in/products",
        currentHref: CURRENT_HREF,
      });
      assert.strictEqual(result, false);
    });

    it("does not trigger loader on hash navigation within current page", () => {
      const result = shouldTriggerNavigationLoader({
        targetHref: "#specifications",
        currentHref: CURRENT_HREF,
      });
      assert.strictEqual(result, false);
    });

    it("does not trigger loader on external origin", () => {
      const result = shouldTriggerNavigationLoader({
        targetHref: "https://instagram.com/knoos_footwear",
        currentHref: CURRENT_HREF,
      });
      assert.strictEqual(result, false);
    });

    it("does not trigger loader on non-primary mouse clicks (middle/right click)", () => {
      const middleClick = shouldTriggerNavigationLoader({
        targetHref: "/products/classic-derby",
        currentHref: CURRENT_HREF,
        button: 1,
      });
      const rightClick = shouldTriggerNavigationLoader({
        targetHref: "/products/classic-derby",
        currentHref: CURRENT_HREF,
        button: 2,
      });
      assert.strictEqual(middleClick, false);
      assert.strictEqual(rightClick, false);
    });

    it("does not trigger loader on modifier keys (new tab/window navigation)", () => {
      assert.strictEqual(
        shouldTriggerNavigationLoader({
          targetHref: "/products/classic-derby",
          currentHref: CURRENT_HREF,
          ctrlKey: true,
        }),
        false
      );
      assert.strictEqual(
        shouldTriggerNavigationLoader({
          targetHref: "/products/classic-derby",
          currentHref: CURRENT_HREF,
          metaKey: true,
        }),
        false
      );
      assert.strictEqual(
        shouldTriggerNavigationLoader({
          targetHref: "/products/classic-derby",
          currentHref: CURRENT_HREF,
          shiftKey: true,
        }),
        false
      );
      assert.strictEqual(
        shouldTriggerNavigationLoader({
          targetHref: "/products/classic-derby",
          currentHref: CURRENT_HREF,
          altKey: true,
        }),
        false
      );
    });

    it("does not trigger loader on target='_blank' or target='_parent'", () => {
      assert.strictEqual(
        shouldTriggerNavigationLoader({
          targetHref: "/products/classic-derby",
          targetAttr: "_blank",
          currentHref: CURRENT_HREF,
        }),
        false
      );
      assert.strictEqual(
        shouldTriggerNavigationLoader({
          targetHref: "/products/classic-derby",
          targetAttr: "_parent",
          currentHref: CURRENT_HREF,
        }),
        false
      );
    });

    it("does not trigger loader on download links", () => {
      const result = shouldTriggerNavigationLoader({
        targetHref: "/catalogs/winter-2026.pdf",
        hasDownload: true,
        currentHref: CURRENT_HREF,
      });
      assert.strictEqual(result, false);
    });

    it("does not trigger loader on static assets / media files", () => {
      const assets = [
        "/images/banner.webp",
        "/media/products/shoe.jpg",
        "/media/products/shoe.mp4",
        "/media/products/shoe.webm",
        "/docs/invoice.pdf",
        "/favicon.ico",
      ];
      for (const asset of assets) {
        assert.strictEqual(
          shouldTriggerNavigationLoader({
            targetHref: asset,
            currentHref: CURRENT_HREF,
          }),
          false,
          `Expected static asset ${asset} not to trigger page loader`
        );
      }
    });

    it("does not trigger loader on API routes", () => {
      assert.strictEqual(
        shouldTriggerNavigationLoader({
          targetHref: "/api/products/search?q=oxford",
          currentHref: CURRENT_HREF,
        }),
        false
      );
    });

    it("does not trigger loader on mailto:, tel:, or javascript: protocols", () => {
      assert.strictEqual(
        shouldTriggerNavigationLoader({
          targetHref: "mailto:support@knoos.in",
          currentHref: CURRENT_HREF,
        }),
        false
      );
      assert.strictEqual(
        shouldTriggerNavigationLoader({
          targetHref: "tel:+919876543210",
          currentHref: CURRENT_HREF,
        }),
        false
      );
      assert.strictEqual(
        shouldTriggerNavigationLoader({
          targetHref: "javascript:void(0)",
          currentHref: CURRENT_HREF,
        }),
        false
      );
    });

    it("does not trigger loader when event was already defaultPrevented", () => {
      assert.strictEqual(
        shouldTriggerNavigationLoader({
          targetHref: "/products/classic-derby",
          currentHref: CURRENT_HREF,
          defaultPrevented: true,
        }),
        false
      );
    });
  });

  describe("3. Code Architecture & Invariants", () => {
    const loaderFilePath = path.join(process.cwd(), "src/components/PageTransitionLoader.tsx");
    const loaderCode = fs.readFileSync(loaderFilePath, "utf8");

    it("does NOT contain popstate event listener (browser back/forward must be instant)", () => {
      assert.strictEqual(
        loaderCode.includes("popstate"),
        false,
        "PageTransitionLoader.tsx must not listen to popstate"
      );
    });

    it("does NOT monkey-patch window.history.pushState or replaceState", () => {
      assert.strictEqual(
        loaderCode.includes("window.history.pushState"),
        false,
        "PageTransitionLoader.tsx must not overwrite pushState"
      );
      assert.strictEqual(
        loaderCode.includes("window.history.replaceState"),
        false,
        "PageTransitionLoader.tsx must not overwrite replaceState"
      );
    });

    it("uses pointer-events-none on backdrop to avoid trapping clicks during transition", () => {
      assert.strictEqual(
        loaderCode.includes("pointer-events-none"),
        true,
        "Overlay must include pointer-events-none"
      );
    });
  });
});
