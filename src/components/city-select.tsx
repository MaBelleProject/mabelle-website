"use client";

import type { StorefrontDeliveryCity } from "@/lib/api";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CitySelectProps {
  cities: StorefrontDeliveryCity[];
  value: string;
  onChange: (city: string) => void;
  hasError?: boolean;
  showFee?: boolean;
}

export default function CitySelect({ cities, value, onChange, hasError, showFee = true }: CitySelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = cities.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const handleFocus = () => {
    setQuery("");
    setOpen(true);
  };

  const handleSelect = (city: string) => {
    onChange(city);
    setQuery("");
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); setQuery(""); }
    if (e.key === "Enter" && filtered.length > 0) { e.preventDefault(); handleSelect(filtered[0].name); }
  };

  const displayValue = open ? query : value;

  const borderCls = hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
    : "border-stone-200 focus:border-[var(--brand)] focus:ring-[var(--brand)]";

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={open && value ? value : "Search city…"}
        autoComplete="off"
        className={`w-full px-4 py-2.5 pr-16 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${borderCls}`}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
        {value && (
          <button
            type="button"
            onMouseDown={handleClear}
            className="pointer-events-auto text-stone-300 hover:text-stone-500 transition"
            tabIndex={-1}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-stone-400">No cities found</p>
            ) : (
              filtered.map(c => (
                <button
                  key={c.name}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleSelect(c.name); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition ${
                    value === c.name
                      ? "bg-[var(--sage-light)] text-[var(--brand)] font-medium"
                      : "text-stone-700 hover:bg-[var(--sage-light)]"
                  }`}
                >
                  <span>{c.name}</span>
                  {showFee && (
                    <span className="text-xs text-stone-400 shrink-0">
                      ${c.deliveryFee ? parseFloat(c.deliveryFee).toFixed(2) : "?"}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
