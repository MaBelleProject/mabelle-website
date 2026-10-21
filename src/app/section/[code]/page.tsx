import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fileUrl } from "@/lib/api";
import { cachedStorefrontApi } from "@/lib/cached-storefront";
import { sameSectionCode } from "@/lib/sections";
import BackButton from "@/components/back-button";
import { SectionBrandFilter } from "./section-brand-filter";

interface PageProps { params: Promise<{ code: string }> }

const decode = (v: string) => { try { return decodeURIComponent(v); } catch { return v; } };

export default function SectionPage(props: PageProps) {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8 animate-pulse">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-xl bg-stone-100 shrink-0" />
          <div className="h-8 w-48 bg-stone-100 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-stone-100 aspect-square" />
          ))}
        </div>
      </div>
    }>
      <SectionContent {...props} />
    </Suspense>
  );
}

async function SectionContent({ params }: PageProps) {
  const code = decode((await params).code);

  const [sections, products] = await Promise.all([
    cachedStorefrontApi.sections().catch(() => []),
    cachedStorefrontApi.products({ sectionCode: code }).catch(() => []),
  ]);

  const section = sections.find(s => sameSectionCode(s.code, code));
  if (!section) notFound();

  const imgUrl = fileUrl(section.imageUrl);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <BackButton href="/" scrollTarget="sections-area" />
        {imgUrl && (
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--sage-light)] shrink-0">
            <img src={imgUrl} alt={section.name} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-stone-800">{section.name}</h1>
      </div>

      <SectionBrandFilter brands={section.brands} products={products} />
    </div>
  );
}
