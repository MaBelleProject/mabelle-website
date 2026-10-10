import { storefrontApi } from "@/lib/api";
import OfferCard from "@/components/offer-card";

/** All running offers, highest priority first. Applied automatically at checkout. */
export default async function OffersPage() {
  const offers = await storefrontApi.offers().catch(() => []);
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-stone-800">Offers</h1>
      <p className="text-stone-500 mt-1 mb-8">Applied automatically to your cart — no code needed.</p>
      {offers.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">🎁</p>
          <p className="font-medium">No offers right now — check back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {offers.map(o => <OfferCard key={o.id} offer={o} />)}
        </div>
      )}
    </div>
  );
}
