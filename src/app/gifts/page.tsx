import Link from "next/link";
import { storefrontApi, fileUrl } from "@/lib/api";
import { Gift } from "lucide-react";

export default async function GiftsPage() {
  const gifts = await storefrontApi.gifts().catch(() => []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-stone-800 mb-2">Gifts</h1>
      <p className="text-stone-500 text-sm mb-6">Pick a gift box, make it yours: choose the treats, the wrapping, and add a personal message.</p>
      {gifts.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">🎁</p>
          <p className="font-medium">No gift boxes right now — check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {gifts.map(g => {
            const img = fileUrl(g.imageUrl);
            const customizable = g.items.some(s => s.isCustomizable);
            return (
              <Link key={g.id} href={`/gifts/${g.id}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-stone-100">
                <div className="relative aspect-square bg-stone-50 overflow-hidden">
                  {img ? (
                    <img src={img} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300"><Gift className="w-12 h-12" /></div>
                  )}
                  <span className="absolute top-2 left-2 bg-[var(--brand)] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">GIFT</span>
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <h3 className="text-sm font-semibold text-stone-800 line-clamp-2 leading-snug">{g.name}</h3>
                  <p className="text-xs text-stone-500 line-clamp-2">{g.items.map(s => `${s.quantity} × ${s.product.name}`).join(" · ")}</p>
                  <p className="mt-auto text-stone-800 font-bold text-base"><span className="text-xs font-normal text-stone-400">from </span>${parseFloat(g.defaultPrice).toFixed(2)}</p>
                  <span className="flex items-center justify-center w-full py-2 rounded-xl bg-[var(--brand)] group-hover:bg-[var(--brand-dark)] text-white text-sm font-semibold transition">
                    {customizable ? "Customize" : "View gift"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
