"use client";

import { useState } from "react";
import type { Offer } from "@/lib/api";
import { trackSelectPromotion } from "@/lib/analytics";
import OfferCard from "@/components/offer-card";
import OfferDetailModal from "@/components/offer-detail-modal";

export default function OffersPageClient({ offers }: { offers: Offer[] }) {
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        {offers.map(o => (
          <button
            key={o.id}
            onClick={() => { trackSelectPromotion({ promotion_id: `offer-${o.id}`, promotion_name: o.name, creative_slot: "offers_page" }); setSelectedOffer(o); }}
            className="text-left w-full rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
          >
            <OfferCard offer={o} />
          </button>
        ))}
      </div>

      {selectedOffer && (
        <OfferDetailModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
        />
      )}
    </>
  );
}
