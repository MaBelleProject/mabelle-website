"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Product id → "Made In" country, loaded once by the root layout (cart, orders and bundles only know product ids). */
const ProductOriginsContext = createContext<Record<number, string>>({});

export function ProductOriginsProvider({ origins, children }: { origins: Record<number, string>; children: ReactNode }) {
  return <ProductOriginsContext.Provider value={origins}>{children}</ProductOriginsContext.Provider>;
}

export function useProductOrigin(productId?: number | null) {
  const origins = useContext(ProductOriginsContext);
  return productId == null ? undefined : origins[productId];
}
