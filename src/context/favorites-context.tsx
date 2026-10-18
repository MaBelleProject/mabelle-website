"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useCustomer } from "./customer-context";
import { storefrontApi } from "@/lib/api";

interface FavoritesContextValue {
  favorites: Set<number>;
  toggle: (productId: number) => Promise<void>;
  isFavorite: (productId: number) => boolean;
  count: number;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: new Set(),
  toggle: async () => {},
  isFavorite: () => false,
  count: 0,
  loading: false,
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { customer } = useCustomer();
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customer) {
      setFavorites(new Set());
      return;
    }
    setLoading(true);
    storefrontApi.getFavorites(customer.id)
      .then(ids => setFavorites(new Set(ids)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customer?.id]);

  const toggle = useCallback(async (productId: number) => {
    if (!customer) return;
    const wasFav = favorites.has(productId);
    setFavorites(prev => {
      const next = new Set(prev);
      if (wasFav) next.delete(productId);
      else next.add(productId);
      return next;
    });
    try {
      if (wasFav) await storefrontApi.removeFavorite(customer.id, productId);
      else await storefrontApi.addFavorite(customer.id, productId);
    } catch {
      setFavorites(prev => {
        const next = new Set(prev);
        if (wasFav) next.add(productId);
        else next.delete(productId);
        return next;
      });
    }
  }, [customer, favorites]);

  const isFavorite = useCallback((productId: number) => favorites.has(productId), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isFavorite, count: favorites.size, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() { return useContext(FavoritesContext); }
