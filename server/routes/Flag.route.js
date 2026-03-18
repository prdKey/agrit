// routes/flag.routes.js
import express from "express";
import {
  flagProduct,
  getFlags,
  submitAppeal,
  resolveAppeal,
  getMyFlags
} from "../controllers/Flag.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// Admin routes
router.post("/", authMiddleware, flagProduct);
router.get("/", authMiddleware, getFlags);
router.patch("/appeals/:id/resolve", authMiddleware, resolveAppeal);

// Seller routes
router.post("/appeals", authMiddleware, submitAppeal);
router.get("/my", authMiddleware, getMyFlags);

export default router;