"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Star, Loader2 } from "lucide-react";
import { storefrontApi } from "@/lib/api";

interface Props {
  customerId?: number;
  existingReviewId?: number;
  initialRating?: number;
  initialText?: string;
  isGuest: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              n <= (hover || value) ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function GeneralReviewFormModal({
  customerId, existingReviewId, initialRating = 0, initialText = "", isGuest, onClose, onSubmitted,
}: Props) {
  const isEditing = !!existingReviewId;
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState(initialText);
  const [guestEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) { setError("Please select a star rating."); return; }
    setSubmitting(true);
    setError(null);
    try {
      if (isEditing && customerId) {
        await storefrontApi.updateGeneralReview(existingReviewId!, customerId, { rating, reviewText: text.trim() || undefined });
      } else {
        await storefrontApi.submitGeneralReview({
          customerId: customerId ?? undefined,
          guestEmail: isGuest && guestEmail.trim() ? guestEmail.trim() : undefined,
          rating,
          reviewText: text.trim() || undefined,
        });
      }
      onSubmitted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--sage-light)]">
          <h2 className="font-bold text-stone-800 text-lg">{isEditing ? "Edit Your Review" : "Leave a Review"}</h2>
          <button onClick={onClose} className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[var(--sage-light)] transition" aria-label="Close">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          <div>
            <p className="font-semibold text-stone-700 mb-2">Your Rating <span className="text-[var(--brand)]">*</span></p>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div>
            <p className="font-semibold text-stone-700 mb-2">Your Review <span className="text-stone-400 text-sm font-normal">(optional)</span></p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Tell us about your experience with MaBelle Bites…"
              rows={4}
              maxLength={1000}
              className="w-full rounded-xl border border-[var(--sage-light)] px-4 py-3 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] resize-none"
            />
            <p className="text-xs text-stone-400 mt-1 text-right">{text.length}/1000</p>
          </div>

          {isGuest && !isEditing && (
            <div>
              <p className="font-semibold text-stone-700 mb-2">Email <span className="text-stone-400 text-sm font-normal">(optional — shown masked)</span></p>
              <input
                type="email"
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-[var(--sage-light)] px-4 py-3 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
              />
            </div>
          )}

          {!isEditing && (
            <p className="text-xs text-stone-400 bg-[var(--cream)] rounded-xl px-4 py-3">
              Your review will be visible after approval by our team. Thank you for sharing your experience! 💕
            </p>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--sage-light)] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--sage-light)] text-stone-600 text-sm font-semibold hover:bg-[var(--sage-light)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Saving…" : isEditing ? "Save Changes" : "Submit Review"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
