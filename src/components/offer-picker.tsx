"use client";

import { Tag } from "lucide-react";
import type { OrderQuote } from "@/lib/api";

/** Marks the discount option that saves the customer the most (the one applied by default). */
export function RecommendedBadge() {
  return (
    <span className="ml-1.5 inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
      Recommended – Best Savings
    </span>
  );
}

/**
 * Lets the customer choose the ONE discount that applies to the order: any offer the cart qualifies for, or
 * the promo code. Discounts are never combined. The option with the biggest saving (worked out by the server)
 * is selected by default and marked as recommended.
 */
export default function OfferPicker({
  quote, onSelectOffer, onSelectPromo,
}: {
  quote: OrderQuote | null;
  /** null = back to the default (the recommended option). */
  onSelectOffer: (offerId: number | null) => void;
  onSelectPromo: (picked: boolean) => void;
}) {
  const offers = quote?.availableOffers ?? [];
  const promo = quote?.promoOption ?? null;
  // Nothing to choose between when there is a single discount option
  if (!quote || offers.length + (promo ? 1 : 0) < 2) return null;

  const appliedOfferId = quote.selectedDiscount === "offer" ? quote.offers[0]?.offerId : undefined;
  const recommendedOfferId = offers.find(o => o.recommended)?.offerId;

  return (
    <fieldset className="mb-4">
      <legend className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Choose your discount</legend>
      <p className="text-xs text-stone-400 mb-2">Only one discount can be used per order.</p>
      <div className="flex flex-col gap-2">
        {offers.map(o => {
          const selected = appliedOfferId === o.offerId;
          return (
            <label
              key={o.offerId}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition ${
                selected ? "border-[var(--brand)] bg-[var(--brand-light)]" : "border-[var(--sage-light)] hover:border-[var(--sage)]"
              }`}
            >
              <input
                type="radio"
                name="discount-choice"
                className="accent-[var(--brand)]"
                checked={selected}
                // Picking the recommended option goes back to the default, so it keeps following the cart
                onChange={() => onSelectOffer(o.offerId === recommendedOfferId ? null : o.offerId)}
              />
              <Tag className="w-3.5 h-3.5 text-[var(--sage)] shrink-0" />
              <span className="flex-1 min-w-0 text-stone-700 break-words">
                {o.offerName}
                {o.recommended && <RecommendedBadge />}
              </span>
              <span className="text-[var(--sage)] font-medium shrink-0">
                {o.offerType === "free_delivery" ? "Free delivery" : `-$${o.discountAmount.toFixed(2)}`}
              </span>
            </label>
          );
        })}
        {promo && (
          <label
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition ${
              promo.selected ? "border-[var(--brand)] bg-[var(--brand-light)]" : "border-[var(--sage-light)] hover:border-[var(--sage)]"
            }`}
          >
            <input
              type="radio"
              name="discount-choice"
              className="accent-[var(--brand)]"
              checked={promo.selected}
              onChange={() => onSelectPromo(!promo.recommended)}
            />
            <Tag className="w-3.5 h-3.5 text-[var(--sage)] shrink-0" />
            <span className="flex-1 min-w-0 text-stone-700 break-words">
              {promo.isFamily ? "Family discount" : "Promo code"} ({promo.code})
              {promo.recommended && <RecommendedBadge />}
            </span>
            <span className="text-[var(--sage)] font-medium shrink-0">-${promo.discountAmount.toFixed(2)}</span>
          </label>
        )}
      </div>
    </fieldset>
  );
}
