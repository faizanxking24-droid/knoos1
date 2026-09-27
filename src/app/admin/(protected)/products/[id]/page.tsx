import type { Metadata } from "next";
import ProductFamilyEditor from "@/components/admin/ProductFamilyEditor";

export const metadata: Metadata = { title: "Edit Product Family — Admin" };

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProductFamilyEditor productId={(await params).id} />;
}
