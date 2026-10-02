"use client";

import { useCart } from "@/context/cart-context";
import { useMenu } from "@/context/menu-context";
import { useCustomer } from "@/context/customer-context";
import type { Brand, Settings } from "@/lib/api";
import { fileUrl } from "@/lib/api";
import { Menu, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

interface HeaderProps {
  brands: Brand[];
  settings: Settings | null;
}

function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSearch = searchParams.get("search") ?? "";
  const [query, setQuery] = useState(activeSearch);
  const preSearchUrl = useRef<string>("/");
  const userTypedRef = useRef(false);

  // Sync state when URL changes (back/forward navigation)
  useEffect(() => {
    userTypedRef.current = false;
    setQuery(activeSearch);
  }, [activeSearch]);

  const doSearch = (q: string) => {
    if (!activeSearch) {
      const qs = searchParams.toString();
      preSearchUrl.current = `${pathname}${qs ? `?${qs}` : ""}`;
    }
    router.push(`/products?search=${encodeURIComponent(q.trim())}`);
  };

  const doClear = () => {
    setQuery("");
    router.push(preSearchUrl.current);
    preSearchUrl.current = "/";
  };

  // Debounce: navigate 350 ms after the user stops typing
  useEffect(() => {
    if (!userTypedRef.current) return;
    if (!query.trim()) return;
    const id = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(id);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    userTypedRef.current = true;
    setQuery(val);
    if (val === "" && activeSearch) doClear();
  };

  return (
    <form
      onSubmit={e => { e.preventDefault(); if (query.trim()) doSearch(query); }}
      className="relative flex-1 max-w-md"
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
      <input
        type="search"
        value={query}
        onChange={handleChange}
        placeholder="Search products, brands, flavors…"
        className="w-full pl-9 pr-4 py-2 rounded-full border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition"
      />
    </form>
  );
}

export default function Header({ brands: _brands, settings }: HeaderProps) {
  const { count } = useCart();
  const { toggle } = useMenu();
  const { customer } = useCustomer();
  const logoUrl = settings?.companyLogo ? fileUrl(settings.companyLogo) : undefined;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 h-16">
          {/* Menu icon — top-left, toggles the sidebar */}
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-stone-50 transition shrink-0"
            onClick={toggle}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={settings?.companyName ?? "Mabelle Bites"} className="h-9 w-auto object-contain" />
            ) : (
              <span className="text-xl font-bold text-[var(--brand-dark)]">
                {settings?.companyName ?? "Mabelle Bites"}
              </span>
            )}
          </Link>

          {/* Search (desktop) */}
          <div className="hidden md:flex flex-1">
            <Suspense><SearchInput /></Suspense>
          </div>

          {/* Hello greeting */}
          {customer && (
            <span className="hidden sm:block text-sm text-stone-500 shrink-0">
              Hello, <span className="font-semibold text-stone-800">{customer.name.split(" ")[0]}</span>
            </span>
          )}

          {/* Cart */}
          <Link href="/cart" className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-stone-50 transition ml-auto md:ml-0">
            <ShoppingCart className="w-5 h-5 text-stone-700" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[var(--brand)] text-white text-[10px] font-bold rounded-full px-1">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <Suspense><SearchInput /></Suspense>
        </div>
      </div>
    </header>
  );
}
