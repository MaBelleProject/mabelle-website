"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { fileUrl, type GiftPackage, type GiftPackaging, type GiftProduct } from "@/lib/api";
import { useCart } from "@/context/cart-context";

interface Choice { slotId: number; productId: number; quantity: number }

const MESSAGE_MAX = 500;

/** Short stable id of a customization, so the same gift built twice adds to the same cart line. */
function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 bg-stone-100 rounded-full p-0.5 shrink-0">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-stone-50 transition disabled:opacity-40" aria-label="Decrease">
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-6 text-center text-sm font-semibold">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} className="w-7 h-7 rounded-full bg-[var(--brand)] text-white shadow flex items-center justify-center hover:bg-[var(--brand-dark)] transition disabled:opacity-40" aria-label="Increase">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function GiftCustomizer({ gift, packagings }: { gift: GiftPackage; packagings: GiftPackaging[] }) {
  const { add } = useCart();
  const [choices, setChoices] = useState<Choice[]>(gift.items.map(s => ({ slotId: s.id, productId: s.productId, quantity: s.quantity })));
  const [packagingId, setPackagingId] = useState<number | null>(packagings[0]?.id ?? null);
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const productById = new Map<number, GiftProduct>();
  for (const s of gift.items) for (const p of [s.product, ...s.options]) productById.set(p.id, p);
  const setChoice = (slotId: number, patch: Partial<Choice>) => {
    setAdded(false);
    setChoices(cs => cs.map(c => (c.slotId === slotId ? { ...c, ...patch } : c)));
  };

  const packaging = packagings.find(p => p.id === packagingId) ?? null;
  const contentsPrice = choices.reduce((s, c) => s + parseFloat(productById.get(c.productId)?.sellingPrice ?? "0") * c.quantity, 0);
  const unitPrice = contentsPrice + (packaging ? parseFloat(packaging.price) : 0);

  // How many of this gift the stock allows (the same product may fill several slots)
  const perGift = new Map<number, number>();
  for (const c of choices) if (c.quantity > 0) perGift.set(c.productId, (perGift.get(c.productId) ?? 0) + c.quantity);
  const maxGifts = perGift.size
    ? Math.min(...[...perGift].map(([pid, q]) => Math.floor((productById.get(pid)?.stock ?? 0) / q)))
    : 0;
  const empty = perGift.size === 0;

  const addToCart = () => {
    if (empty || maxGifts < 1) return;
    const giftSelections = choices.map(c => ({ giftItemId: c.slotId, productId: c.productId, quantity: c.quantity }));
    const giftMessage = message.trim();
    add({
      key: `g-${gift.id}-${hash(JSON.stringify([giftSelections, packagingId, giftMessage]))}`,
      itemType: "gift",
      giftPackageId: gift.id,
      productCode: gift.code,
      productName: gift.name,
      unitPrice,
      imageUrl: gift.imageUrl,
      maxQty: maxGifts,
      giftSelections,
      packagingId,
      packagingName: packaging?.name ?? null,
      giftMessage,
      contents: choices.filter(c => c.quantity > 0).map(c => `${c.quantity} × ${productById.get(c.productId)?.name ?? ""}`),
    }, Math.min(quantity, maxGifts));
    setAdded(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Contents */}
      <section className="bg-stone-50 rounded-2xl p-4">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">What&apos;s inside</p>
        <ul className="flex flex-col gap-3">
          {gift.items.map(slot => {
            const choice = choices.find(c => c.slotId === slot.id)!;
            const options = [slot.product, ...slot.options].filter(p => p.status === "active" || p.id === slot.productId);
            const chosen = productById.get(choice.productId)!;
            const img = fileUrl(chosen.imageUrl);
            const max = Math.min(slot.maxQuantity ?? Infinity, chosen.stock);
            return (
              <li key={slot.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0">
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🍬</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-800 font-medium truncate">{chosen.name}</p>
                    <p className="text-xs text-stone-400">${parseFloat(chosen.sellingPrice).toFixed(2)} each</p>
                  </div>
                  {slot.isCustomizable ? (
                    <Stepper value={choice.quantity} min={0} max={Number.isFinite(max) ? max : 99} onChange={v => setChoice(slot.id, { quantity: v })} />
                  ) : (
                    <span className="text-sm font-semibold text-stone-700">× {choice.quantity}</span>
                  )}
                </div>
                {slot.isCustomizable && options.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 pl-13">
                    {options.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setChoice(slot.id, { productId: p.id, quantity: Math.min(choice.quantity || 1, slot.maxQuantity ?? Infinity) })}
                        className={`px-2.5 py-1 rounded-full text-xs border transition ${p.id === choice.productId ? "bg-[var(--brand)] text-white border-[var(--brand)]" : "bg-white text-stone-600 border-stone-200 hover:border-[var(--brand)]"}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Packaging */}
      {packagings.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Choose the packaging</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[null, ...packagings].map(p => {
              const selected = (p?.id ?? null) === packagingId;
              const img = fileUrl(p?.imageUrl);
              return (
                <button
                  key={p?.id ?? "none"}
                  type="button"
                  onClick={() => { setPackagingId(p?.id ?? null); setAdded(false); }}
                  className={`relative flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${selected ? "border-[var(--brand)] ring-1 ring-[var(--brand)] bg-[var(--cream)]" : "border-stone-200 bg-white hover:border-[var(--brand-light)]"}`}
                >
                  {selected && <Check className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-[var(--brand)]" />}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-stone-50 flex items-center justify-center">
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">{p ? "🎀" : "—"}</span>}
                  </div>
                  <span className="text-xs font-medium text-stone-700 line-clamp-1">{p?.name ?? "No packaging"}</span>
                  <span className="text-[11px] text-stone-400">{p ? `+$${parseFloat(p.price).toFixed(2)}` : "free"}</span>
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
          onChange={e => { setMessage(e.target.value); setAdded(false); }}
          rows={3}
          placeholder="Write a personal note for the gift card…"
          className="mt-2 w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition resize-none"
        />
        <p className="text-[11px] text-stone-400 text-right">{message.length}/{MESSAGE_MAX}</p>
      </section>

      {/* Price & add */}
      <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-4">
        <div>
          <p className="text-xs text-stone-400">Price per gift</p>
          <p className="text-3xl font-bold text-stone-800">${unitPrice.toFixed(2)}</p>
        </div>
        <Stepper value={quantity} min={1} max={Math.max(1, maxGifts)} onChange={setQuantity} />
      </div>
      {empty ? (
        <p className="text-sm text-amber-600">Add at least one treat to your gift.</p>
      ) : maxGifts < 1 ? (
        <p className="text-sm font-medium text-stone-500 bg-stone-100 rounded-full px-3 py-1 w-fit">Not enough stock for this selection</p>
      ) : null}
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
