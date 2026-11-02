import { NextResponse } from "next/server";

/**
 * The shop logo (settings.companyLogo) served from this site, so the voucher can draw it into its PDF
 * (a cross-origin image would be blocked). Only ever the configured logo — never an arbitrary URL.
 */
export async function GET() {
  try {
    const settings = await fetch(`${process.env.API_URL}/storefront/settings`, { cache: "no-store" }).then(r => (r.ok ? r.json() : null));
    const path: string | null | undefined = settings?.companyLogo;
    if (!path) return NextResponse.json({ message: "No logo" }, { status: 404 });
    const url = /^https?:/.test(path) ? path : `${process.env.NEXT_PUBLIC_API_URL ?? ""}${path}`;
    const img = await fetch(url, { cache: "no-store" });
    const type = img.headers.get("content-type") ?? "";
    if (!img.ok || !type.startsWith("image/")) return NextResponse.json({ message: "Logo not found" }, { status: 404 });
    return new NextResponse(img.body, { headers: { "content-type": type, "cache-control": "public, max-age=3600" } });
  } catch {
    return NextResponse.json({ message: "Logo unavailable" }, { status: 502 });
  }
}
