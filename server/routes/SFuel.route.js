import express from "express";
import { distributeSFuel } from "../controllers/SFuel.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// Authenticated users only — prevent abuse
router.post("/distribute", authMiddleware, distributeSFuel);

export default router;