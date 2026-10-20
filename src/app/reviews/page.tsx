import { Star, MessageCircleHeart } from "lucide-react";
import { type PublicReview, type GeneralReview } from "@/lib/api";
import { cachedStorefrontApi } from "@/lib/cached-storefront";
import { cacheLife } from "next/cache";
import GeneralReviewsSection from "./general-reviews-section";

function StarDisplay({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`${sz} ${n <= value ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}`} />
      ))}
    </div>
  );
}

function OrderReviewCard({ review }: { review: PublicReview }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--sage-light)] shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--brand-light)] flex items-center justify-center shrink-0">
            <span className="text-[var(--brand)] font-bold text-sm">{review.displayName.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-stone-800 text-sm">{review.displayName}</p>
            <p className="text-xs text-stone-400 mt-0.5">
              {new Date(review.submittedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
        <StarDisplay value={review.overallRating} size="sm" />
      </div>
      {review.writtenFeedback && (
        <p className="text-sm text-stone-600 leading-relaxed">{review.writtenFeedback}</p>
      )}
    </div>
  );
}

export default async function ReviewsPage() {
  'use cache';
  cacheLife('minutes');
  const [orderReviews, generalReviews] = await Promise.all([
    cachedStorefrontApi.publicReviews().catch(() => [] as PublicReview[]),
    cachedStorefrontApi.generalReviews().catch(() => [] as GeneralReview[]),
  ]);

  const allRatings = [
    ...orderReviews.map(r => r.overallRating),
    ...generalReviews.map(r => r.rating),
  ];
  const totalCount = allRatings.length;
  const avgRating = totalCount
    ? Math.round((allRatings.reduce((s, r) => s + r, 0) / totalCount) * 10) / 10
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--brand-light)] mb-4">
          <MessageCircleHeart className="w-7 h-7 text-[var(--brand)]" />
        </div>
        <h1 className="text-3xl font-bold text-stone-800">Customer Reviews</h1>
        <p className="text-stone-500 mt-2">Real feedback from our lovely customers 💕</p>

        {avgRating !== null && totalCount > 0 && (
          <div className="inline-flex items-center gap-3 mt-4 bg-white border border-[var(--sage-light)] rounded-2xl px-6 py-3 shadow-sm">
            <StarDisplay value={Math.round(avgRating)} size="lg" />
            <div className="text-left">
              <p className="font-bold text-stone-800 text-xl">{avgRating.toFixed(1)}</p>
              <p className="text-xs text-stone-400">{totalCount} review{totalCount !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}
      </div>

      {/* General Reviews (interactive — client component) */}
      <GeneralReviewsSection initialReviews={generalReviews} />

      {/* Order-based Reviews */}
      {orderReviews.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-stone-800 mb-4">Order Reviews</h2>
          <div className="flex flex-col gap-4">
            {orderReviews.map(review => (
              <OrderReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
