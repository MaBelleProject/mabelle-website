import { NextRequest, NextResponse, after } from "next/server";

/**
 * Cookieless, first-party website statistics (no consent banner needed for this).
 *
 * The browser beacons an anonymous event here (same origin). This route adds only coarse, non-identifying context
 * (country / city from the hosting edge, device type from the user agent) and forwards the event to the backend,
 * which increments aggregate daily counters. Cookie-banner clicks ({ e: "consent", decision }) go to their own
 * counter (decision + device only). The visitor's IP address and user agent are NOT forwarded or stored,
 * and no cookie, storage or identifier is used.
 */

const EVENTS = new Set(["page_view", "view_item", "add_to_cart", "view_cart", "begin_checkout", "purchase"]);
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|axios|node-fetch/i;
const MAX_BODY = 4096;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}

function decodeHeader(v: string | null): string | undefined {
  if (!v) return undefined;
  try { return decodeURIComponent(v).slice(0, 80); } catch { return undefined; }
}

export async function POST(req: NextRequest) {
  const ok = new NextResponse(null, { status: 204 });
  const ua = req.headers.get("user-agent") ?? "";
  // Only the site's own pages may report; bots and prefetches are ignored.
  const site = req.headers.get("sec-fetch-site");
  if ((site && site !== "same-origin") || !ua || BOT.test(ua) || req.headers.get("purpose") === "prefetch") return ok;
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return ok;

  let raw: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return ok;
    raw = JSON.parse(text);
  } catch { return ok; }
  if (!raw || typeof raw !== "object") return ok;

  // A click on the cookie banner: only the decision and the device type are passed on.
  if (raw.e === "consent") {
    if (raw.decision !== "accepted" && raw.decision !== "declined") return ok;
    forward("/site-stats/consent", { decision: raw.decision, device: deviceOf(ua) });
    return ok;
  }
  if (!EVENTS.has(raw.e as string)) return ok;

  // Allow-list every field: nothing else from the browser is passed on.
  const items = Array.isArray(raw.items)
    ? raw.items.slice(0, 30).flatMap((i: Record<string, unknown>) => {
        const id = str(i?.id, 60);
        const name = str(i?.name, 200);
        const qty = Math.min(999, Math.max(1, Math.floor(Number(i?.qty) || 1)));
        return id && name ? [{ id, name, qty }] : [];
      })
    : undefined;
  const path = str(raw.path, 300);
  const country = req.headers.get("x-vercel-ip-country")?.toUpperCase();
  const event = {
    e: raw.e,
    ...(path && /^\/[^?#\s]*$/.test(path) ? { path } : {}),
    ...(raw.entry === true ? { entry: true } : {}),
    ...(str(raw.src, 100) ? { src: str(raw.src, 100) } : {}),
    ...(str(raw.medium, 50) ? { medium: str(raw.medium, 50) } : {}),
    ...(items?.length ? { items } : {}),
    ...(raw.e === "purchase" && str(raw.order, 30) ? { order: str(raw.order, 30) } : {}),
    device: deviceOf(ua),
    ...(country && /^[A-Z]{2}$/.test(country) ? { country } : {}),
    ...(decodeHeader(req.headers.get("x-vercel-ip-city")) ? { city: decodeHeader(req.headers.get("x-vercel-ip-city")) } : {}),
  };

  forward("/site-stats/collect", event);
  return ok;
}

/** Answers the beacon immediately; forwards to the backend once the response is sent. */
function forward(path: string, body: Record<string, unknown>) {
  after(async () => {
    try {
      await fetch(`${process.env.API_URL}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    } catch { /* statistics are best-effort */ }
  });
}
