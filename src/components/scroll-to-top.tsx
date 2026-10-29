"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function scrollToTarget(target: string) {
  const el = document.getElementById(target);
  if (el) {
    const header = document.querySelector("header");
    const offset = header ? (header as HTMLElement).offsetHeight + 16 : 96;
    const top = window.scrollY + el.getBoundingClientRect().top - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
  } else {
    window.scrollTo(0, 0);
  }
}

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);

  // Handle bfcache restore — phone back button often restores the page from cache,
  // so React's useEffect (below) never re-fires. pageshow with persisted:true is the
  // only reliable hook for that case.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      const target = sessionStorage.getItem("homeScrollTo");
      if (target && window.location.pathname === "/") {
        sessionStorage.removeItem("homeScrollTo");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollToTarget(target));
        });
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Handle client-side navigation (Next.js router.back() or popstate without bfcache)
  useEffect(() => {
    const target = sessionStorage.getItem("homeScrollTo");

    if (target && pathname === "/") {
      sessionStorage.removeItem("homeScrollTo");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToTarget(target));
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
