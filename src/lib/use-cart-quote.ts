"use client";

import { toOrderLine, type CartItem } from "@/context/cart-context";
import { storefrontApi, type OrderQuote } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

/**
 * Prices the cart exactly as placing the order would: automatic offers (or the one the customer picked),
 * bundle and gift prices.
 * `quote` is null until the server has answered for the current cart.
 */

export function useCartQuote(
  items: CartItem[],
  opts: {
    customerId?: number;
    procodeId?: number;
    selectedOfferId?: number | null;
    skip?: boolean;
    loyaltyPointsUsed?: number;
  } = {}
) {
  const request = useMemo(
    () =>
      items.length && !opts.skip
        ? {
            customerId: opts.customerId,
            procodeId: opts.procodeId,
            selectedOfferId: opts.selectedOfferId ?? undefined,
            loyaltyPointsUsed: opts.loyaltyPointsUsed || undefined,
            items: items.map(toOrderLine),
          }
        : null,
    [
      items,
      opts.customerId,
      opts.procodeId,
      opts.selectedOfferId,
      opts.skip,
      opts.loyaltyPointsUsed,
    ]
  );

  const key = request ? JSON.stringify(request) : "";
  const [state, setState] = useState<{ key: string; quote?: OrderQuote; error?: string } | null>(null);

  useEffect(() => {
    if (!request) return;
    const id = setTimeout(() => {
      storefrontApi.quote(request)
        .then(quote => setState({ key, quote }))
        .catch(e => setState({ key, error: e instanceof Error ? e.message : "Could not price the cart" }));
    }, 300);
    return () => clearTimeout(id);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = state?.key === key ? state : null;
  return { quote: current?.quote ?? null, error: current?.error ?? null, loading: !!request && !current };
}
