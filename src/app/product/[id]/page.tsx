import { notFound } from "next/navigation";
import Link from "next/link";
import { storefrontApi, fileUrl } from "@/lib/api";
import AddToCartButton from "./add-to-cart-button";
import { AlertTriangle } from "lucide-react";

interface PageProps { params: Promise<{ id: string }> }

const LOW_STOCK = 5;

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await storefrontApi.product(parseInt(id)).catch(() => null);
  if (!product) notFound();

  const imgUrl = fileUrl(product.imageUrl);
  const price = parseFloat(product.sellingPrice);
  const discPct = parseFloat(product.discountPercentage ?? "0");
  const isDiscounted = discPct > 0;
  const originalPrice = isDiscounted ? price / (1 - discPct / 100) : null;
  const lowStock = product.quantity > 0 && product.quantity < LOW_STOCK;
  const outOfStock = product.quantity <= 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-stone-400 mb-6 flex items-center gap-1.5">
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
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-50">
          {imgUrl ? (
            <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300 text-8xl">🍬</div>
          )}
          {isDiscounted && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">SALE</span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          <div>
            {product.sectionName && (
              <span className="text-xs font-medium text-[var(--brand)] uppercase tracking-wide">{product.sectionName}</span>
            )}
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
                <span className="text-3xl font-bold text-red-600">${price.toFixed(2)}</span>
                <span className="text-lg text-stone-400 line-through">${originalPrice!.toFixed(2)}</span>
                <span className="text-sm bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-full">{discPct}% off</span>
              </>
            ) : (
              <span className="text-3xl font-bold text-stone-800">${price.toFixed(2)}</span>
            )}
          </div>

          {/* Stock */}
          {outOfStock ? (
            <p className="text-sm font-medium text-stone-500 bg-stone-100 rounded-full px-3 py-1 w-fit">Out of stock</p>
          ) : lowStock ? (
            <div className="flex items-center gap-1.5 text-amber-600 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              Only {product.quantity} left!
            </div>
          ) : null}

          {/* Description */}
          {product.description && (
            <p className="text-stone-600 text-sm leading-relaxed">{product.description}</p>
          )}
          {product.remarkToCustomer && (
            <p className="text-sm text-stone-500 italic border-l-2 border-[var(--brand-light)] pl-3">{product.remarkToCustomer}</p>
          )}

          {/* Quick info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {product.color && <InfoRow label="Color" value={product.color} />}
            {product.material && <InfoRow label="Material" value={product.material} />}
            {product.madeIn && <InfoRow label="Made In" value={product.madeIn} />}
            {product.shelfLife && <InfoRow label="Shelf Life" value={product.shelfLife} />}
            {product.suitableAgeValue && (
              <InfoRow label="Suitable Age" value={`${product.suitableAgeValue}${product.suitableAgeUnit ? ` ${product.suitableAgeUnit}` : ""}+`} />
            )}
            {(product.weightGrams || product.productLenght || product.height || product.width) && (
              <InfoRow
                label="Dimensions"
                value={[
                  product.weightGrams ? `${product.weightGrams}g` : null,
                  product.productLenght ? `L:${product.productLenght}cm` : null,
                  product.height ? `H:${product.height}cm` : null,
                  product.width ? `W:${product.width}cm` : null,
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

      {/* Ingredients */}
      {product.ingredients.length > 0 && (
        <Section title="Ingredients">
          <div className="flex flex-wrap gap-2">
            {product.ingredients.map(ing => (
              <span key={ing.id} className="bg-stone-100 text-stone-700 text-sm px-3 py-1 rounded-full">
                {ing.name}{ing.percentage !== "0.00" ? ` (${ing.percentage}%)` : ""}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Specifications */}
      {product.specifications.length > 0 && (
        <Section title="Specifications">
          <div className="grid sm:grid-cols-2 gap-3">
            {product.specifications.map(spec => {
              let val = "";
              if (spec.specType === "boolean") val = spec.valueBoolean ? "Yes" : "No";
              else if (spec.specType === "numeric") val = `${spec.valueNumeric ?? ""}${spec.unit ? ` ${spec.unit}` : ""}`;
              else val = spec.valueText ?? "";
              if (!val) return null;
              return <SpecRow key={spec.id} label={spec.name} value={val} />;
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-stone-50 rounded-xl px-3 py-2">
      <p className="text-xs text-stone-400 font-medium">{label}</p>
      <p className="text-stone-700 font-medium mt-0.5">{value}</p>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-stone-100">
      <span className="text-stone-500 text-sm">{label}</span>
      <span className="text-stone-800 text-sm font-medium text-right ml-4">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100">{title}</h2>
      {children}
    </div>
  );
}
