"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Eye, EyeOff } from "lucide-react";
import { storefrontApi } from "@/lib/api";
import { useCustomer } from "@/context/customer-context";
import Link from "next/link";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { customer } = useCustomer();

  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState("");
  const [done, setDone] = useState(false);

  if (!customer) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-stone-50 p-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-stone-600">You must be logged in to change your password.</p>
          <Link href="/login" className="text-sm text-[var(--brand)] font-medium hover:underline">Sign in</Link>
        </div>
      </div>
    );
  }

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.currentPassword) e.currentPassword = "Current password is required";
    if (!form.newPassword) e.newPassword = "New password is required";
    else if (form.newPassword.length < 6) e.newPassword = "Password must be at least 6 characters";
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setApiError("");
    try {
      await storefrontApi.changePassword(customer.phone, form.currentPassword, form.newPassword);
      setDone(true);
      setTimeout(() => router.push("/"), 2500);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-100 p-8 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[var(--brand)] rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-stone-900 leading-none">Mabelle Bites</p>
            <p className="text-stone-400 text-xs mt-0.5">Change your password</p>
          </div>
        </div>

        {done ? (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-800">
            Password changed successfully! Redirecting…
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">{apiError}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  autoFocus
                  required
                  value={form.currentPassword}
                  onChange={e => set("currentPassword", e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition pr-10 ${errors.currentPassword ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-stone-200 focus:border-[var(--brand)] focus:ring-[var(--brand)]"}`}
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && <p className="text-xs text-red-500 mt-1">{errors.currentPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={form.newPassword}
                  onChange={e => set("newPassword", e.target.value)}
                  placeholder="Min. 6 characters"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition pr-10 ${errors.newPassword ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-stone-200 focus:border-[var(--brand)] focus:ring-[var(--brand)]"}`}
                />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={e => set("confirmPassword", e.target.value)}
                placeholder="Repeat your new password"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${errors.confirmPassword ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-stone-200 focus:border-[var(--brand)] focus:ring-[var(--brand)]"}`}
              />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold rounded-full transition disabled:opacity-60"
            >
              {busy ? "Saving…" : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
