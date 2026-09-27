import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Cart user foreign-key production repair", () => {
  const root = join(import.meta.dirname, "..");
  const migration = readFileSync(
    join(root, "prisma/migrations/20260927150000_repair_cart_user_foreign_key/migration.sql"),
    "utf8"
  );
  const route = readFileSync(join(root, "src/app/api/cart/route.ts"), "utf8");

  it("recreates Cart.userId against the current User.id without deleting data", () => {
    assert.match(migration, /DROP FOREIGN KEY `Cart_userId_fkey`/);
    assert.match(migration, /FOREIGN KEY \(`userId`\) REFERENCES `User`\(`id`\)/);
    assert.doesNotMatch(migration, /DELETE FROM|DROP TABLE|TRUNCATE/i);
  });

  it("returns an actionable response if a host skipped the repair migration", () => {
    assert.match(route, /err\?\.code === "P2003"/);
    assert.match(route, /CART_USER_LINK_UNAVAILABLE/);
    assert.match(route, /status: 503/);
  });
});
