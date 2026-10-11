import { notFound } from "next/navigation";
import Link from "next/link";
import { storefrontApi, fileUrl } from "@/lib/api";
import { sameSectionCode, sectionHref } from "@/lib/sections";
import ProductCard from "@/components/product-card";
import BackButton from "@/components/back-button";

interface PageProps { params: Promise<{ code: string }>; searchParams: Promise<{ brand?: string }> }

const decode = (v: string) => { try { return decodeURIComponent(v); } catch { return v; } };

/** Every product of a section code, whatever its brand; optional brand chips narrow it down. */
export default async function SectionPage({ params, searchParams }: PageProps) {
  const code = decode((await params).code);
  const { brand: brandParam } = await searchParams;

  const [sections, products] = await Promise.all([
    storefrontApi.sections().catch(() => []),
    storefrontApi.products({ sectionCode: code }).catch(() => []),
  ]);
  const section = sections.find(s => sameSectionCode(s.code, code));
  if (!section) notFound();

  const brandId = brandParam ? parseInt(brandParam) : undefined;
  const shown = brandId ? products.filter(p => p.categoryId === brandId) : products;
  const imgUrl = fileUrl(section.imageUrl);
  const chip = (active: boolean) => `px-4 py-1.5 rounded-full text-sm font-medium transition border ${
    active
      ? "bg-[var(--brand)] text-white border-[var(--brand)]"
      : "bg-white text-stone-600 border-[var(--sage-light)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
  }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <BackButton />
        {imgUrl && (
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--sage-light)] shrink-0">
            <img src={imgUrl} alt={section.name} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-stone-800">{section.name}</h1>
      </div>

      {/* Brand filter — only when the section spans several brands */}
      {section.brands.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link href={sectionHref(section.code)} className={chip(!brandId)}>All Brands</Link>
          {section.brands.map(b => (
            <Link key={b.id} href={`${sectionHref(section.code)}?brand=${b.id}`} className={chip(brandId === b.id)}>
              {b.name}
            </Link>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-medium">No products found in this section.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-stone-500 mb-4">{shown.length} product{shown.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {shown.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
