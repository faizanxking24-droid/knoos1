"use client";

import { useState, useEffect, useCallback } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  liveProductCount: number;
  linkedProductCount: number;
  _count?: { products: number };
}

interface CategoryFormData {
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm: CategoryFormData = { name: "", slug: "", isActive: true, sortOrder: 0 };

export function CategoriesClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories?includeInactive=true");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = () => {
    setEditingId("__new__");
    setFormData(emptyForm);
    setFormError(null);
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, slug: cat.slug, isActive: cat.isActive, sortOrder: cat.sortOrder });
    setFormError(null);
  };

  const handleNameChange = (name: string) => {
    setFormData((f) => ({ ...f, name, slug: name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "") }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const isNew = editingId === "__new__";

    try {
      if (!isNew) {
        const res = await fetch(`/api/admin/categories/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.fieldErrors) {
            const messages = Object.values(data.fieldErrors).flat().join(" ");
            setFormError(messages || data.error);
          } else {
            setFormError(data.error || "Failed to save category");
          }
          return;
        }

        setCategories((cats) =>
          cats.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  ...data,
                  liveProductCount: data.liveProductCount ?? c.liveProductCount ?? 0,
                  linkedProductCount: data.linkedProductCount ?? c.linkedProductCount ?? 0,
                }
              : c
          )
        );
        setEditingId(null);
        setFormData(emptyForm);
      } else {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.fieldErrors) {
            const messages = Object.values(data.fieldErrors).flat().join(" ");
            setFormError(messages || data.error);
          } else {
            setFormError(data.error || "Failed to create category");
          }
          return;
        }

        setCategories((cats) => [
          ...cats,
          {
            ...data,
            liveProductCount: data.liveProductCount ?? 0,
            linkedProductCount: data.linkedProductCount ?? 0,
          },
        ]);
        setFormData(emptyForm);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete category");
        return;
      }

      setCategories((cats) => cats.filter((c) => c.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update category");
        return;
      }

      setCategories((cats) =>
        cats.map((c) => (c.id === id ? { ...c, isActive: !currentStatus } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading categories...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl">Categories</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-black text-white text-xs font-mono uppercase tracking-wide hover:bg-gray-800 transition-colors"
        >
          + Add Category
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-4 border border-red-200 rounded">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {editingId !== null && (
        <form onSubmit={handleSave} className="mb-6 p-4 border border-gray-200 bg-white">
          <h2 className="font-mono text-xs uppercase tracking-wide text-gray-500 mb-3">
            {editingId === "__new__" ? "New Category" : "Edit Category"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="name" className="block font-mono text-xs uppercase tracking-wide mb-1">
                Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Casuals"
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                required
                maxLength={50}
              />
            </div>
            <div>
              <label htmlFor="slug" className="block font-mono text-xs uppercase tracking-wide mb-1">
                Slug
              </label>
              <input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData((f) => ({ ...f, slug: e.target.value.toLowerCase().trim().replace(/[^\w-]/g, "").replace(/--+/g, "-").replace(/^-+|-+$/g, "") }))}
                placeholder="auto-generated from name"
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors font-mono"
                maxLength={50}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="sortOrder" className="block font-mono text-xs uppercase tracking-wide mb-1">
                Sort Order
              </label>
              <input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData((f) => ({ ...f, sortOrder: parseInt(e.target.value || "0", 10) }))}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                min={0}
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-wide mb-1">Status</label>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setFormData((f) => ({ ...f, isActive: true }))}
                  className={`px-3 py-2 text-xs font-mono uppercase tracking-wide border transition-colors ${
                    formData.isActive
                      ? "bg-green-50 border-green-600 text-green-700"
                      : "border-gray-200 text-gray-500 hover:border-black"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((f) => ({ ...f, isActive: false }))}
                  className={`px-3 py-2 text-xs font-mono uppercase tracking-wide border transition-colors ${
                    !formData.isActive
                      ? "bg-gray-100 border-gray-600 text-gray-700"
                      : "border-gray-200 text-gray-500 hover:border-black"
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          {formError && (
            <div className="mb-3 text-red-600 text-xs">{formError}</div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-black text-white text-xs font-mono uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId === "__new__" ? "Create" : "Update"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData(emptyForm);
                setFormError(null);
              }}
              className="px-4 py-2 border border-gray-200 text-xs font-mono uppercase tracking-wide hover:border-black transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories Table */}
      <div className="bg-white border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-4 font-mono text-xs uppercase tracking-wide text-gray-500">Name</th>
              <th className="text-left p-4 font-mono text-xs uppercase tracking-wide text-gray-500">Slug</th>
              <th className="text-left p-4 font-mono text-xs uppercase tracking-wide text-gray-500">Live Products</th>
              <th className="text-left p-4 font-mono text-xs uppercase tracking-wide text-gray-500">Status</th>
              <th className="text-left p-4 font-mono text-xs uppercase tracking-wide text-gray-500">Sort Order</th>
              <th className="text-right p-4 font-mono text-xs uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No categories yet. Click &quot;+ Add Category&quot; to create one.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-100 last:border-0">
                  <td className="p-4">{cat.name}</td>
                  <td className="p-4 font-mono text-xs text-gray-500">{cat.slug}</td>
                  <td className="p-4">{cat.liveProductCount ?? 0}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-mono uppercase tracking-wide ${
                        cat.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">{cat.sortOrder}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(cat.id, cat.isActive)}
                        disabled={togglingId === cat.id}
                        className={`px-2 py-1 text-xs font-mono uppercase tracking-wide border transition-colors disabled:opacity-50 ${
                          cat.isActive
                            ? "border-gray-200 text-gray-600 hover:border-black"
                            : "border-green-200 text-green-600 hover:border-green-600"
                        }`}
                      >
                        {togglingId === cat.id ? "..." : cat.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleEdit(cat)}
                        className="px-2 py-1 text-xs font-mono uppercase tracking-wide border border-gray-200 hover:border-black transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(cat.id)}
                        disabled={deletingId === cat.id}
                        className="px-2 py-1 text-xs font-mono uppercase tracking-wide border border-red-200 text-red-600 hover:border-red-600 transition-colors disabled:opacity-50"
                      >
                        {deletingId === cat.id ? "..." : "Delete"}
                      </button>
                    </div>

                    {/* Delete Confirmation */}
                    {deleteConfirm === cat.id && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 text-xs">
                        {(cat.linkedProductCount ?? cat._count?.products ?? 0) > 0 ? (
                          <p className="text-red-700 mb-2">
                            This category has {cat.linkedProductCount ?? cat._count?.products} linked product(s).
                            Deactivate it instead of deleting.
                          </p>
                        ) : (
                          <p className="text-red-700 mb-2">
                            Are you sure? This cannot be undone.
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(cat.id)}
                            disabled={(cat.linkedProductCount ?? cat._count?.products ?? 0) > 0}
                            className="px-3 py-1 bg-red-600 text-white text-xs font-mono uppercase tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1 border border-gray-200 text-xs font-mono uppercase tracking-wide hover:border-black transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
