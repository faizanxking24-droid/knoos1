import crypto from "node:crypto";
import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

// ─── Configuration ────────────────────────────────────────────────────────────

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

// Extension mapping: MIME type → safe lowercase extension
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// ─── Storage Root Resolution ──────────────────────────────────────────────────

/**
 * Resolve the Hostinger persistent storage root.
 *
 * Priority:
 *  1. HOSTINGER_UPLOAD_ROOT environment variable
 *  2. $HOME/knoos-storage (only when HOME is set)
 *
 * Returns null when no usable storage root is available.
 * Never falls back to public/uploads or any deployment-managed directory.
 */
export function getHostingerUploadRoot(): string | null {
  const configured = process.env.HOSTINGER_UPLOAD_ROOT?.trim();
  if (configured) {
    return configured;
  }

  const home = process.env.HOME?.trim();
  if (home) {
    return path.join(home, "knoos-storage");
  }

  return null;
}

export function getProductUploadDirectory(): string | null {
  const root = getHostingerUploadRoot();
  if (!root) return null;
  return path.join(root, "products");
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

export function validateImageFile(file: { size: number; type: string }): ImageValidationResult {
  const normalizedType = file.type.toLowerCase().trim();
  if (!ALLOWED_IMAGE_TYPES.has(normalizedType)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPG, PNG, and WEBP are allowed.",
      code: "INVALID_FILE_TYPE",
    };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return {
      valid: false,
      error: "File size too large. Maximum 5MB allowed.",
      code: "FILE_TOO_LARGE",
    };
  }

  return { valid: true };
}

// ─── Filename Generation ──────────────────────────────────────────────────────

/**
 * Generate a safe, unique filename for a product image.
 *
 * The stored extension is derived from the validated MIME type, never from
 * the user-supplied filename.  The original filename only influences the
 * sanitized basename.
 *
 * Format: {timestamp}-{slugified-original-name}-{random-hex}{ext}
 * All special characters are stripped.  The result contains only [a-zA-Z0-9._-].
 */
export function generateSafeFilename(originalFileName: string, mimeType: string): string {
  // Strip extension from user filename — MIME controls the stored extension
  const lastDot = originalFileName.lastIndexOf(".");
  const baseName = lastDot >= 0 ? originalFileName.slice(0, lastDot) : originalFileName;

  // Derive extension exclusively from the validated MIME type
  const ext = MIME_TO_EXT[mimeType.toLowerCase()] || ".bin";

  // Sanitize base name: only alphanumeric, dash, underscore
  const sanitized = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_").slice(0, 50);

  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString("hex");

  if (sanitized) {
    return `${timestamp}-${sanitized}-${randomSuffix}${ext}`;
  }
  return `${timestamp}-${randomSuffix}${ext}`;
}

// ─── Path Safety ──────────────────────────────────────────────────────────────

/**
 * Reject any filename containing path traversal or encoded traversal characters.
 */
export function isSafeFilename(filename: string): boolean {
  if (!filename || typeof filename !== "string") return false;

  // Reject null bytes (literal and URL-encoded)
  if (filename.includes("\0") || filename.includes("%00")) return false;

  // Reject path separators (literal and URL-encoded)
  if (filename.includes("/") || filename.includes("\\")) return false;
  if (filename.includes("%2f") || filename.includes("%5c") || filename.includes("%2F") || filename.includes("%5C")) return false;

  // Reject parent directory references (literal and URL-encoded)
  if (filename.includes("..")) return false;
  if (filename.toLowerCase().includes("%2e%2e")) return false;

  // Reject backtick, shell metacharacters
  if (/[`$&|;<>]/.test(filename)) return false;

  // Must have a safe extension (allow .jpeg for legacy backward compat)
  const ext = path.extname(filename).toLowerCase();
  const allowedExts = new Set([...new Set(Object.values(MIME_TO_EXT)), ".jpeg"]);
  if (!ext || !allowedExts.has(ext)) return false;

  return true;
}

/**
 * Resolve a product image path and verify it stays inside the product directory.
 * Returns the absolute path on success, null on failure.
 */
export function resolveProductImagePath(filename: string): string | null {
  if (!isSafeFilename(filename)) return null;

  const productDir = getProductUploadDirectory();
  if (!productDir) return null;

  const resolved = path.resolve(productDir, filename);

  // Ensure resolved path is inside product directory
  if (!resolved.startsWith(productDir + path.sep) && resolved !== productDir) {
    return null;
  }

  return resolved;
}

// ─── Storage Operations ───────────────────────────────────────────────────────

export interface SaveResult {
  success: true;
  url: string;
  filename: string;
}

export interface SaveError {
  success: false;
  error: string;
  code: string;
}

export type ImageStorageResult = SaveResult | SaveError;

/**
 * Save a product image to Hostinger persistent storage.
 *
 * - Creates storage directory recursively if missing
 * - Validates file type and size
 * - Generates a unique, safe filename
 * - Writes atomically via writeFile
 *
 * Returns the public URL (/media/products/...) on success.
 */
export async function saveProductImage(file: {
  arrayBuffer: () => Promise<ArrayBuffer>;
  name: string;
  size: number;
  type: string;
}): Promise<ImageStorageResult> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || "Invalid file.",
      code: validation.code || "VALIDATION_FAILED",
    };
  }

  // Check storage configuration
  const rawProductDir = getProductUploadDirectory();
  if (!rawProductDir) {
    return {
      success: false,
      error: "Persistent Hostinger image storage is not available.",
      code: "HOSTINGER_STORAGE_NOT_AVAILABLE",
    };
  }
  const productDir = path.resolve(rawProductDir);

  // Create storage directory
  try {
    await mkdir(productDir, { recursive: true });
  } catch (err) {
    console.error("[IMAGE_STORAGE_MKDIR_ERROR]", err);
    return {
      success: false,
      error: "Failed to create storage directory.",
      code: "STORAGE_MKDIR_FAILED",
    };
  }

  // Verify directory is writable
  try {
    await access(productDir, constants.W_OK);
  } catch {
    return {
      success: false,
      error: "Storage directory is not writable.",
      code: "STORAGE_NOT_WRITABLE",
    };
  }

  // Generate safe filename — extension derives from validated MIME, not user filename
  const filename = generateSafeFilename(file.name || "product_image", file.type);

  // Double-check the filename is safe (belt-and-suspenders)
  if (!isSafeFilename(filename)) {
    return {
      success: false,
      error: "Generated filename failed safety check.",
      code: "UNSAFE_FILENAME",
    };
  }

  // Resolve and verify final path stays inside product directory
  const filePath = path.resolve(productDir, filename);
  if (!filePath.startsWith(productDir + path.sep)) {
    return {
      success: false,
      error: "Path traversal detected.",
      code: "PATH_TRAVERSAL",
    };
  }

  // Write file
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer, { flag: "wx" });
  } catch (err) {
    console.error("[IMAGE_STORAGE_WRITE_ERROR]", err);
    return {
      success: false,
      error: "Failed to write image to storage.",
      code: "STORAGE_WRITE_FAILED",
    };
  }

  // Return stable public URL
  const url = `/media/products/${filename}`;

  return {
    success: true,
    url,
    filename,
  };
}

/**
 * Get the absolute filesystem path for a product image by filename.
 * Returns null if the filename is unsafe or the file doesn't exist inside the product directory.
 */
// ─── Legacy Data URL Migration ────────────────────────────────────────────────

/**
 * Supported legacy data URL MIME types and their extensions.
 */
const LEGACY_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Magic byte signatures for decoded image validation
const MAGIC_BYTES: Record<string, Buffer> = {
  "image/jpeg": Buffer.from([0xff, 0xd8, 0xff]),
  "image/jpg": Buffer.from([0xff, 0xd8, 0xff]),
  "image/png": Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/webp": Buffer.from("RIFF", "ascii"),
};

export interface LegacyMigrationResult {
  success: true;
  url: string;
  filename: string;
}

export interface LegacyMigrationError {
  success: false;
  error: string;
  code: string;
}

export type LegacyMigrationOutcome = LegacyMigrationResult | LegacyMigrationError;

/**
 * Validate decoded image bytes match the claimed MIME type.
 *
 * Checks magic bytes at the start of the buffer:
 *   JPEG: FF D8 FF
 *   PNG:  89 50 4E 47 0D 0A 1A 0A
 *   WEBP: starts with "RIFF"
 */
export function validateImageMagicBytes(buffer: Buffer, mimeType: string): ImageValidationResult {
  const signature = MAGIC_BYTES[mimeType];
  if (!signature) {
    return {
      valid: false,
      error: `Unsupported MIME type for magic-byte check: ${mimeType}`,
      code: "UNSUPPORTED_MIME",
    };
  }

  if (buffer.length < signature.length) {
    return {
      valid: false,
      error: "File is too short to be a valid image.",
      code: "INVALID_IMAGE_DATA",
    };
  }

  // WEBP needs additional check: bytes 8-11 must be "WEBP"
  if (mimeType === "image/webp") {
    const webpMarker = buffer.toString("ascii", 8, 12);
    if (webpMarker !== "WEBP") {
      return {
        valid: false,
        error: "Decoded data does not match WEBP format.",
        code: "INVALID_IMAGE_DATA",
      };
    }
    return { valid: true };
  }

  // JPEG and PNG: check prefix bytes
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return {
        valid: false,
        error: `Decoded data does not match ${mimeType} format.`,
        code: "INVALID_IMAGE_DATA",
      };
    }
  }

  return { valid: true };
}

/**
 * Migrate a legacy base64 data URL to Hostinger persistent storage.
 *
 * Accepts ONLY: data:image/jpeg;base64,... data:image/ppg;base64,... data:image/webp;base64,...
 *
 * - Validates MIME
 * - Decodes base64 safely
 * - Enforces 5MB decoded size
 * - Rejects malformed/truncated data
 * - Generates safe filename
 * - Persists through the same Hostinger storage directory
 * - Returns /media/products/<filename>
 */
export async function migrateLegacyDataUrl(dataUrl: string): Promise<LegacyMigrationOutcome> {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return {
      success: false,
      error: "Not a valid image data URL.",
      code: "INVALID_DATA_URL",
    };
  }

  // Parse data URL header
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) {
    return {
      success: false,
      error: "Data URL is not base64-encoded or format is invalid.",
      code: "INVALID_DATA_URL_FORMAT",
    };
  }

  const mimeType = match[1].toLowerCase();
  const base64Data = match[2];

  // Validate MIME is in our allowlist
  if (!LEGACY_MIME_TYPES[mimeType]) {
    return {
      success: false,
      error: `Unsupported image type: ${mimeType}. Only JPEG, PNG, and WEBP are supported.`,
      code: "UNSUPPORTED_MIME",
    };
  }

  // Decode base64 safely
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, "base64");
  } catch {
    return {
      success: false,
      error: "Failed to decode base64 data.",
      code: "BASE64_DECODE_FAILED",
    };
  }

  // Enforce 5MB decoded size
  if (buffer.length > MAX_IMAGE_FILE_SIZE) {
    return {
      success: false,
      error: `Decoded image is ${Math.round(buffer.length / 1024 / 1024)}MB. Maximum 5MB allowed.`,
      code: "FILE_TOO_LARGE",
    };
  }

  // Reject empty files
  if (buffer.length === 0) {
    return {
      success: false,
      error: "Decoded image is empty.",
      code: "EMPTY_FILE",
    };
  }

  // Validate decoded bytes match claimed MIME type (magic byte check)
  const magicCheck = validateImageMagicBytes(buffer, mimeType);
  if (!magicCheck.valid) {
    return {
      success: false,
      error: magicCheck.error || "Decoded image data is corrupt or does not match the claimed format.",
      code: magicCheck.code || "INVALID_IMAGE_DATA",
    };
  }

  // Check storage configuration
  const rawProductDir = getProductUploadDirectory();
  if (!rawProductDir) {
    return {
      success: false,
      error: "Persistent Hostinger image storage is not available.",
      code: "HOSTINGER_STORAGE_NOT_AVAILABLE",
    };
  }
  const productDir = path.resolve(rawProductDir);

  // Create storage directory
  try {
    await mkdir(productDir, { recursive: true });
  } catch (err) {
    console.error("[IMAGE_STORAGE_MKDIR_ERROR]", err);
    return {
      success: false,
      error: "Failed to create storage directory.",
      code: "STORAGE_MKDIR_FAILED",
    };
  }

  // Verify directory is writable
  try {
    await access(productDir, constants.W_OK);
  } catch {
    return {
      success: false,
      error: "Storage directory is not writable.",
      code: "STORAGE_NOT_WRITABLE",
    };
  }

  // Generate safe filename — use a recognizable prefix for legacy migration
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString("hex");
  const ext = LEGACY_MIME_TYPES[mimeType];
  const filename = `migrated-${timestamp}-${randomSuffix}${ext}`;

  // Resolve and verify final path stays inside product directory
  const filePath = path.resolve(productDir, filename);
  if (!filePath.startsWith(productDir + path.sep)) {
    return {
      success: false,
      error: "Path traversal detected.",
      code: "PATH_TRAVERSAL",
    };
  }

  // Write file
  try {
    await writeFile(filePath, buffer, { flag: "wx" });
  } catch (err) {
    console.error("[IMAGE_STORAGE_WRITE_ERROR]", err);
    return {
      success: false,
      error: "Failed to write image to storage.",
      code: "STORAGE_WRITE_FAILED",
    };
  }

  // Return stable public URL
  const url = `/media/products/${filename}`;

  return {
    success: true,
    url,
    filename,
  };
}

export async function getProductImagePath(filename: string): Promise<string | null> {
  const resolved = resolveProductImagePath(filename);
  if (!resolved) return null;

  try {
    await access(resolved, constants.R_OK);
    return resolved;
  } catch {
    return null;
  }
}
