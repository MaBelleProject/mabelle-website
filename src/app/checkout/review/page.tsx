"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { useCustomer } from "@/context/customer-context";
import { storefrontApi, type PromoCode } from "@/lib/api";
import { ArrowLeft, Tag, CheckCircle, XCircle } from "lucide-react";

interface CheckoutInfo {
  name: string; phone: string; email: string; address: string;
  city: string; floor: string; paymentMethod: string; remark: string;
  password?: string; customerId?: number;
}

function computePromoDiscount(promo: PromoCode | null, subtotal: number): number {
  if (!promo) return 0;
  const pct = parseFloat(promo.promoDiscountPercentage);
  const amt = parseFloat(promo.promoDiscountAmount);
  if (pct > 0) return subtotal * (pct / 100);
  return Math.min(amt, subtotal);
}

export default function ReviewPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
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

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
      setRedirecting(true);
      return;
    }
    const raw = sessionStorage.getItem("checkout_info");
    if (!raw) { router.replace("/checkout"); setRedirecting(true); return; }
    try { setInfo(JSON.parse(raw)); } catch { router.replace("/checkout"); setRedirecting(true); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    storefrontApi.settings().then(s => {
      if (s?.deliveryCharge) setDeliveryCharge(parseFloat(s.deliveryCharge));
    }).catch(() => {});
  }, []);

  if (redirecting || !info) return null;

  const promoDiscount = computePromoDiscount(promo, subtotal);
  const netTotal = subtotal + deliveryCharge - promoDiscount;

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
      const orderItems = items.map(i => ({
        productId: i.productId,
        productCode: i.productCode,
        productName: i.productName,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      }));

      const fullAddress = [info.address, info.floor, info.city].filter(Boolean).join(", ");

      const orderPayload: Parameters<typeof storefrontApi.createOrder>[0] = {
        phoneNumber: info.phone,
        address: fullAddress,
        paymentMethod: info.paymentMethod,
        remark: info.remark || undefined,
        procodeId: promo?.id,
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
      router.push(`/order-success?orderNumber=${encodeURIComponent(order.orderNumber)}&total=${encodeURIComponent(order.netTotal)}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to place order. Please try again.");
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/checkout" className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-[var(--brand)] mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> Edit Information
      </Link>

      <h1 className="text-2xl font-bold text-stone-800 mb-8">Review Your Order</h1>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Items + Summary */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-50">
              <h2 className="font-semibold text-stone-800">Items ({items.reduce((s, i) => s + i.quantity, 0)})</h2>
            </div>
            {items.map(item => (
              <div key={item.productId} className="flex items-center gap-3 px-5 py-3 border-b border-stone-50 last:border-0">
                <span className="text-stone-500 text-sm flex-1 min-w-0">
                  <span className="font-medium text-stone-800">{item.productName}</span>
                  <span className="text-stone-400"> × {item.quantity}</span>
                </span>
                <span className="text-sm font-semibold text-stone-800 shrink-0">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4">
            <h2 className="font-semibold text-stone-800 mb-3">Delivery Details</h2>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <InfoRow label="Name" value={info.name} />
              <InfoRow label="Phone" value={info.phone} />
              {info.email && <InfoRow label="Email" value={info.email} />}
              <InfoRow label="Address" value={[info.address, info.floor, info.city].filter(Boolean).join(", ")} />
              <InfoRow label="Payment" value="Cash on Delivery" />
              {info.remark && <InfoRow label="Remarks" value={info.remark} />}
            </div>
          </div>
        </div>

        {/* Order totals + promo */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Promo Code */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4">
            <h2 className="font-semibold text-stone-800 mb-3">Promo Code</h2>
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
          </div>

          {/* Totals */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4">
            <h2 className="font-semibold text-stone-800 mb-4">Order Total</h2>
            <div className="flex flex-col gap-2 text-sm text-stone-600">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-stone-400">
                <span>Delivery</span>
                <span>{deliveryCharge > 0 ? `$${deliveryCharge.toFixed(2)}` : "Free"}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-600"><span>Promo ({promo!.code})</span><span>-${promoDiscount.toFixed(2)}</span></div>
              )}
            </div>
            <div className="flex justify-between font-bold text-stone-800 text-base border-t border-stone-100 mt-3 pt-3">
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
