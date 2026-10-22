"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, ChevronUp, Loader2, MessageCircleHeart, Package, RotateCcw } from "lucide-react";
import { useCustomer } from "@/context/customer-context";
import { useCart } from "@/context/cart-context";
import { storefrontApi, type CustomerOrder, type OrderFeedback, fileUrl } from "@/lib/api";
import { trimZeros } from "@/lib/format";
import CountryFlag from "@/components/country-flag";
import FeedbackFormModal from "@/components/feedback-form-modal";
import FeedbackViewModal from "@/components/feedback-view-modal";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-stone-100 text-stone-600",
};

export default function OrderHistoryPage() {
  const { customer } = useCustomer();
  const router = useRouter();
  const { add } = useCart();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const [reorderMessage, setReorderMessage] = useState<{ orderId: number; text: string } | null>(null);

  // Feedback state
  const [feedbackFormOrder, setFeedbackFormOrder] = useState<{ orderId: number; orderNumber: string; initialData?: OrderFeedback } | null>(null);
  const [viewFeedback, setViewFeedback] = useState<{ orderId: number; orderNumber: string; feedback: OrderFeedback } | null>(null);
  const [loadingFeedbackId, setLoadingFeedbackId] = useState<number | null>(null);

  const load = () => {
    if (!customer) return;
    storefrontApi.customerOrders(customer.id)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!customer) { router.replace("/login"); return; }
    load();
  }, [customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReorder = async (order: CustomerOrder) => {
    setReorderingId(order.id);
    setReorderMessage(null);
    const productItems = order.items.filter(i => i.itemType === "product" && i.productId != null);
    let added = 0;
    let unavailable = 0;
    for (const item of productItems) {
      try {
        const product = await storefrontApi.product(item.productId!);
        if (product && product.quantity > 0) {
          add({
            productId: product.id,
            productCode: product.code,
            productName: product.name,
            unitPrice: parseFloat(product.sellingPrice),
            imageUrl: product.imageUrl,
            maxQty: product.quantity,
          });
          added++;
        } else {
          unavailable++;
        }
      } catch {
        unavailable++;
      }
    }
    setReorderingId(null);
    if (added > 0 && unavailable > 0) {
      setReorderMessage({ orderId: order.id, text: `${added} item${added !== 1 ? "s" : ""} added to cart. ${unavailable} item${unavailable !== 1 ? "s" : ""} unavailable.` });
    } else if (added > 0) {
      setReorderMessage({ orderId: order.id, text: `${added} item${added !== 1 ? "s" : ""} added to cart.` });
    } else {
      setReorderMessage({ orderId: order.id, text: "All items from this order are currently unavailable." });
    }
  };

  const handleViewFeedback = async (order: CustomerOrder) => {
    if (!customer) return;
    setLoadingFeedbackId(order.id);
    try {
      const feedback = await storefrontApi.getOrderFeedback(customer.id, order.id);
      if (feedback) setViewFeedback({ orderId: order.id, orderNumber: order.orderNumber, feedback });
    } catch {
      // ignore
    } finally {
      setLoadingFeedbackId(null);
    }
  };

  if (!customer) return null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 flex justify-center">
        <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Order History</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">No orders yet</p>
          <p className="text-stone-400 text-sm mt-1">Your orders will appear here once you place one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-[var(--sage-light)] shadow-sm overflow-hidden">
              {/* Order summary row */}
              <button
                className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-[var(--cream)] transition"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-stone-800">{order.orderNumber}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] ?? "bg-stone-100 text-stone-600"}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-sm text-stone-500 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    {" · "}
                    <span className="font-medium text-stone-700">${trimZeros(order.totalDue)}</span>
                    {" · "}
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </div>
                </div>
                {expandedId === order.id
                  ? <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />}
              </button>

              {/* Expanded details */}
              {expandedId === order.id && (
                <div className="border-t border-[var(--sage-light)] px-5 py-4 flex flex-col gap-4">
                  {/* Items */}
                  <div className="flex flex-col gap-3">
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-[var(--cream)] overflow-hidden shrink-0 border border-[var(--sage-light)]">
                          {item.imageUrl ? (
                            <Image src={fileUrl(item.imageUrl)!} alt={item.productName} fill sizes="48px" className="object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300 text-xl">🍬</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="min-w-0 text-sm font-medium text-stone-800 line-clamp-1">{item.productName}</p>
                            {item.itemType === "product" && <CountryFlag productId={item.productId} className="w-4 h-3" />}
                          </div>
                          <p className="text-xs text-stone-500">
                            {item.quantity} × ${trimZeros(item.unitPrice)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-stone-800 shrink-0">${trimZeros(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-[var(--sage-light)] pt-3 flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal</span>
                      <span>${trimZeros(order.subtotal)}</span>
                    </div>
                    {Number(order.offerDiscountAmount) > 0 && (
                      <div className="flex justify-between text-[var(--sage)]">
                        <span>Offer discount</span>
                        <span>−${trimZeros(order.offerDiscountAmount)}</span>
                      </div>
                    )}
                    {Number(order.promoCodeAmount) > 0 && (
                      <div className="flex justify-between text-[var(--sage)]">
                        <span>Promo code</span>
                        <span>−${trimZeros(order.promoCodeAmount)}</span>
                      </div>
                    )}
                    {Number(order.clientDiscountAmount) > 0 && (
                      <div className="flex justify-between text-[var(--sage)]">
                        <span>Discount</span>
                        <span>−${trimZeros(order.clientDiscountAmount)}</span>
                      </div>
                    )}
                    {Number(order.orderDiscountAmount) > 0 && (
                      <div className="flex justify-between text-[var(--sage)]">
                        <span>Order discount</span>
                        <span>−${trimZeros(order.orderDiscountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-600">
                      <span>Delivery</span>
                      <span>{Number(order.deliveryDue) > 0 ? `$${trimZeros(order.deliveryDue)}` : "Free"}</span>
                    </div>
                    <div className="flex justify-between font-bold text-stone-800 text-base border-t border-[var(--sage-light)] pt-2 mt-1">
                      <span>Total</span>
                      <span>${trimZeros(order.totalDue)}</span>
                    </div>
                  </div>

                  {/* Delivery & payment */}
                  <div className="border-t border-[var(--sage-light)] pt-3 flex flex-col gap-1.5 text-sm text-stone-600">
                    {order.address && (
                      <div className="flex gap-2">
                        <span className="font-medium shrink-0">Delivery:</span>
                        <span>{order.address}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="font-medium shrink-0">Payment:</span>
                      <span>{order.paymentMethod}</span>
                    </div>
                  </div>

                  {/* Reorder message */}
                  {reorderMessage?.orderId === order.id && (
                    <p className="text-sm text-[var(--sage)] font-medium">{reorderMessage.text}</p>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2">
                    {/* Feedback button for delivered orders */}
                    {order.status === "delivered" && (
                      order.feedbackSubmitted ? (
                        <button
                          onClick={() => handleViewFeedback(order)}
                          disabled={loadingFeedbackId === order.id}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[var(--sage-light)] text-[var(--sage)] text-sm font-semibold hover:bg-[var(--sage-light)] transition disabled:opacity-60"
                        >
                          {loadingFeedbackId === order.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <MessageCircleHeart className="w-4 h-4" />}
                          View Feedback
                        </button>
                      ) : (
                        <button
                          onClick={() => setFeedbackFormOrder({ orderId: order.id, orderNumber: order.orderNumber })}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--brand-light)] hover:bg-[oklch(0.88_0.06_22)] text-[var(--brand)] text-sm font-semibold transition"
                        >
                          <MessageCircleHeart className="w-4 h-4" />
                          Give Feedback
                        </button>
                      )
                    )}

                    {/* Reorder button */}
                    {order.items.some(i => i.itemType === "product") && (
                      <button
                        onClick={() => handleReorder(order)}
                        disabled={reorderingId === order.id}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold transition disabled:opacity-60"
                      >
                        <RotateCcw className={`w-4 h-4 ${reorderingId === order.id ? "animate-spin" : ""}`} />
                        {reorderingId === order.id ? "Adding to cart…" : "Reorder"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Feedback form modal */}
      {feedbackFormOrder && customer && (
        <FeedbackFormModal
          customerId={customer.id}
          orderId={feedbackFormOrder.orderId}
          orderNumber={feedbackFormOrder.orderNumber}
          initialData={feedbackFormOrder.initialData}
          onClose={() => setFeedbackFormOrder(null)}
          onSubmitted={(updatedFeedback) => {
            setFeedbackFormOrder(null);
            setOrders(prev => prev.map(o =>
              o.id === feedbackFormOrder.orderId ? { ...o, feedbackSubmitted: true } : o
            ));
            if (feedbackFormOrder.initialData) {
              setViewFeedback({ orderId: feedbackFormOrder.orderId, orderNumber: feedbackFormOrder.orderNumber, feedback: updatedFeedback });
            }
          }}
        />
      )}

      {/* View feedback modal */}
      {viewFeedback && (
        <FeedbackViewModal
          orderNumber={viewFeedback.orderNumber}
          feedback={viewFeedback.feedback}
          onClose={() => setViewFeedback(null)}
          onEdit={() => {
            const { orderId, orderNumber, feedback } = viewFeedback;
            setViewFeedback(null);
            setFeedbackFormOrder({ orderId, orderNumber, initialData: feedback });
          }}
        />
      )}
    </div>
  );
}
