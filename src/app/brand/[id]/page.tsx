import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fileUrl } from "@/lib/api";
import Image from "next/image";
import { cachedStorefrontApi } from "@/lib/cached-storefront";
import BackButton from "@/components/back-button";
import { BrandFlavorFilter } from "./brand-flavor-filter";

interface PageProps { params: Promise<{ id: string }> }

export default function BrandPage(props: PageProps) {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-stone-100 shrink-0" />
          <div className="h-8 w-48 bg-stone-100 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-stone-100 aspect-square" />
          ))}
        </div>
      </div>
    }>
      <BrandContent {...props} />
    </Suspense>
  );
}

async function BrandContent({ params }: PageProps) {
  const { id } = await params;
  const brandId = parseInt(id);

  const [brands, products] = await Promise.all([
    cachedStorefrontApi.brands().catch(() => []),
    cachedStorefrontApi.products({ categoryId: brandId }).catch(() => []),
  ]);

  const brand = brands.find(b => b.id === brandId);
  if (!brand) notFound();

  const imgUrl = fileUrl(brand.imageUrl);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <BackButton href="/" scrollTarget="brands-area" />
        {imgUrl && (
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[var(--sage-light)] shrink-0">
            <Image src={imgUrl} alt={brand.name} fill sizes="64px" className="object-cover" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-stone-800">{brand.name}</h1>
      </div>

      <BrandFlavorFilter sections={brand.sections} products={products} />
    </div>
  );
}
