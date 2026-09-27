"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { easings } from "@/components/motion/constants";
import { useAuth } from "@/hooks/use-auth";
import { loginWithGoogle } from "@/lib/auth-actions";
import { ReviewCarousel } from "@/components/review/ReviewCarousel";
import type { PublicReview } from "@/lib/reviews";
import {
  Star,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ProductReviewsProps {
  productId: string;
  reviews: PublicReview[];
}

export function ProductReviews({ productId, reviews: initialReviews }: ProductReviewsProps) {
  const prefersReducedMotion = useReducedMotion();
  const { user, isLoading: authLoading } = useAuth();
  const [reviews] = useState<PublicReview[]>(initialReviews || []);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  // Rating distribution breakdown (5 stars down to 1 star)
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage:
      reviews.length > 0
        ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
        : 0,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await loginWithGoogle(window.location.pathname);
      return;
    }

    if (reviewText.trim().length === 0) {
      setSubmitError("Review text cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        productId,
        rating: Number(rating),
        reviewText: reviewText.trim(),
      };

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      setSubmitSuccess(true);
      setReviewText("");
      setRating(5);
    } catch (error: any) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-24 pt-16 border-t border-brand-gray-100 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header and Aggregate Rating Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.5, ease: easings.premium }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block mb-2">
          Verified Feedback
        </span>
        <h2 className="font-serif text-3xl md:text-4xl text-brand-dark mb-4">Customer Reviews</h2>

        {reviews.length > 0 ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-serif text-4xl text-brand-dark font-medium">{averageRating}</span>
              <div>
                <div className="flex items-center text-amber-500 text-lg">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s}>
                      {s <= Math.round(Number(averageRating)) ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                <div className="font-mono text-xs text-brand-gray-500 text-left">
                  Based on {reviews.length} approved {reviews.length === 1 ? "review" : "reviews"}
                </div>
              </div>
            </div>

            {/* Quick rating breakdown bars */}
            <div className="w-full max-w-xs space-y-1.5 mt-4 pt-4 border-t border-brand-gray-100">
              {ratingCounts.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-2 text-xs font-mono text-brand-gray-500">
                  <span className="w-7 text-right">{star} ★</span>
                  <div className="flex-1 h-2 bg-brand-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${percentage}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: prefersReducedMotion ? 0.01 : 0.65, ease: easings.premium }}
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </div>
                  <span className="w-6 text-brand-gray-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="font-mono text-sm text-brand-gray-400">
            Be the first verified customer to share feedback on this shoe.
          </p>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Review Showcase: Polished Carousel with Mobile Swipe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.55, ease: easings.premium }}
          className="lg:col-span-7"
        >
          <ReviewCarousel
            reviews={reviews}
            title={reviews.length > 0 ? "What Customers Are Saying" : undefined}
            subtitle={reviews.length > 0 ? "Swipe or use navigation arrows to browse reviews" : undefined}
          />
        </motion.div>

        {/* Review Submission Form (Normal customer text & star review) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.55, delay: prefersReducedMotion ? 0 : 0.1, ease: easings.premium }}
          className="lg:col-span-5"
        >
          <div className="bg-brand-sky/20 border border-brand-sky-border/40 p-6 sm:p-8 rounded-2xl shadow-xs">
            <h3 className="font-serif text-2xl mb-2 text-brand-dark">Write a Review</h3>
            <p className="text-xs text-brand-gray-500 mb-6 font-mono leading-relaxed">
              Reviews are authenticated and reviewed by our moderation team before appearing publicly.
            </p>

            {submitSuccess ? (
              <div className="bg-emerald-50 text-emerald-800 p-5 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-medium text-emerald-900">
                  <CheckCircle size={18} className="text-emerald-600" />
                  Review Submitted Successfully!
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed font-mono">
                  Thank you for your feedback! Your review has been received and will be displayed once approved by our moderation team.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitSuccess(false)}
                  className="mt-3 text-xs font-mono uppercase tracking-wider text-emerald-800 hover:underline inline-block font-semibold"
                >
                  Write another review
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Star Rating Picker */}
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-brand-dark font-medium mb-2">
                    Rating <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isHovered = hoverRating !== null && hoverRating >= star;
                      const isSelected = hoverRating === null && rating >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1 focus:outline-none transition-transform hover:scale-110"
                          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        >
                          <Star
                            size={28}
                            className={`transition-colors ${
                              isHovered || isSelected
                                ? "text-amber-500 fill-amber-500"
                                : "text-brand-gray-300"
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="font-mono text-xs text-brand-gray-500 ml-2">
                      {hoverRating || rating} / 5
                    </span>
                  </div>
                </div>

                {/* Review Text Area */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="review-text"
                      className="font-mono text-xs uppercase tracking-widest text-brand-dark font-medium"
                    >
                      Your Review <span className="text-rose-500">*</span>
                    </label>
                    <span className="font-mono text-[10px] text-brand-gray-400">
                      {reviewText.length}/2000
                    </span>
                  </div>
                  <textarea
                    id="review-text"
                    required
                    value={reviewText}
                    maxLength={2000}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full border border-brand-gray-200 bg-white p-3.5 text-sm focus:outline-none focus:border-brand-navy rounded-xl transition-colors min-h-[130px] leading-relaxed resize-y"
                    placeholder="Share details about the comfort, fit, sizing, and quality..."
                  />
                </div>

                {/* Submission Error Banner */}
                {submitError && (
                  <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 p-3 rounded-lg border border-rose-200 font-mono">
                    <AlertCircle size={15} className="shrink-0 text-rose-500" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Submit / Sign-in Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || authLoading}
                  className="w-full bg-brand-navy hover:bg-brand-blue text-white font-mono text-xs uppercase tracking-widest py-3.5 px-4 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 font-medium"
                >
                  {authLoading
                    ? "Authenticating..."
                    : isSubmitting
                    ? "Submitting Review..."
                    : user
                    ? "Submit for Moderation"
                    : "Sign In with Google to Review"}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
