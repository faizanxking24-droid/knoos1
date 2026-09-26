import { describe, it } from "node:test";
import assert from "node:assert";
import { resolveJwtUser } from "../src/lib/auth";
import { isOtpFeatureEnabled, requestOtpChallenge } from "../src/lib/otp";

describe("JWT User ID Resolution & Provider ID Isolation (Item 1 & 2)", () => {
  it("A. Google OAuth user resolves real Prisma database ID by email, NOT provider ID", async () => {
    const mockDb = {
      user: {
        findUnique: async ({ where }: any) => {
          if (where.email === "customer@example.com") {
            return {
              id: "real-prisma-user-id",
              email: "customer@example.com",
              role: "CUSTOMER",
            };
          }
          if (where.id === "google-provider-id") {
            throw new Error("Should NOT query DB by Google provider ID!");
          }
          return null;
        },
      },
    };

    const token: { id?: string; role?: string } = {};
    const user = {
      id: "google-provider-id",
      email: "customer@example.com",
    };

    const resolved = await resolveJwtUser({ token, user, db: mockDb });

    assert.strictEqual(
      resolved.id,
      "real-prisma-user-id",
      "Must resolve real Prisma User.id"
    );
    assert.notStrictEqual(
      resolved.id,
      "google-provider-id",
      "Must NOT leak Google provider ID into token.id"
    );
    assert.strictEqual(resolved.role, "CUSTOMER");
  });

  it("B. Phone OTP user with null email resolves database user by id", async () => {
    const mockDb = {
      user: {
        findUnique: async ({ where }: any) => {
          if (where.id === "real-phone-user-id") {
            return {
              id: "real-phone-user-id",
              email: null,
              role: "CUSTOMER",
            };
          }
          return null;
        },
      },
    };

    const token: { id?: string; role?: string } = {};
    const user = {
      id: "real-phone-user-id",
      email: null,
    };

    const resolved = await resolveJwtUser({ token, user, db: mockDb });

    assert.strictEqual(resolved.id, "real-phone-user-id");
    assert.strictEqual(resolved.role, "CUSTOMER");
  });

  it("C. Admin credentials user with email resolves correct database ID and ADMIN role", async () => {
    const mockDb = {
      user: {
        findUnique: async ({ where }: any) => {
          if (where.email === "admin@knoos.com") {
            return {
              id: "admin-prisma-id-123",
              email: "admin@knoos.com",
              role: "ADMIN",
            };
          }
          return null;
        },
      },
    };

    const token: { id?: string; role?: string } = {};
    const user = {
      id: "admin-prisma-id-123",
      email: "admin@knoos.com",
      role: "ADMIN",
    };

    const resolved = await resolveJwtUser({ token, user, db: mockDb });

    assert.strictEqual(resolved.id, "admin-prisma-id-123");
    assert.strictEqual(resolved.role, "ADMIN");
  });

  it("D. Existing valid token ID is NOT replaced with unverified provider ID if DB lookup fails", async () => {
    const mockDb = {
      user: {
        findUnique: async () => null, // DB lookup fails
      },
    };

    const token: { id?: string; role?: string } = {
      id: "previously-valid-db-id",
      role: "CUSTOMER",
    };
    const user = {
      id: "unverified-provider-id",
      email: "unknown@example.com",
    };

    const resolved = await resolveJwtUser({ token, user, db: mockDb });

    assert.strictEqual(
      resolved.id,
      "previously-valid-db-id",
      "Should preserve existing valid token ID"
    );
    assert.notStrictEqual(
      resolved.id,
      "unverified-provider-id",
      "Must not overwrite with unverified provider ID"
    );
  });

  it("E. Existing stale Google JWT self-heals token.id from token.email when user is absent", async () => {
    const mockDb = {
      user: {
        findUnique: async ({ where }: any) => {
          if (where.email === "customer@example.com") {
            return {
              id: "real-prisma-user-id",
              email: "customer@example.com",
              role: "CUSTOMER",
            };
          }
          return null;
        },
      },
    };

    // Simulate a JWT from a stale session where token.id still holds
    // the old Google provider ID instead of the real Prisma User.id.
    const token: { id?: string; role?: string; email?: string | null } = {
      id: "old-google-provider-id",
      email: "customer@example.com",
      role: "CUSTOMER",
    };

    // user is undefined — normal case for subsequent requests using
    // an existing session cookie/JWT.
    const user = undefined;

    const resolved = await resolveJwtUser({ token, user, db: mockDb });

    assert.strictEqual(
      resolved.id,
      "real-prisma-user-id",
      "token.id must self-heal to real Prisma User.id from token.email"
    );
    assert.notStrictEqual(
      resolved.id,
      "old-google-provider-id",
      "Must NOT retain old Google provider ID"
    );
    assert.strictEqual(resolved.role, "CUSTOMER");
  });

  it("F. Phone OTP token without email is NOT modified by self-heal", async () => {
    const mockDb = {
      user: {
        findUnique: async () => null,
      },
    };

    const token: { id?: string; role?: string; email?: string | null } = {
      id: "phone-user-id",
      role: "CUSTOMER",
    };

    const user = undefined;

    const resolved = await resolveJwtUser({ token, user, db: mockDb });

    assert.strictEqual(
      resolved.id,
      "phone-user-id",
      "Phone token ID must be preserved when no email is present"
    );
  });
});

describe("Server-Side OTP Feature Gate Enforcement (Item 3)", () => {
  it("isOtpFeatureEnabled reflects NEXT_PUBLIC_OTP_ENABLED environment variable", () => {
    const prev = process.env.NEXT_PUBLIC_OTP_ENABLED;
    try {
      process.env.NEXT_PUBLIC_OTP_ENABLED = "false";
      assert.strictEqual(isOtpFeatureEnabled(), false);

      delete process.env.NEXT_PUBLIC_OTP_ENABLED;
      assert.strictEqual(isOtpFeatureEnabled(), false);

      process.env.NEXT_PUBLIC_OTP_ENABLED = "true";
      assert.strictEqual(isOtpFeatureEnabled(), true);
    } finally {
      if (prev !== undefined) {
        process.env.NEXT_PUBLIC_OTP_ENABLED = prev;
      } else {
        delete process.env.NEXT_PUBLIC_OTP_ENABLED;
      }
    }
  });

  it("requestOtpChallenge rejects immediately when OTP feature is disabled", async () => {
    const prev = process.env.NEXT_PUBLIC_OTP_ENABLED;
    try {
      process.env.NEXT_PUBLIC_OTP_ENABLED = "false";
      const res = await requestOtpChallenge("9876543210");
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.code, "OTP_SERVICE_UNAVAILABLE");
      assert.ok(res.error?.includes("disabled"));
    } finally {
      if (prev !== undefined) {
        process.env.NEXT_PUBLIC_OTP_ENABLED = prev;
      } else {
        delete process.env.NEXT_PUBLIC_OTP_ENABLED;
      }
    }
  });
});
