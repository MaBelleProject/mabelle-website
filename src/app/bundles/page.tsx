import { storefrontApi } from "@/lib/api";
import BundleCard from "@/components/bundle-card";

export default async function BundlesPage() {
  const bundles = await storefrontApi.bundles().catch(() => []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-stone-800 mb-2">Bundles</h1>
      <p className="text-stone-500 text-sm mb-6">Our favourite treats, packed together for less.</p>
      {bundles.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">🎁</p>
          <p className="font-medium">No bundles right now — check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {bundles.map(b => <BundleCard key={b.id} bundle={b} />)}
        </div>
      )}
    </div>
  );
}
