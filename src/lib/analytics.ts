/**
 * Google Analytics 4 (gtag.js) helpers.
 *
 * - Consent Mode v2: every consent type defaults to "denied". Analytics cookies are only used once the visitor
 *   accepts (see `CookieConsent`); before that GA receives cookieless pings only.
 * - No personal data is ever sent: no names, phones, emails, addresses, gift messages or order notes.
 *   Page URLs are stripped of every query parameter except a few harmless catalogue filters.
 * - All calls are no-ops when GA is disabled (no measurement ID) or during server rendering.
 */

import type { CartItem } from "@/context/cart-context";

/**
 * The GA4 measurement ID. NEXT_PUBLIC_GA_MEASUREMENT_ID overrides it; without it, production builds use the
 * MaBelle Bites property and `next dev` sends nothing (so local testing doesn't pollute the reports).
 */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? (process.env.NODE_ENV === "production" ? "G-3T5HKWQYVB" : "");

export const CURRENCY = "USD";
export const CONSENT_STORAGE_KEY = "mabelle_analytics_consent";
export const CONSENT_CHANGE_EVENT = "mabelle:consent-change";

/** Query parameters that are safe (and useful) to keep in page_location. Everything else is dropped. */
const ALLOWED_QUERY_PARAMS = ["categoryId", "sectionCode", "age", "section", "brand"];

export type ConsentChoice = "granted" | "denied";

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

const enabled = () => typeof window !== "undefined" && !!GA_MEASUREMENT_ID && typeof window.gtag === "function";

/** DebugView: on with NEXT_PUBLIC_GA_DEBUG=true, or for this browser tab after visiting any page with ?ga_debug=1. */
export function isDebugMode(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_GA_DEBUG === "true") return true;
  try {
    const flag = new URLSearchParams(window.location.search).get("ga_debug");
    if (flag === "1") sessionStorage.setItem("ga_debug", "1");
    if (flag === "0") sessionStorage.removeItem("ga_debug");
    return sessionStorage.getItem("ga_debug") === "1";
  } catch {
    return false;
  }
}

function send(eventName: string, params: Record<string, unknown> = {}) {
  if (!enabled()) return;
  window.gtag!("event", eventName, isDebugMode() ? { ...params, debug_mode: true } : params);
}

// ─── Consent ──────────────────────────────────────────────────────────────────

export function getStoredConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

/** Saves the visitor's choice and tells GA. Advertising storage stays denied: the site runs no ads. */
export function setConsent(choice: ConsentChoice) {
  try { localStorage.setItem(CONSENT_STORAGE_KEY, choice); } catch { /* private mode */ }
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("consent", "update", { analytics_storage: choice });
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

/** Re-opens the cookie banner (e.g. from a "Cookie settings" link). */
export function openCookieSettings() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("mabelle:open-cookie-settings"));
}

/**
 * The inline script for <head>: sets the Consent Mode defaults (and the stored choice of a returning visitor)
 * before gtag.js loads, so not a single hit goes out without them.
 */
export function gtagBootstrapScript() {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;` +
    `gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});` +
    `try{if(localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)})==='granted')gtag('consent','update',{analytics_storage:'granted'});}catch(e){}` +
    `gtag('set','ads_data_redaction',true);gtag('js',new Date());`;
}

// ─── Page views ───────────────────────────────────────────────────────────────

/** The current URL without personal / secret query parameters (reset tokens, order numbers, search terms…). */
export function sanitizedLocation(): string {
  const url = new URL(window.location.href);
  const kept = new URLSearchParams();
  for (const key of ALLOWED_QUERY_PARAMS) {
    const v = url.searchParams.get(key);
    if (v) kept.set(key, v);
  }
  const qs = kept.toString();
  return `${url.origin}${url.pathname}${qs ? `?${qs}` : ""}`;
}

let configured = false;

/** Sends a page_view for the current route. Called on the first load and after every client-side navigation. */
export function trackPageView() {
  if (!enabled()) return;
  const page_location = sanitizedLocation();
  const page_title = document.title;
  if (!configured) {
    configured = true;
    window.gtag!("config", GA_MEASUREMENT_ID, {
      send_page_view: false, // page views are sent below, with the cleaned URL
      page_location,
      allow_ad_personalization_signals: false,
      ...(isDebugMode() ? { debug_mode: true } : {}),
    });
  }
  // Later events (add_to_cart, purchase…) report the cleaned URL too.
  window.gtag!("set", { page_location, page_title });
  send("page_view", { page_location, page_title });
}

// ─── Ecommerce ────────────────────────────────────────────────────────────────

export interface GaItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_brand?: string;
  item_variant?: string;
  price: number;
  quantity: number;
  discount?: number;
  coupon?: string;
  index?: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** The GA item id of a cart line; the same ids are used by view_item on the product / bundle / gift pages. */
export function cartItemId(i: Pick<CartItem, "itemType" | "productId" | "bundleId" | "giftPackageId" | "productCode">) {
  if (i.itemType === "bundle") return `bundle-${i.bundleId}`;
  if (i.itemType === "gift") return i.giftPackageId ? `gift-${i.giftPackageId}` : "gift-custom";
  return String(i.productId ?? i.productCode);
}

const CATEGORY: Record<string, string> = { product: "Product", bundle: "Bundle", gift: "Gift" };

/** A cart line as a GA item. Only catalogue data: the gift message and other free text are never included. */
export function toGaItem(i: CartItem, quantity = i.quantity, price = i.unitPrice): GaItem {
  return {
    item_id: cartItemId(i),
    item_name: i.productName,
    item_category: CATEGORY[i.itemType ?? "product"],
    ...(i.itemType === "gift" && i.packagingName ? { item_variant: i.packagingName } : {}),
    price: round(price),
    quantity,
  };
}

const itemsValue = (items: GaItem[]) => round(items.reduce((s, i) => s + i.price * i.quantity, 0));

export function trackViewItem(item: Omit<GaItem, "quantity"> & { quantity?: number }) {
  const gaItem: GaItem = { quantity: 1, ...item, price: round(item.price) };
  send("view_item", { currency: CURRENCY, value: gaItem.price, items: [gaItem] });
}

/** Compares the cart before / after a change and reports what was added and removed. */
export function trackCartChange(before: CartItem[], after: CartItem[]) {
  const prev = new Map(before.map(i => [i.key, i]));
  const next = new Map(after.map(i => [i.key, i]));
  const added: GaItem[] = [];
  const removed: GaItem[] = [];
  for (const [key, line] of next) {
    const delta = line.quantity - (prev.get(key)?.quantity ?? 0);
    if (delta > 0) added.push(toGaItem(line, delta));
    else if (delta < 0) removed.push(toGaItem(line, -delta));
  }
  for (const [key, line] of prev) if (!next.has(key)) removed.push(toGaItem(line, line.quantity));
  if (added.length) send("add_to_cart", { currency: CURRENCY, value: itemsValue(added), items: added });
  if (removed.length) send("remove_from_cart", { currency: CURRENCY, value: itemsValue(removed), items: removed });
}

export function trackViewCart(items: CartItem[]) {
  const gaItems = items.map(i => toGaItem(i));
  send("view_cart", { currency: CURRENCY, value: itemsValue(gaItems), items: gaItems });
}

/** A key for "this cart", so funnel steps are reported once per cart, not on every refresh. */
const cartSignature = (items: CartItem[]) => items.map(i => `${i.key}:${i.quantity}`).sort().join("|");

function oncePerCart(step: string, items: CartItem[]) {
  try {
    const key = `ga_${step}`;
    const sig = cartSignature(items);
    if (sessionStorage.getItem(key) === sig) return false;
    sessionStorage.setItem(key, sig);
  } catch { /* storage unavailable: report anyway */ }
  return true;
}

export function trackBeginCheckout(items: CartItem[]) {
  if (!enabled() || !items.length || !oncePerCart("begin_checkout", items)) return;
  const gaItems = items.map(i => toGaItem(i));
  send("begin_checkout", { currency: CURRENCY, value: itemsValue(gaItems), items: gaItems });
}

/** Delivery details were given (or taken from the account). Only the delivery type is reported, never the address. */
export function trackAddShippingInfo(items: CartItem[], freeDelivery: boolean) {
  if (!enabled() || !items.length || !oncePerCart("add_shipping_info", items)) return;
  const gaItems = items.map(i => toGaItem(i));
  send("add_shipping_info", {
    currency: CURRENCY,
    value: itemsValue(gaItems),
    shipping_tier: freeDelivery ? "Free delivery" : "Standard delivery",
    items: gaItems,
  });
}

/** Placing the order failed (stock, server…), so the funnel shows where checkout breaks. */
export function trackCheckoutError() {
  send("checkout_error", { currency: CURRENCY });
}

const REPORTED_PURCHASES_KEY = "ga_reported_purchases";

/** True the first time a transaction id is seen in this browser; later calls (retries, double clicks) get false. */
function claimTransaction(transactionId: string): boolean {
  try {
    const seen: string[] = JSON.parse(localStorage.getItem(REPORTED_PURCHASES_KEY) ?? "[]");
    if (seen.includes(transactionId)) return false;
    localStorage.setItem(REPORTED_PURCHASES_KEY, JSON.stringify([...seen, transactionId].slice(-50)));
  } catch { /* storage unavailable: the in-memory guard below still prevents doubles on this page */ }
  return true;
}
const reportedThisPage = new Set<string>();

/**
 * Reports a placed order.
 * - `value` is the product revenue: the order's net total after offers / promo / points, WITHOUT delivery.
 * - `shipping` is the delivery the customer actually pays, reported separately.
 * - Item prices are the quoted unit prices with the order discount spread over them, so item revenue adds up
 *   to `value`; the per-unit discount is in `discount`.
 */
export function trackPurchase(args: {
  transactionId: string;
  items: CartItem[];
  /** Server-quoted unit prices, by cart line index (bundles / gifts / customer pricing). */
  quotedUnitPrices?: (number | undefined)[];
  /** Order total without delivery (after discounts). */
  netTotal: number;
  /** Delivery the customer pays (0 for free delivery). */
  shipping: number;
  coupon?: string | null;
}) {
  if (!enabled() || !args.transactionId || reportedThisPage.has(args.transactionId)) return;
  reportedThisPage.add(args.transactionId);
  if (!claimTransaction(args.transactionId)) return;

  const value = round(Math.max(0, args.netTotal));
  const shipping = round(Math.max(0, args.shipping));
  const gross = args.items.map((i, idx) => toGaItem(i, i.quantity, args.quotedUnitPrices?.[idx] ?? i.unitPrice));
  const grossValue = itemsValue(gross);
  // Share of the gross price kept after the order-level discount (never above 1).
  const factor = grossValue > 0 ? Math.min(1, value / grossValue) : 1;
  const items = gross.map(i => {
    const price = round(i.price * factor);
    const discount = round(i.price - price);
    return { ...i, price, ...(discount > 0 ? { discount } : {}), ...(args.coupon ? { coupon: args.coupon } : {}) };
  });

  send("purchase", {
    transaction_id: args.transactionId,
    currency: CURRENCY,
    value,
    shipping,
    tax: 0,
    ...(args.coupon ? { coupon: args.coupon } : {}),
    items,
  });
  // The funnel steps start over for the next order.
  try { sessionStorage.removeItem("ga_begin_checkout"); sessionStorage.removeItem("ga_add_shipping_info"); } catch { /* ignore */ }
}

// ─── Search & promotions ──────────────────────────────────────────────────────

/** Looks like an email address or a phone number: never sent. */
const looksPersonal = (s: string) => /@/.test(s) || /\d[\d\s\-().]{6,}\d/.test(s);

export function trackSearch(term: string, resultsCount?: number) {
  const search_term = term.trim().slice(0, 100);
  if (search_term.length < 2 || looksPersonal(search_term)) return;
  send("search", { search_term, ...(resultsCount !== undefined ? { results_count: resultsCount } : {}) });
}

export function trackSelectPromotion(p: { promotion_id: string; promotion_name: string; creative_name?: string; creative_slot?: string }) {
  send("select_promotion", p);
}
