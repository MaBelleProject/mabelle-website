import { cachedStorefrontApi } from "@/lib/cached-storefront";
import { Suspense } from "react";
import ProductsContent from "./products-content";

interface SearchParams {
  search?: string;
  categoryId?: string;
  sectionId?: string;
  subsectionId?: string;
  sectionCode?: string;
  countryId?: string;
  age?: string;
  collection?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const bestSellersOnly = sp.collection === "best-sellers";

  // Brand (categoryId), section (sectionCode) and age are filtered in the browser from the URL, so changing
  // them is instant. Only the structural filters below still narrow the server query.
  const [initialProducts, initialBrands, sections, initialCountry] = await Promise.all([
    (bestSellersOnly
      ? cachedStorefrontApi.bestSellers()
      : cachedStorefrontApi.products({
          sectionId: sp.sectionId ? +sp.sectionId : undefined,
          subsectionId: sp.subsectionId ? +sp.subsectionId : undefined,
          countryId: sp.countryId ? +sp.countryId : undefined,
        })
    ).catch(() => []),
    cachedStorefrontApi.brands().catch(() => []),
    cachedStorefrontApi.sections().catch(() => []),
    sp.countryId
      ? cachedStorefrontApi.country(+sp.countryId).catch(() => null)
      : Promise.resolve(null),
  ]);

  // Key forces remount (and state reset) when structural filters change,
  // preventing stale search text from filtering a different category's products.
  const filterKey = `${sp.sectionId ?? ""},${sp.subsectionId ?? ""},${sp.countryId ?? ""},${sp.collection ?? ""}`;

  return (
    <Suspense>
      <ProductsContent
        key={filterKey}
        initialProducts={initialProducts}
        initialBrands={initialBrands}
        sections={sections}
        initialCountry={initialCountry}
        initialSearch={sp.search ?? ""}
        collection={bestSellersOnly ? "best-sellers" : null}
      />
    </Suspense>
  );
}
