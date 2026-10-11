"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { storefrontApi, type Product, type Brand } from "@/lib/api";
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

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProductsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const search = params.get("search") ?? "";
  const categoryId = params.get("categoryId") ?? undefined;
  const sectionId = params.get("sectionId") ?? undefined;
  const subsectionId = params.get("subsectionId") ?? undefined;
  const sectionCode = params.get("sectionCode") ?? undefined;

  const [allProducts, setAllProducts] = useState<EnrichedProduct[]>([]);
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
  }, [categoryId, sectionId, subsectionId, sectionCode]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--sage-light)] transition shrink-0"
          aria-label="Go to home"
        >
          <ArrowLeft className="w-4 h-4 text-stone-400" />
        </button>
        <h1 className="text-3xl font-bold text-stone-800">All Products</h1>
      </div>

      {/* Search bar */}
      <div className="relative max-w-lg mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search products, sections, brands…"
          className="w-full pl-9 pr-9 py-2.5 rounded-full border border-[var(--sage-light)] bg-white text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition"
        />
        {query && (
          <button
            onClick={clearAll}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
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
