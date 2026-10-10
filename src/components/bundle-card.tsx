"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Layers } from "lucide-react";
import type { Bundle } from "@/lib/api";
import { fileUrl } from "@/lib/api";
import { useCart, bundleKey } from "@/context/cart-context";

/** What goes into the cart for a bundle (one line, its contents listed underneath). */
export const bundleCartItem = (b: Bundle) => ({
  itemType: "bundle" as const,
  bundleId: b.id,
  productCode: b.code,
  productName: b.name,
  unitPrice: parseFloat(b.price),
  imageUrl: b.imageUrl,
  maxQty: b.available,
  contents: b.items.map(i => `${i.quantity} × ${i.productName}`),
});

/** Add / +/- control for a bundle. */
export function BundleCartControl({ bundle, size = "sm" }: { bundle: Bundle; size?: "sm" | "lg" }) {
  const { items, add, update } = useCart();
  const qty = items.find(i => i.key === bundleKey(bundle.id))?.quantity ?? 0;
  const soldOut = bundle.available <= 0;
  const stop = (e: React.MouseEvent) => e.preventDefault();

  if (qty > 0) {
    return (
      <div className="flex items-center gap-3" onClick={stop}>
        <div className="flex items-center gap-1 bg-[var(--sage-light)] rounded-full p-0.5">
          <button onClick={() => update(bundleKey(bundle.id), qty - 1)} className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-[var(--brand-light)] transition" aria-label="Decrease">
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-6 text-center text-sm font-semibold">{qty}</span>
          <button
            onClick={() => update(bundleKey(bundle.id), qty + 1)}
            disabled={qty >= bundle.available}
            className="w-7 h-7 rounded-full bg-[var(--brand)] text-white shadow flex items-center justify-center hover:bg-[var(--brand-dark)] transition disabled:opacity-40"
            aria-label="Increase"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <span className="text-xs text-stone-500 font-medium">${(parseFloat(bundle.price) * qty).toFixed(2)}</span>
      </div>
    );
  }
  return (
    <button
      onClick={(e) => { stop(e); if (!soldOut) add(bundleCartItem(bundle)); }}
      disabled={soldOut}
      className={`flex items-center justify-center gap-2 w-full rounded-full bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${size === "lg" ? "max-w-xs py-3" : "py-2 text-sm rounded-xl"}`}
    >
      <ShoppingCart className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
      {soldOut ? "Unavailable" : "Add to Cart"}
    </button>
  );
}

export default function BundleCard({ bundle }: { bundle: Bundle }) {
  const imgUrl = fileUrl(bundle.imageUrl);
  const price = parseFloat(bundle.price);
  const value = parseFloat(bundle.itemsValue);
  return (
    <Link href={`/bundles/${bundle.id}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-[var(--sage-light)]">
      <div className="relative aspect-square bg-[var(--sage-light)] overflow-hidden">
        {imgUrl ? (
          <img src={imgUrl} alt={bundle.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300"><Layers className="w-12 h-12" /></div>
        )}
        <span className="absolute top-2 left-2 bg-[var(--brand)] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">BUNDLE</span>
        {bundle.available <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-stone-700 text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-semibold text-stone-800 line-clamp-2 leading-snug">{bundle.name}</h3>
        <p className="text-xs text-stone-500 line-clamp-2">{bundle.items.map(i => `${i.quantity} × ${i.productName}`).join(" · ")}</p>
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-stone-800 font-bold text-base">${price.toFixed(2)}</span>
          {value > price && <span className="text-stone-400 text-sm line-through">${value.toFixed(2)}</span>}
        </div>
        <BundleCartControl bundle={bundle} />
      </div>
    </Link>
  );
}
