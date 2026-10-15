import type { Brand } from "@/lib/api";
import { fileUrl } from "@/lib/api";
import Link from "next/link";

interface BrandGridProps { brands: Brand[]; }

export default function BrandGrid({ brands }: BrandGridProps) {
  if (!brands.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">Meet Our Brands</h2>
      <div className="relative">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {brands.map(brand => {
            const imgUrl = fileUrl(brand.imageUrl);
            return (
              <Link
                key={brand.id}
                href={`/brand/${brand.id}`}
                className="group relative shrink-0 w-[calc(25%-6px)] sm:w-[calc(20%-6px)] aspect-square overflow-hidden rounded-2xl bg-[var(--sage-light)] hover:shadow-md transition"
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
        </div>
        <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
