import { ageOptions, KIDS_AGE } from "@/lib/age";
import type { Product } from "@/lib/api";
import Link from "next/link";
import ViewAllLink from "./view-all-link";

/** One tile per age found in the products (numeric order); "Kids" covers products without a specific age. */
export default function ShopByAge({ products }: { products: Product[] }) {
  const options = ageOptions(products);
  if (!options.length) return null;
  return (
    <section id="age-area" className="max-w-7xl mx-auto px-2 sm:px-4 pt-3 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-stone-800">Shop by Age</h2>
        <ViewAllLink href="/products" />
      </div>
      <div className="relative">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {options.map(o => {
            const isKids = o.value === KIDS_AGE;
            return (
              <Link
                key={o.value}
                href={`/products?age=${o.value}`}
                className="shrink-0 min-w-[84px] sm:min-w-[104px] flex flex-col items-center justify-center rounded-2xl bg-[var(--cream)] border border-[var(--brand-light)] px-4 py-3 text-center hover:shadow-md hover:border-[var(--brand)] transition"
              >
                {isKids ? (
                  <span className="text-lg font-bold text-[var(--brand)] leading-tight">Kids</span>
                ) : (
                  <>
                    <span className="text-xl font-bold text-[var(--brand)] leading-tight">{o.value}+</span>
                    <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">Months</span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
