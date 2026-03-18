// components/common/ProductDetailCard.jsx

import { MapPin, ShoppingCart, Loader2 } from "lucide-react";
import { useState }                       from "react";
import { addToCart }                      from "../../services/cartService.js";
import Notification                        from "./Notification.jsx";
import { useUserContext }                  from "../../context/UserContext.jsx";
import { useNavigate }                     from "react-router-dom";

export default function ProductDetails({ product }) {
  const { user }     = useUserContext();
  const navigate     = useNavigate();
  const avgRating    = product.averageRating ?? 0;
  const totalRatings = product.totalRatings  ?? 0;
  const filledStars  = Math.round(avgRating);

  // ── Variants ──────────────────────────────────────────────────────────────
  const variants    = product.variants ?? [];
  const hasVariants = variants.length > 0;

  const [selVariant, setSelVariant] = useState(hasVariants ? 0 : null);

  // Active price & stock depend on selected variant or base product
  const activePrice = hasVariants
    ? variants[selVariant]?.pricePerUnit ?? 0
    : product.pricePerUnit ?? 0;

  const activeStock = hasVariants
    ? variants[selVariant]?.stock ?? 0
    : product.stock ?? 0;

  const activeLabel = hasVariants ? variants[selVariant]?.label : null;

  // ── Quantity ──────────────────────────────────────────────────────────────
  const [quantity, setQuantity] = useState(1);

  // Reset quantity when variant changes
  const handleVariantChange = (i) => {
    setSelVariant(i);
    setQuantity(1);
  };

  const increment = () => setQuantity(q => Math.min(q + 1, activeStock));
  const decrement = () => setQuantity(q => Math.max(q - 1, 1));

  // ── Cart / Buy ────────────────────────────────────────────────────────────
  const [addingToCart,  setAddingToCart]  = useState(false);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (msg, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message: msg, type }]);
    setTimeout(() => removeNotification(id), 3000);
  };
  const removeNotification = (id) =>
    setNotifications(prev => prev.filter(n => n.id !== id));

  // FIX: Added sellerAddress to cartPayload so CheckoutPage can group items
  // by seller and the contract's BatchSellerMismatch guard is never triggered.
  // Also fixed quantity — it was passed as a separate arg but addToCart expects
  // it inside the payload object.
  const cartPayload = () => ({
    productId:     product.productId ?? product.id,
    name:          hasVariants ? `${product.name} (${activeLabel})` : product.name,
    pricePerUnit:  activePrice,
    imageCID:      product.imageCID,
    category:      product.category,
    stock:         activeStock,
    sellerAddress: product.sellerAddress ?? null,  // FIX: was missing entirely
    variantLabel:  activeLabel ?? null,
    variantIndex:  selVariant,
    quantity,
  });

  const handleAddToCart = async () => {
    if (addingToCart) return;
    if (hasVariants && selVariant === null) {
      addNotification("Please select a variant first.", "error");
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart(cartPayload());  // FIX: quantity is now inside the payload
      addNotification(`"${product.name}${activeLabel ? ` (${activeLabel})` : ""}" added to cart!`, "success");
    } catch (err) {
      addNotification(err.response?.data?.error || "Failed to add to cart.", "error");
    } finally {
      setAddingToCart(false);
    }
  };

  // FIX: handleBuy also passes sellerAddress so "Buy Now" (direct to checkout)
  // works correctly without going through the cart.
  const handleBuy = () => {
    if (hasVariants && selVariant === null) {
      addNotification("Please select a variant first.", "error");
      return;
    }
    navigate("/checkout", {
      state: {
        items: [cartPayload()],  // FIX: cartPayload already includes quantity + sellerAddress
      },
    });
  };

  const isOwnProduct =
    user && product.sellerAddress &&
    user.walletAddress?.toLowerCase() === product.sellerAddress?.toLowerCase();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Image */}
        <div className="bg-gray-50 rounded-lg flex max-h-100 items-center justify-center overflow-hidden">
          <img
            src={`https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/${product.imageCID}`}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between h-full">
          <div>
            {/* Title */}
            <h1 className="text-lg sm:text-xl font-semibold mt-2">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i}
                    className={`w-4 h-4 ${i < filledStars ? "text-yellow-400" : "text-gray-300"}`}
                    fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.176c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.176 0l-3.38 2.454c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.049 9.397c-.783-.57-.38-1.81.588-1.81h4.176a1 1 0 00.95-.69l1.286-3.97z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {avgRating > 0 ? avgRating : "No ratings yet"}
                {totalRatings > 0 && ` · ${totalRatings} review${totalRatings > 1 ? "s" : ""}`}
              </span>
            </div>

            {/* Price — updates with variant */}
            <p className="text-green-600 text-2xl font-bold mt-2">
              {Number(activePrice).toFixed(2)} AGT
              {activeLabel && (
                <span className="text-sm font-normal text-gray-400 ml-2">/ {activeLabel}</span>
              )}
            </p>

            {/* Stock — updates with variant */}
            <p className={`text-sm mt-1 ${activeStock <= 5 ? "text-orange-500 font-medium" : "text-gray-500"}`}>
              {activeStock === 0
                ? "Out of stock"
                : activeStock <= 5
                  ? `Only ${activeStock} left!`
                  : `Stock available: ${activeStock}`}
            </p>

            <p className="text-gray-500 text-sm mt-1">Category: {product.category}</p>

            <div className="flex items-center gap-2 text-gray-500 text-sm mt-3">
              <MapPin className="w-4 h-4" />
              Dagupan, Pangasinan
            </div>

            {/* ── Variant selector ──────────────────────────────────────── */}
            {hasVariants && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Size / Weight <span className="text-red-400">*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => handleVariantChange(i)}
                      disabled={v.stock === 0}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all
                        ${selVariant === i
                          ? "bg-green-600 text-white border-green-600"
                          : v.stock === 0
                            ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed line-through"
                            : "bg-white text-gray-700 border-gray-300 hover:border-green-500 hover:text-green-600"
                        }`}
                    >
                      {v.label}
                      <span className={`ml-1.5 text-[10px] font-normal ${selVariant === i ? "text-green-200" : "text-gray-400"}`}>
                        {Number(v.pricePerUnit).toFixed(2)} AGT
                      </span>
                    </button>
                  ))}
                </div>
                {selVariant === null && (
                  <p className="text-xs text-orange-500 mt-1">Please select a size/weight to continue.</p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3 mt-5">
              <span className="text-sm font-medium text-gray-500">Quantity</span>
              <div className="flex items-center justify-center border border-gray-300 rounded-lg overflow-hidden">
                <button onClick={decrement} disabled={quantity <= 1}
                  className="cursor-pointer px-3 py-1 hover:bg-gray-100 text-gray-500 disabled:opacity-40">−</button>
                <span className="px-4 py-1 text-sm text-gray-700 font-medium min-w-[2rem] text-center">{quantity}</span>
                <button onClick={increment} disabled={quantity >= activeStock}
                  className="cursor-pointer px-3 py-1 hover:bg-gray-100 text-gray-500 disabled:opacity-40">+</button>
              </div>
              {hasVariants && selVariant !== null && (
                <span className="text-xs text-gray-400">{activeStock} available</span>
              )}
            </div>
          </div>

          {/* Actions */}
          {isOwnProduct ? (
            <div className="flex mt-6">
              <button disabled className="flex-1 border border-gray-300 text-gray-400 rounded-lg py-2 text-sm cursor-not-allowed">
                You cannot purchase your own product.
              </button>
            </div>
          ) : (
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => user ? handleAddToCart() : navigate("/login")}
                disabled={addingToCart || activeStock === 0}
                className="cursor-pointer flex-1 border border-green-600 text-green-600 rounded-lg py-2 hover:bg-green-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addingToCart
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
                  : "Add to Cart"}
              </button>
              <button
                onClick={() => user ? handleBuy() : navigate("/login")}
                disabled={activeStock === 0}
                className="cursor-pointer flex-1 bg-green-600 text-white rounded-lg py-2 hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" /> Buy Now
              </button>
            </div>
          )}
        </div>
      </div>

      {notifications.map(n => (
        <Notification key={n.id} message={n.message} type={n.type} onClose={() => removeNotification(n.id)} />
      ))}
    </div>
  );
}