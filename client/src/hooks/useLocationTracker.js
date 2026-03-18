// hooks/useLocationTracker.js
// Used in the logistics panel (SellerPanel / LogisticOrders).
// - On mount: registers as online, joins all active order rooms, starts GPS
// - Every 1 min: emits locationUpdate with walletAddress + orderId for each order
// - On unmount: unregisters, stops GPS

import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../services/socket.js";

const INTERVAL_MS = 60_000; // 1 minute

export default function useLocationTracker(walletAddress, activeOrderIds = []) {
  const [isTracking,   setIsTracking]   = useState(false);
  const [lastPosition, setLastPosition] = useState(null);
  const [geoError,     setGeoError]     = useState(null);
  const intervalRef    = useRef(null);

  const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported on this device."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(new Error(err.message)),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  // ── Emit GPS to socket ────────────────────────────────────────────────────
  // If activeOrderIds are provided, emit once per order with explicit orderId
  // so the server knows exactly which room to broadcast to.
  // If no orders yet, still emit with walletAddress only (server will try rooms).
  const emitLocation = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const { lat, lng } = await getCurrentPosition();
      setLastPosition({ lat, lng, timestamp: Date.now() });
      setGeoError(null);

      if (!socket.connected) socket.connect();

      if (activeOrderIds.length > 0) {
        // Emit once per active order — explicit orderId so server routes correctly
        activeOrderIds.forEach(orderId => {
          socket.emit("locationUpdate", { walletAddress, lat, lng, orderId });
        });
        console.log(`[tracker] emitted to ${activeOrderIds.length} order(s)  ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } else {
        // No active orders yet — emit without orderId (server will fallback)
        socket.emit("locationUpdate", { walletAddress, lat, lng });
        console.log(`[tracker] emitted (no orders)  ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (err) {
      console.error("[tracker] GPS error:", err.message);
      setGeoError(err.message);
    }
  }, [walletAddress, activeOrderIds]);

  // ── Start broadcasting ────────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    if (!walletAddress || isTracking) return;
    if (!socket.connected) socket.connect();

    // Register as online
    socket.emit("logisticsOnline", { walletAddress });

    // Join all active order rooms so server can route locationUpdate
    activeOrderIds.forEach(orderId => {
      socket.emit("joinOrderRoom", `order-${orderId}`);
    });

    await emitLocation();
    intervalRef.current = setInterval(emitLocation, INTERVAL_MS);
    setIsTracking(true);
    console.log(`[tracker] started  ${walletAddress}`);
  }, [walletAddress, isTracking, emitLocation, activeOrderIds]);

  // ── Stop broadcasting ─────────────────────────────────────────────────────
  const stopTracking = useCallback(() => {
    if (!walletAddress) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsTracking(false);
    if (socket.connected) socket.emit("logisticsOffline", { walletAddress });
    console.log(`[tracker] stopped  ${walletAddress}`);
  }, [walletAddress]);

  // ── Per-order tracking controls (for pickup / deliver buttons) ───────────
  const startOrderTracking = useCallback((orderId) => {
    if (!socket.connected) socket.connect();
    socket.emit("joinOrderRoom", `order-${orderId}`);
    socket.emit("startTracking", { orderId, walletAddress });
    console.log(`[tracker] order tracking started  order ${orderId}`);
  }, [walletAddress]);

  const stopOrderTracking = useCallback((orderId) => {
    if (socket.connected) socket.emit("stopTracking", { orderId });
    console.log(`[tracker] order tracking stopped  order ${orderId}`);
  }, []);

  // ── Auto-start on mount, re-emit when activeOrderIds changes ─────────────
  useEffect(() => {
    if (!walletAddress) return;

    if (!socket.connected) socket.connect();
    socket.emit("logisticsOnline", { walletAddress });

    // Join all active order rooms
    activeOrderIds.forEach(orderId => {
      socket.emit("joinOrderRoom", `order-${orderId}`);
    });

    // Start interval if not already running
    if (!intervalRef.current) {
      emitLocation(); // emit immediately
      intervalRef.current = setInterval(emitLocation, INTERVAL_MS);
      setIsTracking(true);
    }

    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (walletAddress && socket.connected) {
        socket.emit("logisticsOffline", { walletAddress });
      }
    };
  }, [walletAddress, activeOrderIds.join(",")]);

  return {
    isTracking,
    lastPosition,
    geoError,
    startTracking,
    stopTracking,
    startOrderTracking,
    stopOrderTracking,
  };
}