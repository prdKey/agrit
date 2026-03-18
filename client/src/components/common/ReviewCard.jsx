import { Star } from "lucide-react";

const StarDisplay = ({ rating, size = "sm" }) => {
  const w = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`${w} ${i < rating ? "text-yellow-400" : "text-gray-200"}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.176c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.176 0l-3.38 2.454c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.049 9.397c-.783-.57-.38-1.81.588-1.81h4.176a1 1 0 00.95-.69l1.286-3.97z" />
        </svg>
      ))}
    </div>
  );
};

// Rating breakdown bar (e.g. 5★ ████░ 60%)
const RatingBar = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-4 text-right">{star}</span>
      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="bg-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-400 w-6">{count}</span>
    </div>
  );
};

export default function ReviewCard({ reviews = [], averageRating = 0, totalRatings = 0 }) {
  // Count per star
  const starCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  const fmtDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  };

  const shortAddr = (addr) => {
    if (!addr) return "Buyer";
    return `${addr.slice(0, 4)}****${addr.slice(-3)}`;
  };

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-lg font-bold text-gray-900 mb-5">
        Product Reviews {totalRatings > 0 && <span className="text-gray-400 font-normal text-sm">({totalRatings})</span>}
      </h2>

      {totalRatings === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium text-gray-500">No reviews yet</p>
          <p className="text-sm mt-1">Be the first to review this product</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-gray-100">
            {/* Average */}
            <div className="flex flex-col items-center justify-center min-w-[100px]">
              <p className="text-5xl font-black text-gray-900">{averageRating}</p>
              <StarDisplay rating={Math.round(averageRating)} size="md" />
              <p className="text-xs text-gray-400 mt-1">{totalRatings} review{totalRatings > 1 ? "s" : ""}</p>
            </div>

            {/* Breakdown */}
            <div className="flex-1 space-y-1.5">
              {starCounts.map(({ star, count }) => (
                <RatingBar key={star} star={star} count={count} total={totalRatings} />
              ))}
            </div>
          </div>

          {/* Individual reviews */}
          <div className="space-y-5">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{shortAddr(review.buyerAddress)}</p>
                    <StarDisplay rating={review.rating} size="sm" />
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0 ml-3">{fmtDate(review.createdAt)}</p>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed mt-1">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}