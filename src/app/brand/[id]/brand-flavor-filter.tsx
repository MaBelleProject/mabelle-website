"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Section, Product } from "@/lib/api";
import ProductCard from "@/components/product-card";

interface Props {
  sections: Section[];
  products: Product[];
}

const chip = (active: boolean) =>
  `px-4 py-1.5 rounded-full text-sm font-medium transition border ${
    active
      ? "bg-[var(--brand)] text-white border-[var(--brand)]"
      : "bg-white text-stone-600 border-[var(--sage-light)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
  }`;

export function BrandFlavorFilter({ sections, products }: Props) {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const s = searchParams.get("section");
    return s ? +s : null;
  });

  const shown = selectedId ? products.filter(p => p.sectionId === selectedId) : products;

  return (
    <>
      {sections.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setSelectedId(null)} className={chip(!selectedId)}>
            All Flavors
          </button>
          {sections.map(sec => (
            <button key={sec.id} onClick={() => setSelectedId(sec.id)} className={chip(selectedId === sec.id)}>
              {sec.name}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-medium">No products found in this category.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-stone-500 mb-4">{shown.length} product{shown.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {shown.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </>
  );
}
