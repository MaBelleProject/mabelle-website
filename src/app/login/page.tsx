"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCustomer } from "@/context/customer-context";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useCustomer();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("expired") ? "Your session expired. Please sign in again." : null,
  );
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(phone, password);
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-100 p-8 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 bg-[var(--brand)] rounded-xl flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-stone-900 leading-none">Mabelle Bites</p>
          <p className="text-stone-400 text-xs mt-0.5">Sign in to your account</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-1.5">Phone Number</label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          autoFocus
          required
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+961 xx xxx xxx"
          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-stone-700">Password</label>
          <Link href="/forgot-password" className="text-xs text-[var(--brand)] hover:underline">Forgot password?</Link>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold rounded-full transition disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign In"}
      </button>

      <p className="text-center text-sm text-stone-400">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[var(--brand)] font-medium hover:underline">Sign up</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-stone-50 p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
