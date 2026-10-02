"use client";

import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { fileUrl } from "@/lib/api";

export default function CartPage() {
  const { items, update, remove, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-16 h-16 text-stone-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-stone-700 mb-2">Your cart is empty</h2>
        <p className="text-stone-400 text-sm mb-6">Add some delicious treats to get started!</p>
        <Link href="/" className="inline-block px-6 py-2.5 bg-[var(--brand)] text-white font-semibold rounded-full hover:bg-[var(--brand-dark)] transition">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Your Cart</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {items.map(item => {
            const imgUrl = fileUrl(item.imageUrl);
            return (
              <div key={item.productId} className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
                {/* Image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-50 shrink-0">
                  {imgUrl ? (
                    <img src={imgUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍬</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.productId}`} className="text-sm font-semibold text-stone-800 hover:text-[var(--brand)] transition line-clamp-2">
                    {item.productName}
                  </Link>
                  <p className="text-xs text-stone-400 mt-0.5">${item.unitPrice.toFixed(2)} each</p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-1 bg-stone-100 rounded-full p-1 shrink-0">
                  <button onClick={() => update(item.productId, item.quantity - 1)} className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow hover:bg-stone-50 transition" aria-label="Decrease">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => update(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxQty}
                    className="w-7 h-7 rounded-full bg-[var(--brand)] text-white flex items-center justify-center shadow hover:bg-[var(--brand-dark)] transition disabled:opacity-40"
                    aria-label="Increase"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Total */}
                <span className="text-sm font-bold text-stone-800 w-16 text-right shrink-0">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </span>

                {/* Remove */}
                <button onClick={() => remove(item.productId)} className="text-stone-300 hover:text-red-400 transition ml-1" aria-label="Remove">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 h-fit sticky top-24">
          <h2 className="font-bold text-stone-800 mb-4">Order Summary</h2>
          <div className="flex justify-between text-sm text-stone-600 mb-3">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-stone-400 mb-6">
            <span>Delivery</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex justify-between font-bold text-stone-800 text-base border-t border-stone-100 pt-4 mb-6">
            <span>Total</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <Link
            href="/checkout"
            className="block text-center w-full py-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold rounded-full transition"
          >
            Continue to Order →
          </Link>
          <Link href="/" className="block text-center text-sm text-stone-400 hover:text-[var(--brand)] mt-3 transition">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
