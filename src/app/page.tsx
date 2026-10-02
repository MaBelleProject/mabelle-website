import { storefrontApi } from "@/lib/api";
import Carousel from "@/components/carousel";
import SectionGrid from "@/components/section-grid";
import BrandGrid from "@/components/brand-grid";
import ProductCard from "@/components/product-card";
import RevealGrid from "@/components/reveal-grid";

export default async function HomePage() {
  const [slides, brands, products] = await Promise.all([
    storefrontApi.carousel().catch(() => []),
    storefrontApi.brands().catch(() => []),
    storefrontApi.products().catch(() => []),
  ]);

  const featured = products.slice(0, 12);

  return (
    <div className="pb-16">
      {/* Carousel */}
      {slides.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-8">
          <Carousel slides={slides} />
        </section>
      )}

      {/* Sections */}
      <SectionGrid brands={brands} />

      {/* Brands */}
      <BrandGrid brands={brands} />

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-stone-800">Our Products</h2>
            <a href="/products" className="text-sm text-[var(--brand)] font-semibold hover:underline">
              View all →
            </a>
          </div>
          <RevealGrid className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </RevealGrid>
        </section>
      )}

      {featured.length === 0 && slides.length === 0 && brands.length === 0 && (
        <div className="text-center py-24 text-stone-400">
          <p className="text-5xl mb-4">🍬</p>
          <p className="text-lg font-medium">Coming soon — deliciousness in progress!</p>
        </div>
      )}
    </div>
  );
}
