import React from "react";
import { RotateCcw } from "lucide-react";

const CATEGORIES = ["Fruits", "Vegetables", "Grains", "Dairy"];

const FilterCard = ({
  category,  setCategory,
  priceRange, setPriceRange,
  rating,    setRating,
}) => {

  const handleReset = () => {
    setCategory("");
    setPriceRange(["", ""]);
    setRating(0);
  };

  const hasFilters = category || priceRange[0] || priceRange[1] || rating > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Filters</h2>
        {hasFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-green-600 font-semibold hover:text-green-700 transition-colors"
          >
            <RotateCcw size={11} /> Reset
          </button>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Category</h3>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setCategory("")}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
              category === ""
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600"
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                category === cat
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Price Range */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Price Range (AGT)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([e.target.value, priceRange[1]])}
            placeholder="Min"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <span className="text-gray-300 text-xs flex-shrink-0">—</span>
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], e.target.value])}
            placeholder="Max"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Rating */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Minimum Rating</h3>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5].map(r => (
            <button
              key={r}
              onClick={() => setRating(r)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                rating === r
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-green-400"
              }`}
            >
              {r === 0 ? "All" : `${r}★`}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default FilterCard;