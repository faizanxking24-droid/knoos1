import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";
import { getProductImagePath } from "@/lib/image-storage";

/**
 * Serve product images and videos from Hostinger persistent storage.
 *
 * GET /media/products/[filename]
 *
 * - Validates filename safety (rejects traversal, encoded tricks)
 * - Resolves path only within the product directory
 * - Returns media with correct Content-Type (images & MP4/WEBM videos)
 * - Supports HTTP 206 Partial Content Range requests for video seeking/streaming
 * - Sets long cache headers (files have unique names, so immutable is safe)
 * - Never exposes directory listings
 */

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Resolve safely — rejects traversal, null bytes, encoded tricks
    const filePath = await getProductImagePath(filename);
    if (!filePath) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const fileStats = await stat(filePath);
    const fileSize = fileStats.size;

    // Determine Content-Type from extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const isVideo = ext === ".mp4" || ext === ".webm";

    const rangeHeader = request.headers.get("range");

    // Handle HTTP Range Requests (206 Partial Content)
    if (rangeHeader && rangeHeader.startsWith("bytes=")) {
      const rangeParts = rangeHeader.slice(6).split("-");
      const rawStart = rangeParts[0]?.trim();
      const rawEnd = rangeParts[1]?.trim();

      let start = rawStart ? parseInt(rawStart, 10) : NaN;
      let end = rawEnd ? parseInt(rawEnd, 10) : NaN;

      if (!isNaN(start) && isNaN(end)) {
        end = fileSize - 1;
      } else if (isNaN(start) && !isNaN(end)) {
        start = Math.max(0, fileSize - end);
        end = fileSize - 1;
      } else if (!isNaN(start) && !isNaN(end)) {
        end = Math.min(end, fileSize - 1);
      }

      // Check for unsatisfiable range
      if (isNaN(start) || start < 0 || start >= fileSize || end < start) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
            "Accept-Ranges": "bytes",
          },
        });
      }

      const chunkSize = end - start + 1;
      const nodeStream = createReadStream(filePath, { start, end });
      const webStream = Readable.toWeb(nodeStream) as ReadableStream;

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Full file response
    if (isVideo) {
      const nodeStream = createReadStream(filePath);
      const webStream = Readable.toWeb(nodeStream) as ReadableStream;

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
          "Content-Length": String(fileSize),
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Read image bytes
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(fileSize),
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

// Disable POST/PUT/DELETE for this route
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
