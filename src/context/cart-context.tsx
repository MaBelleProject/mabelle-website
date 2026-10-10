"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { OrderLine } from "@/lib/api";

export type CartItemType = "product" | "bundle" | "gift";

export interface CartItem {
  /** Identifies the line: "p-<productId>", "b-<bundleId>", or one per customized gift. */
  key: string;
  itemType: CartItemType;
  productId?: number;
  bundleId?: number;
  giftPackageId?: number;
  productCode: string;
  productName: string;
  unitPrice: number;
  imageUrl?: string | null;
  quantity: number;
  maxQty: number;
  // Gifts: the customer's choices, kept exactly as they will be ordered
  giftSelections?: { giftItemId: number; productId: number; quantity: number }[];
  packagingId?: number | null;
  packagingName?: string | null;
  giftMessage?: string;
  /** What is inside (bundles / gifts), for display. */
  contents?: string[];
}

export const productKey = (productId: number) => `p-${productId}`;
export const bundleKey = (bundleId: number) => `b-${bundleId}`;

/** Where a cart line's own page is. */
export const cartItemHref = (item: CartItem) =>
  item.itemType === "bundle" ? `/bundles/${item.bundleId}` : item.itemType === "gift" ? `/gifts/${item.giftPackageId}` : `/product/${item.productId}`;

type NewItem = Omit<CartItem, "quantity" | "key" | "itemType"> & { key?: string; itemType?: CartItemType };

interface CartContextValue {
  items: CartItem[];
  /** Adds `quantity` (default 1) of a line, merging with the same key. */
  add: (item: NewItem, quantity?: number) => void;
  update: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  /** Offer the customer picked in the cart (null = the default, highest-priority offer). */
  selectedOfferId: number | null;
  selectOffer: (offerId: number | null) => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "mabelle_cart";
const OFFER_STORAGE_KEY = "mabelle_cart_offer";

/** Carts saved before bundles / gifts existed hold plain products without a key. */
const migrate = (raw: unknown): CartItem[] =>
  Array.isArray(raw)
    ? raw.map((i: CartItem) => ({ ...i, itemType: i.itemType ?? "product", key: i.key ?? productKey(i.productId!) }))
    : [];

/** The cart line in the shape the order / quote API expects. */
export function toOrderLine(i: CartItem): OrderLine {
  if (i.itemType === "bundle") return { itemType: "bundle", bundleId: i.bundleId!, quantity: i.quantity };
  if (i.itemType === "gift") {
    return {
      itemType: "gift", giftPackageId: i.giftPackageId!, quantity: i.quantity,
      giftSelections: i.giftSelections ?? [], packagingId: i.packagingId ?? null, giftMessage: i.giftMessage || undefined,
    };
  }
  return { productId: i.productId!, productCode: i.productCode, productName: i.productName, unitPrice: i.unitPrice, quantity: i.quantity };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(migrate(JSON.parse(raw)));
      const offer = Number(localStorage.getItem(OFFER_STORAGE_KEY));
      if (offer > 0) setSelectedOfferId(offer);
    } catch { /* ignore corrupt storage */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      if (selectedOfferId) localStorage.setItem(OFFER_STORAGE_KEY, String(selectedOfferId));
      else localStorage.removeItem(OFFER_STORAGE_KEY);
    }
  }, [items, selectedOfferId, hydrated]);

  const add = (item: NewItem, quantity = 1) => {
    const itemType = item.itemType ?? "product";
    const key = item.key ?? (itemType === "bundle" ? bundleKey(item.bundleId!) : productKey(item.productId!));
    setItems(prev => {
      const existing = prev.find(i => i.key === key);
      if (existing) {
        return prev.map(i =>
          i.key === key ? { ...i, ...item, key, itemType, quantity: Math.min(i.quantity + quantity, item.maxQty) } : i,
        );
      }
      return [...prev, { ...item, key, itemType, quantity: Math.min(quantity, item.maxQty) }];
    });
  };

  const update = (key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.key !== key));
    } else {
      setItems(prev =>
        prev.map(i => i.key === key ? { ...i, quantity } : i),
      );
    }
  };

  const remove = (key: string) => {
    setItems(prev => prev.filter(i => i.key !== key));
  };

  const clear = () => { setItems([]); setSelectedOfferId(null); };

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, update, remove, clear, selectedOfferId, selectOffer: setSelectedOfferId, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
