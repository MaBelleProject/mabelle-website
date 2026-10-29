"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";


export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);


  // Handle client-side navigation (Next.js router.back() or popstate without bfcache)
  useEffect(() => {
    const target = sessionStorage.getItem("homeScrollTo");

    if (target && pathname === "/") {
      sessionStorage.removeItem("homeScrollTo");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.getElementById(target);
          if (el) {
            const header = document.querySelector("header");
            const offset = header ? header.offsetHeight + 16 : 96;
            const top = window.scrollY + el.getBoundingClientRect().top - offset;
            window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
          } else {
            window.scrollTo(0, 0);
          }
        });
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
