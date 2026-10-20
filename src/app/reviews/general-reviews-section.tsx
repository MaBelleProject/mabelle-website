"use client";

import { useCustomer } from "@/context/customer-context";
import type { GeneralReview, MyGeneralReview } from "@/lib/api";
import { storefrontApi } from "@/lib/api";
import { Pencil, PenLine, Star } from "lucide-react";
import { useState } from "react";
import GeneralReviewFormModal from "./general-review-form-modal";

function StarDisplay({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`${sz} ${n <= value ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}`} />
      ))}
    </div>
  );
}

interface Props {
  initialReviews: GeneralReview[];
}

export default function GeneralReviewsSection({ initialReviews }: Props) {
  const { customer } = useCustomer();
  const [reviews, setReviews] = useState<GeneralReview[]>(initialReviews);
  const [myReview, setMyReview] = useState<MyGeneralReview | null>(null);
  const [loadedMine, setLoadedMine] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadMyReview = async () => {
    if (!customer || loadedMine) return;
    setLoadedMine(true);
    try {
      const mine = await storefrontApi.getCustomerGeneralReviews(customer.id);
      if (mine.length > 0) setMyReview(mine[0]);
    } catch { /* ignore */ }
  };

  const handleOpenForm = () => {
    loadMyReview();
    setShowForm(true);
    setSubmitted(false);
  };

  const handleSubmitted = async () => {
    setShowForm(false);
    setSubmitted(true);
    // Refresh my review data
    if (customer) {
      try {
        const mine = await storefrontApi.getCustomerGeneralReviews(customer.id);
        if (mine.length > 0) setMyReview(mine[0]);
      } catch { /* ignore */ }
    }
    // Refresh public reviews list
    try {
      const updated = await storefrontApi.generalReviews();
      setReviews(updated);
    } catch { /* ignore */ }
  };

  const myApprovedReview = myReview?.status === 'approved'
    ? reviews.find(r => r.id === myReview.id)
    : null;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-stone-800">Mabelle Reviews</h2>
        {!submitted && (
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold transition"
          >
            <PenLine className="w-4 h-4" />
            {myReview ? "Edit My Review" : "Leave a Review"}
          </button>
        )}
      </div>

      {submitted && (
        <div className="bg-[var(--cream)] border border-[var(--sage-light)] rounded-2xl px-5 py-4 mb-4">
          <p className="font-semibold text-stone-700 text-sm">Thank you for your review! 💕</p>
          <p className="text-stone-500 text-xs mt-1">Your review will appear here after approval by our team.</p>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-stone-400 text-sm">No mabelle reviews yet — be the first to share!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl border border-[var(--sage-light)] shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-light)] flex items-center justify-center shrink-0">
                    <span className="text-[var(--brand)] font-bold text-sm">{review.displayName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-stone-800 text-sm">{review.displayName}</p>
                      {myApprovedReview?.id === review.id && (
                        <button
                          onClick={handleOpenForm}
                          className="flex items-center gap-1 text-[var(--brand)] hover:underline text-xs font-medium"
                          title="Edit your review"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(review.submittedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <StarDisplay value={review.rating} />
              </div>
              {review.reviewText && (
                <p className="text-sm text-stone-600 leading-relaxed">{review.reviewText}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <GeneralReviewFormModal
          customerId={customer?.id}
          isGuest={!customer}
          existingReviewId={myReview?.id}
          initialRating={myReview?.rating}
          initialText={myReview?.reviewText ?? ""}
          onClose={() => setShowForm(false)}
          onSubmitted={handleSubmitted}
        />
      )}
    </section>
  );
}
