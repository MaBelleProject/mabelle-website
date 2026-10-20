"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { countryInfo, madeInLabel } from "@/lib/countries";
import { useProductOrigin } from "@/context/product-origins-context";

/** Pass `country` directly, or a `productId` to look its country up. */
interface CountryFlagProps { country?: string | null; productId?: number | null; interactive?: boolean; className?: string; }

// Image flags instead of emoji: Windows doesn't draw flag emoji (it shows "FR" letters).
const flagSrc = (code: string, w: 40 | 80) => `https://flagcdn.com/w${w}/${code.toLowerCase()}.png`;

function FlagImg({ code, className }: { code: string; className: string }) {
  return (
    <img
      src={flagSrc(code, 40)}
      srcSet={`${flagSrc(code, 80)} 2x`}
      alt=""
      loading="lazy"
      className={`object-cover rounded-[3px] ring-1 ring-black/10 ${className}`}
    />
  );
}

/** Small flag button; tapping/clicking it shows "Made in <country>". */
export default function CountryFlag({ country, productId, interactive = true, className = "w-4 h-3" }: CountryFlagProps) {
  const lookedUp = useProductOrigin(productId);
  const info = countryInfo(country || lookedUp);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; center: number } | null>(null);

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !popRef.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos]);

  // Centre the bubble over the flag, kept inside the viewport once its width is known.
  useLayoutEffect(() => {
    const el = popRef.current;
    if (!pos || !el) return;
    const left = pos.center - el.offsetWidth / 2;
    el.style.left = `${Math.min(Math.max(8, left), window.innerWidth - el.offsetWidth - 8)}px`;
    el.style.visibility = "visible";
  }, [pos]);

  if (!info) return null;
  const label = madeInLabel(info);

  // Inside another button (e.g. bundle swap chips) a nested button isn't allowed: show a plain flag with a tooltip.
  if (!interactive) {
    return (
      <span title={label} role="img" aria-label={label} className={`inline-flex shrink-0 ${className}`}>
        <FlagImg code={info.code} className="w-full h-full" />
      </span>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    // Flags sit inside links (brand tiles): show the label instead of navigating.
    e.preventDefault();
    e.stopPropagation();
    if (pos) return setPos(null);
    const r = btnRef.current!.getBoundingClientRect();
    setPos({ top: r.top - 8, center: r.left + r.width / 2 });
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        aria-label={label}
        aria-expanded={!!pos}
        title={label}
        className={`inline-flex items-center justify-center shrink-0 rounded hover:scale-110 transition-transform ${className}`}
      >
        <FlagImg code={info.code} className="w-full h-full" />
      </button>
      {pos && createPortal(
        <div
          ref={popRef}
          role="status"
          style={{ top: pos.top, left: 0, visibility: "hidden" }}
          // Portal clicks still bubble through React to the surrounding link/modal: stop them here.
          onClick={e => { e.preventDefault(); e.stopPropagation(); }}
          className="fixed z-[400] -translate-y-full flex items-center gap-2 whitespace-nowrap bg-white text-stone-800 text-sm font-semibold px-3 py-2 rounded-xl shadow-lg border border-[var(--sage-light)]"
        >
          {label}
          <FlagImg code={info.code} className="w-5 h-[15px]" />
        </div>,
        document.body,
      )}
    </>
  );
}
