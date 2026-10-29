"use client";

import { productKey, useCart } from "@/context/cart-context";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";

interface Props {
  product: { id: number; code: string; name: string; price: number; imageUrl?: string | null; maxQty: number };
}

export default function AddToCartButton({ product }: Props) {
  const { items, add, update, maxQtyFor, stockLeft } = useCart();
  const [added, setAdded] = useState(false);

  const cartItem = items.find(i => i.key === productKey(product.id));
  const qty = cartItem?.quantity ?? 0;
  // Bundles / gifts in the cart may already take some of this product's stock.
  const noneLeft = stockLeft(product.id, product.maxQty) <= 0;

  const handleAdd = () => {
    if (noneLeft) return;
    add({ productId: product.id, productCode: product.code, productName: product.name, unitPrice: product.price, imageUrl: product.imageUrl, maxQty: product.maxQty });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (qty > 0) {
    return (
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-2 bg-[var(--sage-light)] rounded-full p-1">
          <button onClick={() => update(productKey(product.id), qty - 1)} className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:bg-[var(--brand-light)] transition" aria-label="Decrease">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center font-semibold text-stone-800">{qty}</span>
          <button
            onClick={() => update(productKey(product.id), qty + 1)}
            disabled={qty >= maxQtyFor(productKey(product.id))}
            className="w-8 h-8 rounded-full bg-[var(--brand)] text-white shadow flex items-center justify-center hover:bg-[var(--brand-dark)] transition disabled:opacity-40"
            aria-label="Increase"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-sm text-stone-500">${(product.price * qty).toFixed(2)}</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={noneLeft}
      className="flex items-center justify-center gap-2 w-full max-w-xs py-3 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold transition mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
      {added ? "Added!" : noneLeft ? "All in your cart already" : "Add to Cart"}
    </button>
  );
}
