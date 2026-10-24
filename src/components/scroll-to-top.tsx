"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);

  useLayoutEffect(() => {
    const target = sessionStorage.getItem("homeScrollTo");

    if (target && pathname === "/") {
      sessionStorage.removeItem("homeScrollTo");
      // Double rAF — first frame commits paint, second ensures layout is complete
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
