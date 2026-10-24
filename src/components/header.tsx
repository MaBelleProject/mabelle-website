"use client";

import { useCart } from "@/context/cart-context";
import { useCustomer } from "@/context/customer-context";
import { useFavorites } from "@/context/favorites-context";
import { useMenu } from "@/context/menu-context";
import type { Brand, Settings } from "@/lib/api";
import { fileUrl } from "@/lib/api";
import Image from "next/image";
import { Heart, Menu, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

interface HeaderProps {
  brands: Brand[];
  settings: Settings | null;
}

export default function Header({ brands: _brands, settings }: HeaderProps) {
  const { count } = useCart();
  const { toggle, open } = useMenu();
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => document.documentElement.style.setProperty("--header-h", el.offsetHeight + "px");
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { customer } = useCustomer();
  const { count: favCount } = useFavorites();
  const logoUrl = settings?.companyLogo ? fileUrl(settings.companyLogo) : undefined;

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 w-full z-40 bg-white/95 backdrop-blur border-b border-[var(--sage-light)] shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="relative flex items-center justify-between py-4">
          {/* Left: menu + search icons — hidden while sidebar is open (X inside sidebar handles close) */}
          <div className={`flex items-center gap-1 transition-opacity duration-200 ${open ? "opacity-0 pointer-events-none" : ""}`}>
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--sage-light)] transition"
              onClick={toggle}
              aria-label="Open menu"
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
              <Image src={logoUrl} alt={settings?.companyName ?? "Mabelle Bites"} height={80} width={200} className="h-20 w-auto object-contain" priority />
            ) : (
              <span className="text-2xl font-bold text-[var(--brand-dark)]">
                {settings?.companyName ?? "Mabelle Bites"}
              </span>
            )}
          </Link>

          {/* Right: greeting + favorites + cart */}
          <div className="flex items-center gap-2">
            {customer && (
              <span className="hidden sm:block text-sm text-stone-500">
                Hello, <span className="font-semibold text-stone-800">{customer.name.split(" ")[0]}</span>
              </span>
            )}
            {customer && (
              <Link href="/favorites" className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--sage-light)] transition" aria-label="My favorites">
                <Heart className={`w-5 h-5 transition-colors ${favCount > 0 ? "fill-[var(--brand)] text-[var(--brand)]" : "text-stone-700"}`} />
                {favCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[var(--brand)] text-white text-[10px] font-bold rounded-full px-1">
                    {favCount > 99 ? "99+" : favCount}
                  </span>
                )}
              </Link>
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
