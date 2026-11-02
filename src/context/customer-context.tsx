"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setCustomerToken } from "@/lib/api";

export interface CustomerInfo {
  id: number; name: string; phone: string; email?: string | null;
  address?: string | null; city?: string | null; floor?: string | null;
  isNonProfit?: boolean;
  /** Never pays delivery (always true for non-profit customers). */
  freeDelivery?: boolean;
  /** JWT used for customer-authenticated API calls (favorites, orders, etc.). */
  customerToken?: string;
}

/** Older saved logins have no freeDelivery; non-profit customers always had free delivery. */
export const hasFreeDelivery = (c: CustomerInfo | null | undefined) => !!(c?.freeDelivery ?? c?.isNonProfit);

interface Ctx {
  customer: CustomerInfo | null;
  /** True once the stored session has been restored and checked with the server (or found missing / expired). */
  customerReady: boolean;
  login: (phone: string, password: string) => Promise<void>;
  signup: (name: string, phone: string, email: string | undefined, password: string, address?: string, city?: string, floor?: string) => Promise<void>;
  logout: () => void;
}

const CustomerContext = createContext<Ctx>({
  customer: null,
  customerReady: false,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

const STORAGE_KEY = "mabelle_customer";

/** True when the JWT's `exp` has passed (read locally; the server still verifies the signature). */
function tokenExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return false; // unreadable: let the server decide
  }
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomerState] = useState<CustomerInfo | null>(null);
  const [customerReady, setCustomerReady] = useState(false);

  // Restore the saved session after a refresh: `customerReady` only becomes true once it is known whether the
  // session is still valid, so pages never redirect to the login page before that.
  useEffect(() => {
    let cancelled = false;
    const clear = () => {
      setCustomerToken(null);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
    };

    let saved: CustomerInfo | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      saved = raw ? JSON.parse(raw) : null;
    } catch { /* corrupt or unavailable storage: treated as signed out */ }

    if (!saved?.id || !saved.customerToken || tokenExpired(saved.customerToken)) {
      if (saved) clear(); // expired or unusable session
      setCustomerReady(true);
    } else {
      const session = saved;
      setCustomerToken(session.customerToken!);
      setCustomerState(session);
      // Ask the server whether the session is still valid (and refresh the saved profile).
      fetch(`/api/storefront/customers/${session.id}/session`, {
        headers: { Authorization: `Bearer ${session.customerToken}` },
        cache: "no-store",
      })
        .then(async res => {
          if (cancelled) return;
          if (res.status === 401) {
            clear();
            setCustomerState(null);
          } else if (res.ok) {
            const fresh = await res.json().catch(() => null);
            if (fresh && !cancelled) {
              const next = { ...session, ...fresh, customerToken: session.customerToken };
              setCustomerState(next);
              try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
            }
          }
          // Any other answer (server down, 5xx): keep the user signed in rather than logging them out.
        })
        .catch(() => { /* offline: keep the saved session */ })
        .finally(() => { if (!cancelled) setCustomerReady(true); });
    }

    const onExpired = () => setCustomerState(null);
    window.addEventListener("customer-session-expired", onExpired);
    return () => { cancelled = true; window.removeEventListener("customer-session-expired", onExpired); };
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
    if (data.customerToken) setCustomerToken(data.customerToken);
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
    if (data.customerToken) setCustomerToken(data.customerToken);
    setCustomer(data);
  };

  const logout = () => { setCustomerToken(null); setCustomer(null); };

  return (
    <CustomerContext.Provider value={{ customer, customerReady, login, signup, logout }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() { return useContext(CustomerContext); }

/**
 * For pages that need a signed-in customer: waits until the saved session has been restored and checked,
 * then sends a signed-out visitor to the login page (coming back here after signing in).
 * `customer` is null until then, so pages render nothing (or a loader) instead of flashing the login page.
 */
export function useRequireCustomer() {
  const { customer, customerReady } = useCustomer();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (customerReady && !customer) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [customerReady, customer, router, pathname]);
  return { customer: customerReady ? customer : null, customerReady };
}
