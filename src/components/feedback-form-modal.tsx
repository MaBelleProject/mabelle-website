"use client";

import { fileUrl, storefrontApi, type FeedbackProduct, type OrderFeedback, type ProductFeedbackRating } from "@/lib/api";
import Image from "next/image";
import { Loader2, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CountryFlag from "./country-flag";

interface Props {
  customerId: number;
  orderId: number;
  orderNumber: string;
  onClose: () => void;
  onSubmitted: (feedback: OrderFeedback) => void;
  /** When provided, the modal is in edit mode: form is pre-filled and uses the update endpoint. */
  initialData?: OrderFeedback;
}

function StarRating({ value, onChange, size = "md" }: { value: number; onChange?: (v: number) => void; size?: "sm" | "md" }) {
  const [hover, setHover] = useState(0);
  const sz = size === "sm" ? "w-5 h-5" : "w-7 h-7";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`${onChange ? "cursor-pointer" : "cursor-default"} focus:outline-none`}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
        >
          <Star
            className={`${sz} transition-colors ${n <= (hover || value)
              ? "fill-amber-400 text-amber-400"
              : "fill-stone-200 text-stone-200"
              }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackFormModal({ customerId, orderId, orderNumber, onClose, onSubmitted, initialData }: Props) {
  const isEditing = !!initialData;
  const [products, setProducts] = useState<FeedbackProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [overallRating, setOverallRating] = useState(initialData?.overallRating ?? 0);
  const [writtenFeedback, setWrittenFeedback] = useState(initialData?.writtenFeedback ?? "");
  const [productRatings, setProductRatings] = useState<Record<number, { rating: number; comment: string }>>(() => {
    if (!initialData) return {};
    return Object.fromEntries(
      initialData.productRatings.map(pr => [pr.productId, { rating: pr.rating, comment: pr.comment ?? "" }])
    );
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    storefrontApi.getOrderFeedbackProducts(customerId, orderId)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [customerId, orderId]);

  const setProductRating = (productId: number, rating: number) => {
    setProductRatings(prev => ({ ...prev, [productId]: { ...prev[productId], rating, comment: prev[productId]?.comment ?? "" } }));
  };

  const setProductComment = (productId: number, comment: string) => {
    setProductRatings(prev => ({ ...prev, [productId]: { rating: prev[productId]?.rating ?? 0, comment } }));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) { setError("Please give an overall rating before submitting."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const productRatingList: ProductFeedbackRating[] = products
        .filter(p => productRatings[p.productId]?.rating > 0)
        .map(p => ({
          productId: p.productId,
          productName: p.productName,
          productImageUrl: p.productImageUrl ?? undefined,
          rating: productRatings[p.productId].rating,
          comment: productRatings[p.productId].comment || undefined,
        }));
      const payload = {
        overallRating,
        writtenFeedback: writtenFeedback.trim() || undefined,
        productRatings: productRatingList,
      };
      const result = isEditing
        ? await storefrontApi.updateOrderFeedback(customerId, orderId, payload)
        : await storefrontApi.submitOrderFeedback(customerId, orderId, payload);
      onSubmitted(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--sage-light)]">
          <div>
            <h2 className="font-bold text-stone-800 text-lg">{isEditing ? "Edit Feedback" : "Your Feedback"}</h2>
            <p className="text-sm text-stone-400 mt-0.5">Order {orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[var(--sage-light)] transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6">
          {/* Overall rating */}
          <div>
            <p className="font-semibold text-stone-700 mb-2">Overall Order Rating <span className="text-[var(--brand)]">*</span></p>
            <StarRating value={overallRating} onChange={setOverallRating} />
            <p className="text-xs text-stone-400 mt-1.5">Tap to rate your overall experience</p>
          </div>

          {/* Written feedback */}
          <div>
            <p className="font-semibold text-stone-700 mb-2">Written Feedback <span className="text-stone-400 text-sm font-normal">(optional)</span></p>
            <textarea
              value={writtenFeedback}
              onChange={e => setWrittenFeedback(e.target.value)}
              placeholder="Tell us about your experience…"
              rows={3}
              className="w-full rounded-xl border border-[var(--sage-light)] px-4 py-3 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] resize-none"
            />
          </div>

          {/* Product ratings */}
          {loadingProducts ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-[var(--brand)] animate-spin" />
            </div>
          ) : products.length > 0 ? (
            <div>
              <p className="font-semibold text-stone-700 mb-3">Rate Individual Products <span className="text-stone-400 text-sm font-normal">(optional)</span></p>
              <div className="flex flex-col gap-4">
                {products.map(p => {
                  const imgUrl = fileUrl(p.productImageUrl);
                  const currentRating = productRatings[p.productId]?.rating ?? 0;
                  const currentComment = productRatings[p.productId]?.comment ?? "";
                  return (
                    <div key={p.productId} className="rounded-xl border border-[var(--sage-light)] p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-[var(--background)] overflow-hidden shrink-0 border border-[var(--sage-light)]">
                          {imgUrl ? (
                            <Image src={imgUrl} alt={p.productName} fill sizes="48px" className="object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300 text-xl">🍬</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-1.5">
                            <p className="min-w-0 text-sm font-medium text-stone-800 line-clamp-2">{p.productName}</p>
                            <CountryFlag productId={p.productId} className="mt-[3px] w-4 h-3" />
                          </div>
                          <StarRating value={currentRating} onChange={v => setProductRating(p.productId, v)} size="sm" />
                        </div>
                      </div>
                      {currentRating > 0 && (
                        <input
                          type="text"
                          value={currentComment}
                          onChange={e => setProductComment(p.productId, e.target.value)}
                          placeholder="Any thoughts on this product? (optional)"
                          className="w-full rounded-lg border border-[var(--sage-light)] px-3 py-2 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--sage-light)] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--sage-light)] text-stone-600 text-sm font-semibold hover:bg-[var(--sage-light)] transition"
          >
            {isEditing ? "Cancel" : "Skip / Cancel"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || overallRating === 0}
            className="flex-1 py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? (isEditing ? "Saving…" : "Submitting…") : (isEditing ? "Save Changes" : "Submit Feedback")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
