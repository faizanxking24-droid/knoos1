import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  SPLASH_IMAGE,
  SPLASH_STORAGE_KEY,
  SPLASH_HOLD_MS,
  SPLASH_EXIT_DURATION_S,
  shouldShowInitialSplash,
  markInitialSplashSeen,
} from "../src/components/InitialSiteSplash";

class MockSessionStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("InitialSiteSplash & Session Gating", () => {
  describe("1. Configuration Constants", () => {
    it("uses swappable SPLASH_IMAGE constant pointing to existing KNOOS asset", () => {
      assert.strictEqual(typeof SPLASH_IMAGE, "string");
      assert.strictEqual(SPLASH_IMAGE, "/knoos-logo-sm.webp");

      // Verify asset exists in public directory
      const assetPath = path.join(process.cwd(), "public", SPLASH_IMAGE.replace(/^\//, ""));
      assert.strictEqual(fs.existsSync(assetPath), true, `Asset must exist at ${assetPath}`);
    });

    it("uses standard knoos-initial-splash-seen sessionStorage key", () => {
      assert.strictEqual(SPLASH_STORAGE_KEY, "knoos-initial-splash-seen");
    });

    it("targets ~900ms total visible duration (800-1200ms range)", () => {
      const totalDurationMs = SPLASH_HOLD_MS + SPLASH_EXIT_DURATION_S * 1000;
      assert.strictEqual(totalDurationMs >= 800 && totalDurationMs <= 1200, true);
      assert.strictEqual(totalDurationMs, 950);
    });
  });

  describe("2. Session Gating Logic", () => {
    it("A. First Entry: returns true when splash has not been seen", () => {
      const storage = new MockSessionStorage();
      const shouldShow = shouldShowInitialSplash({ storage });
      assert.strictEqual(shouldShow, true);
    });

    it("B. Marks splash as seen in sessionStorage", () => {
      const storage = new MockSessionStorage();
      assert.strictEqual(storage.getItem(SPLASH_STORAGE_KEY), null);
      markInitialSplashSeen({ storage });
      assert.strictEqual(storage.getItem(SPLASH_STORAGE_KEY), "true");
    });

    it("C. Internal Navigation & Reload in Same Tab: returns false once seen", () => {
      const storage = new MockSessionStorage();
      markInitialSplashSeen({ storage });
      const shouldShow = shouldShowInitialSplash({ storage });
      assert.strictEqual(shouldShow, false);
    });

    it("D. Handles null/unavailable storage gracefully without throwing", () => {
      const shouldShow = shouldShowInitialSplash({ storage: null });
      assert.strictEqual(shouldShow, false);

      // Should not throw on mark
      assert.doesNotThrow(() => {
        markInitialSplashSeen({ storage: null });
      });
    });

    it("E. Handles throwing storage (private browsing restrictions) gracefully", () => {
      const throwingStorage = {
        getItem: () => {
          throw new Error("QuotaExceededError");
        },
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
      } as unknown as Storage;

      const shouldShow = shouldShowInitialSplash({ storage: throwingStorage });
      assert.strictEqual(shouldShow, false);

      assert.doesNotThrow(() => {
        markInitialSplashSeen({ storage: throwingStorage });
      });
    });
  });

  describe("3. Architecture & Accessibility Invariants", () => {
    const splashFilePath = path.join(process.cwd(), "src/components/InitialSiteSplash.tsx");
    const splashCode = fs.readFileSync(splashFilePath, "utf8");

    it("uses useReducedMotion to respect accessibility preferences", () => {
      assert.strictEqual(splashCode.includes("useReducedMotion"), true);
    });

    it("marks overlay with role='presentation' and aria-hidden='true' to avoid screen reader noise", () => {
      assert.strictEqual(splashCode.includes('role="presentation"'), true);
      assert.strictEqual(splashCode.includes('aria-hidden="true"'), true);
    });

    it("restores body overflow on unmount and exit completion", () => {
      assert.strictEqual(splashCode.includes("overflow = originalOverflow"), true);
      assert.strictEqual(splashCode.includes("onExitComplete"), true);
    });

    it("does NOT intercept router popstate or history APIs", () => {
      assert.strictEqual(splashCode.includes("popstate"), false);
      assert.strictEqual(splashCode.includes("pushState"), false);
      assert.strictEqual(splashCode.includes("replaceState"), false);
    });

    it("is mounted in src/app/layout.tsx", () => {
      const layoutFilePath = path.join(process.cwd(), "src/app/layout.tsx");
      const layoutCode = fs.readFileSync(layoutFilePath, "utf8");
      assert.strictEqual(layoutCode.includes("InitialSiteSplash"), true);
      assert.strictEqual(layoutCode.includes("<InitialSiteSplash />"), true);
    });
  });
});
