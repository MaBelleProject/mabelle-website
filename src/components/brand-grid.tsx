import RevealGrid from "@/components/reveal-grid";
import type { Brand } from "@/lib/api";
import { fileUrl } from "@/lib/api";
import Link from "next/link";

interface BrandGridProps { brands: Brand[]; }

export default function BrandGrid({ brands }: BrandGridProps) {
  if (!brands.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">Shop by Brand</h2>
      <RevealGrid className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {brands.map(brand => {
          const imgUrl = fileUrl(brand.imageUrl);
          return (
            <Link
              key={brand.id}
              href={`/brand/${brand.id}`}
              className="group flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-stone-100 hover:border-[var(--brand-light)] hover:shadow-md transition"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden bg-stone-50 flex items-center justify-center">
                {imgUrl ? (
                  <img src={imgUrl} alt={brand.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <span className="text-3xl">🏷️</span>
                )}
              </div>
              <span className="text-sm font-semibold text-stone-700 group-hover:text-[var(--brand)] text-center transition">
                {brand.name}
              </span>
            </Link>
          );
        })}
      </RevealGrid>
    </section>
  );
}
