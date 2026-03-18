import express from "express";
import {
  checkout,
  confirmShipment,
  markOutForDelivery,
  confirmDelivery,
  confirmReceipt,
  cancelOrderBySeller,
  cancelOrderByBuyer,
  openDispute,
  resolveDispute,
  getOrderById,
  getOrdersBySeller,
  getOrdersByBuyer,
  getAvailableOrders,
  getAllOrders,
  getOrdersByLogistics,
  acceptOrder,
  pickupOrder,
  getDisputedOrders,
  updateOrderLocation,
  getOrderAddress,
} from "../controllers/Order.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Checkout ──────────────────────────────────────────────────────────────────
// One call per seller group. Items array can have 1 or N items — all same seller.
// Frontend groups cart items by sellerId then calls this once per group.
router.post("/checkout",             authMiddleware, checkout);

// ── Read ──────────────────────────────────────────────────────────────────────
router.get("/seller",                authMiddleware, getOrdersBySeller);
router.get("/buyer",                 authMiddleware, getOrdersByBuyer);
router.get("/available-orders",      authMiddleware, getAvailableOrders);
router.get("/all",                   authMiddleware, getAllOrders);
router.get("/logistics",             authMiddleware, getOrdersByLogistics);
router.get("/disputed",              authMiddleware, getDisputedOrders);
router.get("/:orderId/address",      authMiddleware, getOrderAddress);
router.get("/:orderId",              authMiddleware, getOrderById);

// ── Lifecycle writes ──────────────────────────────────────────────────────────
router.put("/confirm-shipment",      authMiddleware, confirmShipment);
router.put("/confirm-receipt",       authMiddleware, confirmReceipt);
router.put("/confirm-delivery",      authMiddleware, confirmDelivery);
router.put("/cancel-by-seller",      authMiddleware, cancelOrderBySeller);
router.put("/cancel-by-buyer",       authMiddleware, cancelOrderByBuyer);
router.put("/accept-order",          authMiddleware, acceptOrder);
router.put("/pickup-order",          authMiddleware, pickupOrder);
router.put("/mark-out-for-delivery", authMiddleware, markOutForDelivery);
router.put("/update-location",       authMiddleware, updateOrderLocation);
router.put("/open-dispute",          authMiddleware, openDispute);
router.put("/resolve-dispute",       authMiddleware, resolveDispute);

export default router;