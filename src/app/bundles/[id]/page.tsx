import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fileUrl } from "@/lib/api";
import { cachedStorefrontApi } from "@/lib/cached-storefront";
import { BundleCartControlWithSwaps } from "@/components/bundle-card";
import { Layers } from "lucide-react";
import BackButton from "@/components/back-button";

interface PageProps { params: Promise<{ id: string }> }

export default function BundlePage(props: PageProps) {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-8 animate-pulse">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-square rounded-2xl bg-stone-100" />
          <div className="flex flex-col gap-4">
            <div className="h-8 w-3/4 bg-stone-100 rounded-lg" />
            <div className="h-10 w-1/3 bg-stone-100 rounded-lg" />
            <div className="h-24 bg-stone-100 rounded-lg" />
          </div>
        </div>
      </div>
    }>
      <BundleContent {...props} />
    </Suspense>
  );
}

async function BundleContent({ params }: PageProps) {
  const { id } = await params;
  const bundle = await cachedStorefrontApi.bundle(parseInt(id)).catch(() => null);
  if (!bundle) notFound();

  const imgUrl = fileUrl(bundle.imageUrl);
  const price = parseFloat(bundle.price);
  const value = parseFloat(bundle.itemsValue);
  const hasSwaps = bundle.items.some((i) => i.replacements.length > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <nav className="text-xs text-stone-400 mb-6 flex flex-wrap items-center gap-1.5">
        <BackButton />
        <Link href="/" className="hover:text-[var(--brand)] shrink-0">Home</Link>
        <span className="shrink-0">/</span>
        <Link href="/bundles" className="hover:text-[var(--brand)] shrink-0">Bundles</Link>
        <span className="shrink-0">/</span>
        <span className="text-stone-600 min-w-0 break-words">{bundle.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--sage-light)] self-start min-w-0 w-full md:sticky md:top-24">
          {imgUrl ? (
            <Image src={imgUrl} alt={bundle.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300"><Layers className="w-16 h-16 sm:w-24 sm:h-24" /></div>
          )}
          <span className="absolute top-3 left-3 bg-[var(--brand)] text-white text-xs font-bold px-3 py-1 rounded-full">BUNDLE</span>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-800">{bundle.name}</h1>

          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl font-bold text-stone-800">${price.toFixed(2)}</span>
            {value > price && (
              <>
                <span className="text-base sm:text-lg text-stone-400 line-through">${value.toFixed(2)}</span>
                <span className="text-sm bg-[var(--sage-light)] text-[var(--sage)] font-semibold px-2 py-0.5 rounded-full">Save ${(value - price).toFixed(2)}</span>
              </>
            )}
          </div>

          {bundle.available <= 0 && (
            <p className="text-sm font-medium text-stone-500 bg-[var(--sage-light)] rounded-full px-3 py-1 w-fit">Out of stock</p>
          )}

          {bundle.description && <p className="text-stone-600 text-sm leading-relaxed">{bundle.description}</p>}

          {hasSwaps && (
            <p className="text-xs text-[var(--brand)] bg-[var(--sage-light)] rounded-full px-3 py-1.5 w-fit font-medium">
              You can swap some products with alternatives below
            </p>
          )}

          <div className="mt-2">
            <BundleCartControlWithSwaps bundle={bundle} />
          </div>
        </div>
      </div>
    </div>
  );
}
