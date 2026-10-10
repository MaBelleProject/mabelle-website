import type { Offer } from "@/lib/api";

const money = (v: string | number) => `$${parseFloat(String(v)).toFixed(2)}`;

/** Short label for badges, e.g. "Buy 2 Get 1", "10% OFF". */
export function offerBadge(o: Offer) {
  switch (o.offerType) {
    case "buy_x_get_y": return `Buy ${o.buyQuantity} Get ${o.getQuantity}`;
    case "free_delivery": return "Free Delivery";
    case "fixed_discount": return `${money(o.discountAmount)} OFF`;
    default: return `${parseFloat(o.discountPercentage)}% OFF`;
  }
}

/** One-line description of what the offer gives and when (same wording as the dashboard). */
export function describeOffer(o: Offer) {
  const reward =
    o.offerType === "buy_x_get_y" ? `Buy ${o.buyQuantity}, get ${o.getQuantity} free`
    : o.offerType === "free_delivery" ? "Free delivery"
    : o.offerType === "fixed_discount" ? `${money(o.discountAmount)} off`
    : `${parseFloat(o.discountPercentage)}% off`;
  const conds = [
    parseFloat(o.minOrderAmount) > 0 ? `spend ${money(o.minOrderAmount)}+` : null,
    o.minQuantity > 0 ? `${o.minQuantity}+ items` : null,
  ].filter(Boolean);
  return conds.length ? `${reward} · ${conds.join(", ")}` : reward;
}

/** Which products the offer covers, for display. */
export function offerScope(o: Offer) {
  return o.appliesToAll ? "All products" : o.products.map(p => p.name).join(", ");
}

export function offerEnds(o: Offer) {
  return o.endDate ? `Ends ${new Date(o.endDate).toLocaleDateString()}` : null;
}

/**
 * Offers that apply to a product, highest priority first (offers arrive sorted).
 * `specificOnly` leaves out store-wide offers (used for card badges, so every card isn't badged).
 */
export function offersForProduct(offers: Offer[], productId: number, specificOnly = false) {
  return offers.filter(o => o.appliesToAll ? !specificOnly : o.productIds.includes(productId));
}
