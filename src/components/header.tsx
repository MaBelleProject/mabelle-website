"use client";

import { useCart } from "@/context/cart-context";
import { useMenu } from "@/context/menu-context";
import { useCustomer } from "@/context/customer-context";
import type { Brand, Settings } from "@/lib/api";
import { fileUrl } from "@/lib/api";
import { Menu, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  brands: Brand[];
  settings: Settings | null;
}

export default function Header({ brands: _brands, settings }: HeaderProps) {
  const { count } = useCart();
  const { toggle } = useMenu();
  const { customer } = useCustomer();
  const logoUrl = settings?.companyLogo ? fileUrl(settings.companyLogo) : undefined;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[var(--sage-light)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative flex items-center justify-between py-4">
          {/* Left: menu + search icons */}
          <div className="flex items-center gap-1">
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--sage-light)] transition"
              onClick={toggle}
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              href="/products"
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--sage-light)] transition"
              aria-label="Search products"
            >
              <Search className="w-5 h-5" />
            </Link>
          </div>

          {/* Logo — absolutely centered */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            {logoUrl ? (
              <img src={logoUrl} alt={settings?.companyName ?? "Mabelle Bites"} className="h-20 w-auto object-contain" />
            ) : (
              <span className="text-2xl font-bold text-[var(--brand-dark)]">
                {settings?.companyName ?? "Mabelle Bites"}
              </span>
            )}
          </Link>

          {/* Right: greeting + cart */}
          <div className="flex items-center gap-2">
            {customer && (
              <span className="hidden sm:block text-sm text-stone-500">
                Hello, <span className="font-semibold text-stone-800">{customer.name.split(" ")[0]}</span>
              </span>
            )}
            <Link href="/cart" className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--sage-light)] transition">
              <ShoppingCart className="w-5 h-5 text-stone-700" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[var(--brand)] text-white text-[10px] font-bold rounded-full px-1">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
