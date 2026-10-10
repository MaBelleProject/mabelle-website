"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Offer } from "@/lib/api";

/** Active offers (highest priority first), loaded once by the root layout. */
const OffersContext = createContext<Offer[]>([]);

export function OffersProvider({ offers, children }: { offers: Offer[]; children: ReactNode }) {
  return <OffersContext.Provider value={offers}>{children}</OffersContext.Provider>;
}

export function useOffers() { return useContext(OffersContext); }
