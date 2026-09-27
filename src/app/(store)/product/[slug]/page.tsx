import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductRecommendations } from "@/components/product/ProductRecommendations";
import { getRecommendations } from "@/lib/recommendations";
import { StoreContainer } from "@/components/store/StoreContainer";
interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  let product = null;
  try {
    product = await prisma.product.findUnique({
      where: { slug: resolvedParams.slug },
    });
  } catch (error) {
    console.error("Error generating metadata for product:", error);
  }

  if (!product) {
    const { FALLBACK_PRODUCTS } = await import("@/lib/fallback-data");
    const fb = FALLBACK_PRODUCTS.find((p) => p.slug === resolvedParams.slug);
    if (fb) {
      product = fb as any;
    }
  }

  if (!product) {
    return {
      title: "Product Not Found | KNOOS",
    };
  }

  return {
    title: `${product.name} | KNOOS`,
    description: product.description?.slice(0, 160) || `Buy ${product.name} at KNOOS. Premium footwear for the discerning individual.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  let product = null;
  try {
    product = await prisma.product.findUnique({
      where: {
        slug: resolvedParams.slug,
        status: "ACTIVE", // Only show active products to customers
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: true,
        categoryRel: {
          select: { id: true, name: true, slug: true },
        },
        reviews: {
          where: {
            moderationStatus: "APPROVED",
            isActive: true,
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            displayName: true,
            rating: true,
            reviewText: true,
            customerPhotoUrl: true,
            productPhotoUrl: true,
            createdAt: true,
          },
        }
      },
    });
  } catch (error) {
    console.error("Error fetching product by slug:", error);
  }

  if (!product) {
    const { FALLBACK_PRODUCTS } = await import("@/lib/fallback-data");
    const fb = FALLBACK_PRODUCTS.find((p) => p.slug === resolvedParams.slug);
    if (fb) {
      product = fb as any;
    }
  }

  if (!product) {
    notFound();
  }

  // Load active sibling products in the same color family (if colorGroupKey is defined)
  let colorSiblings: Array<{
    id: string;
    name: string;
    slug: string;
    color: string | null;
    status: string;
    price: number;
    salePrice: number | null;
    images: { id: string; imageUrl: string }[];
    variants: { stock: number }[];
  }> = [];

  if (product.colorGroupKey) {
    try {
      colorSiblings = await prisma.product.findMany({
        where: {
          colorGroupKey: product.colorGroupKey,
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          status: true,
          price: true,
          salePrice: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: {
              id: true,
              imageUrl: true,
            },
          },
          variants: { select: { stock: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    } catch (error) {
      console.error("Error fetching color siblings:", error);
    }

    // Always include current product logically in color choices even if edge-case data inconsistency occurred
    if (!colorSiblings.some((sibling) => sibling.id === product.id)) {
      colorSiblings.unshift({
        id: product.id,
        name: product.name,
        slug: product.slug,
        color: product.color,
        status: product.status,
        price: product.price,
        salePrice: product.salePrice,
        images: product.images.slice(0, 1).map((img: any) => ({ id: img.id, imageUrl: img.imageUrl })),
        variants: product.variants.map((variant: any) => ({ stock: variant.stock })),
      });
    }
  }

  // Format reviews to match the props structure expected by ProductReviews
  const formattedReviews = (product.reviews || []).map((r: any) => ({
    ...r,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : r.createdAt.toISOString()
  }));

  const recommendedProducts = await getRecommendations({
    currentProductId: product.id,
    category: product.categoryRel?.name || undefined,
    subCategory: product.subCategory || undefined,
    gender: product.gender,
    limit: 4
  });

  return (
    <div className="bg-white min-h-screen py-8 sm:py-12 lg:py-16 border-b border-neutral-100">
      <StoreContainer>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="w-full lg:col-span-7">
            <ProductGallery images={product.images} productName={product.name} />
          </div>
          <div className="w-full lg:col-span-5 lg:sticky lg:top-28">
            <ProductInfo product={product} variants={product.variants} colorSiblings={colorSiblings} />
          </div>
        </div>
        
        <ProductReviews productId={product.id} reviews={formattedReviews} />
        
        <ProductRecommendations products={recommendedProducts} mode="product-page" />
      </StoreContainer>
    </div>
  );
}
