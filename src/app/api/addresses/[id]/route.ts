import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { normalizeIndianMobile } from "@/lib/phone";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }

    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (label !== undefined) {
      updateData.label = typeof label === "string" && label.trim() ? label.trim().toUpperCase() : "HOME";
    }

    if (fullName !== undefined) {
      const trimmed = typeof fullName === "string" ? fullName.trim() : "";
      if (!trimmed) {
        return NextResponse.json({ error: "Full name cannot be empty." }, { status: 400 });
      }
      updateData.fullName = trimmed;
    }

    if (phone !== undefined) {
      const trimmed = typeof phone === "string" ? phone.trim() : "";
      if (!trimmed) {
        return NextResponse.json({ error: "Phone number cannot be empty." }, { status: 400 });
      }
      const validation = normalizeIndianMobile(trimmed);
      if (!validation.isValid || !validation.digits) {
        return NextResponse.json(
          { error: validation.error || "Please enter a valid 10-digit Indian phone number." },
          { status: 400 }
        );
      }
      updateData.phone = validation.digits;
    }

    if (addressLine1 !== undefined) {
      const trimmed = typeof addressLine1 === "string" ? addressLine1.trim() : "";
      if (!trimmed) {
        return NextResponse.json({ error: "Address line 1 cannot be empty." }, { status: 400 });
      }
      updateData.addressLine1 = trimmed;
    }

    if (addressLine2 !== undefined) {
      updateData.addressLine2 = typeof addressLine2 === "string" && addressLine2.trim() ? addressLine2.trim() : null;
    }

    if (landmark !== undefined) {
      updateData.landmark = typeof landmark === "string" && landmark.trim() ? landmark.trim() : null;
    }

    if (city !== undefined) {
      const trimmed = typeof city === "string" ? city.trim() : "";
      if (!trimmed) {
        return NextResponse.json({ error: "City cannot be empty." }, { status: 400 });
      }
      updateData.city = trimmed;
    }

    if (state !== undefined) {
      const trimmed = typeof state === "string" ? state.trim() : "";
      if (!trimmed) {
        return NextResponse.json({ error: "State cannot be empty." }, { status: 400 });
      }
      updateData.state = trimmed;
    }

    if (postalCode !== undefined) {
      const trimmed = typeof postalCode === "string" ? postalCode.trim() : "";
      if (!/^\d{6}$/.test(trimmed)) {
        return NextResponse.json({ error: "Please enter a valid 6-digit PIN code." }, { status: 400 });
      }
      updateData.postalCode = trimmed;
    }

    if (country !== undefined) {
      updateData.country = typeof country === "string" && country.trim() ? country.trim() : "India";
    }

    if (isDefault !== undefined) {
      updateData.isDefault = Boolean(isDefault);
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If setting as default, unset others first strictly scoped to current user
      if (updateData.isDefault) {
        await tx.address.updateMany({
          where: { userId: session.user.id, isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: updateData,
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
      select: { isDefault: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      // If we deleted the default address, set another as default
      if (existing.isDefault) {
        const firstAddress = await tx.address.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "asc" },
        });

        if (firstAddress) {
          await tx.address.update({
            where: { id: firstAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete address error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
