"use client";

import OfferPicker from "@/components/offer-picker";
import { cartItemHref, useCart } from "@/context/cart-context";
import { hasFreeDelivery, useCustomer } from "@/context/customer-context";
import { fileUrl, storefrontApi } from "@/lib/api";
import { useCartQuote } from "@/lib/use-cart-quote";
import { Minus, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import BackButton from "@/components/back-button";
import CountryFlag from "@/components/country-flag";

export default function CartPage() {
  const { items, update, remove, subtotal, selectedOfferId, selectOffer } = useCart();
  const { customer } = useCustomer();
  const { quote } = useCartQuote(items, { customerId: customer?.id, selectedOfferId });
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  useEffect(() => {
    storefrontApi.settings().then(s => {
      if (s?.deliveryCharge) setDeliveryCharge(parseFloat(s.deliveryCharge));
    }).catch(() => { });
  }, []);

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-8">
          <BackButton />
        </div>
        <div className="text-center py-16">
          <ShoppingBag className="w-16 h-16 text-stone-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-700 mb-2">Your cart is empty</h2>
          <p className="text-stone-400 text-sm mb-6">Add some delicious treats to get started!</p>
          <Link href="/" className="inline-block px-6 py-2.5 bg-[var(--brand)] text-white font-semibold rounded-full hover:bg-[var(--brand-dark)] transition">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const isNonProfit = customer?.isNonProfit === true;
  // Free-delivery customers (every non-profit one too) pay no delivery; the server quote has the final say.
  const freeDelivery = quote?.freeDelivery ?? hasFreeDelivery(customer);
  const shownSubtotal = quote?.subtotal ?? subtotal;
  // Delivery is kept outside the order's net total; the total to pay is netTotal + delivery left after offers.
  const delivery = quote && !freeDelivery ? quote.deliveryCharge : deliveryCharge;
  const deliveryDue = freeDelivery ? 0 : (quote ? quote.deliveryDue : deliveryCharge);
  const total = quote
    ? freeDelivery ? quote.totalDue - quote.deliveryDue : quote.totalDue
    : subtotal + (freeDelivery ? 0 : deliveryCharge);
  const itemOffers = quote?.offers.filter(o => o.offerType !== "free_delivery") ?? [];
  const deliveryOffer = quote?.offers.find(o => o.offerType === "free_delivery");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <BackButton />
        <h1 className="text-2xl font-bold text-stone-800">Your Cart</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {items.map((item, idx) => {
            const imgUrl = fileUrl(item.imageUrl);
            const unitPrice = quote?.items[idx]?.unitPrice ?? item.unitPrice;
            return (
              <div key={item.key} className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-[var(--sage-light)] shadow-sm">
                {/* Image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--cream)] shrink-0">
                  {imgUrl ? (
                    <img src={imgUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">{item.itemType === "gift" ? "🎁" : "🍬"}</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {item.itemType !== "product" && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand)]">{item.itemType}</span>
                  )}
                  <div className="flex items-start gap-1.5">
                    <Link href={cartItemHref(item)} className="min-w-0 text-sm font-semibold text-stone-800 hover:text-[var(--brand)] transition line-clamp-2">
                      {item.productName}
                    </Link>
                    {item.itemType === "product" && <CountryFlag productId={item.productId} className="mt-[3px] w-4 h-3" />}
                  </div>
                  {item.contents?.length ? <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{item.contents.join(" · ")}</p> : null}
                  {item.packagingName && <p className="text-xs text-stone-500">Packaging: {item.packagingName}</p>}
                  {item.giftMessage && <p className="text-xs text-stone-400 italic line-clamp-1">"{item.giftMessage}"</p>}
                  <p className="text-xs text-stone-400 mt-0.5">${unitPrice.toFixed(2)} each</p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-1 bg-[var(--sage-light)] rounded-full p-1 shrink-0">
                  <button onClick={() => update(item.key, item.quantity - 1)} className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow hover:bg-[var(--cream)] transition" aria-label="Decrease">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => update(item.key, item.quantity + 1)}
                    disabled={item.quantity >= item.maxQty}
                    className="w-7 h-7 rounded-full bg-[var(--brand)] text-white flex items-center justify-center shadow hover:bg-[var(--brand-dark)] transition disabled:opacity-40"
                    aria-label="Increase"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Total */}
                <span className="text-sm font-bold text-stone-800 w-16 text-right shrink-0">
                  ${(quote?.items[idx]?.totalPrice ?? unitPrice * item.quantity).toFixed(2)}
                </span>

                {/* Remove */}
                <button onClick={() => remove(item.key)} className="text-stone-300 hover:text-red-400 transition ml-1" aria-label="Remove">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-[var(--sage-light)] shadow-sm p-6 h-fit sticky top-24">
          <h2 className="font-bold text-stone-800 mb-4">Order Summary</h2>
          <div className="flex justify-between text-sm text-stone-600 mb-3">
            <span>Subtotal</span>
            <span>${shownSubtotal.toFixed(2)}</span>
          </div>
          <OfferPicker quote={quote} onSelect={selectOffer} />
          {itemOffers.map(o => (
            <div key={o.offerId} className="flex justify-between text-sm text-green-600 mb-3">
              <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {o.offerName}</span>
              <span>-${o.discountAmount.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm text-stone-400 mb-6">
            <span>
              Delivery
              {freeDelivery && <span className="text-green-600"> · {isNonProfit ? "Non-profit" : "Free delivery"}</span>}
              {!freeDelivery && deliveryOffer && <span className="text-green-600"> · {deliveryOffer.offerName}</span>}
            </span>
            <span>
              {freeDelivery
                ? delivery > 0
                  ? <><span className="line-through mr-1">${delivery.toFixed(2)}</span><span className="text-green-600">Free</span></>
                  : <span className="text-green-600">Free</span>
                : deliveryDue < delivery
                  ? <><span className="line-through mr-1">${delivery.toFixed(2)}</span><span className="text-green-600">{deliveryDue > 0 ? `$${deliveryDue.toFixed(2)}` : "Free"}</span></>
                  : delivery > 0 ? `$${delivery.toFixed(2)}` : "Free"}
            </span>
          </div>
          <div className="flex justify-between font-bold text-stone-800 text-base border-t border-[var(--sage-light)] pt-4 mb-6">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
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
