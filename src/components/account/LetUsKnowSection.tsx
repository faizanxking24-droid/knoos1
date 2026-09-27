"use client";

import { useState, useEffect } from "react";
import { Check, CheckCircle2, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { SHOE_SIZE_OPTIONS } from "@/lib/preferences";

interface PreferenceData {
  name: string;
  genderPreference: string;
  shoeSize: string;
  isConfigured: boolean;
}

const GENDER_OPTIONS = [
  { id: "Men", label: "Men" },
  { id: "Women", label: "Women" },
  { id: "Prefer not to say", label: "Prefer not to say" },
];

interface LetUsKnowSectionProps {
  initialName?: string;
  onSaved?: (updatedName: string) => void;
}

export function LetUsKnowSection({
  initialName = "",
  onSaved,
}: LetUsKnowSectionProps) {
  const [name, setName] = useState(initialName);
  const [genderPreference, setGenderPreference] = useState("");
  const [shoeSize, setShoeSize] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPreferences() {
      try {
        const res = await fetch("/api/account/preferences", {
          cache: "no-store",
        });
        if (res.ok) {
          const data: PreferenceData = await res.json();
          if (!cancelled) {
            setName(data.name || initialName);
            setGenderPreference(data.genderPreference || "");
            setShoeSize(data.shoeSize || "");
            setIsConfigured(Boolean(data.isConfigured));
          }
        }
      } catch {
        // silent fallback to initial props
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPreferences();
    return () => {
      cancelled = true;
    };
  }, [initialName]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/account/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          genderPreference: genderPreference || null,
          shoeSize: shoeSize || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to update preferences.",
        });
        return;
      }

      setIsConfigured(true);
      setMessage({ type: "success", text: "Preferences saved successfully!" });
      if (onSaved) {
        onSaved(name.trim());
      }
    } catch {
      setMessage({
        type: "error",
        text: "An error occurred while saving preferences.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center text-brand-gray-400">
        <Loader2 size={18} className="animate-spin mr-2" />
        <span className="font-mono text-xs uppercase tracking-wider">
          Loading preferences...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-[820px] w-full pt-8 border-t border-brand-sky-border/60">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-brand-blue" />
          <h3 className="font-serif text-xl sm:text-2xl text-brand-navy font-normal">
            Let Us Know
          </h3>
        </div>
        {isConfigured && (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full font-medium">
            <Check size={12} />
            Preferences Set
          </span>
        )}
      </div>
      <p className="text-xs sm:text-sm text-brand-gray-500 mb-6">
        Answer three quick questions to help us tailor recommendations and
        sizing for you.
      </p>

      {message && (
        <div
          role="status"
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border mb-6 text-sm ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Questionnaire Card */}
      <form
        onSubmit={handleSave}
        className="space-y-6 bg-white border border-brand-sky-border/60 rounded-xl p-6 sm:p-7 shadow-xs"
      >
        {/* Question 1: Name */}
        <div>
          <label
            htmlFor="pref-name"
            className="block font-mono text-xs uppercase tracking-widest text-brand-blue font-medium mb-1"
          >
            1. Your Name
          </label>
          <p className="text-xs text-brand-gray-400 mb-2.5">
            How should we address you?
          </p>
          <input
            id="pref-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={100}
            className="w-full max-w-md h-12 border border-brand-sky-border/80 rounded-xl px-4 text-sm bg-white text-brand-dark focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition-colors placeholder:text-brand-gray-300"
          />
        </div>

        {/* Question 2: Gender Preference */}
        <div>
          <label className="block font-mono text-xs uppercase tracking-widest text-brand-blue font-medium mb-1">
            2. Gender
          </label>
          <p className="text-xs text-brand-gray-400 mb-2.5">
            Which footwear collection are you primarily shopping for?
          </p>
          <div className="flex flex-wrap gap-2.5">
            {GENDER_OPTIONS.map((option) => {
              const selected = genderPreference === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setGenderPreference(selected ? "" : option.id)}
                  className={`h-11 px-4 rounded-xl text-xs font-mono uppercase tracking-wider transition-all border ${
                    selected
                      ? "bg-brand-navy text-white border-brand-navy shadow-xs font-semibold"
                      : "bg-brand-sky/20 text-brand-dark border-brand-sky-border/60 hover:border-brand-blue/40 hover:bg-brand-sky/40"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question 3: Shoe Size */}
        <div>
          <label className="block font-mono text-xs uppercase tracking-widest text-brand-blue font-medium mb-1">
            3. Shoe Size
          </label>
          <p className="text-xs text-brand-gray-400 mb-2.5">
            Select your standard UK footwear size.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-w-lg">
            {SHOE_SIZE_OPTIONS.map((option) => {
              const selected =
                shoeSize === option.value || shoeSize === option.label;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setShoeSize(selected ? "" : option.value)}
                  className={`h-11 px-2 text-center rounded-xl text-xs font-mono font-medium transition-all border ${
                    selected
                      ? "bg-brand-navy text-white border-brand-navy shadow-xs font-semibold"
                      : "bg-brand-sky/20 text-brand-dark border-brand-sky-border/60 hover:border-brand-blue/40 hover:bg-brand-sky/40"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-brand-navy text-white h-11 px-6 font-mono text-xs uppercase tracking-widest rounded-xl hover:bg-brand-blue transition-colors shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
