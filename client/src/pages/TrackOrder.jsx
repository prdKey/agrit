// pages/OrderTracker.jsx
import { socket } from "../services/socket.js";
import React, { useEffect, useState } from "react";
import {
  Package, CheckCircle2, Truck, MapPin, Clock, User,
  DollarSign, Box, Phone, ShoppingBag,
} from "lucide-react";
import { getOrderById } from "../services/orderService.js";
import { useParams, useNavigate } from "react-router-dom";
import MapTracker from "../components/common/MapTracker.jsx";

export default function OrderTracker() {
  const [orderStatus,      setOrderStatus]      = useState(1);
  const [orderData,        setOrderData]        = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [liveCoords,       setLiveCoords]       = useState(null);  // { lat, lng }
  const [isTrackingActive, setIsTrackingActive] = useState(false);

  const { orderId } = useParams();
  const navigate    = useNavigate();

  const formatTimestamp = (ts) => {
    if (!ts || ts === 0) return "";
    return new Date(ts * 1000).toLocaleString("en-US", {
      month: "2-digit", day: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const formatAddress = (loc) => {
    if (!loc) return "N/A";
    if (typeof loc === "string") return loc;
    return [loc.houseNumber, loc.street, loc.barangay, loc.city].filter(Boolean).join(", ") || "N/A";
  };

  // ── Fetch order ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await getOrderById(orderId);
        if (!cancelled) {
          setOrderData(res.order);
          setOrderStatus(res.order.status);
          // If already in transit, show as tracking active
          const s = res.order.status;
          if (s >= 3 && s <= 4) setIsTrackingActive(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load order details. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [orderId]);

  // ── Socket ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) return;
    if (!socket.connected) socket.connect();

    // Receives { orderId, lat, lng, timestamp } every 1 min from logistics
    const onLocation = (data) => {
      if (data.lat != null && data.lng != null) {
        setLiveCoords({ lat: data.lat, lng: data.lng });
      }
    };

    // Receives { orderId, active } when logistics picks up or delivers
    const onTrackingStatus = (data) => {
      setIsTrackingActive(data.active);
      if (!data.active) setLiveCoords(null); // clear marker on delivery
    };

    // Receives { orderId, status } on every lifecycle change
    const onStatus = (data) => {
      setOrderStatus(data.status);
      const now = Math.floor(Date.now() / 1000);
      setOrderData(prev => {
        if (!prev) return prev;
        const u = { ...prev };
        if (data.status === 2) u.confirmAt        = now;
        if (data.status === 3) u.pickedUpAt       = now;
        if (data.status === 4) u.outForDeliveryAt = now;
        if (data.status === 5) { u.deliveredAt    = now; setLiveCoords(null); }
        if (data.status === 6) u.completedAt      = now;
        return u;
      });
    };

    socket.emit("joinOrderRoom", `order-${orderId}`);
    socket.on("locationUpdate",  onLocation);
    socket.on("trackingStatus",  onTrackingStatus);
    socket.on("statusUpdate",    onStatus);

    return () => {
      socket.off("locationUpdate",  onLocation);
      socket.off("trackingStatus",  onTrackingStatus);
      socket.off("statusUpdate",    onStatus);
      socket.emit("leaveOrderRoom", `order-${orderId}`);
    };
  }, [orderId]);

  if (loading) return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-600">
        Loading order details…
      </div>
    </div>
  );

  if (error || !orderData) return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-red-600 mb-4">{error ?? "Order not found."}</div>
        <button onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500">
          Retry
        </button>
      </div>
    </div>
  );

  const lineItems    = orderData.lineItems ?? [];
  const totalQty     = lineItems.reduce((s, i) => s + i.quantity, 0);
  const itemsSummary = lineItems.length
    ? lineItems.map(i => `${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ""}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")
    : "—";

  const mapSellerAddress = formatAddress(orderData.sellerLocation);
  const mapBuyerAddress  = orderData.deliveryAddress?.fullAddress || formatAddress(orderData.buyerLocation);
  // Pass coords directly — don't gate on isTrackingActive
  // coords arriving = tracking is active
  const mapLogisticsCoords = liveCoords;

  const steps = [
    { icon: DollarSign,   label: "Paid",            time: formatTimestamp(orderData.createdAt),        status: 1 },
    { icon: CheckCircle2, label: "Shipped",          time: formatTimestamp(orderData.confirmAt),        status: 2 },
    { icon: Box,          label: "Picked Up",        time: formatTimestamp(orderData.pickedUpAt),       status: 3 },
    { icon: Truck,        label: "Out for Delivery", time: formatTimestamp(orderData.outForDeliveryAt), status: 4 },
    { icon: MapPin,       label: "Delivered",        time: formatTimestamp(orderData.deliveredAt),      status: 5 },
    { icon: User,         label: "Completed",        time: formatTimestamp(orderData.completedAt),      status: 6 },
  ];

  const statusLabels = ["NONE","PAID","SHIPPED","PICKED UP","OUT FOR DELIVERY","DELIVERED","COMPLETED","DISPUTED","REFUNDED"];
  const getStatusLabel = (s) => statusLabels[s] ?? "UNKNOWN";
  const getStatusColor = (s) =>
    s === 6 ? "text-green-600" : s === 7 ? "text-red-600" : s === 8 ? "text-yellow-600" : s >= 4 ? "text-blue-600" : "text-green-600";

  const trackingHistory = [
    orderData.completedAt      > 0 && { date: formatTimestamp(orderData.completedAt),      status: "Completed",        desc: "Order completed — thank you for your purchase!" },
    orderData.deliveredAt      > 0 && { date: formatTimestamp(orderData.deliveredAt),       status: "Delivered",        desc: `Parcel delivered by ${orderData.logisticsName || "logistics provider"}` },
    orderData.outForDeliveryAt > 0 && { date: formatTimestamp(orderData.outForDeliveryAt), status: "Out for Delivery", desc: "Parcel is out for delivery to your location" },
    orderData.pickedUpAt       > 0 && { date: formatTimestamp(orderData.pickedUpAt),        status: "Picked Up",        desc: `Parcel picked up by ${orderData.logisticsName || "logistics provider"}` },
    orderData.confirmAt        > 0 && { date: formatTimestamp(orderData.confirmAt),         status: "Shipped",          desc: `Order confirmed by ${orderData.sellerName || "seller"}` },
    orderData.createdAt        > 0 && { date: formatTimestamp(orderData.createdAt),         status: "Paid",             desc: `Order placed — ${totalQty} item${totalQty !== 1 ? "s" : ""}: ${itemsSummary}` },
  ].filter(Boolean);

  const currentStepIndex = steps.findIndex(s => s.status === orderStatus);

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-gray-600">
              ORDER ID: <span className="font-semibold">#{orderData.id || orderId}</span>
            </h3>
            <span className={`text-sm font-medium ${getStatusColor(orderStatus)}`}>
              {getStatusLabel(orderStatus)}
            </span>
          </div>
          {lineItems.length > 0 ? (
            <div className="space-y-1 mb-3">
              {lineItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 flex items-center gap-1.5">
                    <ShoppingBag className="w-3 h-3 text-gray-400" />
                    {item.name}
                    {item.variantLabel && (
                      <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                        {item.variantLabel}
                      </span>
                    )}
                    <span className="text-gray-400">×{item.quantity}</span>
                  </span>
                  <span className="font-medium text-gray-800">{Number(item.productPrice).toFixed(2)} AGT</span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-gray-400 mb-3">No item details available.</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div><span className="text-gray-500">Total Items:</span><p className="font-medium text-gray-800">{totalQty} unit{totalQty !== 1 ? "s" : ""}</p></div>
            <div><span className="text-gray-500">Product Total:</span><p className="font-medium text-gray-800">{Number(orderData.totalProductPrice).toFixed(2)} AGT</p></div>
            <div><span className="text-gray-500">Total Paid:</span><p className="font-medium text-gray-800">{Number(orderData.totalPrice).toFixed(2)} AGT</p></div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Platform Fee: {Number(orderData.platformFee).toFixed(4)} AGT &nbsp;·&nbsp;
            Logistics Fee: {Number(orderData.logisticsFee).toFixed(2)} AGT
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
              <div className="h-full bg-green-600 transition-all duration-500"
                style={{ width: `${currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0}%` }} />
            </div>
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive  = step.status <= orderStatus;
              const isCurrent = step.status === orderStatus;
              return (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                    ${isActive ? "bg-green-600 border-green-600" : "bg-white border-gray-300"}
                    ${isCurrent ? "ring-4 ring-green-100" : ""}`}>
                    <Icon size={20} className={isActive ? "text-white" : "text-gray-400"} />
                  </div>
                  <p className={`mt-2 text-xs text-center max-w-[80px] ${isActive ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                    {step.label}
                  </p>
                  {step.time && <p className="text-xs text-gray-400 mt-1">{step.time}</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                <Package size={14} className="text-blue-600" /> Seller
              </h4>
              <p className="font-medium text-gray-800 mb-1">{orderData.sellerName || "Unknown"}</p>
              <p className="text-gray-600 mb-1">{formatAddress(orderData.sellerLocation)}</p>
              {orderData.sellerMobile && (
                <a href={`tel:${orderData.sellerMobile}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                  <Phone size={12} /> {orderData.sellerMobile}
                </a>
              )}
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                <Truck size={14} className="text-green-600" /> Logistics
              </h4>
              <p className="font-medium text-gray-800 mb-1">{orderData.logisticsName || "Not assigned yet"}</p>
              {isTrackingActive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full mb-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                  </span>
                  Live tracking
                </span>
              )}
              {isTrackingActive && liveCoords && (
                <p className="text-gray-500 font-mono text-[10px] mb-1">
                  {liveCoords.lat.toFixed(5)}, {liveCoords.lng.toFixed(5)}
                </p>
              )}
              {orderData.logisticsMobile && (
                <a href={`tel:${orderData.logisticsMobile}`} className="flex items-center gap-1 text-green-600 hover:text-green-800 font-medium">
                  <Phone size={12} /> {orderData.logisticsMobile}
                </a>
              )}
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                <User size={14} className="text-purple-600" /> Delivery To
              </h4>
              <p className="font-medium text-gray-800 mb-1">
                {orderData.deliveryAddress?.name || orderData.buyerName || "Unknown"}
              </p>
              <p className="text-gray-600 mb-1">{mapBuyerAddress}</p>
              {orderData.deliveryAddress?.phone && (
                <a href={`tel:${orderData.deliveryAddress.phone}`} className="flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium">
                  <Phone size={12} /> {orderData.deliveryAddress.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Map + Timeline */}
        <div className="grid md:grid-cols-2 gap-6 p-6">

          {orderStatus >= 5 && !isTrackingActive ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-gray-200 bg-gray-50 gap-3">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="text-sm font-semibold text-gray-700">Order Delivered</p>
              <p className="text-xs text-gray-400">Live tracking has ended</p>
            </div>
          ) : (
            <MapTracker
              sellerLocation={mapSellerAddress}
              buyerLocation={mapBuyerAddress}
              logisticsLocation={mapLogisticsCoords}
            />
          )}

          <div>
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">Delivery Timeline</h4>
              <p className="text-xs text-gray-500">Track your order status updates</p>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {trackingHistory.length > 0 ? trackingHistory.map((item, i) => (
                <div key={i} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <Clock size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs text-gray-500">{item.date}</span>
                      <span className="text-xs font-semibold text-gray-600">{item.status}</span>
                    </div>
                    <p className="text-xs text-gray-700">{item.desc}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500 text-center py-4">No tracking history available</p>}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 text-xs">
              <p className="font-semibold mb-2 text-gray-700">Smart Contract Details</p>
              <div className="space-y-1 text-gray-600">
                <p><span className="font-medium">Buyer: </span>{orderData.buyerAddress ? `${orderData.buyerAddress.slice(0,10)}...${orderData.buyerAddress.slice(-8)}` : "N/A"}</p>
                <p><span className="font-medium">Seller: </span>{orderData.sellerAddress ? `${orderData.sellerAddress.slice(0,10)}...${orderData.sellerAddress.slice(-8)}` : "N/A"}</p>
                <p><span className="font-medium">Items: </span>{lineItems.length} product type{lineItems.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center flex-wrap gap-3">
          <button onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
            ← Back to Orders
          </button>
          <div className="flex gap-3">
            {orderData.sellerMobile && (
              <a href={`tel:${orderData.sellerMobile}`}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Phone size={14} /> Contact Seller
              </a>
            )}
            {orderData.logisticsMobile && orderStatus >= 3 && orderStatus < 6 && (
              <a href={`tel:${orderData.logisticsMobile}`}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors flex items-center gap-2">
                <Phone size={14} /> Contact Logistics
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}