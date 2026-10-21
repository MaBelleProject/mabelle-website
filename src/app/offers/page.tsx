import { cachedStorefrontApi } from "@/lib/cached-storefront";
import BackButton from "@/components/back-button";
import { cacheLife } from "next/cache";
import OffersPageClient from "./offers-client";

/** All running offers, highest priority first. Applied automatically at checkout. */
export default async function OffersPage() {
  'use cache';
  cacheLife('minutes');
  const offers = await cachedStorefrontApi.offers().catch(() => []);
  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-8">
      <div className="flex items-center gap-3 mb-1">
        <BackButton />
        <h1 className="text-3xl font-bold text-stone-800">Offers</h1>
      </div>
      <p className="text-stone-500 mt-1 mb-8">Applied automatically to your cart — no code needed.</p>
      {offers.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">🎁</p>
          <p className="font-medium">No offers right now — check back soon!</p>
        </div>
      ) : (
        <OffersPageClient offers={offers} />
      )}
    </div>
  );
}
