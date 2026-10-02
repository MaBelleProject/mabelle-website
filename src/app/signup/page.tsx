"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Eye, EyeOff } from "lucide-react";
import { useCustomer } from "@/context/customer-context";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useCustomer();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", confirmPassword: "", address: "", city: "", floor: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
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
      await signup(form.name.trim(), form.phone.trim(), form.email || undefined, form.password, form.address || undefined, form.city || undefined, form.floor || undefined);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Sign up failed");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-stone-50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-100 p-8 space-y-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-10 h-10 bg-[var(--brand)] rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-stone-900 leading-none">Mabelle Bites</p>
            <p className="text-stone-400 text-xs mt-0.5">Create your account</p>
          </div>
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
            {apiError}
          </div>
        )}

        <Field label="Full Name *" error={errors.name}>
          <input
            type="text"
            autoFocus
            required
            value={form.name}
            onChange={e => set("name", e.target.value)}
            placeholder="Your name"
            className={inputCls(!!errors.name)}
          />
        </Field>

        <Field label="Phone Number *" error={errors.phone}>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={e => set("phone", e.target.value)}
            placeholder="+961 xx xxx xxx"
            className={inputCls(!!errors.phone)}
          />
        </Field>

        <Field label="Email Address" error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={e => set("email", e.target.value)}
            placeholder="your@email.com (optional)"
            className={inputCls(!!errors.email)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="City" error={errors.city}>
            <input type="text" value={form.city} onChange={e => set("city", e.target.value)} placeholder="Your city" className={inputCls(!!errors.city)} />
          </Field>
          <Field label="Floor / Apt" error={errors.floor}>
            <input type="text" value={form.floor} onChange={e => set("floor", e.target.value)} placeholder="e.g. 3rd floor" className={inputCls(!!errors.floor)} />
          </Field>
        </div>

        <Field label="Delivery Address" error={errors.address}>
          <input type="text" value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street, building, landmark… (optional)" className={inputCls(!!errors.address)} />
        </Field>

        <Field label="Password *" error={errors.password}>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={e => set("password", e.target.value)}
              placeholder="Min. 6 characters"
              className={`${inputCls(!!errors.password)} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <Field label="Confirm Password *" error={errors.confirmPassword}>
          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={e => set("confirmPassword", e.target.value)}
            placeholder="Repeat your password"
            className={inputCls(!!errors.confirmPassword)}
          />
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold rounded-full transition disabled:opacity-60 !mt-6"
        >
          {busy ? "Creating account…" : "Create Account"}
        </button>

        <p className="text-center text-sm text-stone-400 !mt-3">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--brand)] font-medium hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-200"
      : "border-stone-200 focus:border-[var(--brand)] focus:ring-[var(--brand)]"
  }`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
