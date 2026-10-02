"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { storefrontApi } from "@/lib/api";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setBusy(true);
    setError("");
    try {
      await storefrontApi.forgotPassword(phone.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
            <p className="text-stone-400 text-xs mt-0.5">Reset your password</p>
          </div>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-800">
              If a matching account is found, we&apos;ve sent a password reset link to your registered email address.
            </div>
            <p className="text-sm text-stone-500">Didn&apos;t receive it? Check your spam folder, or try again with the correct phone number.</p>
            <Link href="/login" className="block text-center text-sm text-[var(--brand)] font-medium hover:underline">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-stone-500">
              Enter your phone number and we&apos;ll send a password reset link to your registered email address.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">{error}</div>
            )}

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-1.5">Phone Number</label>
              <input
                id="phone"
                type="tel"
                autoFocus
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+961 xx xxx xxx"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold rounded-full transition disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send Reset Link"}
            </button>

            <p className="text-center text-sm text-stone-400">
              Remember your password?{" "}
              <Link href="/login" className="text-[var(--brand)] font-medium hover:underline">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
