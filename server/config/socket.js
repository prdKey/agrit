// config/socket.js
import { Server }        from "socket.io";
import OrderTracking     from "../models/OrderTracking.js";

let io = null;

// Map<walletAddress (lowercase), { socketId, lat, lng, timestamp }>
const logisticsOnline = new Map();

// Map<orderId (string), { walletAddress }>
const activeTracking = new Map();

// ── Save or update tracking record in DB ─────────────────────────────────────
const saveTracking = async (orderId, { latitude, longitude, isTracking }) => {
  try {
    await OrderTracking.upsert({
      orderId:     Number(orderId),
      latitude,
      longitude,
      isTracking,
      lastUpdated: new Date(),
    });
  } catch (err) {
    console.error(`[socket] saveTracking error order ${orderId}:`, err.message);
  }
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "https://agritrust.shop"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] connected  ${socket.id}`);

    // ── Join an order room ────────────────────────────────────────────────
    socket.on("joinOrderRoom", async (room) => {
      socket.join(room);
      console.log(`[socket] ${socket.id} joined ${room}`);

      const orderId = String(room).replace("order-", "");

      // Send last saved position from DB immediately (no need to wait for next emit)
      try {
        const record = await OrderTracking.findOne({ where: { orderId: Number(orderId) } });
        if (record && record.isTracking && record.latitude != null) {
          socket.emit("trackingStatus", { orderId, active: true });
          socket.emit("locationUpdate", {
            orderId,
            lat:       parseFloat(record.latitude),
            lng:       parseFloat(record.longitude),
            timestamp: record.lastUpdated?.getTime() ?? Date.now(),
          });
        }
      } catch (_) {}
    });

    socket.on("leaveOrderRoom", (room) => socket.leave(room));

    // ── Logistics: register online ────────────────────────────────────────
    socket.on("logisticsOnline", ({ walletAddress }) => {
      if (!walletAddress) return;
      const key = walletAddress.toLowerCase();
      logisticsOnline.set(key, { socketId: socket.id, lat: null, lng: null, timestamp: null });
      console.log(`[socket] logistics online  ${key}`);
    });

    // ── Logistics: start tracking an order ───────────────────────────────
    socket.on("startTracking", async ({ orderId, walletAddress }) => {
      if (!orderId || !walletAddress) return;
      const key = walletAddress.toLowerCase();
      activeTracking.set(String(orderId), { walletAddress: key });
      console.log(`[socket] tracking STARTED  order ${orderId}`);

      await saveTracking(orderId, { latitude: null, longitude: null, isTracking: true });
      io.to(`order-${orderId}`).emit("trackingStatus", { orderId, active: true });
    });

    // ── Logistics: push live GPS ──────────────────────────────────────────
    // Payload: { walletAddress, lat, lng, orderId? }
    socket.on("locationUpdate", async ({ walletAddress, lat, lng, orderId }) => {
      if (!walletAddress || lat == null || lng == null) return;
      const key = walletAddress.toLowerCase();

      // Update in-memory position
      const existing = logisticsOnline.get(key) || { socketId: socket.id };
      logisticsOnline.set(key, { ...existing, socketId: socket.id, lat, lng, timestamp: Date.now() });

      if (orderId) {
        const oid = String(orderId);

        // Save to DB
        await saveTracking(oid, { latitude: lat, longitude: lng, isTracking: true });

        // Broadcast to room
        io.to(`order-${oid}`).emit("locationUpdate", {
          orderId: oid, lat, lng, timestamp: Date.now(),
        });
        console.log(`[socket] locationUpdate → order-${oid}  ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } else {
        // No orderId — broadcast to all tracked orders for this logistics
        let count = 0;
        for (const [oid, data] of activeTracking.entries()) {
          if (data.walletAddress === key) {
            await saveTracking(oid, { latitude: lat, longitude: lng, isTracking: true });
            io.to(`order-${oid}`).emit("locationUpdate", {
              orderId: oid, lat, lng, timestamp: Date.now(),
            });
            count++;
          }
        }
        console.log(`[socket] locationUpdate → ${count} order(s)  ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    });

    // ── Logistics: stop tracking an order ────────────────────────────────
    socket.on("stopTracking", async ({ orderId }) => {
      if (!orderId) return;
      activeTracking.delete(String(orderId));
      console.log(`[socket] tracking STOPPED  order ${orderId}`);

      await saveTracking(orderId, { latitude: null, longitude: null, isTracking: false });
      io.to(`order-${orderId}`).emit("trackingStatus", { orderId, active: false });
    });

    // ── Logistics: going offline ──────────────────────────────────────────
    socket.on("logisticsOffline", async ({ walletAddress }) => {
      if (!walletAddress) return;
      const key = walletAddress.toLowerCase();
      logisticsOnline.delete(key);

      for (const [oid, data] of activeTracking.entries()) {
        if (data.walletAddress === key) {
          activeTracking.delete(oid);
          await saveTracking(oid, { latitude: null, longitude: null, isTracking: false });
          io.to(`order-${oid}`).emit("trackingStatus", { orderId: oid, active: false });
        }
      }
      console.log(`[socket] logistics offline  ${key}`);
    });

    // ── Generic status broadcast ──────────────────────────────────────────
    socket.on("statusUpdate", ({ orderId, status }) => {
      if (!orderId || status == null) return;
      io.to(`order-${orderId}`).emit("statusUpdate", { orderId, status });
    });

    // ── Auto cleanup on disconnect ────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`[socket] disconnected  ${socket.id}`);
      for (const [addr, data] of logisticsOnline.entries()) {
        if (data.socketId === socket.id) {
          logisticsOnline.delete(addr);
          for (const [oid, tracking] of activeTracking.entries()) {
            if (tracking.walletAddress === addr) {
              activeTracking.delete(oid);
              await saveTracking(oid, { latitude: null, longitude: null, isTracking: false });
              io.to(`order-${oid}`).emit("trackingStatus", { orderId: oid, active: false });
              console.log(`[socket] tracking AUTO-STOPPED  order ${oid}`);
            }
          }
          console.log(`[socket] logistics auto-offline  ${addr}`);
          break;
        }
      }
    });
  });

  return io;
};

// ── Helpers for Order.controller.js ──────────────────────────────────────────
export const emitOrderStatus = (orderId, status) => {
  if (!io) return;
  io.to(`order-${orderId}`).emit("statusUpdate", { orderId, status });
};

export const emitTrackingStart = async (orderId, walletAddress) => {
  if (!io) return;
  if (walletAddress) activeTracking.set(String(orderId), { walletAddress: walletAddress.toLowerCase() });
  await saveTracking(orderId, { latitude: null, longitude: null, isTracking: true });
  io.to(`order-${orderId}`).emit("trackingStatus", { orderId, active: true });
};

export const emitTrackingStop = async (orderId) => {
  if (!io) return;
  activeTracking.delete(String(orderId));
  await saveTracking(orderId, { latitude: null, longitude: null, isTracking: false });
  io.to(`order-${orderId}`).emit("trackingStatus", { orderId, active: false });
};

export const getIO = () => io;