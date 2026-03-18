import { useState } from "react";
import { MapPin, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProductCard = ({ product }) => {
  console.log(product)
  const navigate     = useNavigate();
  const avgRating    = product.averageRating ?? 0;
  const totalRatings = product.totalRatings  ?? 0;
  const filledStars  = Math.round(avgRating);

  // Support both variant-based and legacy single-price products
  const variants = product.variants?.length
    ? product.variants
    : [{ label: "default", pricePerUnit: product.pricePerUnit, stock: product.stock }];

  const [selIdx, setSelIdx] = useState(0);
  const v = variants[selIdx] ?? variants[0];

  const totalStock = variants.reduce((s, vr) => s + Number(vr.stock ?? 0), 0);

  return (
    <div
      onClick={() => navigate(`/products/${product.id}`)}
      className="group cursor-pointer bg-white rounded-2xl border border-gray-100 hover:border-green-400 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden w-full"
    >
      {/* Image */}
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        <img
          src={`https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/${product.imageCID}`}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {totalStock <= 10 && totalStock > 0 && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Low Stock
          </span>
        )}
        {totalStock === 0 && (
          <span className="absolute top-2 left-2 bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Out of Stock
          </span>
        )}
        {variants.length > 1 && (
          <span className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {variants.length} sizes
          </span>
        )}
        <div className="absolute inset-0 bg-green-600/0 group-hover:bg-green-600/10 transition-all duration-300 flex items-end justify-end p-2">
          <div className="bg-green-600 text-white rounded-full p-2 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
            <ShoppingCart size={14} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-green-700 transition-colors">
          {product.name}
        </h3>

        {/* Variant pills — stop propagation so clicking doesn't navigate */}
        {variants.length > 1 && (
          <div
            className="flex flex-wrap gap-1"
            onClick={e => e.stopPropagation()}
          >
            {variants.map((vr, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setSelIdx(i); }}
                className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold transition-all
                  ${selIdx === i
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:border-green-400"}`}
              >
                {vr.label}
              </button>
            ))}
          </div>
        )}

        {/* Price + stock for selected variant */}
        <div className="flex items-center justify-between">
          <span className="text-green-600 font-black text-base">
            {Number(v.pricePerUnit).toFixed(2)}
            <span className="text-xs font-semibold text-green-500 ml-0.5">AGT</span>
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
            ${Number(v.stock) === 0
              ? "bg-red-50 text-red-500 border-red-200"
              : Number(v.stock) <= 10
              ? "bg-orange-50 text-orange-600 border-orange-200"
              : "bg-gray-50 text-gray-400 border-gray-100"}`}>
            {Number(v.stock) === 0 ? "sold out" : `${v.stock} left`}
          </span>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Rating + Location */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i}
                className={`w-3 h-3 ${i < filledStars ? "text-yellow-400" : "text-gray-200"}`}
                fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.176c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.176 0l-3.38 2.454c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.049 9.397c-.783-.57-.38-1.81.588-1.81h4.176a1 1 0 00.95-.69l1.286-3.97z" />
              </svg>
            ))}
            <span className="text-gray-400 text-[10px] ml-1">
              {avgRating > 0 ? avgRating : "No ratings"}
              {totalRatings > 0 && ` (${totalRatings})`}
            </span>
          </div>

          <div className="flex items-center gap-1 text-gray-400 text-[10px] max-w-[50%]">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0 text-green-400" />
            <span className="truncate">
              {product.ownerAddress?.barangay}, {product.ownerAddress?.city}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;