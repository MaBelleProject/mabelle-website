import RevealGrid from "@/components/reveal-grid";
import type { SectionGroup } from "@/lib/api";
import { fileUrl } from "@/lib/api";
import { sectionHref } from "@/lib/sections";
import Link from "next/link";

interface SectionGridProps { sections: SectionGroup[]; }

/** One tile per section code — e.g. "Lollipops" shows the lollipops of every brand. */
export default function SectionGrid({ sections }: SectionGridProps) {
  if (!sections.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">Shop by Section</h2>
      <RevealGrid className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {sections.map(sec => {
          const imgUrl = fileUrl(sec.imageUrl);
          return (
            <Link
              key={sec.code}
              href={sectionHref(sec.code)}
              className="group relative overflow-hidden rounded-2xl bg-[var(--sage-light)] aspect-square hover:shadow-md transition"
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={sec.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-4xl">🍬</div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2">
                <span className="text-base font-bold text-white text-center block">
                  {sec.name}
                </span>
              </div>
            </Link>
          );
        })}
      </RevealGrid>
    </section>
  );
}
