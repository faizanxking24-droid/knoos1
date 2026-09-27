"use client";

import { useState, useEffect } from "react";
import { Save, X, CheckCircle, AlertCircle, Pencil } from "lucide-react";
import { LetUsKnowSection } from "@/components/account/LetUsKnowSection";

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface ProfileClientProps {
  initialUser: { id: string; name: string; email?: string | null };
}

export default function ProfileClient({ initialUser }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    id: initialUser.id,
    name: initialUser.name || "",
    email: initialUser.email || "",
    phone: null,
  });
  const [editForm, setEditForm] = useState({
    name: initialUser.name || "",
    email: initialUser.email || "",
    phone: "",
  });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch full profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/account/profile", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setEditForm({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
          });
        }
      } catch {
        // use initial data
      }
    }
    loadProfile();
  }, []);

  const handleEdit = () => {
    setEditForm({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
    });
    setIsEditing(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setEditForm({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
    });
    setIsEditing(false);
    setMessage(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to update profile.",
        });
        return;
      }

      setProfile(data);
      setIsEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile.name || "Not set";
  const displayEmail = profile.email || "Not set";
  const displayPhone = profile.phone || "Not set";

  return (
    <div className="max-w-[820px] w-full">
      {/* Top Profile Identity Block */}
      <div className="flex items-center gap-4 sm:gap-5 mb-7 p-4 sm:p-5 bg-white border border-brand-sky-border/60 rounded-xl shadow-xs">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-brand-sky border border-brand-sky-border/80 flex items-center justify-center shrink-0">
          <span className="font-serif text-2xl text-brand-navy font-medium">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="font-serif text-xl sm:text-2xl text-brand-navy truncate">
            {displayName}
          </h2>
          <p className="text-xs sm:text-sm text-brand-gray-500 truncate mt-0.5">
            {displayEmail}
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border mb-6 text-sm ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Details Card */}
      <div className="bg-white border border-brand-sky-border/60 rounded-xl p-6 sm:p-7 shadow-xs">
        {isEditing ? (
          /* Edit Mode */
          <div className="space-y-5">
            <FieldGroup
              label="Full Name"
              value={editForm.name}
              onChange={(val) => setEditForm({ ...editForm, name: val })}
              placeholder="Enter your full name"
            />
            <FieldGroup
              label="Email Address"
              value={editForm.email}
              onChange={(val) => setEditForm({ ...editForm, email: val })}
              type="email"
              placeholder="your@email.com"
            />
            <FieldGroup
              label="Phone Number"
              value={editForm.phone}
              onChange={(val) =>
                setEditForm({
                  ...editForm,
                  phone: val.replace(/\D/g, "").slice(0, 10),
                })
              }
              type="tel"
              placeholder="10-digit mobile number"
            />

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-brand-navy text-white px-5 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-brand-blue rounded-xl transition-colors shadow-xs disabled:opacity-50"
              >
                <Save size={15} />
                <span>{loading ? "Saving..." : "Save Changes"}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex items-center gap-2 border border-brand-sky-border text-brand-gray-600 px-5 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-brand-sky/30 rounded-xl transition-colors"
              >
                <X size={15} />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div>
            <div className="divide-y divide-brand-sky-border/40">
              <ProfileField label="NAME" value={displayName} />
              <ProfileField label="EMAIL" value={displayEmail} />
              <ProfileField label="PHONE" value={displayPhone} />
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center gap-2 border border-brand-navy/30 text-brand-navy px-5 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-brand-navy hover:text-white rounded-xl transition-colors shadow-xs"
              >
                <Pencil size={13} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Preferences: Let Us Know (48–56px vertical separation) */}
      <div className="mt-12 sm:mt-14">
        <LetUsKnowSection
          initialName={profile.name || ""}
          onSaved={(updatedName) => {
            setProfile((prev) => ({ ...prev, name: updatedName }));
            setEditForm((prev) => ({ ...prev, name: updatedName }));
          }}
        />
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder: string;
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
        placeholder={placeholder}
        className="w-full h-12 border border-brand-sky-border/80 rounded-xl px-4 text-sm bg-white text-brand-dark focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition-colors placeholder:text-brand-gray-300"
      />
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-1 sm:gap-4">
      <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 shrink-0 w-28">
        {label}
      </span>
      <span className="text-sm font-medium text-brand-dark sm:text-right break-all">
        {value}
      </span>
    </div>
  );
}
