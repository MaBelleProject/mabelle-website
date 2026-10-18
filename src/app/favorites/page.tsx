"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useCustomer } from "@/context/customer-context";
import { useFavorites } from "@/context/favorites-context";
import { storefrontApi, type Product } from "@/lib/api";
import ProductCard from "@/components/product-card";

export default function FavoritesPage() {
  const { customer } = useCustomer();
  const router = useRouter();
  const { favorites, loading: favLoading } = useFavorites();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) { router.replace("/login"); return; }
    storefrontApi.products()
      .then(setAllProducts)
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));
  }, [customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!customer) return null;

  const favoriteProducts = allProducts.filter(p => favorites.has(p.id));
  const isLoading = loading || favLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-16">
      <h1 className="text-2xl font-bold text-stone-800 mb-6">My Favorites</h1>

      {favoriteProducts.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">No favorites yet</p>
          <p className="text-stone-400 text-sm mt-1">Tap the heart on any product to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {favoriteProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
