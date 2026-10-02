"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CustomerInfo {
  id: number; name: string; phone: string; email?: string | null;
  address?: string | null; city?: string | null; floor?: string | null;
}

interface Ctx {
  customer: CustomerInfo | null;
  login: (phone: string, password: string) => Promise<void>;
  signup: (name: string, phone: string, email: string | undefined, password: string, address?: string, city?: string, floor?: string) => Promise<void>;
  logout: () => void;
}

const CustomerContext = createContext<Ctx>({
  customer: null,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

const STORAGE_KEY = "mabelle_customer";

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomerState] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCustomerState(JSON.parse(raw));
    } catch { /* ignore corrupt storage */ }
  }, []);

  const setCustomer = (c: CustomerInfo | null) => {
    setCustomerState(c);
    if (c) localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = async (phone: string, password: string) => {
    const res = await fetch("/api/storefront/customer-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message ?? "Login failed");
    setCustomer(data);
  };

  const signup = async (name: string, phone: string, email: string | undefined, password: string, address?: string, city?: string, floor?: string) => {
    const res = await fetch("/api/storefront/customer-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, password, address, city, floor }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message ?? "Sign up failed");
    setCustomer(data);
  };

  const logout = () => setCustomer(null);

  return (
    <CustomerContext.Provider value={{ customer, login, signup, logout }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() { return useContext(CustomerContext); }
