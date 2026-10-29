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
  /** The gift idea this was based on; null for "Create Your Own". */
  giftPackageId?: number | null;
  productCode: string;
  productName: string;
  unitPrice: number;
  imageUrl?: string | null;
  quantity: number;
  maxQty: number;
  // Bundles: product swaps (only items that differ from default)
  bundleSelections?: { bundleItemId: number; productId: number }[];
  // Gifts: the products the customer chose (any product, any quantity)
  giftSelections?: { productId: number; quantity: number }[];
  packagingId?: number | null;
  packagingName?: string | null;
  giftMessage?: string;
  /** What is inside (bundles / gifts), for display. */
  contents?: string[];
  /** Bundles / gifts: the products one unit takes from stock, with the stock each had when it was added. */
  components?: CartComponent[];
}

export interface CartComponent { productId: number; quantity: number; stock: number }

/**
 * What one unit of a line takes from stock, per product. Product lines take their own product (their maxQty is
 * its stock); bundle / gift lines saved before components were kept have none (the server still checks them).
 */
function lineComponents(i: Pick<CartItem, "itemType" | "productId" | "maxQty" | "components">): CartComponent[] {
  if (i.itemType === "product" || !i.itemType) return i.productId != null ? [{ productId: i.productId, quantity: 1, stock: i.maxQty }] : [];
  const byProduct = new Map<number, CartComponent>();
  for (const c of i.components ?? []) {
    const seen = byProduct.get(c.productId);
    byProduct.set(c.productId, seen ? { ...seen, quantity: seen.quantity + c.quantity, stock: Math.min(seen.stock, c.stock) } : c);
  }
  return [...byProduct.values()].filter(c => c.quantity > 0);
}

/** Units of a product the cart already takes — product lines, bundles and gifts — leaving out the line `exceptKey`. */
export function unitsInCart(items: CartItem[], productId: number, exceptKey?: string) {
  return items.reduce((s, i) => i.key === exceptKey ? s
    : s + lineComponents(i).reduce((x, c) => x + (c.productId === productId ? c.quantity * i.quantity : 0), 0), 0);
}

/** The most of a line the cart can hold: its own limit, and what its products have left after the cart's other lines. */
export function maxLineQty(items: CartItem[], line: Pick<CartItem, "key" | "itemType" | "productId" | "maxQty" | "components">) {
  let max = line.maxQty;
  for (const c of lineComponents(line)) {
    max = Math.min(max, Math.floor(Math.max(0, c.stock - unitsInCart(items, c.productId, line.key)) / c.quantity));
  }
  return Math.max(0, max);
}

export const productKey = (productId: number) => `p-${productId}`;
export const bundleKey = (bundleId: number) => `b-${bundleId}`;

/** Where a cart line's own page is. */
export const cartItemHref = (item: CartItem) =>
  item.itemType === "bundle" ? `/bundles/${item.bundleId}`
  : item.itemType === "gift" ? (item.giftPackageId ? `/gifts/${item.giftPackageId}` : "/gifts/create")
  : `/product/${item.productId}`;

type NewItem = Omit<CartItem, "quantity" | "key" | "itemType"> & { key?: string; itemType?: CartItemType };

interface CartContextValue {
  items: CartItem[];
  /** Adds `quantity` (default 1) of a line, merging with the same key. */
  add: (item: NewItem, quantity?: number) => void;
  /** Sets a line's quantity; an increase is capped by the stock left after the cart's other lines. */
  update: (key: string, quantity: number) => void;
  /** The most of this line the cart can hold now (see `maxLineQty`). */
  maxQtyFor: (key: string) => number;
  /** Units of a product still free: `stock` less what the cart's lines (but `exceptKey`) already take. */
  stockLeft: (productId: number, stock: number, exceptKey?: string) => number;
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
  if (i.itemType === "bundle") {
    return { itemType: "bundle", bundleId: i.bundleId!, quantity: i.quantity, bundleSelections: i.bundleSelections };
  }
  if (i.itemType === "gift") {
    return {
      itemType: "gift",
      giftPackageId: i.giftPackageId ?? null,
      quantity: i.quantity,
      giftSelections: i.giftSelections ?? [],
      packagingId: i.packagingId ?? null,
      giftMessage: i.giftMessage || undefined,
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
      // Never more than the stock left once the cart's other lines (products, bundles, gifts) are counted.
      const max = maxLineQty(prev, { ...item, key, itemType });
      if (existing) {
        return prev.map(i =>
          i.key === key ? { ...i, ...item, key, itemType, quantity: Math.max(i.quantity, Math.min(i.quantity + quantity, max)) } : i,
        );
      }
      const qty = Math.min(quantity, max);
      return qty > 0 ? [...prev, { ...item, key, itemType, quantity: qty }] : prev;
    });
  };

  const update = (key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.key !== key));
    } else {
      setItems(prev =>
        prev.map(i => i.key !== key ? i
          : { ...i, quantity: quantity > i.quantity ? Math.max(i.quantity, Math.min(quantity, maxLineQty(prev, i))) : quantity }),
      );
    }
  };

  const maxQtyFor = (key: string) => {
    const line = items.find(i => i.key === key);
    return line ? maxLineQty(items, line) : 0;
  };
  const stockLeft = (productId: number, stock: number, exceptKey?: string) =>
    Math.max(0, stock - unitsInCart(items, productId, exceptKey));

  const remove = (key: string) => {
    setItems(prev => prev.filter(i => i.key !== key));
  };

  const clear = () => { setItems([]); setSelectedOfferId(null); };

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, update, maxQtyFor, stockLeft, remove, clear, selectedOfferId, selectOffer: setSelectedOfferId, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
