"use client";

import { productKey, useCart } from "@/context/cart-context";
import { fileUrl, type Offer, type ProductDetail, storefrontApi } from "@/lib/api";
import Image from "next/image";
import { trimZeros } from "@/lib/format";
import { describeOffer, offerBadge, offerEnds, offerScope } from "@/lib/offers";
import { ArrowRight, BadgePercent, Loader2, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  offer: Offer;
  onClose: () => void;
}

export default function OfferDetailModal({ offer, onClose }: Props) {
  const { add, items } = useCart();
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());

  const ends = offerEnds(offer);
  const badge = offerBadge(offer);
  const description = describeOffer(offer);
  const scope = offerScope(offer);

  useEffect(() => {
    if (offer.appliesToAll || offer.products.length === 0) return;
    setLoadingProducts(true);
    Promise.all(offer.products.map(p => storefrontApi.product(p.id).catch(() => null)))
      .then(results => setProducts(results.filter((p): p is ProductDetail => p !== null && p.quantity > 0)))
      .finally(() => setLoadingProducts(false));
  }, [offer.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = (product: ProductDetail) => {
    add({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      unitPrice: parseFloat(product.sellingPrice),
      imageUrl: product.imageUrl,
      maxQty: product.quantity,
    });
    const key = productKey(product.id);
    setAddedKeys(prev => new Set(prev).add(key));
  };

  const discountedPrice = (price: string) => {
    const p = parseFloat(price);
    if (offer.offerType === "percentage_discount") {
      return p * (1 - parseFloat(offer.discountPercentage) / 100);
    }
    return null;
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-[var(--sage-light)]">
          <div className="flex items-start gap-3 min-w-0">
            <span className="shrink-0 w-10 h-10 rounded-full bg-[var(--cream)] flex items-center justify-center">
              <BadgePercent className="w-5 h-5 text-[var(--brand)]" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-stone-800 text-lg leading-tight">{offer.name}</h2>
                <span className="shrink-0 bg-[var(--brand)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{badge}</span>
              </div>
              {offer.description && (
                <p className="text-sm text-stone-500 mt-1">{offer.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full hover:bg-[var(--sage-light)] transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Offer details card */}
          <div className="bg-[var(--cream)] rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide w-20 shrink-0 pt-0.5">Offer</span>
              <span className="text-sm font-semibold text-stone-800">{description}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide w-20 shrink-0 pt-0.5">Applies to</span>
              <span className="text-sm text-stone-700">{scope}</span>
            </div>
            {offer.offerType === "fixed_discount" && parseFloat(offer.discountAmount) > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide w-20 shrink-0 pt-0.5">Discount</span>
                <span className="text-sm font-bold text-[var(--brand)]">${trimZeros(offer.discountAmount)} off</span>
              </div>
            )}
            {offer.offerType === "percentage_discount" && parseFloat(offer.discountPercentage) > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide w-20 shrink-0 pt-0.5">Discount</span>
                <span className="text-sm font-bold text-[var(--brand)]">{parseFloat(offer.discountPercentage)}% off</span>
              </div>
            )}
            {ends && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide w-20 shrink-0 pt-0.5">Ends</span>
                <span className="text-sm text-stone-500">{ends}</span>
              </div>
            )}
            {!offer.combinable && (
              <p className="text-xs text-stone-400 mt-1">Cannot be combined with other offers.</p>
            )}
          </div>

          {/* Product list */}
          {offer.appliesToAll ? (
            <div className="text-center py-2">
              {/* <p className="text-sm text-stone-600 mb-4">This offer applies to <span className="font-semibold">all products</span> in the store.</p> */}
              <Link
                href="/products"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold transition"
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : loadingProducts ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-[var(--brand)] animate-spin" />
            </div>
          ) : products.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Products in this offer</p>
              <div className="flex flex-col gap-3">
                {products.map(product => {
                  const imgUrl = fileUrl(product.imageUrl);
                  const key = productKey(product.id);
                  const inCart = items.some(i => i.key === key);
                  const justAdded = addedKeys.has(key);
                  const originalPrice = parseFloat(product.sellingPrice);
                  const discounted = discountedPrice(product.sellingPrice);

                  return (
                    <div key={product.id} className="flex items-center gap-3 rounded-xl border border-[var(--sage-light)] p-3">
                      <div className="relative w-12 h-12 rounded-xl bg-[var(--background)] overflow-hidden shrink-0 border border-[var(--sage-light)]">
                        {imgUrl ? (
                          <Image src={imgUrl} alt={product.name} fill sizes="48px" className="object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300 text-xl">🍬</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 line-clamp-1">{product.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {discounted !== null ? (
                            <>
                              <span className="text-xs font-bold text-[var(--brand)]">${trimZeros(discounted.toFixed(2))}</span>
                              <span className="text-xs text-stone-400 line-through">${trimZeros(product.sellingPrice)}</span>
                            </>
                          ) : (
                            <span className="text-xs text-stone-600">${trimZeros(product.sellingPrice)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAdd(product)}
                        disabled={product.quantity === 0}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${inCart || justAdded
                            ? "bg-[var(--sage-light)] text-[var(--sage)]"
                            : "bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white"
                          } disabled:opacity-50`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {inCart || justAdded ? "In Cart" : "Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : offer.products.length > 0 ? (
            <p className="text-sm text-stone-500 text-center py-2">Products from this offer are currently out of stock.</p>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--sage-light)]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-[var(--sage-light)] text-stone-600 text-sm font-semibold hover:bg-[var(--sage-light)] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
