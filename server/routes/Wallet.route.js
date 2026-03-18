// routes/Wallet.route.js

import express        from "express";
import authMiddleware from "../middleware/auth.middleware.js"; // your existing middleware
import {
  getRate,
  getBalance,
  getTransactions,
  depositGcash,
  paymongoWebhook,
  withdraw,
  adminApprove,
  adminReject,
  adminGetPending,
  adminGetAll,
  adminCancel
} from "../controllers/Wallet.controller.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/rate", getRate);

// ── PayMongo webhook — NO auth (PayMongo calls this directly) ─────────────────
router.post("/webhook/paymongo", paymongoWebhook);

// ── Authenticated user ────────────────────────────────────────────────────────
router.get ("/balance",       authMiddleware, getBalance);
router.get ("/transactions",  authMiddleware, getTransactions);
router.post("/deposit/gcash", authMiddleware, depositGcash);
router.post("/withdraw",      authMiddleware, withdraw);

// ── Admin only ────────────────────────────────────────────────────────────────
// uses your existing authMiddleware + role check inline
router.get  ("/admin/pending",     authMiddleware,  adminGetPending);
router.patch("/admin/approve/:id", authMiddleware,  adminApprove);
router.patch("/admin/reject/:id",  authMiddleware, adminReject);
router.get("/admin/all", authMiddleware, adminGetAll);
router.delete("/admin/cancel/:id", authMiddleware, adminCancel);

export default router;


// ─────────────────────────────────────────────────────────────────────────────
// Add to index.js:
//   import walletRoute from "./routes/Wallet.route.js";
//   app.use("/api/wallet", walletRoute);
// ─────────────────────────────────────────────────────────────────────────────