"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { storefrontApi, type Product } from "@/lib/api";
import ProductCard from "@/components/product-card";
import { Search } from "lucide-react";

function ProductsContent() {
  const params = useSearchParams();
  const search = params.get("search") ?? "";
  const categoryId = params.get("categoryId") ?? undefined;
  const sectionId = params.get("sectionId") ?? undefined;
  const subsectionId = params.get("subsectionId") ?? undefined;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(search);

  useEffect(() => {
    setLoading(true);
    storefrontApi.products({
      search: search || undefined,
      categoryId: categoryId ? +categoryId : undefined,
      sectionId: sectionId ? +sectionId : undefined,
      subsectionId: subsectionId ? +subsectionId : undefined,
    }).then(setProducts).finally(() => setLoading(false));
  }, [search, categoryId, sectionId, subsectionId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-stone-800 mb-6">All Products</h1>

      {/* Search bar — hidden when header search is already active */}
      {!search && (
        <form
          onSubmit={e => {
            e.preventDefault();
            const url = new URL(window.location.href);
            if (query.trim()) url.searchParams.set("search", query.trim());
            else url.searchParams.delete("search");
            window.history.pushState({}, "", url);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          className="relative max-w-lg mb-8"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2.5 rounded-full border border-stone-200 bg-white text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition"
          />
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-stone-100 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No products found{search ? ` for "${search}"` : ""}.</p>
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
