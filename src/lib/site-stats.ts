/**
 * Cookieless first-party statistics: anonymous event beacons to this site's own /api/stats.
 *
 * - No cookies, localStorage / sessionStorage, fingerprinting or visitor / session identifiers.
 * - Only the page PATH is sent (never the query string), plus catalogue data for shop events.
 * - The visit's traffic source is remembered in memory for this page only (gone on reload / close).
 * - On by default in production builds; NEXT_PUBLIC_SITE_STATS=true / false overrides it (local testing
 *   would otherwise write to the shared database).
 */

export const SITE_STATS_ENABLED =
  process.env.NEXT_PUBLIC_SITE_STATS ? process.env.NEXT_PUBLIC_SITE_STATS === "true" : process.env.NODE_ENV === "production";

export type StatEvent = "page_view" | "view_item" | "add_to_cart" | "view_cart" | "begin_checkout" | "purchase";
export interface StatItem { id: string; name: string; qty: number }

let landing: { src: string; medium: string } | null = null;
let firstPageView = true;

/**
 * Where this visit came from, decided once per page load: utm_source / utm_medium if present, else the referring
 * site's host name, else "(direct)". Null when the page load is not the start of a visit (reload, back / forward,
 * or a link from another page of this site).
 */
function visitStart(): { src: string; medium: string } | null {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav && (nav.type === "reload" || nav.type === "back_forward")) return null;
    const url = new URL(window.location.href);
    let refHost = "";
    try { refHost = document.referrer ? new URL(document.referrer).hostname : ""; } catch { /* ignore */ }
    if (refHost && refHost === url.hostname) return null; // internal navigation with a full page load
    const utmSource = url.searchParams.get("utm_source")?.trim().slice(0, 100);
    const utmMedium = url.searchParams.get("utm_medium")?.trim().slice(0, 50);
    if (utmSource) return { src: utmSource, medium: utmMedium || "(not set)" };
    return refHost ? { src: refHost, medium: "referral" } : { src: "(direct)", medium: "(none)" };
  } catch {
    return null;
  }
}

function beacon(body: Record<string, unknown>) {
  if (!SITE_STATS_ENABLED || typeof window === "undefined") return;
  try {
    const json = JSON.stringify(body);
    const blob = new Blob([json], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/stats", blob)) return;
    void fetch("/api/stats", { method: "POST", body: json, headers: { "content-type": "application/json" }, keepalive: true, credentials: "omit" }).catch(() => {});
  } catch { /* statistics must never break the page */ }
}

/** A page view of the current route (path only). The first one of a page load may start a visit. */
export function statPageView() {
  if (!SITE_STATS_ENABLED || typeof window === "undefined") return;
  const path = window.location.pathname.slice(0, 300);
  if (firstPageView) {
    firstPageView = false;
    landing = visitStart();
    if (landing) return beacon({ e: "page_view", path, entry: true, ...landing });
  }
  beacon({ e: "page_view", path });
}

export function statEvent(e: Exclude<StatEvent, "page_view" | "purchase">, items?: StatItem[]) {
  beacon({ e, path: typeof window !== "undefined" ? window.location.pathname.slice(0, 300) : undefined, ...(items?.length ? { items: items.slice(0, 30) } : {}) });
}

/**
 * One explicit Accept / Decline click on the cookie banner. Anonymous: only the decision is sent (the server adds
 * the device type). Called by the banner only, so a visitor who never answers is not counted.
 */
export function statConsent(decision: "accepted" | "declined") {
  beacon({ e: "consent", decision });
}

/** The order itself is recorded by the server; this only adds the visit's source (when this page load knows it). */
export function statPurchase(orderNumber: string) {
  beacon({ e: "purchase", order: orderNumber.slice(0, 30), ...(landing ?? {}) });
}
