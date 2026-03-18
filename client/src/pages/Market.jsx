import React, { useState, useEffect } from "react";
import FilterCard from "../components/common/FilterCard.jsx";
import ProductCard from "../components/common/ProductCard.jsx";
import { getAllProducts } from "../services/productService.js";
import { getProductRatings } from "../services/ratingService.js";
import Loader from "../components/common/Loader.jsx";
import { Outlet, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Search, Leaf } from "lucide-react";

const toArray = (data) =>
  Array.isArray(data) ? data : (data?.products ?? []);

const applyFilters = (list, { keyword, category, priceRange, rating }) =>
  list.filter((p) => {
    if (keyword    && !p.name?.toLowerCase().includes(keyword.toLowerCase())) return false;
    if (category   && p.category !== category)                                return false;
    if (priceRange[0] !== "" && Number(p.pricePerUnit) < Number(priceRange[0])) return false;
    if (priceRange[1] !== "" && Number(p.pricePerUnit) > Number(priceRange[1])) return false;
    if (rating > 0 && Number(p.averageRating ?? 0) < rating)                 return false;
    return true;
  });

const Marketplace = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";

  const [category,   setCategory]   = useState("");
  const [priceRange, setPriceRange] = useState(["", ""]);
  const [rating,     setRating]     = useState(0);

  const [allProducts, setAllProducts] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showFilter,  setShowFilter]  = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data     = await getAllProducts();
        const products = toArray(data);

        // Fetch ratings one by one with delay to avoid race conditions
        const withRatings = await Promise.all(
          products.map(async (p) => {
            try {
              const res = await getProductRatings(p.id);
              // res is the full response: { productId, averageRating, totalRatings, ratings }
              return {
                ...p,
                averageRating: Number(res?.averageRating ?? 0),
                totalRatings:  Number(res?.totalRatings  ?? 0),
              };
            } catch {
              return { ...p, averageRating: 0, totalRatings: 0 };
            }
          })
        );

        if (!cancelled) setAllProducts(withRatings);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        if (!cancelled) setAllProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = applyFilters(allProducts, { keyword, category, priceRange, rating });

  const activeFilterCount = [
    category !== "",
    priceRange[0] !== "" || priceRange[1] !== "",
    rating > 0,
  ].filter(Boolean).length;

  const filterProps = {
    category, setCategory,
    priceRange, setPriceRange,
    rating, setRating,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />

      <div className="px-4 pt-6 pb-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              {keyword ? (
                <>Results for <span className="text-green-600">"{keyword}"</span></>
              ) : (
                <><Leaf className="w-7 h-7 text-green-600" /> Marketplace</>
              )}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {loading
                ? "Loading products…"
                : `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found`}
            </p>
          </div>

          <button onClick={() => setShowFilter(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold shadow-sm">
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-green-700 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilter && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilter(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Filters</h2>
              <button onClick={() => setShowFilter(false)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            <FilterCard {...filterProps} />
            <button onClick={() => setShowFilter(false)}
              className="mt-4 w-full py-3 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700 transition-colors">
              Show {filtered.length} Products
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-5 flex gap-6">
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-[133px]">
            <FilterCard {...filterProps} />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
              <Loader className="w-10" />
              <p className="text-sm">Loading products…</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
              <Search size={40} className="text-gray-200" />
              <p className="text-base font-semibold text-gray-500">No products found</p>
              <p className="text-sm">Try adjusting your filters or search term</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Marketplace;