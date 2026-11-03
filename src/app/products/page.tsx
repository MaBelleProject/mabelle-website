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
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const [initialProducts, initialBrands, initialCountry] = await Promise.all([
    cachedStorefrontApi
      .products({
        categoryId: sp.categoryId ? +sp.categoryId : undefined,
        sectionId: sp.sectionId ? +sp.sectionId : undefined,
        subsectionId: sp.subsectionId ? +sp.subsectionId : undefined,
        sectionCode: sp.sectionCode,
        countryId: sp.countryId ? +sp.countryId : undefined,
      })
      .catch(() => []),
    cachedStorefrontApi.brands().catch(() => []),
    sp.countryId
      ? cachedStorefrontApi.country(+sp.countryId).catch(() => null)
      : Promise.resolve(null),
  ]);

  // Key forces remount (and state reset) when structural filters change,
  // preventing stale search text from filtering a different category's products.
  const filterKey = `${sp.categoryId ?? ""},${sp.sectionId ?? ""},${sp.subsectionId ?? ""},${sp.sectionCode ?? ""},${sp.countryId ?? ""}`;

  return (
    <Suspense>
      <ProductsContent
        key={filterKey}
        initialProducts={initialProducts}
        initialBrands={initialBrands}
        initialCountry={initialCountry}
        initialSearch={sp.search ?? ""}
      />
    </Suspense>
  );
}
