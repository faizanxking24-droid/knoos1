import { requireAdmin } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { migrateLegacyDataUrl, LegacyMigrationOutcome } from "@/lib/image-storage";

/**
 * POST /api/admin/products/[id]/migrate-images
 *
 * Migrates legacy base64 data URL images to Hostinger persistent storage.
 * Admin-only. Does NOT auto-migrate on public page loads.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  try {
    const { id: productId } = await params;

    // Load product with its images
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Find legacy data URL images
    const legacyImages = product.images.filter((img) =>
      img.imageUrl.startsWith("data:image/")
    );

    if (legacyImages.length === 0) {
      return NextResponse.json({
        migrated: 0,
        skipped: product.images.length,
        failed: 0,
        message: "No legacy images to migrate.",
      });
    }

    let migrated = 0;
    let skipped = 0;
    let failed = 0;
    const failures: Array<{ id: string; error: string }> = [];

    for (const image of legacyImages) {
      const outcome = (await migrateLegacyDataUrl(image.imageUrl)) as LegacyMigrationOutcome;

      if (outcome.success) {
        // Update the database record
        await prisma.productImage.update({
          where: { id: image.id },
          data: { imageUrl: outcome.url },
        });
        migrated++;
      } else {
        failed++;
        failures.push({
          id: image.id,
          error: `${outcome.code}: ${outcome.error}`,
        });
        // Do NOT delete the original DB record — admin must re-upload
      }
    }

    skipped = product.images.length - legacyImages.length;

    return NextResponse.json({
      migrated,
      skipped,
      failed,
      failures: failures.length > 0 ? failures : undefined,
      message: failed > 0
        ? `${migrated} migrated, ${failed} failed (must be re-uploaded).`
        : `All ${migrated} legacy images migrated successfully.`,
    });
  } catch (err) {
    console.error("[MIGRATE_IMAGES_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to migrate images." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
