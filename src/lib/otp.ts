/**
 * Server-side OTP Challenge Management & Cryptography.
 *
 * Security guarantees:
 * - 6-digit cryptographically secure pseudo-random numeric code via crypto.randomInt
 * - Plaintext OTP never stored in database or logged
 * - Keyed HMAC-SHA256 hash using server-side secret (OTP_HMAC_SECRET or AUTH_SECRET)
 * - HMAC message binds normalized phone to code: `${phone}:${code}`
 * - Fails securely if HMAC secret is missing (never empty string fallback, never hardcoded default)
 * - Constant-time comparison via crypto.timingSafeEqual to prevent timing attacks
 * - Buffer length equality checked before timingSafeEqual
 * - Expiry window: 5 minutes (300 seconds)
 * - Resend cooldown: 60 seconds
 * - Maximum attempts: 5 (invalidated after 5 failed attempts)
 * - OTP is strictly single-use
 * - Never logged to console, never returned in API responses
 */

import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getSmsProvider } from "@/lib/sms";
import { normalizeIndianMobile } from "@/lib/phone";

export const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
export const OTP_COOLDOWN_MS = 60 * 1000;   // 60 seconds
export const OTP_MAX_ATTEMPTS = 5;

/**
 * Checks whether the mobile OTP login feature is enabled on the server.
 * Requires explicit environment variable: NEXT_PUBLIC_OTP_ENABLED === "true".
 * Defaults to false (disabled).
 */
export function isOtpFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_OTP_ENABLED === "true";
}

/**
 * Retrieves the server-side HMAC secret key.
 *
 * Checks OTP_HMAC_SECRET first, then AUTH_SECRET.
 * Validates presence: fails securely if missing.
 * Never falls back to an empty string or hardcoded development secret.
 * Never exposes the secret to the client.
 */
export function getHmacSecret(): string {
  const secret = process.env.OTP_HMAC_SECRET || process.env.AUTH_SECRET;
  if (!secret || typeof secret !== "string" || secret.trim() === "") {
    throw new Error(
      "Server OTP authentication secret is not configured. Please define AUTH_SECRET or OTP_HMAC_SECRET."
    );
  }
  return secret.trim();
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 */
export function generateOtpCode(): string {
  // Generates integer between 100000 and 999999 inclusive
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes an OTP using HMAC-SHA256 with server secret and phone context.
 * The normalized phone is embedded in the HMAC message context (${phone}:${code})
 * to prevent cross-phone hash replay, while the key is strictly the server-side secret.
 */
export function hashOtp(phone: string, code: string, secretOverride?: string): string {
  const secret = secretOverride ?? getHmacSecret();
  if (!secret || secret.trim() === "") {
    throw new Error("HMAC secret cannot be empty.");
  }
  return crypto
    .createHmac("sha256", secret)
    .update(`${phone}:${code.trim()}`)
    .digest("hex");
}

/**
 * Verifies OTP against stored hash using constant-time comparison via crypto.timingSafeEqual.
 * Ensures compared buffers have identical lengths before calling timingSafeEqual.
 */
export function verifyOtpHash(
  phone: string,
  code: string,
  storedHash: string,
  secretOverride?: string
): boolean {
  if (!phone || !code || !storedHash) return false;
  try {
    const computedHash = hashOtp(phone, code, secretOverride);
    const computedBuf = Buffer.from(computedHash, "hex");
    const storedBuf = Buffer.from(storedHash, "hex");

    if (computedBuf.length !== storedBuf.length || computedBuf.length === 0) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuf, storedBuf);
  } catch {
    return false;
  }
}

export interface RequestOtpResult {
  success: boolean;
  code?: "OTP_SERVICE_UNAVAILABLE" | "COOLDOWN_ACTIVE" | "INVALID_PHONE" | "DELIVERY_FAILED";
  error?: string;
  cooldownRemainingSeconds?: number;
}

/**
 * Requests and initiates an OTP challenge for an Indian mobile number.
 */
export async function requestOtpChallenge(rawPhone: string): Promise<RequestOtpResult> {
  const validation = normalizeIndianMobile(rawPhone);
  if (!validation.isValid || !validation.normalized) {
    return {
      success: false,
      code: "INVALID_PHONE",
      error: validation.error || "Invalid Indian phone number.",
    };
  }

  const phone = validation.normalized;

  // 1. Verify OTP feature gate is enabled on the server
  if (!isOtpFeatureEnabled()) {
    return {
      success: false,
      code: "OTP_SERVICE_UNAVAILABLE",
      error: "Mobile OTP authentication is currently disabled.",
    };
  }

  // 2. Verify HMAC secret configuration exists before issuing challenges
  try {
    getHmacSecret();
  } catch {
    return {
      success: false,
      code: "DELIVERY_FAILED",
      error: "Authentication service is misconfigured.",
    };
  }

  // 2. Check if SMS delivery provider is configured
  const smsProvider = getSmsProvider();
  if (!smsProvider.isConfigured()) {
    // DO NOT store or leave a valid challenge that cannot be delivered to customer
    return {
      success: false,
      code: "OTP_SERVICE_UNAVAILABLE",
      error: "SMS service is currently unavailable. Please sign in with Google or try again later.",
    };
  }

  // 3. Check existing challenge for cooldown
  const existingChallenge = await prisma.otpChallenge.findUnique({
    where: { phone },
  });

  const now = new Date();

  if (existingChallenge) {
    const elapsedMs = now.getTime() - existingChallenge.lastSentAt.getTime();
    if (elapsedMs < OTP_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - elapsedMs) / 1000);
      return {
        success: false,
        code: "COOLDOWN_ACTIVE",
        error: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
        cooldownRemainingSeconds: remainingSeconds,
      };
    }
  }

  // 4. Generate secure OTP and hash using server secret
  const otp = generateOtpCode();
  const codeHash = hashOtp(phone, otp);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

  // 5. Send OTP via configured provider BEFORE finalizing DB state
  const sendResult = await smsProvider.sendOtp(phone, otp);
  if (!sendResult.success) {
    return {
      success: false,
      code: "DELIVERY_FAILED",
      error: "Failed to send OTP via SMS. Please try again later.",
    };
  }

  // 6. Upsert challenge in database (single active challenge per phone)
  await prisma.otpChallenge.upsert({
    where: { phone },
    create: {
      phone,
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    },
    update: {
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    },
  });

  return {
    success: true,
  };
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
  code?: "INVALID_CODE" | "EXPIRED" | "MAX_ATTEMPTS_EXCEEDED" | "NO_CHALLENGE";
}

/**
 * Validates an OTP code against the database challenge.
 * On success, deletes/invalidates the challenge immediately (single use).
 */
export async function verifyOtpChallenge(rawPhone: string, code: string): Promise<VerifyOtpResult> {
  const validation = normalizeIndianMobile(rawPhone);
  if (!validation.isValid || !validation.normalized) {
    return { success: false, code: "INVALID_CODE", error: "Invalid phone number." };
  }

  const phone = validation.normalized;
  const challenge = await prisma.otpChallenge.findUnique({
    where: { phone },
  });

  if (!challenge) {
    return { success: false, code: "NO_CHALLENGE", error: "No active OTP request found. Please request a new OTP." };
  }

  const now = new Date();

  // Check expiry
  if (now > challenge.expiresAt) {
    await prisma.otpChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
    return { success: false, code: "EXPIRED", error: "OTP has expired. Please request a new one." };
  }

  // Check attempt limit
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.otpChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
    return {
      success: false,
      code: "MAX_ATTEMPTS_EXCEEDED",
      error: "Too many incorrect attempts. Please request a new OTP.",
    };
  }

  // Verify hash
  const isValid = verifyOtpHash(phone, code, challenge.codeHash);

  if (!isValid) {
    const updatedAttempts = challenge.attempts + 1;
    if (updatedAttempts >= OTP_MAX_ATTEMPTS) {
      await prisma.otpChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
      return {
        success: false,
        code: "MAX_ATTEMPTS_EXCEEDED",
        error: "Too many incorrect attempts. Please request a new OTP.",
      };
    } else {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      const attemptsLeft = OTP_MAX_ATTEMPTS - updatedAttempts;
      return {
        success: false,
        code: "INVALID_CODE",
        error: `Incorrect OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.`,
      };
    }
  }

  // Valid OTP! Invalidate challenge immediately (Single use)
  await prisma.otpChallenge.delete({ where: { id: challenge.id } }).catch(() => {});

  return { success: true };
}
