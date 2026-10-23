"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { storefrontApi, fileUrl, type Product, type Brand, type OriginCountry } from "@/lib/api";
import { countryInfo, madeInLabel } from "@/lib/countries";
import ProductCard from "@/components/product-card";
import { ArrowLeft, Search, X } from "lucide-react";

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

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProductsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const search = params.get("search") ?? "";
  const categoryId = params.get("categoryId") ?? undefined;
  const sectionId = params.get("sectionId") ?? undefined;
  const subsectionId = params.get("subsectionId") ?? undefined;
  const sectionCode = params.get("sectionCode") ?? undefined;
  const countryId = params.get("countryId") ?? undefined;

  const [allProducts, setAllProducts] = useState<EnrichedProduct[]>([]);
  const [country, setCountry] = useState<OriginCountry | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(search);
  const mounted = useRef(false);

  // Debounce: update URL 300 ms after the user stops typing
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

  // Fetch products (with structural filters) + brands to enrich names — re-runs only when non-text filters change
  useEffect(() => {
    setLoading(true);
    Promise.all([
      storefrontApi.products({
        categoryId: categoryId ? +categoryId : undefined,
        sectionId: sectionId ? +sectionId : undefined,
        subsectionId: subsectionId ? +subsectionId : undefined,
        sectionCode,
        countryId: countryId ? +countryId : undefined,
      }),
      storefrontApi.brands(),
    ]).then(([products, brands]) => {
      const { brandMap, sectionMap } = buildMaps(brands);
      setAllProducts(products.map(p => ({
        ...p,
        brandName: p.categoryId ? (brandMap.get(p.categoryId) ?? "") : "",
        sectionName: p.sectionId ? (sectionMap.get(p.sectionId) ?? "") : "",
      })));
    }).finally(() => setLoading(false));
  }, [categoryId, sectionId, subsectionId, sectionCode, countryId]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Made in <country>" page (carousel link): the country's name and flag head the page.
  useEffect(() => {
    setCountry(null);
    if (!countryId) return;
    storefrontApi.country(+countryId).then(setCountry).catch(() => {});
  }, [countryId]);

  // Client-side fuzzy filter (runs instantly on every keystroke, no network round-trip)
  const products = query.trim()
    ? allProducts.filter(p =>
        fuzzyMatch(query.trim(), `${p.name} ${p.brandName} ${p.sectionName}`)
      )
    : allProducts;

  const clearAll = () => {
    setQuery("");
    window.history.pushState({}, "", "/products");
    window.dispatchEvent(new PopStateEvent("popstate"));
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
        {country ? (
          <h1 className="flex items-center gap-3 text-3xl font-bold text-stone-800">
            {countryFlagSrc(country) && (
              <img src={countryFlagSrc(country)} alt="" className="w-10 h-[30px] object-cover rounded ring-1 ring-black/10 shrink-0" />
            )}
            {countryHeading(country)}
          </h1>
        ) : (
          <h1 className="text-3xl font-bold text-stone-800">All Products</h1>
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

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-[var(--sage-light)] rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No products found{query ? ` for "${query}"` : ""}.</p>
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

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
