import { describe, it } from "node:test";
import assert from "node:assert/strict";
import packageJson from "../package.json" with { type: "json" };

describe("production startup", () => {
  it("applies pending Prisma migrations before accepting traffic", () => {
    assert.equal(packageJson.scripts.start, "prisma migrate deploy && next start");
  });
});
