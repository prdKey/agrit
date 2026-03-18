import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  removeBulkCartItems,
} from "../controllers/Cart.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",          authMiddleware, getCart);
router.post("/",         authMiddleware, addToCart);

// ⚠️ Static routes MUST come before /:id to avoid being swallowed
router.delete("/bulk",   authMiddleware, removeBulkCartItems);
router.delete("/clear",  authMiddleware, clearCart);

// Use :id (cart row primary key) — NOT :productId
// productId is not unique when a product has multiple variants
router.put("/:id",       authMiddleware, updateCartItem);
router.delete("/:id",    authMiddleware, removeCartItem);

export default router;