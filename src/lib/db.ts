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

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;