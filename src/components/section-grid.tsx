import RevealGrid from "@/components/reveal-grid";
import type { Brand } from "@/lib/api";
import { fileUrl } from "@/lib/api";
import Link from "next/link";

interface SectionGridProps { brands: Brand[]; }

export default function SectionGrid({ brands }: SectionGridProps) {
  const sections = brands.flatMap(b => b.sections.map(s => ({ ...s, brandId: b.id })));
  if (!sections.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">Shop by Section</h2>
      <RevealGrid className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sections.map(sec => {
          const imgUrl = fileUrl(sec.imageUrl);
          return (
            <Link
              key={sec.id}
              href={`/brand/${sec.brandId}?section=${sec.id}`}
              className="group flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-stone-100 hover:border-[var(--brand-light)] hover:shadow-md transition"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden bg-stone-50 flex items-center justify-center">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={sec.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <span className="text-3xl">🍬</span>
                )}
              </div>
              <span className="text-sm font-semibold text-stone-700 group-hover:text-[var(--brand)] text-center transition">
                {sec.name}
              </span>
            </Link>
          );
        })}
      </RevealGrid>
    </section>
  );
}
