import express from "express";
import { createRating, getProductRatings, checkRating } from "../controllers/Rating.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/",                          authMiddleware, createRating);
router.get("/product/:productId",         getProductRatings); // public
router.get("/order/:orderId/check",       authMiddleware, checkRating);

export default router;