import { notFound } from "next/navigation";
import { storefrontApi } from "@/lib/api";
import ProductCard from "@/components/product-card";
import { fileUrl } from "@/lib/api";
import Link from "next/link";

interface PageProps { params: Promise<{ id: string }>; searchParams: Promise<{ section?: string }> }

export default async function BrandPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { section: sectionIdStr } = await searchParams;
  const brandId = parseInt(id);

  const [brands, products] = await Promise.all([
    storefrontApi.brands().catch(() => []),
    storefrontApi.products({
      categoryId: brandId,
      sectionId: sectionIdStr ? +sectionIdStr : undefined,
    }).catch(() => []),
  ]);

  const brand = brands.find(b => b.id === brandId);
  if (!brand) notFound();

  const selectedSection = sectionIdStr ? brand.sections.find(s => s.id === +sectionIdStr) : null;
  const imgUrl = fileUrl(brand.imageUrl);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Brand header */}
      <div className="flex items-center gap-4 mb-8">
        {imgUrl && (
          <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-50 shrink-0">
            <img src={imgUrl} alt={brand.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-stone-800">{brand.name}</h1>
          {selectedSection && <p className="text-stone-500 mt-0.5">Flavor: {selectedSection.name}</p>}
        </div>
      </div>

      {/* Flavor filter tabs */}
      {brand.sections.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href={`/brand/${brandId}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
              !sectionIdStr
                ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                : "bg-white text-stone-600 border-stone-200 hover:border-[var(--brand)] hover:text-[var(--brand)]"
            }`}
          >
            All Flavors
          </Link>
          {brand.sections.map(sec => (
            <Link
              key={sec.id}
              href={`/brand/${brandId}?section=${sec.id}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                sectionIdStr === String(sec.id)
                  ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                  : "bg-white text-stone-600 border-stone-200 hover:border-[var(--brand)] hover:text-[var(--brand)]"
              }`}
            >
              {sec.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-medium">No products found in this category.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-stone-500 mb-4">{products.length} product{products.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
