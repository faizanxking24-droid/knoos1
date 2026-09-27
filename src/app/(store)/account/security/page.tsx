"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, CheckCircle, AlertCircle, Lock } from "lucide-react";
import AccountShell from "../AccountShell";

export default function SecurityPage() {
  return (
    <AccountShell
      title="Security"
      subtitle="Manage your password and account security"
      active="security"
    >
      <SecurityForm />
    </AccountShell>
  );
}

function SecurityForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!currentPassword.trim())
      errs.currentPassword = "Current password is required.";
    if (!newPassword.trim()) errs.newPassword = "New password is required.";
    else if (newPassword.length < 8)
      errs.newPassword = "Password must be at least 8 characters.";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      errs.newPassword =
        "Password must contain uppercase, lowercase, and a number.";
    }
    if (newPassword !== confirmPassword)
      errs.confirmPassword = "Passwords do not match.";
    if (newPassword === currentPassword && currentPassword) {
      errs.newPassword =
        "New password must be different from the current password.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to update password.",
        });
        return;
      }

      setMessage({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[760px] w-full">
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

      <div className="border border-brand-sky-border/60 rounded-xl bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-brand-sky-border/40">
          <div className="w-10 h-10 rounded-xl bg-brand-sky text-brand-navy flex items-center justify-center shrink-0">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="font-serif text-lg text-brand-navy">Change Password</h2>
            <p className="text-xs text-brand-gray-500">
              Update your account password
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            error={errors.currentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
          />

          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            error={errors.newPassword}
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
            hint="Minimum 8 characters with uppercase, lowercase, and a number"
          />

          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={errors.confirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-brand-navy text-white px-6 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-brand-blue rounded-xl transition-colors shadow-xs disabled:opacity-50 font-medium"
            >
              <Save size={15} />
              <span>{loading ? "Updating..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  error,
  show,
  onToggle,
  hint,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  show: boolean;
  onToggle: () => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block font-mono text-xs uppercase tracking-widest text-brand-blue font-medium mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-12 border ${
            error ? "border-red-300" : "border-brand-sky-border/80"
          } rounded-xl px-4 pr-12 text-sm bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition-colors placeholder:text-brand-gray-300`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-gray-400 hover:text-brand-navy p-1"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-red-600 text-xs mt-1.5">{error}</p>}
      {hint && !error && (
        <p className="text-brand-gray-400 text-xs mt-1.5">{hint}</p>
      )}
    </div>
  );
}
