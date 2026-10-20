"use client";

import CountryFlag from "@/components/country-flag";
import { useCart } from "@/context/cart-context";
import { fileUrl, type GiftPackage, type GiftPackaging, type GiftProduct, type Product } from "@/lib/api";
import { Check, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface Selection { productId: number; quantity: number }

const MESSAGE_MAX = 500;

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 bg-[var(--sage-light)] rounded-full p-0.5 shrink-0">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-[var(--brand-light)] transition disabled:opacity-40" aria-label="Decrease">
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-6 text-center text-sm font-semibold">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} className="w-7 h-7 rounded-full bg-[var(--brand)] text-white shadow flex items-center justify-center hover:bg-[var(--brand-dark)] transition disabled:opacity-40" aria-label="Increase">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

function ProductPicker({ allProducts, selected, onAdd }: {
  allProducts: Product[];
  selected: Set<number>;
  onAdd: (productId: number) => void;
}) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const visible = useMemo(
    () => allProducts.filter((p) => p.status === "active" && (!needle || p.name.toLowerCase().includes(needle) || p.code.toLowerCase().includes(needle))),
    [allProducts, needle],
  );

  return (
    <div className="rounded-xl border border-[var(--sage-light)] bg-white overflow-hidden">
      <div className="relative border-b border-[var(--sage-light)]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products to add…"
          className="w-full pl-9 pr-3 py-2 text-xs focus:outline-none"
        />
      </div>
      <div className="max-h-48 overflow-y-auto">
        {visible.length === 0 && <p className="px-3 py-3 text-xs text-stone-400 text-center">No products found</p>}
        {visible.map((p) => {
          const alreadyIn = selected.has(p.id);
          const img = fileUrl(p.imageUrl);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => { if (!alreadyIn) onAdd(p.id); }}
              disabled={alreadyIn}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--sage-light)] transition disabled:opacity-50 text-left"
            >
              <div className="w-7 h-7 rounded-md overflow-hidden bg-[var(--sage-light)] shrink-0 flex items-center justify-center">
                {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <span>🍬</span>}
              </div>
              <span className="flex-1 min-w-0 flex items-center gap-1.5">
                <span className="truncate text-stone-700">{p.name}</span>
                <CountryFlag country={p.madeIn} interactive={false} className="w-3.5 h-2.5" />
              </span>
              <span className="text-stone-400 shrink-0">${parseFloat(p.sellingPrice).toFixed(2)}</span>
              {alreadyIn
                ? <span className="text-[10px] text-[var(--brand)] font-semibold shrink-0">Added</span>
                : <Plus className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />
              }
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function GiftCustomizer({
  gift,
  packagings,
  allProducts,
}: {
  gift: GiftPackage | null;
  packagings: GiftPackaging[];
  allProducts: Product[];
}) {
  const { add } = useCart();

  const productMap = useMemo(() => {
    const m = new Map<number, Product | GiftProduct>();
    for (const p of allProducts) m.set(p.id, p);
    if (gift) for (const s of gift.items) m.set(s.product.id, s.product);
    return m;
  }, [allProducts, gift]);

  const initialSelections: Selection[] = gift
    ? gift.items.map((s) => ({ productId: s.productId, quantity: s.quantity }))
    : [];

  const [selections, setSelections] = useState<Selection[]>(initialSelections);
  const defaultPkg = packagings.find(p => parseFloat(p.price) === 0) ?? packagings[0];
  const [packagingId, setPackagingId] = useState<number | null>(defaultPkg?.id ?? null);
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const selectedIds = useMemo(() => new Set(selections.map((s) => s.productId)), [selections]);

  const addProduct = (productId: number) => {
    setAdded(false);
    setSelections((prev) => {
      if (prev.some((s) => s.productId === productId)) return prev.map((s) => s.productId === productId ? { ...s, quantity: s.quantity + 1 } : s);
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeProduct = (productId: number) => {
    setAdded(false);
    setSelections((prev) => prev.filter((s) => s.productId !== productId));
  };

  const setQty = (productId: number, qty: number) => {
    setAdded(false);
    if (qty <= 0) { removeProduct(productId); return; }
    setSelections((prev) => prev.map((s) => s.productId === productId ? { ...s, quantity: qty } : s));
  };

  const packaging = packagings.find((p) => p.id === packagingId) ?? null;
  const contentsPrice = selections.reduce((s, c) => {
    const p = productMap.get(c.productId);
    return s + (p ? parseFloat((p as Product).sellingPrice) * c.quantity : 0);
  }, 0);
  const unitPrice = contentsPrice + (packaging ? parseFloat(packaging.price) : 0);

  const perGift = new Map<number, number>();
  for (const c of selections) if (c.quantity > 0) perGift.set(c.productId, (perGift.get(c.productId) ?? 0) + c.quantity);
  const maxGifts = perGift.size
    ? Math.min(...[...perGift].map(([pid, q]) => {
      const p = productMap.get(pid);
      return Math.floor(((p as Product)?.quantity ?? (p as GiftProduct)?.stock ?? 0) / q);
    }))
    : 0;

  const empty = selections.length === 0;

  const addToCart = () => {
    if (empty || maxGifts < 1) return;
    const giftSelections = selections.map((s) => ({ productId: s.productId, quantity: s.quantity }));
    const giftMessage = message.trim();
    const contentsLabel = selections
      .filter((s) => s.quantity > 0)
      .map((s) => `${s.quantity} × ${productMap.get(s.productId)?.name ?? ""}`)
      .join(", ");
    add({
      key: `g-${gift?.id ?? "custom"}-${hash(JSON.stringify([giftSelections, packagingId, giftMessage]))}`,
      itemType: "gift",
      giftPackageId: gift?.id ?? null,
      productCode: gift?.code ?? "GIFT",
      productName: gift?.name ?? "Custom Gift",
      unitPrice,
      imageUrl: gift?.imageUrl ?? null,
      maxQty: maxGifts,
      giftSelections,
      packagingId,
      packagingName: packaging?.name ?? null,
      giftMessage,
      contents: [contentsLabel + (packaging ? ` + ${packaging.name}` : "")],
    }, Math.min(quantity, maxGifts));
    setAdded(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Selected products */}
      <section className="bg-[var(--sage-light)] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">What&apos;s inside</p>
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add product
          </button>
        </div>

        {showPicker && (
          <div className="mb-3">
            <ProductPicker allProducts={allProducts} selected={selectedIds} onAdd={(id) => { addProduct(id); setShowPicker(false); }} />
          </div>
        )}

        {selections.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-4">No products yet — add some treats!</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selections.map((sel) => {
              const p = productMap.get(sel.productId);
              if (!p) return null;
              const img = fileUrl((p as Product).imageUrl ?? (p as GiftProduct).imageUrl);
              const stock = (p as Product).quantity ?? (p as GiftProduct).stock ?? 0;
              const maxQty = Math.max(sel.quantity, stock);
              return (
                <li key={sel.productId} className="flex items-start gap-3 bg-white rounded-xl px-3 py-2.5">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--sage-light)] shrink-0 mt-0.5">
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🍬</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="min-w-0 text-sm text-stone-800 font-medium truncate">{p.name}</p>
                      <CountryFlag productId={sel.productId} className="w-4 h-3" />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-xs text-stone-400 flex-1 min-w-0 truncate">${parseFloat((p as Product).sellingPrice).toFixed(2)} each</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Stepper value={sel.quantity} min={1} max={maxQty || 99} onChange={(v) => setQty(sel.productId, v)} />
                        <button type="button" onClick={() => removeProduct(sel.productId)} className="p-1 text-stone-300 hover:text-red-400 transition" aria-label="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Gift box selection */}
      {packagings.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Choose your gift box</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {packagings.map((p) => {
              const selected = p.id === packagingId;
              const outOfStock = p.stock <= 0;
              const img = fileUrl(p.imageUrl);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setPackagingId(p.id); setAdded(false); }}
                  className={`relative flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${selected ? "border-[var(--brand)] ring-1 ring-[var(--brand)] bg-[var(--cream)]" : "border-stone-200 bg-white hover:border-[var(--brand-light)]"}`}
                >
                  {selected && <Check className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-[var(--brand)]" />}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--cream)] flex items-center justify-center">
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">🎀</span>}
                  </div>
                  <span className="text-xs font-medium text-stone-700 line-clamp-1">{p.name}</span>
                  <span className="text-[11px] font-semibold text-[var(--brand)]">+${parseFloat(p.price).toFixed(2)}</span>
                  {outOfStock && <span className="text-[10px] text-amber-600 font-medium">Low stock</span>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Message */}
      <section>
        <label htmlFor="gift-message" className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Gift card message (optional)</label>
        <textarea
          id="gift-message"
          value={message}
          maxLength={MESSAGE_MAX}
          onChange={(e) => { setMessage(e.target.value); setAdded(false); }}
          rows={3}
          placeholder="Write a personal note for the gift card…"
          className="mt-2 w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition resize-none"
        />
        <p className="text-[11px] text-stone-400 text-right">{message.length}/{MESSAGE_MAX}</p>
      </section>

      {/* Price & add */}
      <div className="flex items-center justify-between gap-4 border-t border-[var(--sage-light)] pt-4">
        <div>
          <p className="text-xs text-stone-400">Price per gift</p>
          <p className="text-2xl sm:text-3xl font-bold text-stone-800">${unitPrice.toFixed(2)}</p>
        </div>
        <Stepper value={quantity} min={1} max={Math.max(1, maxGifts)} onChange={setQuantity} />
      </div>
      {empty && <p className="text-sm text-amber-600">Add at least one product to your gift.</p>}
      {!empty && maxGifts < 1 && <p className="text-sm font-medium text-stone-500 bg-[var(--sage-light)] rounded-full px-3 py-1 w-fit">Not enough stock for this selection</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addToCart}
          disabled={empty || maxGifts < 1}
          className="flex items-center justify-center gap-2 flex-1 max-w-xs py-3 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
          {added ? "Added!" : `Add to Cart · $${(unitPrice * quantity).toFixed(2)}`}
        </button>
        {added && <Link href="/cart" className="text-sm text-[var(--brand)] font-semibold hover:underline">View cart →</Link>}
      </div>
    </div>
  );
}
