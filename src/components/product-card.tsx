"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, AlertTriangle } from "lucide-react";
import type { Product } from "@/lib/api";
import { fileUrl } from "@/lib/api";
import { useCart } from "@/context/cart-context";

const LOW_STOCK_THRESHOLD = 5;

interface ProductCardProps { product: Product; }

function computeDisplay(product: Product): { price: number; originalPrice: number | null } {
  const price = parseFloat(product.sellingPrice);
  const discPct = parseFloat(product.discountPercentage ?? "0");
  if (discPct > 0) {
    const originalPrice = price / (1 - discPct / 100);
    return { price, originalPrice };
  }
  return { price, originalPrice: null };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, add, update } = useCart();
  const imgUrl = fileUrl(product.imageUrl);
  const { price, originalPrice } = computeDisplay(product);
  const lowStock = product.quantity > 0 && product.quantity < LOW_STOCK_THRESHOLD;
  const outOfStock = product.quantity <= 0;

  const cartItem = items.find(i => i.productId === product.id);
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOfStock) return;
    add({ productId: product.id, productCode: product.code, productName: product.name, unitPrice: price, imageUrl: product.imageUrl, maxQty: product.quantity });
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    update(product.id, qty - 1);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    update(product.id, qty + 1);
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-stone-100"
    >
      {/* Image */}
      <div className="relative aspect-square bg-stone-50 overflow-hidden">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-5xl">🍬</div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-stone-700 text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        {originalPrice && !outOfStock && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">SALE</span>
        )}
        {qty > 0 && (
          <span className="absolute top-2 right-2 bg-[var(--brand)] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{qty}</span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-semibold text-stone-800 line-clamp-2 leading-snug">{product.name}</h3>

        {lowStock && (
          <div className="flex items-center gap-1 text-amber-600 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Only {product.quantity} left
          </div>
        )}

        <div className="flex items-baseline gap-2 mt-auto">
          {originalPrice ? (
            <>
              <span className="text-red-600 font-bold text-base">${price.toFixed(2)}</span>
              <span className="text-stone-400 text-sm line-through">${originalPrice.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-stone-800 font-bold text-base">${price.toFixed(2)}</span>
          )}
        </div>

        {/* Cart control */}
        {qty > 0 ? (
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 bg-stone-100 rounded-full p-0.5">
              <button onClick={handleDecrease} className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-stone-50 transition" aria-label="Decrease">
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-sm font-semibold">{qty}</span>
              <button
                onClick={handleIncrease}
                disabled={qty >= product.quantity}
                className="w-7 h-7 rounded-full bg-[var(--brand)] text-white shadow flex items-center justify-center hover:bg-[var(--brand-dark)] transition disabled:opacity-40"
                aria-label="Increase"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-stone-500 font-medium">${(price * qty).toFixed(2)}</span>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed mt-1"
          >
            <ShoppingCart className="w-4 h-4" />
            {outOfStock ? "Unavailable" : "Add to Cart"}
          </button>
        )}
      </div>
    </Link>
  );
}
