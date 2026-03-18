import express from "express";
import {
  getNotifications, markAsRead, markAllAsRead,
  deleteNotification, deleteAllRead,
} from "../controllers/Notification.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",              authMiddleware, getNotifications);
router.put("/read-all",      authMiddleware, markAllAsRead);
router.put("/:id/read",      authMiddleware, markAsRead);
router.delete("/read",       authMiddleware, deleteAllRead);
router.delete("/:id",        authMiddleware, deleteNotification);

export default router;