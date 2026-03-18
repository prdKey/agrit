import { orderManagerContract } from "../blockchain/contract.js";
import { Rating } from "../models/index.js";

// POST /api/ratings
export const createRating = async (req, res) => {
  try {
    const { orderId, rating, comment, productId} = req.body;
    const buyerAddress = req.user.walletAddress;

    if (!orderId || !rating) {
      return res.status(400).json({ error: "orderId and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Verify order exists and is completed (status 6)
    const order = await orderManagerContract.getOrderById(orderId);
    if (Number(order.status) !== 6) {
      return res.status(400).json({ error: "You can only rate completed orders" });
    }

    // Verify buyer owns this order
    if (order.buyerAddress.toLowerCase() !== buyerAddress.toLowerCase()) {
      return res.status(403).json({ error: "You can only rate your own orders" });
    }

    // Check if already rated
    const existing = await Rating.findOne({ where: { orderId: Number(orderId) } });
    if (existing) {
      return res.status(400).json({ error: "You have already rated this order" });
    }

    const newRating = await Rating.create({
      orderId:      Number(orderId),
      productId:    Number(productId),
      buyerAddress: buyerAddress.toLowerCase(),
      rating:       Number(rating),
      comment:      comment?.trim() || null,
    });

    res.status(201).json({ message: "Rating submitted successfully", rating: newRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/ratings/product/:productId
export const getProductRatings = async (req, res) => {
  try {
    const { productId } = req.params;

    const ratings = await Rating.findAll({
      where: { productId: Number(productId) },
      order: [["createdAt", "DESC"]],
      raw: true, // ← returns plain objects including all fields like comment
    });

    const avg = ratings.length
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;
    res.json({
      productId:     Number(productId),
      averageRating: parseFloat(avg.toFixed(1)),
      totalRatings:  ratings.length,
      ratings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/ratings/order/:orderId/check
// Check if buyer already rated this order
export const checkRating = async (req, res) => {
  try {
    const { orderId } = req.params;
    const existing = await Rating.findOne({ where: { orderId: Number(orderId) } });
    res.json({ rated: !!existing, rating: existing || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};