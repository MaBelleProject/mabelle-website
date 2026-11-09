"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fileUrl, type Product, type Brand, type OriginCountry, type SectionGroup } from "@/lib/api";
import { ageOptions, matchesAge } from "@/lib/age";
import { countryInfo, madeInLabel } from "@/lib/countries";
import ProductCard from "@/components/product-card";
import { ArrowLeft, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

// ─── Fuzzy search ─────────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, row[j], row[j - 1]);
      prev = tmp;
    }
  }
  return row[n];
}

function wordMatches(qw: string, tw: string): boolean {
  if (tw.includes(qw) || qw.includes(tw)) return true;
  // Compare query word against a same-length prefix of the text word to handle endings ("gumy"→"gumm" prefix of "gummies")
  const maxDist = qw.length <= 4 ? 1 : 2;
  const prefix = tw.slice(0, qw.length + 1);
  return levenshtein(qw, prefix) <= maxDist;
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return true;
  if (t.includes(q)) return true;
  const qWords = q.split(/\s+/).filter(Boolean);
  const tWords = t.split(/[\s,./\-]+/).filter(Boolean);
  // Every query word must match at least one text word
  return qWords.every(qw => tWords.some(tw => wordMatches(qw, tw)));
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

type EnrichedProduct = Product & { brandName: string; sectionName: string };

function buildMaps(brands: Brand[]) {
  const brandMap = new Map<number, string>();
  const sectionMap = new Map<number, string>();
  for (const b of brands) {
    brandMap.set(b.id, b.name);
    for (const s of b.sections) sectionMap.set(s.id, s.name);
  }
  return { brandMap, sectionMap };
}

// The uploaded flag wins; otherwise the ISO code, or the code guessed from the name.
function countryFlagSrc(c: OriginCountry): string | undefined {
  if (c.flagImageUrl) return fileUrl(c.flagImageUrl) ?? c.flagImageUrl;
  const code = c.isoCode || countryInfo(c.name)?.code;
  return code ? `https://flagcdn.com/w80/${code.toLowerCase()}.png` : undefined;
}

/** "Made in France" ("Proudly Made in Lebanon"), like the product flags say. */
function countryHeading(c: OriginCountry): string {
  const code = c.isoCode || countryInfo(c.name)?.code;
  return code ? madeInLabel({ code: code.toUpperCase(), name: c.name }) : `Made in ${c.name}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialProducts: Product[];
  initialBrands: Brand[];
  sections: SectionGroup[];
  /** "best-sellers" lists the best sellers in their homepage order. */
  collection?: string | null;
  initialCountry: OriginCountry | null;
  initialSearch: string;
}

const selectCls = "w-full appearance-none rounded-full border-2 border-[var(--sage-light)] bg-white pl-3.5 pr-8 py-1.5 text-xs text-stone-700 shadow-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 transition";

function FilterSelect({ label, value, onChange, options, allLabel }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; allLabel: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-0.5 pl-1">{label}</span>
      <span className="relative block">
        <select value={value} onChange={e => onChange(e.target.value)} className={selectCls} aria-label={label}>
          <option value="">{allLabel}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
      </span>
    </label>
  );
}

export default function ProductsContent({ initialProducts, initialBrands, sections, collection, initialCountry, initialSearch }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The URL is the source of truth for the filters, so filtered links work directly and survive a refresh.
  const brandFilter = searchParams.get("categoryId") ?? "";
  const sectionFilter = searchParams.get("sectionCode") ?? "";
  const ageFilter = searchParams.get("age") ?? "";
  const activeFilters = [brandFilter, sectionFilter, ageFilter].filter(Boolean).length;
  // Always collapsed on load, even with filters applied; only the Filters button opens it.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState(initialSearch);
  const mounted = useRef(false);

  // Enrich products with brand/section names — derived from props, no fetch needed.
  const allProducts = useMemo<EnrichedProduct[]>(() => {
    const { brandMap, sectionMap } = buildMaps(initialBrands);
    return initialProducts.map(p => ({
      ...p,
      brandName: p.categoryId ? (brandMap.get(p.categoryId) ?? "") : "",
      sectionName: p.sectionId ? (sectionMap.get(p.sectionId) ?? "") : "",
    }));
  }, [initialProducts, initialBrands]);

  // Debounce: update URL 300 ms after the user stops typing (client-side only, no server navigation)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      if (query.trim()) url.searchParams.set("search", query.trim());
      else url.searchParams.delete("search");
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Filter options come from the products themselves: only brands / sections / ages that exist.
  const brandOptions = useMemo(() => {
    const used = new Set(allProducts.map(p => p.categoryId));
    return initialBrands.filter(b => used.has(b.id)).map(b => ({ value: String(b.id), label: b.name }));
  }, [allProducts, initialBrands]);
  const sectionOptions = useMemo(() => {
    const used = new Set(allProducts.map(p => p.sectionId));
    return sections.filter(s => s.sectionIds.some(id => used.has(id))).map(s => ({ value: s.code, label: s.name }));
  }, [allProducts, sections]);
  const ageChoices = useMemo(() => ageOptions(allProducts), [allProducts]);

  const replaceParams = (edit: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(window.location.search);
    edit(params);
    const qs = params.toString();
    router.replace(`/products${qs ? `?${qs}` : ""}`, { scroll: false });
  };
  const setFilter = (key: string, value: string) =>
    replaceParams(params => { if (value) params.set(key, value); else params.delete(key); });
  const clearFilters = () =>
    replaceParams(params => ["categoryId", "sectionCode", "age"].forEach(k => params.delete(k)));

  // Client-side filters + fuzzy search (instant, no network round-trip). The order of the list is kept.
  const products = useMemo<EnrichedProduct[]>(() => {
    const group = sectionFilter ? sections.find(s => s.code === sectionFilter) : undefined;
    return allProducts.filter(p =>
      (!brandFilter || String(p.categoryId) === brandFilter) &&
      (!sectionFilter || (group ? !!p.sectionId && group.sectionIds.includes(p.sectionId) : false)) &&
      matchesAge(p, ageFilter) &&
      (!query.trim() || fuzzyMatch(query.trim(), `${p.name} ${p.brandName} ${p.sectionName}`)),
    );
  }, [allProducts, query, brandFilter, sectionFilter, ageFilter, sections]);

  const clearAll = () => {
    setQuery("");
    router.push("/products");
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--sage-light)] transition shrink-0"
          aria-label="Go to home"
        >
          <ArrowLeft className="w-4 h-4 text-stone-400" />
        </button>
        {initialCountry ? (
          <h1 className="flex items-center gap-3 text-3xl font-bold text-stone-800">
            {countryFlagSrc(initialCountry) && (
              <img src={countryFlagSrc(initialCountry)} alt="" className="w-10 h-[30px] object-cover rounded ring-1 ring-black/10 shrink-0" />
            )}
            {countryHeading(initialCountry)}
          </h1>
        ) : (
          <h1 className="text-3xl font-bold text-stone-800">{collection === "best-sellers" ? "Best Sellers" : "All Products"}</h1>
        )}
      </div>

      {/* Search bar */}
      <div className="relative max-w-2xl mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search products, sections, brands…"
          className="w-full pl-12 pr-12 py-4 rounded-full border-2 border-[var(--sage-light)] bg-white text-base shadow-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 transition"
        />
        {query && (
          <button
            onClick={clearAll}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters: brand, section, age — they combine, and live in the URL */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen(v => !v)}
            className="flex items-center gap-2 rounded-full border-2 border-[var(--sage-light)] bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm"
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {activeFilters > 0 && <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--brand)] text-white text-[10px] font-bold px-1">{activeFilters}</span>}
          </button>
          {activeFilters > 0 && (
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)] hover:underline">
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
        <div className={`${filtersOpen ? "grid" : "hidden"} grid-cols-1 sm:grid-cols-3 gap-2 mt-3 max-w-3xl`}>
          <FilterSelect label="Brand" value={brandFilter} onChange={v => setFilter("categoryId", v)} options={brandOptions} allLabel="All brands" />
          <FilterSelect label="Section" value={sectionFilter} onChange={v => setFilter("sectionCode", v)} options={sectionOptions} allLabel="All sections" />
          <FilterSelect label="Age" value={ageFilter} onChange={v => setFilter("age", v)} options={ageChoices} allLabel="All ages" />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No products found{query ? ` for "${query}"` : ""}.</p>
          {activeFilters > 0 && (
            <button type="button" onClick={clearFilters} className="mt-3 text-sm font-semibold text-[var(--brand)] hover:underline">Clear Filters</button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-stone-500 mb-4">{products.length} product{products.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
