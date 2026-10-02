"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShoppingBag, Eye, EyeOff } from "lucide-react";
import { storefrontApi } from "@/lib/api";
import Link from "next/link";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-red-600">Invalid or missing reset link.</p>
        <Link href="/forgot-password" className="text-sm text-[var(--brand)] hover:underline">Request a new one</Link>
      </div>
    );
  }

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setApiError("");
    try {
      await storefrontApi.resetPassword(token, form.password);
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-800">
          Your password has been reset successfully. Redirecting you to sign in…
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-stone-500">Choose a new password for your account.</p>

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
          {apiError}{" "}
          {apiError.toLowerCase().includes("expired") && (
            <Link href="/forgot-password" className="underline">Request a new link</Link>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">New Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoFocus
            required
            value={form.password}
            onChange={e => set("password", e.target.value)}
            placeholder="Min. 6 characters"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition pr-10 ${errors.password ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-stone-200 focus:border-[var(--brand)] focus:ring-[var(--brand)]"}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Confirm New Password</label>
        <input
          type="password"
          required
          value={form.confirmPassword}
          onChange={e => set("confirmPassword", e.target.value)}
          placeholder="Repeat your password"
          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${errors.confirmPassword ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-stone-200 focus:border-[var(--brand)] focus:ring-[var(--brand)]"}`}
        />
        {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold rounded-full transition disabled:opacity-60"
      >
        {busy ? "Saving…" : "Set New Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-100 p-8 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[var(--brand)] rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-stone-900 leading-none">Mabelle Bites</p>
            <p className="text-stone-400 text-xs mt-0.5">Set a new password</p>
          </div>
        </div>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
