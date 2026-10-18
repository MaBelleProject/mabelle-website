"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCustomer } from "@/context/customer-context";
import { storefrontApi, type Product } from "@/lib/api";
import ProductCard from "@/components/product-card";

export default function OrderAgainSection() {
  const { customer } = useCustomer();
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customer) {
      setProducts([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    storefrontApi.customerOrderAgain(customer.id)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoaded(true));
  }, [customer?.id]);

  if (!loaded || !customer || products.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Order Again</h2>
          <p className="text-sm text-stone-500 mt-0.5">Products you&apos;ve ordered before</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center hover:bg-[var(--cream)] transition shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-stone-600" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center hover:bg-[var(--cream)] transition shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map(product => (
          <div key={product.id} className="snap-start shrink-0 w-44 sm:w-52">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
