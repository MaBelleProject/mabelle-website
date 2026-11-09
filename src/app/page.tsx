import BestSellersList from "@/components/best-sellers-list";
import BrandGrid from "@/components/brand-grid";
import BundleCard from "@/components/bundle-card";
import Carousel from "@/components/carousel";
import HorizontalRow from "@/components/horizontal-row";
import HomeOffersSection from "@/components/home-offers-section";
import MobileGreeting from "@/components/mobile-greeting";
import OffersNote from "@/components/offers-note";
import OrderAgainSection from "@/components/order-again-section";
import ProductCard from "@/components/product-card";
import QuickInfoButtons from "@/components/quick-info-buttons";
import SectionGrid from "@/components/section-grid";
import ShopByAge from "@/components/shop-by-age";
import ViewAllLink from "@/components/view-all-link";
import { cachedStorefrontApi } from "@/lib/cached-storefront";
import { brandCountries } from "@/lib/countries";
import { Gift } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";

/** Products shown in the homepage "All Products" preview. */
const HOME_PRODUCTS = 8;

export default async function HomePage() {
  'use cache';
  cacheLife('minutes');
  const [slides, brands, sections, offers, products, bundles, gifts, bestSellers, settings] = await Promise.all([
    cachedStorefrontApi.carousel().catch(() => []),
    cachedStorefrontApi.brands().catch(() => []),
    cachedStorefrontApi.sections().catch(() => []),
    cachedStorefrontApi.offers().catch(() => []),
    cachedStorefrontApi.products().catch(() => []),
    cachedStorefrontApi.bundles().catch(() => []),
    cachedStorefrontApi.gifts().catch(() => []),
    cachedStorefrontApi.bestSellers().catch(() => []),
    cachedStorefrontApi.settings().catch(() => null),
  ]);

  const featured = products.slice(0, HOME_PRODUCTS);

  return (
    <div className="pb-16">
      {/* 1. Carousel (with the "Hello, Name" line above it on mobile) */}
      <MobileGreeting />
      {slides.length > 0 && (
        <section className="max-w-7xl mx-auto px-2 sm:px-4 pt-3 sm:pt-6 pb-4">
          <Carousel slides={slides} sections={sections} />
        </section>
      )}

      {/* 2. Four quick information buttons */}
      <QuickInfoButtons
        deliveryCharge={settings?.deliveryCharge}
        phoneNumber={settings?.phoneNumber}
        hasOffers={offers.length > 0}
      />

      {/* 3. Order Again (logged-in customers only, fetches its own data) */}
      <OrderAgainSection />

      {/* 4. Shop by Age */}
      <ShopByAge products={products} />

      {/* 5. Shop by Category (one tile per section code, across brands) */}
      <div id="sections-area">
        <SectionGrid sections={sections} />
      </div>

      {/* 6. Best Sellers */}
      <BestSellersList products={bestSellers} />

      {/* 7. Offers (highest priority first) */}
      {offers.length > 0 && (
        <section id="offers-area" className="max-w-7xl mx-auto px-2 sm:px-4 pt-3 pb-6 scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-stone-800">Offers</h2>
            <ViewAllLink href="/offers" />
          </div>
          <OffersNote />
          <HomeOffersSection offers={offers} />
        </section>
      )}

      {/* 8. Bundles */}
      <HorizontalRow title="Bundles" viewAllHref="/bundles">
        {bundles.map(b => <BundleCard key={b.id} bundle={b} />)}
      </HorizontalRow>

      {/* 9. Shop by Brand */}
      <div id="brands-area">
        <BrandGrid brands={brands} countries={brandCountries(products)} />
      </div>

      {/* 10. All Products (first 8, in the same order as the full list) */}
      <HorizontalRow title="All Products" viewAllHref="/products">
        {featured.map(p => <ProductCard key={p.id} product={p} compact />)}
      </HorizontalRow>

      {/* 11. Customize Gifts */}
      {gifts.length > 0 && (
        <section className="max-w-7xl mx-auto px-2 sm:px-4 pt-3 pb-6">
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
