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
      <RevealGrid className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {brands.map(brand => {
          const imgUrl = fileUrl(brand.imageUrl);
          return (
            <Link
              key={brand.id}
              href={`/brand/${brand.id}`}
              className="group relative overflow-hidden rounded-2xl bg-[var(--sage-light)] aspect-square hover:shadow-md transition"
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={brand.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-4xl">🏷️</div>
              )}
            </Link>
          );
        })}
      </RevealGrid>
    </section>
  );
}
