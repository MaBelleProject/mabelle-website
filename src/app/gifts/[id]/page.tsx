import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fileUrl } from "@/lib/api";
import { cachedStorefrontApi } from "@/lib/cached-storefront";
import GiftCustomizer from "./gift-customizer";
import { Gift } from "lucide-react";
import BackButton from "@/components/back-button";

interface PageProps { params: Promise<{ id: string }> }

export default function GiftPage(props: PageProps) {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-8 animate-pulse">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-square rounded-2xl bg-stone-100" />
          <div className="flex flex-col gap-4">
            <div className="h-8 w-3/4 bg-stone-100 rounded-lg" />
            <div className="h-24 bg-stone-100 rounded-lg" />
          </div>
        </div>
      </div>
    }>
      <GiftContent {...props} />
    </Suspense>
  );
}

async function GiftContent({ params }: PageProps) {
  const { id } = await params;
  const [gift, packagings, allProducts, giftCards] = await Promise.all([
    cachedStorefrontApi.gift(parseInt(id)).catch(() => null),
    cachedStorefrontApi.giftPackaging().catch(() => []),
    cachedStorefrontApi.products().catch(() => []),
    cachedStorefrontApi.giftCards().catch(() => []),
  ]);
  if (!gift) notFound();
  const imgUrl = fileUrl(gift.imageUrl);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <nav className="text-xs text-stone-400 mb-6 flex flex-wrap items-center gap-1.5">
        <BackButton />
        <Link href="/" className="hover:text-[var(--brand)] shrink-0">Home</Link>
        <span className="shrink-0">/</span>
        <Link href="/gifts" className="hover:text-[var(--brand)] shrink-0">Gifts</Link>
        <span className="shrink-0">/</span>
        <span className="text-stone-600 min-w-0 break-words">{gift.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--sage-light)] self-start min-w-0 w-full md:sticky md:top-24">
          {imgUrl ? (
            <Image src={imgUrl} alt={gift.name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300"><Gift className="w-16 h-16 sm:w-24 sm:h-24" /></div>
          )}
        </div>
        <div className="flex flex-col gap-4 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-800">{gift.name}</h1>
          {gift.description && <p className="text-stone-600 text-sm leading-relaxed">{gift.description}</p>}
          <GiftCustomizer gift={gift} packagings={packagings} allProducts={allProducts} giftCardImage={fileUrl(giftCards[0]?.imageUrl)} />
        </div>
      </div>
    </div>
  );
}
