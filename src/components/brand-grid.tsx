"use client";

import type { Brand } from "@/lib/api";
import { fileUrl } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import CountryFlag from "./country-flag";

/** `countries` maps brand id → its "Made In" country. */
interface BrandGridProps { brands: Brand[]; countries?: Record<number, string>; }

export default function BrandGrid({ brands, countries = {} }: BrandGridProps) {
  if (!brands.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-2 sm:px-4 pt-3 pb-6">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">Meet Our Brands</h2>
      <div className="relative">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {brands.map(brand => {
            const imgUrl = fileUrl(brand.imageUrl);
            return (
              <Link
                key={brand.id}
                href={`/brand/${brand.id}`}
                onClick={() => sessionStorage.setItem("homeScrollTo", "brands-area")}
                className="group relative shrink-0 w-[calc(33%-6px)] sm:w-[calc(20%-6px)] aspect-square overflow-hidden rounded-2xl bg-[var(--sage-light)] hover:shadow-md transition"
              >
                {imgUrl ? (
                  <Image
                    src={imgUrl}
                    alt={brand.name}
                    fill
                    sizes="(max-width: 640px) 33vw, 20vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">🏷️</div>
                )}
                <CountryFlag
                  country={countries[brand.id]}
                  className="absolute bottom-1.5 right-1.5 z-10 w-4 h-3 sm:w-5 sm:h-[15px] shadow-sm"
                />
              </Link>
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
