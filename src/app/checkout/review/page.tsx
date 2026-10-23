"use client";

import CountryFlag from "@/components/country-flag";
import OfferPicker from "@/components/offer-picker";
import { toOrderLine, useCart, type CartItem } from "@/context/cart-context";
import { useCustomer } from "@/context/customer-context";
import { storefrontApi, type PromoCode } from "@/lib/api";
import { useCartQuote } from "@/lib/use-cart-quote";
import { ArrowLeft, CheckCircle, Star, Tag, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CheckoutInfo {
  name: string; phone: string; email: string; address: string;
  city: string; floor: string; paymentMethod: string; remark: string;
  password?: string; customerId?: number; isNonProfit?: boolean; freeDelivery?: boolean;
}

/** Rough preview until the server quote arrives (which also applies the offer rules): bundles never get a promo code. */
function computePromoDiscount(promo: PromoCode | null, items: CartItem[]): number {
  if (!promo) return 0;
  const base = items.filter(i => i.itemType !== "bundle").reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const pct = parseFloat(promo.promoDiscountPercentage);
  const amt = parseFloat(promo.promoDiscountAmount);
  if (pct > 0) return base * (pct / 100);
  return Math.min(amt, base);
}

export default function ReviewPage() {
  const router = useRouter();
  const { items, subtotal, clear, selectedOfferId, selectOffer } = useCart();
  const { login } = useCustomer();
  const [info, setInfo] = useState<CheckoutInfo | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  // Loyalty points: the customer chooses how many to use (the server limits it to their balance and the order total)
  const [usePoints, setUsePoints] = useState(false);
  const [pointsInput, setPointsInput] = useState<string | null>(null);
  const [maxPoints, setMaxPoints] = useState(0);
  const requestedPoints = usePoints ? (pointsInput === null ? maxPoints : Math.max(0, Math.floor(Number(pointsInput)) || 0)) : 0;
  // Exact totals from the server: offers applied automatically, bundle / gift prices
  const { quote, error: quoteError } = useCartQuote(items, { customerId: info?.customerId, procodeId: promo?.id, selectedOfferId, loyaltyPointsUsed: requestedPoints });
  const quotedMax = quote?.maxRedeemablePoints;
  useEffect(() => { if (quotedMax !== undefined) setMaxPoints(quotedMax); }, [quotedMax]);

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
      setRedirecting(true);
      return;
    }
    const raw = sessionStorage.getItem("checkout_info");
    if (!raw) { router.replace("/checkout"); setRedirecting(true); return; }
    try {
      const saved = JSON.parse(raw);
      setInfo(saved);
      if (saved.remark) setOrderNote(String(saved.remark).slice(0, 200));
    } catch { router.replace("/checkout"); setRedirecting(true); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    storefrontApi.settings().then(s => {
      if (s?.deliveryCharge) setDeliveryCharge(parseFloat(s.deliveryCharge));
    }).catch(() => { });
  }, []);

  if (redirecting || !info) return null;

  const isNonProfit = info?.isNonProfit === true;
  // Free-delivery customers (every non-profit one too) pay no delivery; the server quote has the final say.
  const freeDelivery = quote?.freeDelivery ?? !!(info?.freeDelivery ?? isNonProfit);
  const shownSubtotal = quote?.subtotal ?? subtotal;
  const promoDiscount = quote?.promoCodeAmount ?? computePromoDiscount(promo, items);
  // Delivery is kept outside the order's net total; the total to pay is netTotal + delivery left after offers.
  const delivery = quote && !freeDelivery ? quote.deliveryCharge : deliveryCharge;
  const deliveryDue = freeDelivery ? 0 : (quote ? quote.deliveryDue : deliveryCharge);
  const netTotal = quote
    ? freeDelivery ? quote.totalDue - quote.deliveryDue : quote.totalDue
    : subtotal + (freeDelivery ? 0 : deliveryCharge) - promoDiscount;
  const availablePoints = quote?.availablePoints ?? 0;
  const pointsPerDollar = quote?.pointsPerDollar ?? 20;
  const showPoints = !!info.customerId && !isNonProfit && availablePoints > 0;
  const loyaltyDiscount = quote?.loyaltyDiscountAmount ?? 0;
  const promoCodeInUse = promo?.code ?? quote?.promoCode ?? null;
  const itemOffers = quote?.offers.filter(o => o.offerType !== "free_delivery") ?? [];
  const deliveryOffer = quote?.offers.find(o => o.offerType === "free_delivery");

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await storefrontApi.validatePromo(promoInput.trim(), info.phone);
      if (res.valid && res.promo) {
        setPromo(res.promo);
      } else {
        setPromo(null);
        setPromoError(res.message ?? "Invalid or inactive promo code.");
      }
    } catch {
      setPromoError("Could not validate promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const placeOrder = async () => {
    setPlacing(true);
    setError("");
    try {
      const orderItems = items.map(toOrderLine);

      const fullAddress = [info.address, info.floor, info.city].filter(Boolean).join(", ");

      const orderPayload: Parameters<typeof storefrontApi.createOrder>[0] = {
        phoneNumber: info.phone,
        address: fullAddress,
        paymentMethod: info.paymentMethod,
        remark: orderNote.trim() || undefined,
        procodeId: promo?.id,
        selectedOfferId: selectedOfferId ?? undefined,
        loyaltyPointsUsed: quote?.loyaltyPointsUsed || undefined,
        items: orderItems,
        orderType: "order",
      };

      if (info.customerId) {
        orderPayload.customerId = info.customerId;
      } else {
        orderPayload.newCustomer = {
          name: info.name,
          phone: info.phone,
          email: info.email || undefined,
          address: fullAddress,
          password: info.password || undefined,
        };
      }

      const order = await storefrontApi.createOrder(orderPayload);

      // Auto-login the guest if they created an account during checkout
      if (!info.customerId && info.password) {
        try { await login(info.phone, info.password); } catch { /* non-fatal */ }
      }

      clear();
      sessionStorage.removeItem("checkout_info");
      router.push(`/order-success?orderNumber=${encodeURIComponent(order.orderNumber)}&total=${encodeURIComponent(order.totalDue ?? order.netTotal)}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to place order. Please try again.");
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8">
      {!info.customerId && (
        <button
          onClick={() => {
            sessionStorage.setItem("checkout_info", JSON.stringify({ ...info, remark: orderNote }));
            sessionStorage.setItem("checkout_edit", "1");
            router.push("/checkout");
          }}
          className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-[var(--brand)] mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Edit Information
        </button>
      )}

      <div className="flex items-center gap-3 mb-8">
        {info.customerId && (
          <button
            onClick={() => router.push("/cart")}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--sage-light)] transition shrink-0"
            aria-label="Back to cart"
          >
            <ArrowLeft className="w-4 h-4 text-stone-400" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-stone-800">Review Your Order</h1>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Items + Summary */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-[var(--sage-light)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--sage-light)]">
              <h2 className="font-semibold text-stone-800">Items ({items.reduce((s, i) => s + i.quantity, 0)})</h2>
            </div>
            {items.map((item, idx) => (
              <div key={item.key} className="flex items-center gap-3 px-5 py-3 border-b border-[var(--sage-light)] last:border-0">
                <span className="text-stone-500 text-sm flex-1 min-w-0">
                  <span className="font-medium text-stone-800">{item.productName}</span>
                  {item.itemType === "product" && <CountryFlag productId={item.productId} className="ml-1.5 align-[-1px] w-4 h-3" />}
                  <span className="text-stone-400"> × {item.quantity}</span>
                  {item.contents?.length ? <span className="block text-xs text-stone-400">{item.contents.join(" · ")}</span> : null}
                  {item.packagingName && <span className="block text-xs text-stone-400">Packaging: {item.packagingName}</span>}
                  {item.giftMessage && <span className="block text-xs text-stone-400 italic">Card: "{item.giftMessage}"</span>}
                </span>
                <span className="text-sm font-semibold text-stone-800 shrink-0">
                  ${(quote?.items[idx]?.totalPrice ?? item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-2xl border border-[var(--sage-light)] shadow-sm px-5 py-4">
            <h2 className="font-semibold text-stone-800 mb-3">Delivery Details</h2>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <InfoRow label="Name" value={info.name} />
              <InfoRow label="Phone" value={info.phone} />
              {info.email && <InfoRow label="Email" value={info.email} />}
              <InfoRow label="Address" value={[info.address, info.floor, info.city].filter(Boolean).join(", ")} />
              <InfoRow label="Payment" value="Cash on Delivery" />
            </div>
          </div>

          {/* Order Note */}
          <div className="bg-white rounded-2xl border border-[var(--sage-light)] shadow-sm px-5 py-4">
            <label htmlFor="order-note" className="block font-semibold text-stone-800 mb-3">
              Order Note <span className="ml-1 text-xs font-normal text-stone-400">(optional)</span>
            </label>
            <textarea
              id="order-note"
              value={orderNote}
              onChange={e => setOrderNote(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Any special instructions for your order…"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-[var(--brand)] transition resize-none"
            />
            <p className="text-xs text-stone-400 mt-1 text-right">{orderNote.length}/200</p>
          </div>
        </div>

        {/* Order totals + promo */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Promo Code */}
          {!isNonProfit && <div className="bg-white rounded-2xl border border-[var(--sage-light)] shadow-sm px-5 py-4">
            <h2 className="font-semibold text-stone-800 mb-3">Promo Code <span className="ml-1 text-xs font-normal text-stone-400">(not applicable to bundles)</span></h2>
            {promo ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-700">{promo.code}</p>
                  <p className="text-xs text-stone-500">
                    {parseFloat(promo.promoDiscountPercentage) > 0
                      ? `${promo.promoDiscountPercentage}% off`
                      : `$${promo.promoDiscountAmount} off`}
                  </p>
                </div>
                <button onClick={() => { setPromo(null); setPromoInput(""); }} className="text-stone-300 hover:text-red-400 transition">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ) : quote?.promoCode && quote.promoApplied && quote.promoIsFamily ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-700">{quote.promoCode}</p>
                  <p className="text-xs text-stone-500">Family discount, applied automatically</p>
                </div>
              </div>
            ) : (
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                  onKeyDown={e => e.key === "Enter" && applyPromo()}
                  placeholder="Enter promo code"
                  className="w-full pl-3 pr-20 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-[var(--brand)] transition"
                />
                <button
                  onClick={applyPromo}
                  disabled={promoLoading || !promoInput.trim()}
                  className="absolute right-1 flex items-center gap-1 px-3 py-1.5 bg-[var(--brand)] text-white text-xs font-semibold rounded-md hover:bg-[var(--brand-dark)] transition disabled:opacity-50"
                >
                  <Tag className="w-3 h-3" />
                  {promoLoading ? "…" : "Apply"}
                </button>
              </div>
            )}
            {promoError && <p className="text-xs text-red-500 mt-1.5">{promoError}</p>}
            {promo && quote?.promoNote && (
              <p className={`text-xs mt-1.5 ${quote.promoApplied ? "text-amber-600" : "text-red-500"}`}>{quote.promoNote}</p>
            )}
          </div>}

          {/* Loyalty points */}
          {showPoints && (
            <div className="bg-white rounded-2xl border border-[var(--sage-light)] shadow-sm px-5 py-4">
              <h2 className="font-semibold text-stone-800 mb-1 flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500" /> Loyalty Points</h2>
              <p className="text-xs text-stone-500 mb-3">
                {availablePoints} pts available (${(Math.floor(availablePoints / pointsPerDollar * 100) / 100).toFixed(2)}) · {pointsPerDollar} pts = $1 discount
              </p>
              <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                <input type="checkbox" checked={usePoints} onChange={e => { setUsePoints(e.target.checked); setPointsInput(null); }} className="rounded border-stone-300" />
                Use My Points
              </label>
              {usePoints && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number" min={0} max={maxPoints} step={1}
                    value={pointsInput ?? String(maxPoints)}
                    onChange={e => setPointsInput(e.target.value === "" ? "" : String(Math.min(maxPoints, Math.max(0, Math.floor(Number(e.target.value)) || 0))))}
                    onBlur={() => setPointsInput(String(Math.min(maxPoints, requestedPoints)))}
                    className="w-28 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-[var(--brand)] transition"
                  />
                  <span className="text-xs text-stone-500">of max {maxPoints}</span>
                  <button type="button" onClick={() => setPointsInput(String(maxPoints))} className="ml-auto text-xs font-medium text-[var(--brand)] hover:underline">Use max</button>
                </div>
              )}
            </div>
          )}

          {/* Totals */}
          <div className="bg-white rounded-2xl border border-[var(--sage-light)] shadow-sm px-5 py-4">
            <h2 className="font-semibold text-stone-800 mb-4">Order Total</h2>
            <OfferPicker quote={quote} onSelect={selectOffer} />
            <div className="flex flex-col gap-2 text-sm text-stone-600">
              <div className="flex justify-between"><span>Subtotal</span><span>${shownSubtotal.toFixed(2)}</span></div>
              {promoDiscount > 0 && (
                <div>
                  <div className="flex justify-between text-green-600"><span>Promo{promoCodeInUse ? ` (${promoCodeInUse})` : ""}</span><span>-${promoDiscount.toFixed(2)}</span></div>
                  <p className="text-xs text-stone-400 mt-0.5">Promo code is not applicable to bundles.</p>
                </div>
              )}
              {itemOffers.map(o => (
                <div key={o.offerId}>
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {o.offerName}</span>
                    <span>-${o.discountAmount.toFixed(2)}</span>
                  </div>
                  {promoCodeInUse && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      {promoDiscount > 0 ? `Promo code applied: ${promoCodeInUse}` : `Promo code ${promoCodeInUse} can't be combined with this offer`}
                    </p>
                  )}
                </div>
              ))}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Loyalty points ({quote!.loyaltyPointsUsed})</span>
                  <span>-${loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-400">
                <span>
                  Delivery
                  {freeDelivery && <span className="text-green-600"> · {isNonProfit ? "Non-profit" : "Free delivery"}</span>}
                  {!freeDelivery && deliveryOffer && <span className="text-green-600"> · {deliveryOffer.offerName}</span>}
                </span>
                <span>
                  {deliveryDue < delivery
                    ? <><span className="line-through mr-1">${delivery.toFixed(2)}</span><span className="text-green-600">{deliveryDue > 0 ? `$${deliveryDue.toFixed(2)}` : "Free"}</span></>
                    : delivery > 0 ? `$${delivery.toFixed(2)}` : "Free"}
                </span>
              </div>
              {quoteError && <p className="text-xs text-red-500">{quoteError}</p>}
            </div>
            <div className="flex justify-between font-bold text-stone-800 text-base border-t border-[var(--sage-light)] mt-3 pt-3">
              <span>Total</span><span>${netTotal.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            onClick={placeOrder}
            disabled={placing}
            className="w-full py-3.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold rounded-full transition disabled:opacity-60 text-base"
          >
            {placing ? "Placing Order…" : "Place Order →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-stone-400">{label}</span>
      <span className="text-stone-700 font-medium">{value}</span>
    </>
  );
}
