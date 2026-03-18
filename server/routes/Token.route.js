import express from "express";
import { getTotalSupply, getBalance, mintTokens, transferTokens } from "../controllers/Token.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/total-supply",       authMiddleware, getTotalSupply);
router.get("/balance/:address",   authMiddleware, getBalance);
router.post("/mint",              authMiddleware, mintTokens);
router.post("/transfer",          authMiddleware, transferTokens);

export default router;