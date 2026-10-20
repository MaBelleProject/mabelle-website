"use client";

import { useState } from "react";
import type { Offer } from "@/lib/api";
import OfferCard from "./offer-card";
import OfferDetailModal from "./offer-detail-modal";

export default function HomeOffersSection({ offers }: { offers: Offer[] }) {
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  return (
    <>
      <div className="relative">
        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
          {offers.map(o => (
            <button
              key={o.id}
              onClick={() => setSelectedOffer(o)}
              className="shrink-0 w-[85%] sm:w-[45%] lg:w-[32%] text-left rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            >
              <OfferCard offer={o} compact />
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />
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
