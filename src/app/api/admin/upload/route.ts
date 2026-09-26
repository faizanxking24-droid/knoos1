import { requireAdmin } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";
import { saveProductImage } from "@/lib/image-storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.type.toLowerCase();
    if (!ALLOWED_TYPES.has(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and WEBP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size too large. Maximum 5MB allowed." },
        { status: 400 }
      );
    }

    // Save file to Hostinger filesystem storage
    const result = await saveProductImage(file);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to save image." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: result.url,
      filename: result.filename,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

// Disable GET for this route
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
