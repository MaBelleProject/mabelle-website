"use client";

import { Tag } from "lucide-react";
import type { OrderQuote } from "@/lib/api";

/**
 * Lets the customer choose which offer to use when the cart qualifies for more than one.
 * Only one offer is applied; by default the highest-priority one (listed first).
 */
export default function OfferPicker({ quote, onSelect }: { quote: OrderQuote | null; onSelect: (offerId: number | null) => void }) {
  const available = quote?.availableOffers ?? [];
  if (available.length < 2) return null;
  const defaultId = available[0].offerId;
  const appliedId = quote?.offers[0]?.offerId;

  return (
    <fieldset className="mb-4">
      <legend className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Choose your offer</legend>
      <div className="flex flex-col gap-2">
        {available.map(o => (
          <label
            key={o.offerId}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition ${
              o.offerId === appliedId ? "border-green-500 bg-green-50" : "border-stone-200 hover:border-stone-300"
            }`}
          >
            <input
              type="radio"
              name="offer"
              className="accent-green-600"
              checked={o.offerId === appliedId}
              onChange={() => onSelect(o.offerId === defaultId ? null : o.offerId)}
            />
            <Tag className="w-3.5 h-3.5 text-green-600 shrink-0" />
            <span className="flex-1 min-w-0 text-stone-700">
              {o.offerName}
              {o.offerId === defaultId && <span className="ml-1 text-[10px] font-semibold uppercase text-[var(--brand)]">Recommended</span>}
            </span>
            <span className="text-green-600 font-medium shrink-0">
              {o.offerType === "free_delivery" ? "Free delivery" : `-$${o.discountAmount.toFixed(2)}`}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
