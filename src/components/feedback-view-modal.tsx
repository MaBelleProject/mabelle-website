"use client";

import { createPortal } from "react-dom";
import { X, Star, Pencil } from "lucide-react";
import { type OrderFeedback, fileUrl } from "@/lib/api";
import CountryFlag from "./country-flag";

interface Props {
  orderNumber: string;
  feedback: OrderFeedback;
  onClose: () => void;
  onEdit?: () => void;
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`w-5 h-5 ${n <= value ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}`}
        />
      ))}
    </div>
  );
}

export default function FeedbackViewModal({ orderNumber, feedback, onClose, onEdit }: Props) {
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
            <h2 className="font-bold text-stone-800 text-lg">Your Feedback</h2>
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

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Overall */}
          <div>
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-2">Overall Rating</p>
            <StarDisplay value={feedback.overallRating} />
          </div>

          {feedback.writtenFeedback && (
            <div>
              <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-2">Your Comment</p>
              <p className="text-sm text-stone-700 leading-relaxed bg-[var(--background)] rounded-xl px-4 py-3">
                {feedback.writtenFeedback}
              </p>
            </div>
          )}

          {feedback.productRatings.length > 0 && (
            <div>
              <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-3">Product Ratings</p>
              <div className="flex flex-col gap-3">
                {feedback.productRatings.map(pr => {
                  const imgUrl = fileUrl(pr.productImageUrl ?? undefined);
                  return (
                    <div key={pr.id} className="rounded-xl border border-[var(--sage-light)] p-4 flex gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[var(--background)] overflow-hidden shrink-0 border border-[var(--sage-light)]">
                        {imgUrl ? (
                          <img src={imgUrl} alt={pr.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300 text-xl">🍬</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1.5 mb-1">
                          <p className="min-w-0 text-sm font-medium text-stone-800 line-clamp-2">{pr.productName}</p>
                          <CountryFlag productId={pr.productId} className="mt-[3px] w-4 h-3" />
                        </div>
                        <div className="flex gap-0.5 mb-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} className={`w-4 h-4 ${n <= pr.rating ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}`} />
                          ))}
                        </div>
                        {pr.comment && <p className="text-xs text-stone-500">{pr.comment}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-xs text-stone-400 text-center">
            Submitted {new Date(feedback.submittedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--sage-light)] flex gap-3">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 py-2.5 rounded-xl border border-[var(--brand)] text-[var(--brand)] text-sm font-semibold hover:bg-[var(--brand-light)] transition flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit Feedback
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--sage-light)] text-stone-600 text-sm font-semibold hover:bg-[var(--sage-light)] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
