import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is properly encoded and uses localhost in production
if (process.env.DATABASE_URL) {
  try {
    const rawUrl = process.env.DATABASE_URL;
    const match = rawUrl.match(/^mysql:\/\/[^:]+:([^@]+)@([^:]+):(\d+)\/(.+)$/);
    if (match) {
      const rawPassword = match[1];
      // Safely handle already-encoded passwords to prevent double-encoding
      // decodeURIComponent safely decodes it if it was encoded, or leaves it alone if not
      const decodedPassword = decodeURIComponent(rawPassword);
      const encodedPassword = encodeURIComponent(decodedPassword);
      const newUrl = rawUrl.replace(':' + rawPassword + '@', ':' + encodedPassword + '@');
      
      process.env.DATABASE_URL = newUrl;
    }
  } catch (e) {
    // Ignore parse errors, let Prisma handle it
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const opts: ConstructorParameters<typeof PrismaClient>[0] = {};
    if (process.env.DATABASE_URL) {
      opts.datasources = {
        db: { url: process.env.DATABASE_URL },
      };
    }
    prismaInstance = new PrismaClient(opts);
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance;
    }
  }
  return prismaInstance;
}

// Lazy: defer instantiation until first use so test environments
// that pass a mock db to resolveJwtUser do not need a live database.
let _prisma: PrismaClient | undefined;
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop) {
    if (!_prisma) {
      _prisma = getPrismaClient();
    }
    return (_prisma as any)[prop];
  },
  set() {
    throw new Error("Cannot assign to the prisma export — it is a read-only proxy.");
  },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;