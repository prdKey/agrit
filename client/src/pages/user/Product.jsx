import ProductDetailCard from "../../components/common/ProductDetailCard.jsx";
import ReviewCard from "../../components/common/ReviewCard.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { getProductById } from "../../services/productService.js";
import { getProductRatings } from "../../services/ratingService.js";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Loader from "../../components/common/Loader.jsx";

export default function Product() {
  const { id }     = useParams();
  const [product,  setProduct]  = useState(null);
  const [ratings,  setRatings]  = useState({ averageRating: 0, totalRatings: 0, ratings: [] });
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const [productData, ratingsData] = await Promise.all([
          getProductById(id),
          getProductRatings(id).catch(() => ({ averageRating: 0, totalRatings: 0, ratings: [] })),
        ]);
        setProduct(productData.product);
        setRatings(ratingsData);
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Attach ratings to product so ProductDetails can show them
  const productWithRatings = product ? {
    ...product,
    averageRating: ratings.averageRating,
    totalRatings:  ratings.totalRatings,
  } : null;

  return (
    <div className="m-5">
      {loading ? (
        <Loader css="h-130" />
      ) : productWithRatings?.productId ? (
        <>
          <ProductDetailCard product={productWithRatings} />
          <ReviewCard
            reviews={ratings.ratings}
            averageRating={ratings.averageRating}
            totalRatings={ratings.totalRatings}
          />
        </>
      ) : (
        <EmptyState
          title="Product not found"
          actionLabel="Go Back"
          navigateTo="/"
        />
      )}
    </div>
  );
}