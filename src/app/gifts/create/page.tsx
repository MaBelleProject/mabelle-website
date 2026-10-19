import Link from "next/link";
import { cachedStorefrontApi } from "@/lib/cached-storefront";
import GiftCustomizer from "../[id]/gift-customizer";
import BackButton from "@/components/back-button";
import { cacheLife } from "next/cache";

export default async function CreateGiftPage() {
  'use cache';
  cacheLife('minutes');
  const [packagings, allProducts] = await Promise.all([
    cachedStorefrontApi.giftPackaging().catch(() => []),
    cachedStorefrontApi.products().catch(() => []),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <nav className="text-xs text-stone-400 mb-6 flex items-center gap-1.5">
        <BackButton />
        <Link href="/" className="hover:text-[var(--brand)]">Home</Link>
        <span>/</span>
        <Link href="/gifts" className="hover:text-[var(--brand)]">Gifts</Link>
        <span>/</span>
        <span className="text-stone-600">Create Your Own</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--sage-light)] flex items-center justify-center">
            <span className="text-8xl">🎁</span>
          </div>
          <div className="rounded-2xl bg-[var(--sage-light)] p-4 text-sm text-stone-600 space-y-1.5">
            <p className="font-semibold text-stone-700">How it works</p>
            <p>1. Add any products you love</p>
            <p>2. Choose a gift box (optional)</p>
            <p>3. Add a personal message</p>
            <p>4. We pack and ship it beautifully</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800">Create Your Own Gift</h1>
          <p className="text-stone-500 text-sm">Pick exactly what you want — no restrictions, your perfect gift.</p>
          <GiftCustomizer gift={null} packagings={packagings} allProducts={allProducts} />
        </div>
      </div>
    </div>
  );
}
