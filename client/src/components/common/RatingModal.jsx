import { useState } from "react";
import { Star, X, Loader2, CheckCircle } from "lucide-react";
import { submitRating } from "../../services/ratingService.js";

export default function RatingModal({ order, onClose, onSuccess }) {
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [comment,   setComment]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  const handleSubmit = async () => {
    if (!rating) { setError("Please select a star rating."); return; }
    setError(""); setSubmitting(true);
    try {
      await submitRating(order.id, rating, comment, order.lineItems[0].productId);
      setSuccess(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  };

  const starLabel = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Rate this Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-5">
          <img
            src={`https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/${order.imageCID}`}
            alt={order.name}
            className="w-12 h-12 object-cover rounded-lg border border-gray-100 flex-shrink-0"
            onError={e => { e.target.style.display = "none"; }}
          />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{order.name}</p>
            <p className="text-xs text-gray-400">Order #{order.id} · {order.quantity} pc{order.quantity > 1 ? "s" : ""}</p>
          </div>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <p className="font-semibold text-gray-900">Rating Submitted!</p>
            <p className="text-sm text-gray-400">Thank you for your feedback.</p>
          </div>
        ) : (
          <>
            {/* Stars */}
            <div className="flex flex-col items-center mb-5">
              <div className="flex gap-2 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        star <= (hovered || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {(hovered || rating) > 0 && (
                <p className="text-sm font-semibold text-amber-500">
                  {starLabel[hovered || rating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Review <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={3}
                maxLength={500}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</p>
            </div>

            {error && (
              <p className="text-xs text-red-500 mb-3">{error}</p>
            )}

            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!rating || submitting}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                Submit Rating
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}