import { BadgePercent } from "lucide-react";
import type { Offer } from "@/lib/api";
import { describeOffer, offerBadge, offerEnds, offerScope } from "@/lib/offers";
import CountryFlag from "./country-flag";

/** One active offer with its details. `compact` is the dense version used in the header panel. */
export default function OfferCard({ offer, compact = false }: { offer: Offer; compact?: boolean }) {
  const ends = offerEnds(offer);
  return (
    <div className={`flex gap-3 bg-white border border-[var(--sage-light)] ${compact ? "p-3 rounded-xl" : "p-5 rounded-2xl shadow-sm"}`}>
      <span className={`shrink-0 rounded-full bg-[var(--cream)] flex items-center justify-center ${compact ? "w-9 h-9" : "w-12 h-12"}`}>
        <BadgePercent className={`text-[var(--brand)] ${compact ? "w-4 h-4" : "w-6 h-6"}`} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-bold text-stone-800 ${compact ? "text-sm" : "text-base"}`}>{offer.name}</p>
          <span className="shrink-0 bg-[var(--brand)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{offerBadge(offer)}</span>
        </div>
        {offer.description && <p className={`text-stone-500 mt-0.5 ${compact ? "text-xs" : "text-sm"}`}>{offer.description}</p>}
        <p className={`text-stone-700 mt-1 ${compact ? "text-xs" : "text-sm"}`}>{describeOffer(offer)}</p>
        <p className={`text-stone-400 mt-1 ${compact ? "text-[11px] line-clamp-1" : "text-xs"}`}>
          {offer.appliesToAll ? offerScope(offer) : offer.products.map((p, n) => (
            <span key={p.id}>
              {n > 0 && ", "}{p.name}
              <CountryFlag productId={p.id} className="ml-1 align-[-1px] w-3.5 h-2.5" />
            </span>
          ))}
          {ends ? ` · ${ends}` : ""}
        </p>
      </div>
    </div>
  );
}
