"use client";

import ProductCard from "@/components/product-card";
import type { Product } from "@/lib/api";
import { useRef } from "react";

interface BestSellersListProps { products: Product[]; }

export default function BestSellersList({ products }: BestSellersListProps) {
  if (!products.length) return null;

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section className="max-w-7xl mx-auto px-2 sm:px-4 pt-3 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Best Sellers</h2>
          {/* <p className="text-sm text-stone-500 mt-0.5">Most loved by our customers</p> */}
        </div>
        <div className="flex items-center gap-2">
          {/* <button
            onClick={() => scroll("left")}
            className="w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center hover:bg-[var(--cream)] transition shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-stone-600" />
          </button> */}
          {/* <button
            onClick={() => scroll("right")}
            className="w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center hover:bg-[var(--cream)] transition shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-stone-600" />
          </button> */}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className="relative snap-start shrink-0 w-44 sm:w-52"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
