/**
 * KNOOS Auth Library — single source of truth for NextAuth configuration.
 *
 * Exports:
 *   - auth()       → session getter for Server Components and API routes
 *   - GET/POST     → for the [...nextauth] route handler
 *   - signIn       → trigger Google Sign-In
 *   - signOut      → trigger sign-out
 *
 * Authentication is exclusively via Google OAuth.
 * Roles are CUSTOMER (default) or ADMIN (assigned explicitly in the DB).
 * The role is server-managed and signed into the JWT — the client cannot
 * alter it.
 */

import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/db";
import { verifyOtpChallenge, isOtpFeatureEnabled } from "@/lib/otp";
import { normalizeIndianMobile } from "@/lib/phone";

import { resolveOrCreatePhoneUser } from "@/lib/phone-auth";

if (!process.env.AUTH_URL && process.env.NEXTAUTH_URL) {
  process.env.AUTH_URL = process.env.NEXTAUTH_URL;
} else if (!process.env.AUTH_URL && process.env.NEXT_PUBLIC_APP_URL) {
  process.env.AUTH_URL = process.env.NEXT_PUBLIC_APP_URL;
}

// In production, prevent NextAuth from using localhost or 0.0.0.0 if the environment 
// variables were incorrectly copied from local .env
if (
  process.env.NODE_ENV === "production" &&
  process.env.AUTH_URL &&
  (process.env.AUTH_URL.includes("localhost") ||
   process.env.AUTH_URL.includes("0.0.0.0") ||
   process.env.AUTH_URL.includes("127.0.0.1"))
) {
  process.env.AUTH_URL = "";
}

/**
 * Helper to resolve the authenticated database user ID and role into the JWT token.
 *
 * Prioritizes resolving the database User by email first (Google OAuth & Admin credentials).
 * Falls back to resolving by id when email is null (Phone OTP).
 * Never overwrites a valid database token ID with an unverified provider ID.
 */
export async function resolveJwtUser({
  token,
  user,
  db = prisma,
}: {
  token: { id?: string; role?: string; email?: string | null; [key: string]: any };
  user?: { id?: string; email?: string | null; role?: string; [key: string]: any };
  db?: any;
}): Promise<{ id?: string; role?: string; [key: string]: any }> {
  if (user) {
    if (user.role) {
      token.role = user.role;
    }

    try {
      const dbUser = user.email
        ? await db.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true },
          })
        : user.id
        ? await db.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true },
          })
        : null;

      if (dbUser) {
        token.id = dbUser.id;
        token.role = dbUser.role;
      } else {
        // If DB lookup unexpectedly fails:
        // Do NOT overwrite a previously valid database token ID with an unverified provider ID.
        if (!token.id && !user.email && user.id) {
          token.id = user.id;
        }
        if (!token.role) {
          token.role = "CUSTOMER";
        }
      }
    } catch (error) {
      if (!token.role) {
        token.role = "CUSTOMER";
      }
    }
  } else if (token.email) {
    // Self-heal: stale JWT session where token.id may hold a provider ID
    // instead of the real Prisma User.id. Resolve by email and replace.
    // This handles Google sessions created before the email-first fix.
    // Phone OTP tokens without an email are not affected.
    try {
      const dbUser = await db.user.findUnique({
        where: { email: token.email },
        select: { id: true, role: true },
      });

      if (dbUser) {
        token.id = dbUser.id;
        token.role = dbUser.role;
      } else if (!token.role) {
        token.role = "CUSTOMER";
      }
    } catch (error) {
      if (!token.role) {
        token.role = "CUSTOMER";
      }
    }
  }

  return token;
}

const nextAuth = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  basePath: "/api/auth",
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: { prompt: "select_account", response_type: "code", scope: "openid profile email" }
      },
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
      jwks_endpoint: "https://www.googleapis.com/oauth2/v3/certs",
      issuer: "https://accounts.google.com",
    }),
    Credentials({
      id: "credentials",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const rawEmail = credentials.email as string;
        const email = rawEmail.trim().toLowerCase();

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password || user.role !== "ADMIN") {
            return null;
          }

          const isPasswordValid = await bcryptjs.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          return null;
        }
      }
    }),
    Credentials({
      id: "phone-otp",
      name: "Customer Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        code: { label: "OTP Code", type: "text" }
      },
      async authorize(credentials) {
        // Enforce server-side OTP feature gate
        if (!isOtpFeatureEnabled()) {
          console.warn("[AUTH] Phone OTP login attempted while feature is disabled.");
          return null;
        }

        if (!credentials?.phone || !credentials?.code) return null;

        const rawPhone = credentials.phone as string;
        const code = (credentials.code as string).trim();

        // 1. Verify OTP challenge
        const verifyResult = await verifyOtpChallenge(rawPhone, code);
        if (!verifyResult.success) {
          return null;
        }

        const validation = normalizeIndianMobile(rawPhone);
        if (!validation.isValid || !validation.normalized) {
          return null;
        }
        const phone = validation.normalized;

        try {
          // 2. Safe authoritative account resolution via PhoneAuthIdentity
          const resolution = await resolveOrCreatePhoneUser(phone);
          if (!resolution.success) {
            return null;
          }

          return {
            id: resolution.user.id,
            name: resolution.user.name,
            email: resolution.user.email,
            role: resolution.user.role || "CUSTOMER",
          };
        } catch (error) {
          console.error("Phone OTP authorize error:", error);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    /**
     * Manually sync user to DB on sign-in since PrismaAdapter is removed.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials" || account?.provider === "phone-otp") {
        return true;
      }

      const email = user?.email || profile?.email;
      
      if (!email) {
        return false;
      }
      
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!existingUser) {
          // Safely handle Google image URLs that exceed MySQL's default VARCHAR(191) limit
          const rawImage = user?.image || profile?.picture;
          const safeImage = rawImage && rawImage.length <= 191 ? rawImage : null;

          await prisma.user.create({
            data: {
              email,
              name: user?.name || profile?.name || null,
              googleId: account?.providerAccountId || null,
              image: safeImage,
            },
          });
        }
        return true;
      } catch (error) {
        return false;
      }
    },

    /**
     * Persist role/id into the JWT on first sign-in.
     */
    async jwt({ token, user, trigger }) {
      await resolveJwtUser({ token, user, db: prisma });

      // On manual session refresh, re-read the role from the database so
      // an admin promotion takes effect without forcing a re-login.
      if (trigger === "update" && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          if (dbUser) token.role = dbUser.role;
        } catch (e) {
          // ignore
        }
      }

      return token;
    },

    /**
     * Hydrate the session.user object from the JWT.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as string) ?? "CUSTOMER";
      }
      return session;
    },

    /**
     * Redirect callback to track flow
     */
    async redirect({ url, baseUrl }) {
      let finalUrl = baseUrl;
      if (url.startsWith("/")) {
        finalUrl = new URL(url, baseUrl).toString();
      } else if (new URL(url).origin === baseUrl) {
        finalUrl = url;
      }
      return finalUrl;
    }
  },
} satisfies NextAuthConfig);

export const { auth, signIn, signOut, handlers } = nextAuth;

// Route handler exports
export const GET = handlers.GET;
export const POST = handlers.POST;
