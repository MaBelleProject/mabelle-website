import Link from "next/link";
import { fileUrl } from "@/lib/api";
import { cachedStorefrontApi } from "@/lib/cached-storefront";
import { Gift, Plus } from "lucide-react";
import BackButton from "@/components/back-button";
import { cacheLife } from "next/cache";

export default async function GiftsPage() {
  'use cache';
  cacheLife('hours');
  const gifts = await cachedStorefrontApi.gifts().catch(() => []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <BackButton />
        <h1 className="text-3xl font-bold text-stone-800">Gifts</h1>
      </div>
      <p className="text-stone-500 text-sm mb-6">Choose a gift idea or build your own from scratch — pick the treats, the box, and add a personal message.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Create Your Own Gift */}
        <Link
          href="/gifts/create"
          className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border-2 border-dashed border-[var(--sage)] hover:border-[var(--brand)]"
        >
          <div className="relative aspect-square bg-[var(--sage-light)] flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow group-hover:scale-110 transition-transform">
              <Plus className="w-7 h-7 text-[var(--brand)]" />
            </div>
          </div>
          <div className="p-3 flex flex-col gap-1 flex-1">
            <h3 className="text-sm font-semibold text-stone-800 leading-snug">Create Your Own Gift</h3>
            <p className="text-xs text-stone-500">Pick exactly what you want</p>
            <span className="mt-auto flex items-center justify-center w-full py-2 rounded-xl bg-[var(--brand)] group-hover:bg-[var(--brand-dark)] text-white text-sm font-semibold transition">
              Start from scratch
            </span>
          </div>
        </Link>

        {/* Predefined gift ideas */}
        {gifts.map((g) => {
          const img = fileUrl(g.imageUrl);
          return (
            <Link key={g.id} href={`/gifts/${g.id}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-[var(--sage-light)]">
              <div className="relative aspect-square bg-[var(--sage-light)] overflow-hidden">
                {img ? (
                  <img src={img} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300"><Gift className="w-12 h-12" /></div>
                )}
                <span className="absolute top-2 left-2 bg-[var(--brand)] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">GIFT IDEA</span>
              </div>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <h3 className="text-sm font-semibold text-stone-800 line-clamp-2 leading-snug">{g.name}</h3>
                <p className="text-xs text-stone-500 line-clamp-2">{g.items.map((s) => `${s.quantity} × ${s.product.name}`).join(" · ")}</p>
                <p className="mt-auto text-stone-800 font-bold text-base"><span className="text-xs font-normal text-stone-400">from </span>${parseFloat(g.defaultPrice).toFixed(2)}</p>
                <span className="flex items-center justify-center w-full py-2 rounded-xl bg-[var(--brand)] group-hover:bg-[var(--brand-dark)] text-white text-sm font-semibold transition">
                  Customize
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
