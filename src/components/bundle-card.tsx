"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Minus, Plus, ShoppingCart, Layers } from "lucide-react";
import type { Bundle, BundleReplacementProduct } from "@/lib/api";
import { fileUrl } from "@/lib/api";
import { useCart, bundleKey, maxLineQty } from "@/context/cart-context";
import CountryFlag from "./country-flag";

interface BundleSwap { bundleItemId: number; productId: number }

/** Builds the cart key for a bundle, accounting for any product swaps. */
function bundleSwapKey(bundleId: number, swaps: BundleSwap[]) {
  if (!swaps.length) return bundleKey(bundleId);
  const sorted = [...swaps].sort((a, b) => a.bundleItemId - b.bundleItemId);
  return `b-${bundleId}-${sorted.map((s) => `${s.bundleItemId}:${s.productId}`).join(",")}`;
}

/** Builds the cart line payload for a bundle (with the cart key for its swaps). */
function bundleCartItem(b: Bundle, swaps: BundleSwap[] = []) {
  const chosen = b.items.map((i) => {
    const swap = swaps.find((s) => s.bundleItemId === i.id);
    const r = swap ? i.replacements.find((x) => x.productId === swap.productId) : undefined;
    return { item: i, productId: r?.productId ?? i.productId, name: r?.name ?? i.productName, stock: r ? r.stock : i.stock };
  });
  return {
    key: bundleSwapKey(b.id, swaps),
    itemType: "bundle" as const,
    bundleId: b.id,
    productCode: b.code,
    productName: b.name,
    unitPrice: parseFloat(b.price),
    imageUrl: b.imageUrl,
    // Bundles of the default products the stock can make; swapped-in products are limited by `components`.
    maxQty: swaps.length ? Number.MAX_SAFE_INTEGER : b.available,
    bundleSelections: swaps.length ? swaps : undefined,
    contents: chosen.map((c) => `${c.item.quantity} × ${c.name}`),
    components: chosen.map((c) => ({ productId: c.productId, quantity: c.item.quantity, stock: c.stock })),
  };
}

/** The simple add/+/- control used on bundle cards and the bundles list page. */
export function BundleCartControl({ bundle, size = "sm" }: { bundle: Bundle; size?: "sm" | "lg" }) {
  const { items, add, update } = useCart();
  const key = bundleKey(bundle.id);
  const qty = items.find((i) => i.key === key)?.quantity ?? 0;
  // Products in other cart lines (products, other bundles, gifts) count against the same stock.
  const max = maxLineQty(items, bundleCartItem(bundle));
  const soldOut = bundle.available <= 0 || max <= 0;
  const stop = (e: React.MouseEvent) => e.preventDefault();

  if (qty > 0) {
    return (
      <div className="flex items-center gap-3" onClick={stop}>
        <div className="flex items-center gap-1 bg-[var(--sage-light)] rounded-full p-0.5">
          <button onClick={() => update(key, qty - 1)} className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-[var(--brand-light)] transition" aria-label="Decrease">
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-6 text-center text-sm font-semibold">{qty}</span>
          <button
            onClick={() => update(key, qty + 1)}
            disabled={qty >= max}
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

/** Full add-to-cart control with per-item swap selection for the bundle detail page. */
export function BundleCartControlWithSwaps({ bundle }: { bundle: Bundle }) {
  const { items, add, update } = useCart();
  const [swaps, setSwaps] = useState<BundleSwap[]>([]);
  const [added, setAdded] = useState(false);

  /** The swaps with one item set to `productId` (choosing the default removes its swap). */
  const swapsWith = (bundleItemId: number, productId: number) => {
    const without = swaps.filter((s) => s.bundleItemId !== bundleItemId);
    const defaultId = bundle.items.find((i) => i.id === bundleItemId)?.productId;
    return productId === defaultId ? without : [...without, { bundleItemId, productId }];
  };
  // How many of a selection the stock allows, once the cart's other lines (products, bundles, gifts) are counted.
  const maxFor = (s: BundleSwap[]) => maxLineQty(items, bundleCartItem(bundle, s));

  const cartKey = bundleSwapKey(bundle.id, swaps);
  const qty = items.find((i) => i.key === cartKey)?.quantity ?? 0;
  const availableStock = maxFor(swaps);
  const noStock = availableStock <= 0 && qty === 0;

  const setSwap = (bundleItemId: number, productId: number) => {
    setAdded(false);
    setSwaps(swapsWith(bundleItemId, productId));
  };

  const addToCart = () => {
    if (noStock) return;
    add(bundleCartItem(bundle, swaps));
    setAdded(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Contents with swap options */}
      <div className="bg-[var(--sage-light)] rounded-2xl p-4">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">What&apos;s inside</p>
        <ul className="flex flex-col gap-3">
          {bundle.items.map((item) => {
            const swap = swaps.find((s) => s.bundleItemId === item.id);
            const chosenId = swap?.productId ?? item.productId;
            const chosen = chosenId === item.productId
              ? { name: item.productName, imageUrl: item.imageUrl, sellingPrice: item.sellingPrice }
              : item.replacements.find((r) => r.productId === chosenId);
            const img = fileUrl(chosen?.imageUrl);
            const allOptions: { productId: number; name: string; imageUrl?: string | null; sellingPrice: string }[] = [
              { productId: item.productId, name: item.productName, imageUrl: item.imageUrl, sellingPrice: item.sellingPrice },
              ...item.replacements,
            ];

            return (
              <li key={item.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Link href={`/product/${chosenId}`} className="relative w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 hover:opacity-80 transition">
                    {img ? <Image src={img} alt="" fill sizes="40px" className="object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center">🍬</div>}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${chosenId}`} className="min-w-0 text-sm text-stone-800 font-medium truncate hover:text-[var(--brand)] hover:underline transition block">
                      {chosen?.name ?? item.productName}
                    </Link>
                    <p className="text-xs text-stone-400">${parseFloat(chosen?.sellingPrice ?? item.sellingPrice).toFixed(2)} · {item.quantity} included</p>
                  </div>
                  <span className="text-sm font-semibold text-stone-700 shrink-0">× {item.quantity}</span>
                </div>

                {allOptions.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 sm:pl-[52px]">
                    {allOptions.map((opt) => {
                      // Not enough of this product left (with the rest of the cart) to make even one bundle
                      const short = opt.productId !== chosenId && maxFor(swapsWith(item.id, opt.productId)) <= 0;
                      return (
                        <button
                          key={opt.productId}
                          type="button"
                          onClick={() => setSwap(item.id, opt.productId)}
                          disabled={short}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition disabled:opacity-40 disabled:cursor-not-allowed ${opt.productId === chosenId ? "bg-[var(--brand)] text-white border-[var(--brand)]" : "bg-white text-stone-600 border-stone-200 hover:border-[var(--brand)]"}`}
                        >
                          {opt.name}
                          <CountryFlag productId={opt.productId} interactive={false} className="w-3.5 h-2.5" />
                          {opt.productId === item.productId && <span className="ml-1 opacity-60">(default)</span>}
                          {short && <span className="ml-1 opacity-60">(not enough stock)</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Price note: price is fixed regardless of swaps */}
      <p className="text-xs text-stone-400 text-center">
        Bundle price is fixed at <span className="font-semibold text-stone-600">${parseFloat(bundle.price).toFixed(2)}</span> regardless of your selection
      </p>

      {/* Add to cart */}
      {noStock ? (
        <p className="text-sm font-medium text-stone-500 bg-[var(--sage-light)] rounded-full px-3 py-1 w-fit">
          {bundle.available <= 0 && !swaps.length ? "Out of stock" : "Not enough stock for this selection (counting your cart)"}
        </p>
      ) : qty > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-[var(--sage-light)] rounded-full p-0.5">
            <button onClick={() => update(cartKey, qty - 1)} className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:bg-[var(--brand-light)] transition" aria-label="Decrease">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center font-semibold">{qty}</span>
            <button
              onClick={() => update(cartKey, qty + 1)}
              disabled={qty >= availableStock}
              className="w-8 h-8 rounded-full bg-[var(--brand)] text-white shadow flex items-center justify-center hover:bg-[var(--brand-dark)] transition disabled:opacity-40"
              aria-label="Increase"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-sm text-stone-500">${(parseFloat(bundle.price) * qty).toFixed(2)}</span>
          <Link href="/cart" className="text-sm text-[var(--brand)] font-semibold hover:underline">View cart →</Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addToCart}
            className="flex items-center justify-center gap-2 flex-1 min-w-[180px] py-3 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold transition"
          >
            {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
            {added ? "Added!" : `Add to Cart · $${parseFloat(bundle.price).toFixed(2)}`}
          </button>
          {added && <Link href="/cart" className="text-sm text-[var(--brand)] font-semibold hover:underline">View cart →</Link>}
        </div>
      )}
    </div>
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
          <Image src={imgUrl} alt={bundle.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
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
        <p className="text-xs text-stone-500 line-clamp-2">
          {bundle.items.map((i, n) => (
            <span key={i.id}>
              {n > 0 && " · "}{i.quantity} × {i.productName}
              <CountryFlag productId={i.productId} className="ml-1 align-[-1px] w-3.5 h-2.5" />
            </span>
          ))}
        </p>
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-stone-800 font-bold text-base">${price.toFixed(2)}</span>
          {value > price && <span className="text-stone-400 text-sm line-through">${value.toFixed(2)}</span>}
        </div>
        <BundleCartControl bundle={bundle} />
      </div>
    </Link>
  );
}
