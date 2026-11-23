"use client";

import { GA_MEASUREMENT_ID, sanitizedLocation, trackPageView } from "@/lib/analytics";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";

/** Sends a page_view on the first load and after every client-side navigation (App Router). */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const last = useRef<string | null>(null);

  useEffect(() => {
    // Wait a frame so the new page's <title> is in place.
    const id = requestAnimationFrame(() => {
      const location = sanitizedLocation();
      // Changes to dropped parameters only (e.g. typing in the product search) are not a new page.
      if (location === last.current) return;
      last.current = location;
      trackPageView();
    });
    return () => cancelAnimationFrame(id);
  }, [pathname, query]);

  return null;
}

/** Loads gtag.js once for the whole site. The consent defaults are set earlier by the inline <head> script. */
export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;
  return (
    <>
      <Script id="ga4-gtag" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Suspense fallback={null}><PageViewTracker /></Suspense>
    </>
  );
}
