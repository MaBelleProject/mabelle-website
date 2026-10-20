"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface ProductRating {
  averageRating: number;
  totalRatings: number;
}

const ProductRatingsContext = createContext<Map<number, ProductRating>>(new Map());

export function ProductRatingsProvider({
  ratings,
  children,
}: {
  ratings: { productId: number; averageRating: number; totalRatings: number }[];
  children: ReactNode;
}) {
  const map = new Map(ratings.map(r => [r.productId, { averageRating: r.averageRating, totalRatings: r.totalRatings }]));
  return <ProductRatingsContext.Provider value={map}>{children}</ProductRatingsContext.Provider>;
}

export function useProductRatings() {
  return useContext(ProductRatingsContext);
}
