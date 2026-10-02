import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

import {
  MAX_IMAGE_FILE_SIZE,
  MAX_VIDEO_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  validateImageFile,
  validateVideoFile,
  validateMediaFile,
  generateSafeFilename,
  isSafeFilename,
  saveProductImage,
  saveProductVideo,
  saveProductMedia,
  getProductImagePath,
} from "../src/lib/image-storage";
import { productImageSchema } from "../src/lib/validation/admin";
import { productFamilySchema } from "../src/lib/validation/product-family";
import { GET as getMediaRoute } from "../src/app/media/products/[filename]/route";

const TEST_ROOT = mkdtempSync(path.join(tmpdir(), "knoos-media-test-"));

function createMockFile(bytes: number, mimeType: string, name = "media-test.bin", content?: Buffer) {
  const arrayBuffer = new ArrayBuffer(bytes);
  if (content) {
    new Uint8Array(arrayBuffer).set(content);
  }
  return {
    arrayBuffer: async (): Promise<ArrayBuffer> => arrayBuffer,
    name,
    size: bytes,
    type: mimeType,
  };
}

describe("Product Media Upload & Validation", () => {
  let prevRoot: string | undefined;

  before(() => {
    prevRoot = process.env.HOSTINGER_UPLOAD_ROOT;
    process.env.HOSTINGER_UPLOAD_ROOT = TEST_ROOT;
  });

  after(() => {
    if (prevRoot === undefined) {
      delete process.env.HOSTINGER_UPLOAD_ROOT;
    } else {
      process.env.HOSTINGER_UPLOAD_ROOT = prevRoot;
    }
    try {
      rmSync(TEST_ROOT, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error on windows
    }
  });

  describe("1. Single and Multi-Image Upload & Validation", () => {
    it("accepts valid image formats under 5MB", () => {
      for (const mime of ALLOWED_IMAGE_TYPES) {
        const result = validateImageFile({ size: 1024, type: mime });
        assert.equal(result.valid, true, `MIME ${mime} should be valid`);
      }
    });

    it("rejects oversized images (> 5MB)", () => {
      const result = validateImageFile({ size: MAX_IMAGE_FILE_SIZE + 1, type: "image/jpeg" });
      assert.equal(result.valid, false);
      assert.equal(result.code, "FILE_TOO_LARGE");
    });

    it("saves one image successfully and returns media URL", async () => {
      const mockFile = createMockFile(2048, "image/webp", "front.webp");
      const result = await saveProductImage(mockFile);
      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.url.startsWith("/media/products/"));
        assert.ok(result.filename.endsWith(".webp"));
      }
    });

    it("preserves order across multiple uploaded files with bounded concurrency", async () => {
      const filenames = ["front.webp", "side.webp", "back.webp", "sole.webp", "angle.webp"];
      const files = filenames.map((name, i) => createMockFile(1024 * (i + 1), "image/webp", name));

      // Bounded concurrency simulation (2 workers)
      const results: { url: string; filename: string; originalIndex: number }[] = new Array(files.length);
      let nextIndex = 0;

      async function worker() {
        while (nextIndex < files.length) {
          const currentIndex = nextIndex++;
          const file = files[currentIndex];
          const uploadRes = await saveProductMedia(file);
          assert.equal(uploadRes.success, true);
          if (uploadRes.success) {
            results[currentIndex] = {
              url: uploadRes.url,
              filename: uploadRes.filename,
              originalIndex: currentIndex,
            };
          }
        }
      }

      await Promise.all([worker(), worker()]);

      // Confirm order is strictly preserved
      assert.equal(results.length, 5);
      for (let i = 0; i < results.length; i++) {
        assert.equal(results[i].originalIndex, i);
        assert.ok(results[i].filename.includes(filenames[i].replace(".webp", "")));
      }
    });

    it("does not discard successful files when one fails in a batch", async () => {
      const files = [
        createMockFile(1024, "image/jpeg", "front.jpg"),
        createMockFile(MAX_IMAGE_FILE_SIZE + 100, "image/jpeg", "back-too-large.jpg"), // fails
        createMockFile(1024, "image/jpeg", "side.jpg"),
      ];

      const results: ({ url: string; filename: string } | null)[] = new Array(files.length).fill(null);
      const errors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await saveProductMedia(file);
        if (res.success) {
          results[i] = { url: res.url, filename: res.filename };
        } else {
          errors.push(`${file.name} failed: ${res.error}`);
        }
      }

      const successful = results.filter((r) => r !== null);
      assert.equal(successful.length, 2);
      assert.equal(errors.length, 1);
      assert.ok(errors[0].includes("back-too-large.jpg"));
      assert.ok(successful[0]?.filename.includes("front"));
      assert.ok(successful[1]?.filename.includes("side"));
    });
  });

  describe("2. Product Video Upload & Validation", () => {
    it("accepts valid MP4 and WebM videos under 40MB", () => {
      for (const mime of ALLOWED_VIDEO_TYPES) {
        const result = validateVideoFile({ size: 10 * 1024 * 1024, type: mime });
        assert.equal(result.valid, true, `Video MIME ${mime} should be valid`);
      }
    });

    it("rejects unsupported video formats (e.g. avi, mov, mkv)", () => {
      const unsupported = ["video/avi", "video/quicktime", "video/x-matroska", "video/x-msvideo"];
      for (const mime of unsupported) {
        const result = validateVideoFile({ size: 1024, type: mime });
        assert.equal(result.valid, false);
        assert.equal(result.code, "INVALID_FILE_TYPE");
      }
    });

    it("rejects oversized video files (> 40MB)", () => {
      const result = validateVideoFile({ size: MAX_VIDEO_FILE_SIZE + 1, type: "video/mp4" });
      assert.equal(result.valid, false);
      assert.equal(result.code, "FILE_TOO_LARGE");
    });

    it("saves MP4 video and returns safe media URL with isVideo=true", async () => {
      const file = createMockFile(5000, "video/mp4", "product-run.mp4");
      const result = await saveProductMedia(file);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.isVideo, true);
        assert.ok(result.url.startsWith("/media/products/"));
        assert.ok(result.filename.endsWith(".mp4"));
        assert.equal(isSafeFilename(result.filename), true);
      }
    });

    it("saves WebM video and returns safe media URL with isVideo=true", async () => {
      const file = createMockFile(5000, "video/webm", "product-spin.webm");
      const result = await saveProductMedia(file);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.isVideo, true);
        assert.ok(result.url.startsWith("/media/products/"));
        assert.ok(result.filename.endsWith(".webm"));
        assert.equal(isSafeFilename(result.filename), true);
      }
    });

    it("derives extension strictly from MIME type, ignoring user extension", async () => {
      const file = createMockFile(5000, "video/mp4", "spoofed.exe");
      const result = await saveProductMedia(file);
      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.filename.endsWith(".mp4"));
        assert.ok(!result.filename.endsWith(".exe"));
      }
    });

    it("protects against path traversal in filenames", () => {
      assert.equal(isSafeFilename("../../video.mp4"), false);
      assert.equal(isSafeFilename("..\\..\\video.mp4"), false);
      assert.equal(isSafeFilename("%2e%2e%2fvideo.mp4"), false);
      assert.equal(isSafeFilename("video\0.mp4"), false);
    });
  });

  describe("3. HTTP Range Requests on Media Route", () => {
    let videoFilename: string;
    const testVideoContent = Buffer.alloc(1000, "X");

    before(async () => {
      const file = createMockFile(1000, "video/mp4", "range-test.mp4", testVideoContent);
      const res = await saveProductVideo(file);
      if (!res.success) throw new Error("Failed to save test video");
      videoFilename = res.filename;
    });

    it("returns 200 with Accept-Ranges when no Range header is sent", async () => {
      const req = new Request(`http://localhost/media/products/${videoFilename}`);
      const res = await getMediaRoute(req, { params: Promise.resolve({ filename: videoFilename }) });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("Accept-Ranges"), "bytes");
      assert.equal(res.headers.get("Content-Type"), "video/mp4");
      assert.equal(res.headers.get("Content-Length"), "1000");
    });

    it("returns 206 Partial Content for valid bytes=0-499 Range request", async () => {
      const req = new Request(`http://localhost/media/products/${videoFilename}`, {
        headers: { Range: "bytes=0-499" },
      });
      const res = await getMediaRoute(req, { params: Promise.resolve({ filename: videoFilename }) });
      assert.equal(res.status, 206);
      assert.equal(res.headers.get("Accept-Ranges"), "bytes");
      assert.equal(res.headers.get("Content-Range"), "bytes 0-499/1000");
      assert.equal(res.headers.get("Content-Length"), "500");
      assert.equal(res.headers.get("Content-Type"), "video/mp4");
    });

    it("returns 206 for open-ended Range bytes=500-", async () => {
      const req = new Request(`http://localhost/media/products/${videoFilename}`, {
        headers: { Range: "bytes=500-" },
      });
      const res = await getMediaRoute(req, { params: Promise.resolve({ filename: videoFilename }) });
      assert.equal(res.status, 206);
      assert.equal(res.headers.get("Content-Range"), "bytes 500-999/1000");
      assert.equal(res.headers.get("Content-Length"), "500");
    });

    it("returns 206 for suffix Range bytes=-200", async () => {
      const req = new Request(`http://localhost/media/products/${videoFilename}`, {
        headers: { Range: "bytes=-200" },
      });
      const res = await getMediaRoute(req, { params: Promise.resolve({ filename: videoFilename }) });
      assert.equal(res.status, 206);
      assert.equal(res.headers.get("Content-Range"), "bytes 800-999/1000");
      assert.equal(res.headers.get("Content-Length"), "200");
    });

    it("returns 416 Range Not Satisfiable for out-of-range request", async () => {
      const req = new Request(`http://localhost/media/products/${videoFilename}`, {
        headers: { Range: "bytes=2000-3000" },
      });
      const res = await getMediaRoute(req, { params: Promise.resolve({ filename: videoFilename }) });
      assert.equal(res.status, 416);
      assert.equal(res.headers.get("Content-Range"), "bytes */1000");
    });
  });

  describe("4. Schema Validation & isVideo Flag Preservation", () => {
    it("productImageSchema accepts isVideo flag and defaults to false", () => {
      const withVideo = productImageSchema.parse({
        imageUrl: "/media/products/run.mp4",
        isVideo: true,
        sortOrder: 0,
      });
      assert.equal(withVideo.isVideo, true);

      const defaultOmitted = productImageSchema.parse({
        imageUrl: "/media/products/shoe.jpg",
        sortOrder: 1,
      });
      assert.equal(defaultOmitted.isVideo, false);
    });

    it("productFamilySchema accepts mixed images and videos", () => {
      const family = {
        baseName: "KNOOS Oxford Wave",
        gender: "MEN" as const,
        categoryId: null,
        description: null,
        colors: [
          {
            color: "Tan",
            sku: "OXF-TAN",
            name: "KNOOS Oxford Wave Tan",
            slug: "knoos-oxford-wave-tan",
            status: "ACTIVE" as const,
            images: [
              { imageUrl: "/media/products/img1.webp", isVideo: false, sortOrder: 0 },
              { imageUrl: "/media/products/img2.webp", isVideo: false, sortOrder: 1 },
              { imageUrl: "/media/products/vid1.mp4", isVideo: true, sortOrder: 2 },
              { imageUrl: "/media/products/img3.webp", isVideo: false, sortOrder: 3 },
            ],
            variants: [{ size: "7", sku: "OXF-TAN-7", price: 2999, stock: 5 }],
          },
        ],
      };

      const parsed = productFamilySchema.safeParse(family);
      assert.equal(parsed.success, true);
      if (parsed.success) {
        const media = parsed.data.colors[0].images;
        assert.equal(media[0].isVideo, false);
        assert.equal(media[1].isVideo, false);
        assert.equal(media[2].isVideo, true);
        assert.equal(media[3].isVideo, false);
        assert.equal(media[2].imageUrl, "/media/products/vid1.mp4");
      }
    });

    it("simulates media reorder and removal", () => {
      const initialMedia = [
        { imageUrl: "/media/products/img1.webp", isVideo: false },
        { imageUrl: "/media/products/vid1.mp4", isVideo: true },
        { imageUrl: "/media/products/img2.webp", isVideo: false },
      ];

      // Reorder: swap index 0 and 1
      const reordered = [...initialMedia];
      [reordered[0], reordered[1]] = [reordered[1], reordered[0]];

      assert.equal(reordered[0].isVideo, true);
      assert.equal(reordered[1].isVideo, false);
      assert.equal(reordered[0].imageUrl, "/media/products/vid1.mp4");

      // Remove: remove index 1
      const removed = reordered.filter((_, i) => i !== 1);
      assert.equal(removed.length, 2);
      assert.equal(removed[0].imageUrl, "/media/products/vid1.mp4");
      assert.equal(removed[1].imageUrl, "/media/products/img2.webp");
    });
  });
});
