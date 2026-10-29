"use client";

import { useCustomer } from "@/context/customer-context";
import { useMenu } from "@/context/menu-context";
import type { SectionGroup } from "@/lib/api";
import { sectionHref } from "@/lib/sections";
import { ChevronDown, LogOut, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TRANSITION = "300ms cubic-bezier(0.4, 0, 0.2, 1)";

export default function MenuSidebar({ sections }: { sections: SectionGroup[] }) {
  const { open, close } = useMenu();
  const { customer, logout } = useCustomer();
  const pathname = usePathname();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const scrollYRef = useRef(0);
  const navRef = useRef<HTMLElement>(null);

  const navClass = (href: string) => {
    const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?");
    return `px-4 py-3 rounded-lg text-sm font-medium transition ${
      active
        ? "bg-[var(--sage-light)] text-[var(--brand)]"
        : "text-stone-700 hover:bg-[var(--sage-light)] hover:text-[var(--brand)]"
    }`;
  };

  useEffect(() => { close(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // The document-level touchmove handler in layout.tsx calls e.preventDefault() whenever
  // window.scrollY === 0 and the finger moves down (scroll-up gesture). While the menu is
  // open, body is position:fixed so window.scrollY is always 0 — that handler would block
  // every upward scroll in the nav. Stopping propagation here keeps nav touches local.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const stop = (e: TouchEvent) => e.stopPropagation();
    nav.addEventListener("touchmove", stop, { passive: true });
    return () => nav.removeEventListener("touchmove", stop);
  }, []);

  // Close the confirm dialog whenever the sidebar closes
  useEffect(() => { if (!open) setConfirmSignOut(false); }, [open]);

  // Lock body scroll while menu is open.
  // position:fixed is used instead of overflow:hidden because iOS Safari ignores
  // overflow:hidden on the body, which lets the page scroll compete with the nav scroll.
  useEffect(() => {
    if (open) {
      if (navRef.current) {
        const nav = navRef.current;
        const links = Array.from(nav.querySelectorAll("a"));
        const activeLink = links.find(a => {
          const href = a.getAttribute("href") ?? "";
          if (href === "/") return pathname === "/";
          return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?");
        }) as HTMLElement | undefined;
        if (activeLink) {
          const linkTop = activeLink.offsetTop - nav.offsetTop;
          const max = nav.scrollHeight - nav.clientHeight;
          const target = linkTop - nav.clientHeight / 2 + activeLink.offsetHeight / 2;
          // Cap at max - 1 so iOS Safari never sits at the scroll boundary (which blocks upward gestures)
          nav.scrollTop = Math.max(0, Math.min(target, max > 1 ? max - 1 : max));
        }
      }
      scrollYRef.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.width = "100%";
    } else {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollYRef.current);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [open]);

  const handleSignOut = () => {
    setConfirmSignOut(false);
    close();
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      window.location.replace("/");
    }, 700);
  };

  return (
    <>
      {/* Backdrop — closes menu when clicking outside the sidebar */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={close}
      />

      <aside
        className="fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 flex flex-col will-change-transform overflow-x-hidden"
        style={{
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: `transform ${TRANSITION}`,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Close button */}
        <div className="flex items-center justify-end px-3 pt-3 pb-1 shrink-0">
          <button
            onClick={close}
            aria-label="Close menu"
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[var(--sage-light)] transition"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Nav links */}
        <nav ref={navRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide px-3 pt-1 pb-4 flex flex-col gap-0.5">
          <Link href="/" onClick={close} className={navClass("/")}>
            Home
          </Link>

          {sections.length > 0 && (
            <div>
              <button
                onClick={() => setSectionsOpen(v => !v)}
                className="w-full px-4 py-3 rounded-lg text-sm font-medium transition text-stone-700 hover:bg-[var(--sage-light)] hover:text-[var(--brand)] flex items-center justify-between"
              >
                <span>Sections</span>
                <ChevronDown
                  className="w-4 h-4 transition-transform duration-300"
                  style={{ transform: sectionsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: sectionsOpen ? `${sections.length * 52}px` : "0px" }}
              >
                <div className="flex flex-col gap-0.5 pl-3 pt-0.5 pb-1">
                  {sections.map(s => (
                    <Link
                      key={s.code}
                      href={sectionHref(s.code)}
                      onClick={close}
                      className={navClass(sectionHref(s.code))}
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Link href="/bundles" onClick={close} className={navClass("/bundles")}>
            Bundles
          </Link>
          <Link href="/gifts" onClick={close} className={navClass("/gifts")}>
            Gifts
          </Link>
          {/* <Link href="/offers" onClick={close} className={navClass("/offers")}>
            Offers
          </Link> */}

          <Link href="/reviews" onClick={close} className={navClass("/reviews")}>
            Customer Reviews
          </Link>
          <Link href="/about" onClick={close} className={navClass("/about")}>
            About Us
          </Link>

          {customer ? (
            <>
              <Link href="/order-history" onClick={close} className={`${navClass("/order-history")} flex items-center gap-2`}>
                Order History
              </Link>
              <Link href="/profile" onClick={close} className={`${navClass("/profile")} flex items-center gap-2`}>
                My Profile
              </Link>
              <Link href="/favorites" onClick={close} className={`${navClass("/favorites")} flex items-center gap-2`}>
                My Favorites
              </Link>
              <Link href="/change-password" onClick={close} className={navClass("/change-password")}>
                Change Password
              </Link>
              <button
                onClick={() => setConfirmSignOut(true)}
                className="px-4 py-3 rounded-lg text-stone-700 hover:bg-[var(--sage-light)] hover:text-red-500 text-sm font-medium transition text-left flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" onClick={close} className={navClass("/login")}>
              Login
            </Link>
          )}
        </nav>

      </aside>

      {loggingOut && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-white">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--sage-light)] border-t-[var(--brand)] animate-spin" />
        </div>,
        document.body
      )}

      {confirmSignOut && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={() => setConfirmSignOut(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Card */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs px-6 py-8 flex flex-col items-center gap-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <LogOut className="w-7 h-7 text-red-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-stone-800 text-lg">Sign out?</p>
              <p className="text-stone-400 text-sm mt-1">You&apos;ll need to log in again at checkout.</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={handleSignOut}
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-full transition"
              >
                Yes, sign out
              </button>
              <button
                onClick={() => setConfirmSignOut(false)}
                className="w-full py-2.5 bg-[var(--sage-light)] hover:bg-[oklch(0.89_0.025_145)] text-stone-700 text-sm font-semibold rounded-full transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
