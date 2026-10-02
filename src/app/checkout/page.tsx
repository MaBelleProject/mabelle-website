"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { useCustomer } from "@/context/customer-context";
import Link from "next/link";
import { ArrowLeft, LogIn, LogOut, Eye, EyeOff } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCart();
  const { customer, login, logout } = useCustomer();

  const [redirecting, setRedirecting] = useState(false);
  const [form, setForm] = useState({
    address: "", city: "", floor: "", remark: "",
    // Guest-only
    name: "", phone: "", email: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
      setRedirecting(true);
    }
  }, [items.length, router]);

  // If already logged in AND has a saved address → skip form entirely
  useEffect(() => {
    if (!customer?.address) return;
    sessionStorage.setItem("checkout_info", JSON.stringify({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
      address: customer.address,
      city: customer.city ?? "",
      floor: customer.floor ?? "",
      paymentMethod: "cash",
      remark: "",
      customerId: customer.id,
    }));
    router.replace("/checkout/review");
    setRedirecting(true);
  }, [customer?.id, customer?.address]); // eslint-disable-line react-hooks/exhaustive-deps

  if (redirecting) return null;

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.address.trim()) e.address = "Delivery address is required";
    if (!customer) {
      if (!form.name.trim()) e.name = "Name is required";
      if (!form.phone.trim()) e.phone = "Phone number is required";
      if (!form.email.trim()) e.email = "Email address is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
      if (!form.password) e.password = "Password is required";
      else if (form.password.length < 6) e.password = "Password must be at least 6 characters";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError("");
    try {
      await login(loginPhone, loginPassword);
      setShowLoginForm(false);
      // After login, customer context updates → the useEffect above handles redirect if address exists
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = () => {
    logout();
    setForm(prev => ({ ...prev, name: "", phone: "", email: "" }));
  };

  const proceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    sessionStorage.setItem("checkout_info", JSON.stringify({
      name: customer?.name ?? form.name,
      phone: customer?.phone ?? form.phone,
      email: customer?.email ?? form.email,
      address: form.address,
      city: form.city,
      floor: form.floor,
      paymentMethod: "cash",
      remark: form.remark,
      password: !customer ? form.password : undefined,
      customerId: customer?.id,
    }));
    router.push("/checkout/review");
  };

  // Logged in but no saved address → show just delivery fields
  const loggedInNoAddress = !!customer && !customer.address;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-[var(--brand)] mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </Link>

      <h1 className="text-2xl font-bold text-stone-800 mb-2">Your Information</h1>
      <p className="text-stone-500 text-sm mb-6">
        {loggedInNoAddress ? "Please add a delivery address to continue." : "Please fill in your details for the order."}
      </p>

      {/* Auth section */}
      {customer ? (
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-800 font-medium text-sm">Logged in as {customer.name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-stone-400 hover:text-red-500 transition text-xs">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
          <div className="text-xs text-stone-500 flex flex-col gap-0.5">
            <span>{customer.phone}</span>
            {customer.email && <span>{customer.email}</span>}
          </div>
        </div>
      ) : (
        <div className="mb-6">
          {showLoginForm ? (
            <form onSubmit={handleLogin} className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-4">
              <p className="text-sm font-semibold text-stone-700 mb-3">Log in to your account</p>
              {loginError && <p className="text-xs text-red-500 mb-2">{loginError}</p>}
              <div className="flex flex-col gap-2.5">
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)}
                  placeholder="Phone number"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition"
                />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={loginBusy} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--brand)] text-white text-sm font-semibold rounded-full transition hover:bg-[var(--brand-dark)] disabled:opacity-60">
                    <LogIn className="w-3.5 h-3.5" />
                    {loginBusy ? "Signing in…" : "Log In"}
                  </button>
                  <button type="button" onClick={() => setShowLoginForm(false)} className="px-4 py-2 text-stone-500 text-sm rounded-full hover:bg-stone-100 transition">
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setShowLoginForm(true)} className="flex items-center gap-1.5 text-sm text-[var(--brand)] hover:underline">
              <LogIn className="w-3.5 h-3.5" /> Have an account? Log in for faster checkout
            </button>
          )}
        </div>
      )}

      <form onSubmit={proceed} className="flex flex-col gap-5">
        {/* Personal details — guests only */}
        {!customer && (
          <>
            <Field label="Full Name *" error={errors.name}>
              <input type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your name" className={inputCls(!!errors.name)} />
            </Field>
            <Field label="Phone Number *" error={errors.phone}>
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+961 xx xxx xxx" className={inputCls(!!errors.phone)} />
            </Field>
            <Field label="Email Address *" error={errors.email}>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com" className={inputCls(!!errors.email)} />
            </Field>
          </>
        )}

        {/* Delivery address — always shown when form is visible */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="City" error={errors.city}>
            <input type="text" value={form.city} onChange={e => set("city", e.target.value)} placeholder="Your city" className={inputCls(!!errors.city)} />
          </Field>
          <Field label="Floor / Apt" error={errors.floor}>
            <input type="text" value={form.floor} onChange={e => set("floor", e.target.value)} placeholder="e.g. 3rd floor, apt 12" className={inputCls(!!errors.floor)} />
          </Field>
        </div>

        <Field label="Delivery Address *" error={errors.address}>
          <input type="text" value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street, building, landmark…" className={inputCls(!!errors.address)} />
        </Field>

        <Field label="Remarks (optional)">
          <textarea
            value={form.remark}
            onChange={e => set("remark", e.target.value)}
            placeholder="Any special instructions…"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition resize-none"
          />
        </Field>

        {/* Password — guests only */}
        {!customer && (
          <>
            <Field label="Password *" error={errors.password}>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  placeholder="Min. 6 characters"
                  className={`${inputCls(!!errors.password)} pr-10`}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Already have an account? <Link href="/login" className="text-[var(--brand)] hover:underline">Sign in</Link>
              </p>
            </Field>
            <Field label="Confirm Password *" error={errors.confirmPassword}>
              <input type="password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="Repeat your password" className={inputCls(!!errors.confirmPassword)} />
            </Field>
          </>
        )}

        <button type="submit" className="w-full py-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold rounded-full transition mt-2">
          Review Order →
        </button>
      </form>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${
    hasError ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-stone-200 focus:border-[var(--brand)] focus:ring-[var(--brand)]"
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
