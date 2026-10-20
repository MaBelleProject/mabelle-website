import BestSellersList from "@/components/best-sellers-list";
import BrandGrid from "@/components/brand-grid";
import BundleCard from "@/components/bundle-card";
import Carousel from "@/components/carousel";
import HomeOffersSection from "@/components/home-offers-section";
import OrderAgainSection from "@/components/order-again-section";
import ProductCard from "@/components/product-card";
import SectionGrid from "@/components/section-grid";
import { cachedStorefrontApi } from "@/lib/cached-storefront";
import { brandCountries } from "@/lib/countries";
import { Gift } from "lucide-react";
import Link from "next/link";
import { cacheLife } from "next/cache";

export default async function HomePage() {
  'use cache';
  cacheLife('minutes');
  const [slides, brands, sections, offers, products, bundles, gifts, bestSellers] = await Promise.all([
    cachedStorefrontApi.carousel().catch(() => []),
    cachedStorefrontApi.brands().catch(() => []),
    cachedStorefrontApi.sections().catch(() => []),
    cachedStorefrontApi.offers().catch(() => []),
    cachedStorefrontApi.products().catch(() => []),
    cachedStorefrontApi.bundles().catch(() => []),
    cachedStorefrontApi.gifts().catch(() => []),
    cachedStorefrontApi.bestSellers().catch(() => []),
  ]);

  const featured = products.slice(0, 10);

  return (
    <div className="pb-16">
      {/* Carousel */}
      {slides.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-8">
          <Carousel slides={slides} sections={sections} />
        </section>
      )}

      {/* Order Again (logged-in customers only, fetches its own data) */}
      <OrderAgainSection />

      {/* Best Sellers */}
      <BestSellersList products={bestSellers} />

      {/* Offers (highest priority first) */}
      {offers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-stone-800">Offers</h2>
            {/* <Link href="/offers" className="text-sm text-[var(--brand)] font-semibold hover:underline">View all offers →</Link> */}
          </div>
          <HomeOffersSection offers={offers} />
        </section>
      )}

      {/* Sections (one per section code, across brands) */}
      <div id="sections-area">
        <SectionGrid sections={sections} />
      </div>

      {/* Brands */}
      <div id="brands-area">
        <BrandGrid brands={brands} countries={brandCountries(products)} />
      </div>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-stone-800">Our Products</h2>
            <a href="/products" className="text-sm text-[var(--brand)] font-semibold hover:underline">
              View all products →
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-6 text-center">
            <a href="/products" className="inline-block px-8 py-3 rounded-full border-2 border-[var(--brand)] text-[var(--brand)] font-semibold hover:bg-[var(--brand)] hover:text-white transition">
              View all products
            </a>
          </div>
        </section>
      )}

      {/* Bundles */}
      {bundles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-stone-800">Bundles</h2>
            <Link href="/bundles" className="text-sm text-[var(--brand)] font-semibold hover:underline">View all bundles →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bundles.slice(0, 5).map(b => <BundleCard key={b.id} bundle={b} />)}
          </div>
        </section>
      )}

      {/* Gifts */}
      {gifts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/gifts" className="flex items-center gap-4 rounded-2xl bg-[var(--cream)] border border-[var(--brand-light)] px-6 py-5 hover:shadow-md transition">
            <span className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0"><Gift className="w-6 h-6 text-[var(--brand)]" /></span>
            <span className="flex-1">
              <span className="block text-lg font-bold text-stone-800">Make it a gift</span>
              <span className="block text-sm text-stone-500">{gifts.length} gift box{gifts.length !== 1 ? "es" : ""} — choose the treats, the wrapping and add your message.</span>
            </span>
            <span className="text-sm text-[var(--brand)] font-semibold">Customize →</span>
          </Link>
        </section>
      )}

      {featured.length === 0 && slides.length === 0 && brands.length === 0 && bestSellers.length === 0 && (
        <div className="text-center py-24 text-stone-400">
          <p className="text-5xl mb-4">🍬</p>
          <p className="text-lg font-medium">Coming soon — deliciousness in progress!</p>
        </div>
      )}
    </div>
  );
}
