import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { normalizeIndianMobile } from "@/lib/phone";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
  });

  // Sort: default first, then by newest
  addresses.sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json(addresses);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
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

    const trimmedFullName = typeof fullName === "string" ? fullName.trim() : "";
    const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
    const trimmedAddressLine1 = typeof addressLine1 === "string" ? addressLine1.trim() : "";
    const trimmedCity = typeof city === "string" ? city.trim() : "";
    const trimmedState = typeof state === "string" ? state.trim() : "";
    const trimmedPostalCode = typeof postalCode === "string" ? postalCode.trim() : "";

    if (
      !trimmedFullName ||
      !trimmedPhone ||
      !trimmedAddressLine1 ||
      !trimmedCity ||
      !trimmedState ||
      !trimmedPostalCode
    ) {
      return NextResponse.json(
        { error: "Please fill all required fields." },
        { status: 400 }
      );
    }

    // Validate Indian phone number (10 digits starting with 6, 7, 8, or 9)
    const phoneValidation = normalizeIndianMobile(trimmedPhone);
    if (!phoneValidation.isValid || !phoneValidation.digits) {
      return NextResponse.json(
        { error: phoneValidation.error || "Please enter a valid 10-digit Indian phone number." },
        { status: 400 }
      );
    }

    // Validate postal code (exactly 6 digits)
    if (!/^\d{6}$/.test(trimmedPostalCode)) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit PIN code." },
        { status: 400 }
      );
    }

    const phoneDigits = phoneValidation.digits;

    const address = await prisma.$transaction(async (tx) => {
      let makeDefault = Boolean(isDefault);

      // If no addresses exist for this user, make this one default
      if (!makeDefault) {
        const count = await tx.address.count({ where: { userId: session.user.id } });
        if (count === 0) {
          makeDefault = true;
        }
      }

      // If this is being set as default, unset other defaults strictly for this user
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId: session.user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: session.user.id,
          label: typeof label === "string" && label.trim() ? label.trim().toUpperCase() : "HOME",
          fullName: trimmedFullName,
          phone: phoneDigits,
          addressLine1: trimmedAddressLine1,
          addressLine2: typeof addressLine2 === "string" && addressLine2.trim() ? addressLine2.trim() : null,
          landmark: typeof landmark === "string" && landmark.trim() ? landmark.trim() : null,
          city: trimmedCity,
          state: trimmedState,
          postalCode: trimmedPostalCode,
          country: typeof country === "string" && country.trim() ? country.trim() : "India",
          isDefault: makeDefault,
        },
      });
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error("Create address error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
