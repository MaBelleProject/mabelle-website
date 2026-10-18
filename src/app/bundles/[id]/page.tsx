import { notFound } from "next/navigation";
import Link from "next/link";
import { storefrontApi, fileUrl } from "@/lib/api";
import { BundleCartControlWithSwaps } from "@/components/bundle-card";
import { Layers } from "lucide-react";
import BackButton from "@/components/back-button";

interface PageProps { params: Promise<{ id: string }> }

export default async function BundlePage({ params }: PageProps) {
  const { id } = await params;
  const bundle = await storefrontApi.bundle(parseInt(id)).catch(() => null);
  if (!bundle) notFound();

  const imgUrl = fileUrl(bundle.imageUrl);
  const price = parseFloat(bundle.price);
  const value = parseFloat(bundle.itemsValue);
  const hasSwaps = bundle.items.some((i) => i.replacements.length > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <nav className="text-xs text-stone-400 mb-6 flex items-center gap-1.5">
        <BackButton />
        <Link href="/" className="hover:text-[var(--brand)]">Home</Link>
        <span>/</span>
        <Link href="/bundles" className="hover:text-[var(--brand)]">Bundles</Link>
        <span>/</span>
        <span className="text-stone-600">{bundle.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--sage-light)]">
          {imgUrl ? (
            <img src={imgUrl} alt={bundle.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300"><Layers className="w-24 h-24" /></div>
          )}
          <span className="absolute top-3 left-3 bg-[var(--brand)] text-white text-xs font-bold px-3 py-1 rounded-full">BUNDLE</span>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800">{bundle.name}</h1>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-stone-800">${price.toFixed(2)}</span>
            {value > price && (
              <>
                <span className="text-lg text-stone-400 line-through">${value.toFixed(2)}</span>
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
