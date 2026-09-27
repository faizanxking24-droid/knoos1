"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Check,
  X,
  AlertCircle,
  Save,
} from "lucide-react";

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const LABELS = ["HOME", "WORK", "OTHER"] as const;

const emptyAddress = (): Omit<Address, "id"> & { isDefault?: boolean } => ({
  label: "HOME",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
});

export default function AddressesClient() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyAddress());

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/addresses", { cache: "no-store" });
      if (res.status === 401) {
        setMessage({
          type: "error",
          text: "Please sign in to view and manage your addresses.",
        });
        return;
      }
      if (!res.ok) {
        setMessage({
          type: "error",
          text: "Unable to load addresses right now. Please refresh or try again later.",
        });
        return;
      }
      const data = await res.json();
      setAddresses(data);
    } catch {
      setMessage({
        type: "error",
        text: "Unable to load addresses right now. Please refresh or try again later.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAddresses();
  }, [fetchAddresses]);

  const resetForm = () => {
    setForm(emptyAddress());
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (addr: Address) => {
    setForm({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      landmark: addr.landmark || "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const url = editingId ? `/api/addresses/${editingId}` : "/api/addresses";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to save address.",
        });
        return;
      }

      await fetchAddresses();
      resetForm();
      setMessage({
        type: "success",
        text: editingId
          ? "Address updated successfully."
          : "Address added successfully.",
      });
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to delete address.",
        });
        return;
      }
      await fetchAddresses();
      setMessage({ type: "success", text: "Address deleted." });
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setSaving(false);
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data?.error || "Failed to set default address.",
        });
        return;
      }
      await fetchAddresses();
      setMessage({ type: "success", text: "Default address updated." });
    } catch {
      setMessage({
        type: "error",
        text: "Unable to update default address. Please try again.",
      });
    }
  };

  return (
    <div className="max-w-[1000px] w-full">
      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border mb-6 text-sm ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <Check size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form Drawer / Container */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border border-brand-sky-border/60 rounded-xl bg-white p-6 sm:p-7 mb-8 shadow-xs"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-serif text-xl text-brand-navy">
              {editingId ? "Edit Address" : "Add New Address"}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-brand-gray-400 hover:text-brand-navy transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-brand-blue font-medium mb-2">
                Address Type
              </label>
              <div className="flex gap-2">
                {LABELS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setForm({ ...form, label })}
                    className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-xl border transition-all ${
                      form.label === label
                        ? "border-brand-navy bg-brand-navy text-white shadow-xs font-semibold"
                        : "border-brand-sky-border bg-brand-sky/20 hover:border-brand-blue/50 text-brand-dark"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Full Name"
                value={form.fullName}
                onChange={(v) => setForm({ ...form, fullName: v })}
                required
              />
              <TextField
                label="Phone Number"
                value={form.phone}
                onChange={(v) =>
                  setForm({
                    ...form,
                    phone: v.replace(/\D/g, "").slice(0, 10),
                  })
                }
                type="tel"
                inputMode="numeric"
                required
              />
            </div>

            <TextField
              label="Address Line 1"
              value={form.addressLine1}
              onChange={(v) => setForm({ ...form, addressLine1: v })}
              required
            />
            <TextField
              label="Address Line 2 (Optional)"
              value={form.addressLine2 || ""}
              onChange={(v) => setForm({ ...form, addressLine2: v })}
            />
            <TextField
              label="Landmark (Optional)"
              value={form.landmark || ""}
              onChange={(v) => setForm({ ...form, landmark: v })}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <TextField
                label="City"
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
                required
              />
              <TextField
                label="State"
                value={form.state}
                onChange={(v) => setForm({ ...form, state: v })}
                required
              />
              <TextField
                label="PIN Code"
                value={form.postalCode}
                onChange={(v) =>
                  setForm({
                    ...form,
                    postalCode: v.replace(/\D/g, "").slice(0, 6),
                  })
                }
                type="tel"
                inputMode="numeric"
                required
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm({ ...form, isDefault: e.target.checked })
                }
                className="w-4 h-4 accent-brand-navy rounded"
              />
              <span className="text-sm text-brand-dark">
                Make this my default delivery address
              </span>
            </label>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-brand-navy text-white px-5 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-brand-blue rounded-xl transition-colors shadow-xs disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? "Saving..." : "Save Address"}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="inline-flex items-center gap-2 border border-brand-sky-border text-brand-gray-600 px-5 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-brand-sky/30 rounded-xl transition-colors"
              >
                <X size={15} />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Address List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-48 bg-brand-sky/20 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <EmptyState
          onAdd={() => {
            resetForm();
            setShowForm(true);
          }}
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="border border-brand-sky-border/60 rounded-xl bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 bg-brand-sky text-brand-navy text-[11px] font-mono uppercase tracking-wider rounded-md font-semibold">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="px-2.5 py-0.5 bg-brand-navy text-white text-[11px] font-mono uppercase tracking-wider rounded-md font-medium">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="font-serif text-base text-brand-dark font-medium mb-1.5">
                    {addr.fullName}
                  </p>
                  <p className="text-sm text-brand-gray-600 leading-relaxed">
                    {addr.addressLine1}
                    {addr.addressLine2 && <>, {addr.addressLine2}</>}
                    {addr.landmark && <> ({addr.landmark})</>}
                    <br />
                    {addr.city}, {addr.state} — {addr.postalCode}
                    <br />
                    {addr.country}
                  </p>
                  <p className="text-xs font-mono text-brand-gray-500 mt-2.5">
                    +91 {addr.phone}
                  </p>
                </div>

                <div className="border-t border-brand-sky-border/40 mt-5 pt-3.5 flex items-center justify-between text-xs font-mono uppercase tracking-wider">
                  <div>
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-brand-blue hover:text-brand-navy transition-colors font-medium"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(addr)}
                      className="inline-flex items-center gap-1 text-brand-gray-600 hover:text-brand-navy transition-colors"
                    >
                      <Pencil size={12} />
                      <span>Edit</span>
                    </button>
                    <span className="text-brand-sky-border">|</span>
                    <button
                      onClick={() => setDeletingId(addr.id)}
                      className="inline-flex items-center gap-1 text-brand-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Address Card Button */}
          {!showForm && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="w-full min-h-[76px] border border-dashed border-brand-sky-border/80 hover:border-brand-blue/60 rounded-xl bg-brand-sky/15 hover:bg-brand-sky/30 transition-all flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest text-brand-navy hover:text-brand-blue font-semibold shadow-xs"
            >
              <Plus size={16} />
              <span>Add New Address</span>
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-brand-sky-border/60 p-6 max-w-sm w-full shadow-lg">
            <h3 className="font-serif text-lg text-brand-navy mb-2">
              Delete this address?
            </h3>
            <p className="text-sm text-brand-gray-600 mb-6">
              This cannot be undone. If this is your default address, another
              will be set as default.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={saving}
                className="flex-1 bg-red-600 text-white py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingId(null)}
                disabled={saving}
                className="flex-1 border border-brand-sky-border text-brand-gray-600 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-brand-sky/30 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  required,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  inputMode?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block font-mono text-xs uppercase tracking-widest text-brand-blue font-medium mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode as React.HTMLAttributes<HTMLInputElement>["inputMode"]}
        required={required}
        className="w-full h-12 border border-brand-sky-border/80 rounded-xl px-4 text-sm bg-white text-brand-dark focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition-colors placeholder:text-brand-gray-300"
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border border-brand-sky-border/60 rounded-xl bg-white py-12 px-6 text-center shadow-xs">
      <div className="w-12 h-12 rounded-full bg-brand-sky/40 text-brand-navy flex items-center justify-center mx-auto mb-3">
        <MapPin size={22} strokeWidth={1.75} />
      </div>
      <h3 className="font-serif text-xl text-brand-navy mb-1.5">
        No addresses yet
      </h3>
      <p className="text-brand-gray-500 text-sm mb-5 max-w-sm mx-auto">
        Save your delivery addresses for seamless checkout.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 bg-brand-navy text-white px-5 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-brand-blue rounded-xl transition-colors shadow-xs"
      >
        <Plus size={15} />
        <span>Add Address</span>
      </button>
    </div>
  );
}
