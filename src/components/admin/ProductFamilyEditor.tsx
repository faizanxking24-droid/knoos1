"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MEN_SIZES, WOMEN_SIZES } from "@/lib/constants";

type MediaDraft = { imageUrl: string; isVideo: boolean };
type VariantDraft = { id?: string; size: string; sku: string; price: string; salePrice: string; stock: string };
type ColorDraft = { id?: string; color: string; sku: string; name: string; slug: string; status: "ACTIVE" | "INACTIVE"; images: MediaDraft[]; variants: VariantDraft[] };
type FamilyDraft = { baseName: string; gender: "MEN" | "WOMEN"; categoryId: string; description: string; subCategory: string; upperMaterial: string; innerMaterial: string; sole: string; colors: ColorDraft[] };
const blankColor = (): ColorDraft => ({ color: "", sku: "", name: "", slug: "", status: "ACTIVE", images: [], variants: [] });
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s-]+/g, "-").replace(/^-|-$/g, "");
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const suggestedName = (base: string, color: string) => !color.trim() || new RegExp(`\\b${escapeRegex(color)}\\b`, "i").test(base) ? base : /^knoos\b/i.test(base) ? base.replace(/^knoos\b/i, `KNOOS ${color.trim()}`) : `${color.trim()} ${base}`;

export default function ProductFamilyEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<FamilyDraft>({ baseName: "", gender: "MEN", categoryId: "", description: "", subCategory: "", upperMaterial: "", innerMaterial: "", sole: "", colors: [blankColor()] });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [legacy, setLegacy] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ colorIndex: number; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/categories").then((response) => response.json()).then((data) => setCategories(data.categories ?? [])).catch(() => {});
    if (!productId) return;
    fetch(`/api/admin/product-families/${productId}`).then(async (response) => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      const first = data.products[0];
      const baseName = first.color ? first.name.replace(new RegExp(`\\b${escapeRegex(first.color)}\\b`, "i"), "").replace(/\s+/g, " ").trim() : first.name;
      setDraft({ baseName, gender: first.gender, categoryId: first.categoryId ?? "", description: first.description ?? "", subCategory: first.subCategory ?? "", upperMaterial: first.upperMaterial ?? "", innerMaterial: first.innerMaterial ?? "", sole: first.sole ?? "", colors: data.products.map((product: any) => ({ id: product.id, color: product.color ?? "", sku: product.sku, name: product.name, slug: product.slug, status: product.status, images: (product.images || []).map((image: any) => ({ imageUrl: typeof image === "string" ? image : image.imageUrl, isVideo: typeof image === "string" ? false : Boolean(image.isVideo) })), variants: product.variants.map((variant: any) => ({ id: variant.id, size: variant.size, sku: variant.sku, price: String(variant.price), salePrice: variant.salePrice == null ? "" : String(variant.salePrice), stock: String(variant.stock) })) })) });
      setLegacy(data.legacyCombined);
    }).catch((reason) => setError(reason.message || "Unable to load product family")).finally(() => setLoading(false));
  }, [productId]);

  const updateColor = (index: number, patch: Partial<ColorDraft>) => setDraft((current) => ({ ...current, colors: current.colors.map((color, i) => i === index ? { ...color, ...patch } : color) }));
  const updateVariant = (colorIndex: number, variantIndex: number, patch: Partial<VariantDraft>) => updateColor(colorIndex, { variants: draft.colors[colorIndex].variants.map((variant, i) => i === variantIndex ? { ...variant, ...patch } : variant) });
  const addSize = (colorIndex: number, size = "") => { const color = draft.colors[colorIndex]; if (size && color.variants.some((variant) => variant.size === size)) return; updateColor(colorIndex, { variants: [...color.variants, { size, sku: color.sku && size ? `${color.sku}-${size}` : "", price: "", salePrice: "", stock: "0" }] }); };
  const uploadBatch = async (colorIndex: number, files: File[], isVideo: boolean) => {
    if (!files.length || uploadStatus !== null) return;
    setError("");

    const total = files.length;
    let nextIndex = 0;
    let completedCount = 0;
    const results: (MediaDraft | null)[] = new Array(total).fill(null);
    const failureMessages: string[] = [];

    setUploadStatus({
      colorIndex,
      text: `Uploading 1 of ${total}...`,
    });

    const worker = async () => {
      while (nextIndex < total) {
        const currentIndex = nextIndex++;
        const file = files[currentIndex];

        try {
          const body = new FormData();
          body.append("file", file);
          const response = await fetch("/api/admin/upload", { method: "POST", body });
          const data = await response.json();

          if (!response.ok) {
            failureMessages.push(`${file.name} failed: ${data.error || "Upload failed"}`);
          } else {
            results[currentIndex] = {
              imageUrl: data.url,
              isVideo: isVideo || Boolean(data.isVideo),
            };
          }
        } catch {
          failureMessages.push(`${file.name} failed: Network error`);
        } finally {
          completedCount++;
          if (completedCount < total) {
            setUploadStatus({
              colorIndex,
              text: `Uploading ${completedCount + 1} of ${total}...`,
            });
          }
        }
      }
    };

    const concurrency = Math.min(2, total);
    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    const successful = results.filter((item): item is MediaDraft => item !== null);

    if (successful.length > 0) {
      setDraft((current) => ({
        ...current,
        colors: current.colors.map((color, i) =>
          i === colorIndex
            ? { ...color, images: [...color.images, ...successful] }
            : color
        ),
      }));
    }

    if (failureMessages.length > 0) {
      if (successful.length > 0) {
        setError(`${successful.length} of ${total} uploaded successfully. ${failureMessages.join("; ")}`);
      } else {
        setError(`Upload failed: ${failureMessages.join("; ")}`);
      }
    }

    setUploadStatus(null);
  };
  const addColor = () => { const source = draft.colors[0]; setDraft((current) => ({ ...current, colors: [...current.colors, { ...blankColor(), variants: source.variants.map((variant) => ({ size: variant.size, sku: "", price: variant.price, salePrice: variant.salePrice, stock: "0" })) }] })); };
  const convertLegacy = async () => { if (!productId) return; const colors = draft.colors[0].color.split(/[,;]/).map((value) => value.trim()).filter(Boolean); const skus = draft.colors[0].sku.split(/[,;]/).map((value) => value.trim()); const response = await fetch(`/api/admin/products/${productId}/convert-legacy-colors`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ colors, skuMap: colors.map((color, index) => ({ color, sku: skus[index] })) }) }); const data = await response.json(); if (!response.ok) return setError(data.error || "Conversion failed"); window.location.reload(); };
  const save = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(""); const body = { ...draft, categoryId: draft.categoryId || null, colors: draft.colors.map((color) => ({ ...color, images: color.images.map((item, sortOrder) => ({ imageUrl: item.imageUrl, isVideo: item.isVideo, sortOrder })), variants: color.variants.map((variant) => ({ ...variant, stock: Number(variant.stock), price: Number(variant.price), salePrice: variant.salePrice === "" ? null : Number(variant.salePrice) })) })) }; try { const response = await fetch(productId ? `/api/admin/product-families/${productId}` : "/api/admin/product-families", { method: productId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to save product family"); router.push("/admin/products"); router.refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save product family"); } finally { setSaving(false); } };
  if (loading) return <div className="p-8 font-mono text-sm">Loading product family...</div>;

  return <form onSubmit={save} className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
    <header className="flex items-center justify-between"><div><p className="font-mono text-xs uppercase tracking-widest text-brand-gray-500">Products</p><h1 className="font-serif text-3xl">{productId ? "Edit Product Family" : "Add Product"}</h1></div><Link href="/admin/products" className="font-mono text-xs uppercase">Cancel</Link></header>
    {error && <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {legacy && <div className="border border-amber-300 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3"><div><strong>Legacy combined color data detected</strong><p className="text-sm text-amber-800">Convert this product before editing it as a family.</p></div><button type="button" onClick={convertLegacy} className="bg-amber-800 text-white px-4 py-2 text-xs font-mono uppercase">Convert Product</button></div>}
    <section className="bg-white border p-5 sm:p-7 space-y-5"><h2 className="font-serif text-xl border-b pb-3">A. Basic Information</h2>
      <Field label="Product Name *"><input required value={draft.baseName} onChange={(e) => setDraft({ ...draft, baseName: e.target.value })} className="field" placeholder="KNOOS Chelsea Boot WAV-323" /></Field>
      <div className="grid sm:grid-cols-2 gap-4"><Field label="Gender *"><select value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value as "MEN" | "WOMEN" })} className="field"><option>MEN</option><option>WOMEN</option></select></Field><Field label="Category"><select value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })} className="field"><option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field></div>
      <Field label="Description"><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="field min-h-28" /></Field>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{(["subCategory", "upperMaterial", "innerMaterial", "sole"] as const).map((field) => <Field key={field} label={field.replace(/([A-Z])/g, " $1")}><input value={draft[field]} onChange={(e) => setDraft({ ...draft, [field]: e.target.value })} className="field" /></Field>)}</div>
    </section>
    <section className="space-y-5"><div><h2 className="font-serif text-xl">B. Colors &amp; Variants</h2><p className="text-sm text-brand-gray-500">Each color has independent images, sizes, pricing, and stock.</p></div>
      {draft.colors.map((color, colorIndex) => <details key={color.id ?? colorIndex} open className="bg-white border"><summary className="cursor-pointer p-5 font-serif text-xl flex justify-between"><span>{color.color || `Color ${colorIndex + 1}`}</span><span className="font-mono text-xs text-brand-gray-500">{color.variants.length} sizes</span></summary><div className="p-5 pt-0 space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><Field label="Color Name *"><input required value={color.color} onChange={(e) => { const value = e.target.value; const name = suggestedName(draft.baseName, value); updateColor(colorIndex, { color: value, name, slug: slugify(name) }); }} className="field" placeholder="Black" /></Field><Field label="Color SKU *"><input required value={color.sku} onChange={(e) => updateColor(colorIndex, { sku: e.target.value, variants: color.variants.map((variant) => ({ ...variant, sku: variant.size ? `${e.target.value}-${variant.size}` : variant.sku })) })} className="field font-mono" placeholder="WAV-323-BLK" /></Field><Field label="Status"><select value={color.status} onChange={(e) => updateColor(colorIndex, { status: e.target.value as "ACTIVE" | "INACTIVE" })} className="field"><option>ACTIVE</option><option>INACTIVE</option></select></Field><Field label="Product Name"><input required value={color.name} onChange={(e) => updateColor(colorIndex, { name: e.target.value, slug: slugify(e.target.value) })} className="field" /></Field></div>
        <details className="border bg-gray-50 p-3"><summary className="cursor-pointer font-mono text-xs uppercase">Advanced</summary><div className="mt-3"><Field label="Slug"><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={color.slug} onChange={(e) => updateColor(colorIndex, { slug: slugify(e.target.value) })} className="field font-mono" /></Field><p className="mt-1 text-xs text-brand-gray-500">A numeric suffix is added automatically if this URL is already used.</p></div></details>
        <Field label="Product Media">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {color.images.map((item, mediaIndex) => (
                <div key={`${item.imageUrl}-${mediaIndex}`} className="relative w-24 h-24 border bg-gray-50 rounded overflow-hidden">
                  {item.isVideo ? (
                    <div className="relative w-full h-full bg-black flex items-center justify-center">
                      <video
                        src={item.imageUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      <div className="absolute top-1 left-1 bg-black/85 text-white text-[9px] font-mono px-1 py-0.5 rounded font-bold uppercase tracking-wider z-10">
                        VIDEO
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow">
                          <svg className="w-3 h-3 text-brand-navy ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Image src={item.imageUrl} alt="" fill className="object-contain" />
                  )}
                  <div className="absolute bottom-0 inset-x-0 flex bg-white/90 border-t text-xs font-mono">
                    <button
                      type="button"
                      disabled={mediaIndex === 0}
                      onClick={() => {
                        const images = [...color.images];
                        [images[mediaIndex - 1], images[mediaIndex]] = [images[mediaIndex], images[mediaIndex - 1]];
                        updateColor(colorIndex, { images });
                      }}
                      className="flex-1 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move left"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={mediaIndex === color.images.length - 1}
                      onClick={() => {
                        const images = [...color.images];
                        [images[mediaIndex], images[mediaIndex + 1]] = [images[mediaIndex + 1], images[mediaIndex]];
                        updateColor(colorIndex, { images });
                      }}
                      className="flex-1 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent border-l"
                      title="Move right"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      onClick={() => updateColor(colorIndex, { images: color.images.filter((_, i) => i !== mediaIndex) })}
                      className="flex-1 text-red-600 hover:bg-red-50 border-l font-bold"
                      title="Remove media"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <label
                className={`px-3 py-2 border border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white transition-colors text-xs font-mono uppercase cursor-pointer rounded flex items-center gap-1.5 ${
                  uploadStatus !== null ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <span>+ Upload Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadStatus !== null}
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    if (files.length) void uploadBatch(colorIndex, files, false);
                    e.target.value = "";
                  }}
                />
              </label>

              <label
                className={`px-3 py-2 border border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white transition-colors text-xs font-mono uppercase cursor-pointer rounded flex items-center gap-1.5 ${
                  uploadStatus !== null ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <span>+ Upload Video</span>
                <input
                  type="file"
                  multiple
                  accept="video/mp4,video/webm"
                  className="hidden"
                  disabled={uploadStatus !== null}
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    if (files.length) void uploadBatch(colorIndex, files, true);
                    e.target.value = "";
                  }}
                />
              </label>

              <span className="text-xs text-brand-gray-500 font-mono">
                Images: JPG / PNG / WEBP (max 5MB) &bull; Video: MP4 / WEBM (max 40MB)
              </span>
            </div>

            {uploadStatus?.colorIndex === colorIndex && (
              <div className="text-xs font-mono text-brand-blue flex items-center gap-2 bg-blue-50/80 p-2 rounded border border-blue-200">
                <span className="inline-block w-3 h-3 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                <span>{uploadStatus.text}</span>
              </div>
            )}
          </div>
        </Field>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="text-left font-mono text-[11px] uppercase border-b">{["Size", "Variant SKU", "MRP", "Selling Price", "Stock", "Availability", ""].map((heading) => <th key={heading} className="p-2">{heading}</th>)}</tr></thead><tbody>{color.variants.map((variant, variantIndex) => <tr key={variant.id ?? variantIndex} className="border-b"><td className="p-2"><input required value={variant.size} onChange={(e) => updateVariant(colorIndex, variantIndex, { size: e.target.value, sku: `${color.sku}-${e.target.value}` })} className="cell w-16" /></td><td className="p-2"><input required value={variant.sku} onChange={(e) => updateVariant(colorIndex, variantIndex, { sku: e.target.value })} className="cell w-44 font-mono" /></td><td className="p-2"><input required min="1" type="number" value={variant.price} onChange={(e) => updateVariant(colorIndex, variantIndex, { price: e.target.value })} className="cell w-24" /></td><td className="p-2"><input min="0" type="number" value={variant.salePrice} onChange={(e) => updateVariant(colorIndex, variantIndex, { salePrice: e.target.value })} className="cell w-24" /></td><td className="p-2"><input required min="0" type="number" value={variant.stock} onChange={(e) => updateVariant(colorIndex, variantIndex, { stock: e.target.value })} className="cell w-20" /></td><td className="p-2 font-mono text-xs">{Number(variant.stock) > 0 ? <span className="text-green-700">AVAILABLE</span> : <span className="text-red-600">OUT OF STOCK</span>}</td><td><button type="button" onClick={() => updateColor(colorIndex, { variants: color.variants.filter((_, i) => i !== variantIndex) })} className="text-red-600">Remove</button></td></tr>)}</tbody></table></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => addSize(colorIndex)} className="secondary">+ Add Size</button><button type="button" onClick={() => (draft.gender === "MEN" ? MEN_SIZES : WOMEN_SIZES).forEach((size) => addSize(colorIndex, size))} className="secondary">Add Standard Sizes</button>{colorIndex > 0 && <button type="button" onClick={() => updateColor(colorIndex, { variants: draft.colors[0].variants.map((variant) => ({ size: variant.size, sku: color.sku ? `${color.sku}-${variant.size}` : "", price: variant.price, salePrice: variant.salePrice, stock: "0" })) })} className="secondary">Copy size structure from {draft.colors[0].color || "first color"}</button>}{draft.colors.length > 1 && <button type="button" onClick={() => setDraft({ ...draft, colors: draft.colors.filter((_, i) => i !== colorIndex) })} className="secondary text-red-600">Remove Color</button>}</div>
      </div></details>)}
      <button type="button" onClick={addColor} className="w-full border-2 border-dashed p-4 font-mono text-xs uppercase">+ Add Color</button>
    </section>
    <div className="sticky bottom-0 bg-white/95 border p-4 flex justify-end"><button disabled={saving || legacy || uploadStatus !== null} className="bg-brand-navy text-white px-7 py-3 font-mono text-xs uppercase disabled:opacity-50">{saving ? "Saving family..." : "Save Product Family"}</button></div>
    <style jsx global>{`.family-label{display:block;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}.field{width:100%;border:1px solid #d7d7d7;padding:10px 12px;background:white}.cell{border:1px solid #ddd;padding:8px}.secondary{border:1px solid #ccc;padding:8px 12px;font-family:monospace;font-size:11px;text-transform:uppercase}`}</style>
  </form>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="family-label">{label}</label>{children}</div>;
}
