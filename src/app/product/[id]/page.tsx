import { fileUrl, storefrontApi } from "@/lib/api";
import { trimZeros } from "@/lib/format";
import { describeOffer, offerBadge, offersForProduct } from "@/lib/offers";
import { sectionHref } from "@/lib/sections";
import { AlertTriangle, Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "./add-to-cart-button";
import ProductInfoTabs from "./product-info-tabs";
import BackButton from "@/components/back-button";

interface PageProps { params: Promise<{ id: string }> }

const LOW_STOCK = 5;

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const [product, allOffers] = await Promise.all([
    storefrontApi.product(parseInt(id)).catch(() => null),
    storefrontApi.offers().catch(() => []),
  ]);
  if (!product) notFound();
  // Every running offer this product counts towards, store-wide ones included.
  const offers = offersForProduct(allOffers, product.id);

  const imgUrl = fileUrl(product.imageUrl);
  const price = parseFloat(product.sellingPrice);
  const discPct = parseFloat(product.discountPercentage ?? "0");
  const isDiscounted = discPct > 0;
  const originalPrice = isDiscounted ? price / (1 - discPct / 100) : null;
  const lowStock = product.quantity > 0 && product.quantity < LOW_STOCK;
  const outOfStock = product.quantity <= 0;
  const highlights = product.specifications.filter(s => s.specType === "boolean" && s.valueBoolean);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-stone-400 mb-6 flex items-center gap-1.5">
        <BackButton />
        <Link href="/" className="hover:text-[var(--brand)]">Home</Link>
        <span>/</span>
        {product.categoryName && (
          <>
            <Link href={`/brand/${product.categoryId}`} className="hover:text-[var(--brand)]">{product.categoryName}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-stone-600">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--cream)]">
          {imgUrl ? (
            <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300 text-8xl">🍬</div>
          )}
          {(isDiscounted || offers.length > 0) && (
            <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
              {isDiscounted && <span className="bg-[var(--brand)] text-white text-xs font-bold px-3 py-1 rounded-full">SALE</span>}
              {offers.length > 0 && (
                <span className="bg-[var(--sage-light)] text-[var(--sage)] text-xs font-bold px-3 py-1 rounded-full uppercase">{offerBadge(offers[0])}</span>
              )}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          <div>
            {product.sectionName && (product.sectionCode ? (
              <Link href={sectionHref(product.sectionCode)} className="text-xs font-medium text-[var(--brand)] uppercase tracking-wide hover:underline">
                {product.sectionName}
              </Link>
            ) : (
              <span className="text-xs font-medium text-[var(--brand)] uppercase tracking-wide">{product.sectionName}</span>
            ))}
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mt-1">{product.name}</h1>
            {product.categoryName && (
              <Link href={`/brand/${product.categoryId}`} className="text-sm text-stone-400 hover:text-[var(--brand)] transition">
                Brand: {product.categoryName}
              </Link>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            {isDiscounted ? (
              <>
                <span className="text-3xl font-bold text-[var(--brand)]">${price.toFixed(2)}</span>
                <span className="text-lg text-stone-400 line-through">${originalPrice!.toFixed(2)}</span>
                <span className="text-sm bg-[var(--brand-light)] text-[var(--brand)] font-semibold px-2 py-0.5 rounded-full">{trimZeros(product.discountPercentage)}% off</span>
              </>
            ) : (
              <span className="text-3xl font-bold text-stone-800">${price.toFixed(2)}</span>
            )}
          </div>

          {/* Offers this product counts towards */}
          {offers.length > 0 && (
            <div className="rounded-xl border border-[var(--sage-light)] bg-[var(--cream)] px-4 py-3 space-y-1.5">
              {offers.map(o => (
                <div key={o.id} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 bg-[var(--sage-light)] text-[var(--sage)] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mt-0.5">{offerBadge(o)}</span>
                  <span className="text-stone-700">
                    <span className="font-semibold">{o.name}</span> — {describeOffer(o)}
                    {o.appliesToAll && <span className="text-stone-400"> (all products)</span>}
                  </span>
                </div>
              ))}
              <Link href="/offers" className="block text-xs text-[var(--brand)] font-semibold hover:underline pt-0.5">All offers →</Link>
            </div>
          )}

          {/* Stock */}
          {outOfStock ? (
            <p className="text-sm font-medium text-stone-500 bg-[var(--sage-light)] rounded-full px-3 py-1 w-fit">Out of stock</p>
          ) : lowStock ? (
            <div className="flex items-center gap-1.5 text-amber-600 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              Only {product.quantity} left!
            </div>
          ) : null}

          {/* Description */}
          {product.description && (
            <div className="text-stone-600 text-sm leading-relaxed space-y-2">
              {product.description.split(/\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
          {product.remarkToCustomer && (
            <p className="text-sm text-stone-500 italic border-l-2 border-[var(--brand-light)] pl-3">{product.remarkToCustomer}</p>
          )}

          {/* Highlights (checked boolean specs) */}
          {highlights.length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {highlights.map(spec => (
                <li key={spec.id} className="flex items-center gap-1.5 text-sm text-stone-700">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--sage-light)] shrink-0">
                    <Check className="w-3.5 h-3.5 text-[var(--sage)]" strokeWidth={3} />
                  </span>
                  {spec.name}
                </li>
              ))}
            </ul>
          )}

          {/* Quick info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {product.color && <InfoRow label="Color" value={product.color} />}
            {product.material && <InfoRow label="Material" value={product.material} />}
            {product.madeIn && <InfoRow label="Made In" value={product.madeIn} />}
            {product.shelfLife && <InfoRow label="Shelf Life" value={`${trimZeros(product.shelfLife)}${product.shelfLifeUnit ? ` ${product.shelfLifeUnit}` : ""}`} />}
            {product.suitableAgeValue && (
              <InfoRow label="Suitable Age" value={`${trimZeros(product.suitableAgeValue)}${product.suitableAgeUnit ? ` ${product.suitableAgeUnit}` : ""}+`} />
            )}
            {(product.weightGrams || product.productLenght || product.height || product.width) && (
              <InfoRow
                label="Dimensions"
                value={[
                  product.weightGrams ? `${trimZeros(product.weightGrams)}g` : null,
                  product.productLenght ? `L:${trimZeros(product.productLenght)}cm` : null,
                  product.height ? `H:${trimZeros(product.height)}cm` : null,
                  product.width ? `W:${trimZeros(product.width)}cm` : null,
                ].filter(Boolean).join(" · ")}
              />
            )}
          </div>

          {/* Add to Cart */}
          {!outOfStock && (
            <AddToCartButton
              product={{
                id: product.id,
                code: product.code,
                name: product.name,
                price,
                imageUrl: product.imageUrl,
                maxQty: product.quantity,
              }}
            />
          )}
        </div>
      </div>

      {/* Specifications & Ingredients */}
      {(product.specifications.length > 0 || product.ingredients.length > 0) && (
        <ProductInfoTabs specifications={product.specifications} ingredients={product.ingredients} />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--sage-light)] rounded-xl px-3 py-2">
      <p className="text-xs text-stone-400 font-medium">{label}</p>
      <p className="text-stone-700 font-medium mt-0.5">{value}</p>
    </div>
  );
}
