"use client";

import ViewAllLink from "@/components/view-all-link";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";

interface HorizontalRowProps {
  title: string;
  viewAllHref: string;
  children: ReactNode;
}

/** A homepage section: title + "View All" link above a single horizontally scrolling row of cards. */
export default function HorizontalRow({ title, viewAllHref, children }: HorizontalRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const items = Children.toArray(children);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [items.length]);

  if (!items.length) return null;

  const scroll = () => scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" });

  return (
    <section className="max-w-7xl mx-auto px-2 sm:px-4 pt-3 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-stone-800">{title}</h2>
        <ViewAllLink href={viewAllHref} />
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((child, i) => (
            <div key={i} className="relative snap-start shrink-0 w-36 sm:w-44">
              {child}
            </div>
          ))}
        </div>
        {canScrollRight && (
          <button
            onClick={scroll}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-sm shadow hover:bg-white/80 transition touch-manipulation"
            aria-label="Scroll right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-stone-600">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
