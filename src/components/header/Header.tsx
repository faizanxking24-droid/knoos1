import { auth, signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const session = await auth();

  let cartCount = 0;
  let categories: { id: string; name: string; slug: string }[] = [];

  try {
    if (session?.user?.id) {
      const cart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
        include: { items: true },
      });
      if (cart) {
        cartCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
      }
    }

    categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    });
  } catch (error) {
    console.warn("Could not query header data from database:", error instanceof Error ? error.message : error);
  }

  const signInAction = async () => {
    "use server";
    await signIn("google");
  };

  const signOutAction = async () => {
    "use server";
    await signOut();
  };

  return (
    <HeaderClient
      cartCount={cartCount}
      userName={session?.user?.name}
      signInAction={signInAction}
      signOutAction={signOutAction}
      categories={categories}
    />
  );
}

