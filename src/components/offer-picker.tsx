"use client";

import { Tag } from "lucide-react";
import type { OrderQuote } from "@/lib/api";

/**
 * Lets the customer choose which offer to use when the cart qualifies for offers that can't all apply.
 * The picked offer is the main one (by default the highest-priority one, listed first); offers on other
 * products are applied with it. The biggest saving is marked "Recommended".
 */
export default function OfferPicker({ quote, onSelect }: { quote: OrderQuote | null; onSelect: (offerId: number | null) => void }) {
  const available = quote?.availableOffers ?? [];
  const applied = new Set(quote?.offers.map(o => o.offerId) ?? []);
  // Nothing to choose when every offer the cart qualifies for is already applied
  if (available.length < 2 || available.every(o => applied.has(o.offerId))) return null;
  const defaultId = available[0].offerId;

  return (
    <fieldset className="mb-4">
      <legend className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Choose your offer</legend>
      <div className="flex flex-col gap-2">
        {available.map(o => (
          <label
            key={o.offerId}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition ${
              applied.has(o.offerId) ? "border-[var(--brand)] bg-[var(--brand-light)]" : "border-[var(--sage-light)] hover:border-[var(--sage)]"
            }`}
          >
            <input
              type="radio"
              name={`offer-${o.offerId}`}
              className="accent-[var(--brand)]"
              checked={applied.has(o.offerId)}
              onChange={() => onSelect(o.offerId === defaultId ? null : o.offerId)}
            />
            <Tag className="w-3.5 h-3.5 text-[var(--sage)] shrink-0" />
            <span className="flex-1 min-w-0 text-stone-700">
              {o.offerName}
              {o.recommended && <span className="ml-1 text-[10px] font-semibold uppercase text-[var(--brand)]">Recommended</span>}
            </span>
            <span className="text-[var(--sage)] font-medium shrink-0">
              {o.offerType === "free_delivery" ? "Free delivery" : `-$${o.discountAmount.toFixed(2)}`}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
