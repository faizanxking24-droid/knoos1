import { requireAdmin } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";
import { saveProductImage } from "@/lib/image-storage";

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

    // Persist to Hostinger filesystem via the storage module
    const result = await saveProductImage({
      arrayBuffer: () => file.arrayBuffer(),
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!result.success) {
      const statusMap: Record<string, number> = {
        HOSTINGER_STORAGE_NOT_AVAILABLE: 503,
      };
      const status = statusMap[result.code] || 400;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      url: result.url,
      filename: result.filename,
    });
  } catch (err) {
    console.error("[UPLOAD_ERROR]", err);
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
