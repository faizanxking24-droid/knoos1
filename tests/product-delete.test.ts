import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAdminProductWhere,
  DELETED_PRODUCT_STATUS,
  softDeleteProducts,
  visibleFamilyWhere,
  visibleProductWhere,
} from "../src/lib/product-deletion";

type Row = { id: string; status: string };

function memoryStore(rows: Row[]) {
  return {
    rows,
    product: {
      async updateMany(args: { where: { id: { in: string[] }; status: { not: string } }; data: { status: string } }) {
        let count = 0;
        for (const row of rows) {
          if (args.where.id.in.includes(row.id) && row.status !== args.where.status.not) {
            row.status = args.data.status;
            count++;
          }
        }
        return { count };
      },
    },
  };
}

const filters = (status?: string) => buildAdminProductWhere({
  status,
  validGenders: ["MEN", "WOMEN"],
  validStatuses: ["ACTIVE", "INACTIVE", "DRAFT"],
});

describe("admin product soft deletion", () => {
  it("marks an active product DELETED while preserving its row", async () => {
    const store = memoryStore([{ id: "active", status: "ACTIVE" }]);
    const result = await softDeleteProducts(store, ["active"]);
    assert.equal(result.count, 1);
    assert.equal(store.rows.length, 1, "soft delete must preserve the Product row");
    assert.equal(store.rows[0]?.status, DELETED_PRODUCT_STATUS);
  });

  it("does not count an already deleted product twice", async () => {
    const store = memoryStore([{ id: "deleted", status: "DELETED" }]);
    assert.equal((await softDeleteProducts(store, ["deleted"])).count, 0);
  });

  it("excludes DELETED but retains INACTIVE in an unfiltered admin list", () => {
    assert.deepEqual(filters(), { status: { not: "DELETED" } });
  });

  it("uses an exact INACTIVE filter, which cannot return DELETED products", () => {
    assert.deepEqual(filters("INACTIVE"), { status: "INACTIVE" });
  });

  it("never accepts DELETED as a normal admin-list status filter", () => {
    assert.deepEqual(filters("DELETED"), { status: { not: "DELETED" } });
  });

  it("excludes a deleted colorway when loading a family through a sibling", () => {
    assert.deepEqual(
      visibleFamilyWhere({ id: "brown", status: "ACTIVE", colorGroupKey: "chelsea" }),
      { colorGroupKey: "chelsea", status: { not: "DELETED" } },
    );
  });

  it("treats a deleted family source as missing", () => {
    assert.equal(visibleFamilyWhere({ id: "black", status: "DELETED", colorGroupKey: "chelsea" }), null);
  });

  it("builds direct product reads so deleted products behave as missing", () => {
    assert.deepEqual(visibleProductWhere("deleted"), {
      id: "deleted",
      status: { not: "DELETED" },
    });
  });
});
