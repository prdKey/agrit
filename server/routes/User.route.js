import express from "express";
import {
  getProfile,
  updateProfile,
  getSellerStats,
  getAllUsers,
  getUserById,
  toggleUserStatus,
  changeUserRole,
  submitApplication,
  getMyApplications,
  getAllApplications,
  reviewApplication,
} from "../controllers/User.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Profile ───────────────────────────────────────────────────────────────────
// GET /api/users/profile
// PUT /api/users/profile
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

// ── Seller stats (public) ─────────────────────────────────────────────────────
// GET /api/users/sellerstats/:walletAddress
router.get("/sellerstats/:walletAddress", getSellerStats);

// ── Applications (must come BEFORE /:id to avoid route collision) ─────────────
// POST   /api/users/applications
// GET    /api/users/applications/mine
// GET    /api/users/applications/all
// PATCH  /api/users/applications/:id/review
router.post("/applications",              authMiddleware, submitApplication);
router.get("/applications/mine",          authMiddleware, getMyApplications);
router.get("/applications/all",           authMiddleware, getAllApplications);
router.patch("/applications/:id/review",  authMiddleware, reviewApplication);

// ── User management ───────────────────────────────────────────────────────────
// GET    /api/users
// GET    /api/users/:id
// PATCH  /api/users/:id/status
// PATCH  /api/users/:id/role
router.get("/",               authMiddleware, getAllUsers);
router.get("/:id",            authMiddleware, getUserById);
router.patch("/:id/status",   authMiddleware, toggleUserStatus);
router.patch("/:id/role",     authMiddleware, changeUserRole);

export default router;