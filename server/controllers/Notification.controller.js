import { Notification, User } from "../models/index.js";

// ── Helper — create notification for a user by walletAddress ─────────────────
export const createNotification = async (walletAddress, { type, title, message, orderId = null }) => {
  try {
    const user = await User.findOne({ where: { walletAddress: walletAddress.toLowerCase() } });
    if (!user) return;

    await Notification.create({
      userId:  user.id,
      type,
      title,
      message,
      orderId,
      read:    false,
    });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
};

// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
      raw: true,
    });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { id: req.params.id, userId: req.user.id } }
    );
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { userId: req.user.id } }
    );
    res.json({ message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    await Notification.destroy({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/notifications/read
export const deleteAllRead = async (req, res) => {
  try {
    await Notification.destroy({ where: { userId: req.user.id, read: true } });
    res.json({ message: "All read notifications deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};