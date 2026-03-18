import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getOrdersByBuyer, confirmReceipt,
  cancelOrderByBuyer, openDispute
} from "../../services/orderService";
import { checkOrderRating } from "../../services/ratingService.js";
import { useUserContext } from "../../context/UserContext";
import RatingModal from "../../components/common/RatingModal.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import {
  Package, MapPin, CheckCircle, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Loader2, RefreshCw, Navigation, Star, FileText
} from "lucide-react";

const PINATA = "https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/";
const PAGE_SIZE = 10;

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: 1, label: "Paid" }, { id: 2, label: "Shipped" },
  { id: 3, label: "Picked Up" }, { id: 4, label: "Out for Delivery" },
  { id: 5, label: "Delivered" }, { id: 6, label: "Completed" },
  { id: 7, label: "Disputed" }, { id: 10, label: "Cancelled" },
];

const STATUS_CONFIG = {
  1:  { label: "PAID",             color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  2:  { label: "SHIPPED",          color: "bg-blue-100 text-blue-800 border-blue-200" },
  3:  { label: "PICKED UP",        color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  4:  { label: "OUT FOR DELIVERY", color: "bg-purple-100 text-purple-800 border-purple-200" },
  5:  { label: "DELIVERED",        color: "bg-teal-100 text-teal-800 border-teal-200" },
  6:  { label: "COMPLETED",        color: "bg-green-100 text-green-800 border-green-200" },
  7:  { label: "DISPUTED",         color: "bg-red-100 text-red-800 border-red-200" },
  8:  { label: "REFUNDED",         color: "bg-orange-100 text-orange-800 border-orange-200" },
  9:  { label: "CANCELLED",        color: "bg-gray-200 text-gray-600 border-gray-300" },
  10: { label: "CANCELLED",        color: "bg-gray-200 text-gray-600 border-gray-300" },
};

const fmtTime = (ts) => (!ts || ts === 0) ? null : new Date(ts * 1000).toLocaleString();
const fmtAddr = (loc) => {
  if (!loc) return "N/A";
  if (typeof loc === "string") return loc;
  return `#${loc.houseNumber}, ${loc.street}, ${loc.barangay}, ${loc.city}`;
};
const calcCancellationFee = (totalPrice) => (parseFloat(totalPrice) * 0.01).toFixed(4);

// ── Confirm Modal ─────────────────────────────────────────────────────────────
// disputeReason state lives HERE so typing doesn't trigger parent re-render
function ConfirmModal({ modal, onClose, onConfirm }) {
  const [reason, setReason] = useState("");

  // Reset reason when modal changes
  useEffect(() => { setReason(""); }, [modal?.type, modal?.order?.id]);

  if (!modal) return null;
  const { type, order } = modal;

  const configs = {
    receipt: {
      icon: <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />,
      title: "Confirm Receipt",
      body: `Confirm you received all items in Order #${order.id}? This releases ${parseFloat(order.totalProductPrice).toFixed(2)} AGT to the seller and ${parseFloat(order.logisticsFee).toFixed(2)} AGT to logistics.`,
      confirmLabel: "Yes, I Received It",
      confirmClass: "bg-green-600 hover:bg-green-700",
    },
    cancel: {
      icon: <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />,
      title: "Cancel Order",
      body: `Cancel Order #${order.id}? A 1% cancellation fee of ~${calcCancellationFee(order.totalPrice)} AGT will be deducted. You'll receive ~${(parseFloat(order.totalPrice) * 0.99).toFixed(4)} AGT back.`,
      confirmLabel: "Yes, Cancel Order",
      confirmClass: "bg-red-600 hover:bg-red-700",
    },
    dispute: {
      icon: <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />,
      title: "Open Dispute",
      body: `Open a dispute for Order #${order.id}? The platform admin will review. Funds remain in escrow until resolved.`,
      confirmLabel: "Open Dispute",
      confirmClass: "bg-amber-600 hover:bg-amber-700",
    },
  };

  const cfg = configs[type];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        {cfg.icon}
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{cfg.title}</h3>
        <p className="text-sm text-gray-600 text-center mb-4">{cfg.body}</p>

        {/* Dispute reason textarea — only for dispute type */}
        {type === "dispute" && (
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">
              Reason for Dispute <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe the issue with this order..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className={`flex-1 py-2.5 text-white rounded-xl font-semibold transition-colors text-sm ${cfg.confirmClass}`}
          >
            {cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BuyerOrders() {
  const { user }   = useUserContext();
  const navigate   = useNavigate();
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedId, setExpandedId]       = useState(null);
  const [activeTab, setActiveTab]         = useState("all");
  const [modal, setModal]                 = useState(null);
  const [ratingOrder, setRatingOrder]     = useState(null);
  const [ratedOrders, setRatedOrders]     = useState({});
  const [page, setPage]                   = useState(1);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const data   = await getOrdersByBuyer();
      const orders = data.orders || [];
      setOrders(orders);
      const completed = orders.filter(o => o.status === 6);
      const ratingChecks = await Promise.all(
        completed.map(o => checkOrderRating(o.id).then(r => [o.id, r.rated]))
      );
      setRatedOrders(Object.fromEntries(ratingChecks));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [user]);
  useEffect(() => { setPage(1); }, [activeTab]);

  // onConfirm now receives `reason` from inside the modal
  const handleConfirm = async (reason = "") => {
    if (!modal) return;
    const orderId = modal.order.id;
    const type    = modal.type;
    setModal(null);
    setActionLoading(orderId);
    try {
      if (type === "receipt") await confirmReceipt(orderId);
      else if (type === "cancel")  await cancelOrderByBuyer(orderId);
      else if (type === "dispute") await openDispute(orderId, reason);
      await fetchOrders();
    } catch (e) {
      alert(e.response?.data?.error || `Failed to ${type} order`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const cfg = STATUS_CONFIG[status] || { label: "UNKNOWN", color: "bg-gray-100 text-gray-800 border-gray-200" };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>{cfg.label}</span>;
  };

  const filteredOrders = (activeTab === "all" ? orders : orders.filter(o =>
    activeTab === "cancelled" ? (o.status === 9 || o.status === 10) : o.status === activeTab
  )).slice().sort((a, b) => b.id - a.id);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginated  = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ConfirmModal
        modal={modal}
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      />
      {ratingOrder && (
        <RatingModal order={ratingOrder} onClose={() => setRatingOrder(null)}
          onSuccess={() => { setRatingOrder(null); fetchOrders(); }} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Purchases</h1>
          <p className="text-gray-600 mt-1">Track and manage your orders</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
        {STATUS_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === tab.id ? "bg-green-600 text-white shadow-md" : "bg-white text-gray-700 hover:bg-green-50 border border-gray-200"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {filteredOrders.length > 0 && (
        <p className="text-xs text-gray-400 mb-3">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} &nbsp;·&nbsp; Page {page} of {totalPages}
        </p>
      )}

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders found</h3>
          <p className="text-gray-500 text-sm">{activeTab === "all" ? "You haven't made any purchases yet" : "No orders with this status"}</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginated.map(order => {
              const isExpanded   = expandedId === order.id;
              const isActing     = actionLoading === order.id;
              const canCancel    = order.status === 1;
              const canConfirm   = order.status === 5;
              const canDispute   = [2, 3, 4, 5].includes(order.status);
              const canTrack     = [2, 3, 4, 5].includes(order.status);
              const isCompleted  = order.status === 6;
              const alreadyRated = ratedOrders[order.id];
              const lineItems    = order.lineItems || [];

              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 overflow-hidden">
                  <div className="flex flex-col lg:flex-row">

                    {/* Left panel */}
                    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-5 lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Order ID</p>
                          <p className="text-2xl font-bold text-gray-900">#{order.id}</p>
                        </div>
                        {getStatusBadge(order.status)}
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Items ({lineItems.length})</p>
                          <div className="space-y-1.5">
                            {lineItems.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                {item.imageCID && <img src={`${PINATA}${item.imageCID}`} alt={item.name} className="w-8 h-8 rounded-lg object-cover border border-white flex-shrink-0" onError={e => { e.target.style.display = "none"; }} />}
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                                  {item.hasVariant && item.variantLabel && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">{item.variantLabel}</span>}
                                  <p className="text-[10px] text-gray-400">×{item.quantity}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">Total Paid</p>
                          <p className="font-bold text-green-600">{parseFloat(order.totalPrice).toFixed(2)} AGT</p>
                        </div>
                      </div>
                    </div>

                    {/* Right panel */}
                    <div className="flex-1 p-5 space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Seller</p>
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">{order.sellerName || "Unknown"}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{fmtAddr(order.sellerLocation)}</p>
                        </div>
                      </div>
                      {order.logisticsName && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Logistics Provider</p>
                          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                            <p className="text-sm font-semibold text-gray-900">{order.logisticsName}</p>
                          </div>
                        </div>
                      )}

                      {/* Show dispute reason if order is disputed */}
                      {order.status === 7 && order.dispute?.reason && (
                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-1">
                            <FileText className="w-3.5 h-3.5" /> Your Dispute Reason
                          </p>
                          <p className="text-sm text-gray-700 italic">"{order.dispute.reason}"</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        {canTrack    && <button onClick={() => navigate(`/track-order/${order.id}`)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"><Navigation className="w-3.5 h-3.5" /> Track Order</button>}
                        {canConfirm  && <button onClick={() => setModal({ type: "receipt", order })} disabled={isActing} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">{isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Confirm Receipt</button>}
                        {canCancel   && <button onClick={() => setModal({ type: "cancel", order })} disabled={isActing} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50">{isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Cancel Order</button>}
                        {canDispute  && (
                          <button onClick={() => setModal({ type: "dispute", order })} disabled={isActing}
                            className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors disabled:opacity-50">
                            {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />} Open Dispute
                          </button>
                        )}
                        {isCompleted && (alreadyRated
                          ? <span className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-sm font-medium"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Rated</span>
                          : <button onClick={() => setRatingOrder(order)} className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"><Star className="w-3.5 h-3.5" /> Rate Products</button>
                        )}
                        {order.status === 1  && <span className="text-sm text-yellow-600 font-medium self-center">⏳ Awaiting shipment</span>}
                        {order.status === 2  && <span className="text-sm text-blue-600 font-medium self-center">📦 Waiting for logistics pickup</span>}
                        {order.status === 6  && <span className="text-sm text-green-600 font-semibold self-center flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Completed</span>}
                        {order.status === 7  && <span className="text-sm text-red-600 font-medium self-center">⚖️ Under review by admin</span>}
                        {order.status === 8  && <span className="text-sm text-orange-600 font-medium self-center">↩️ Refunded</span>}
                        {(order.status === 9 || order.status === 10) && <span className="text-sm text-gray-500 font-medium self-center">❌ Cancelled</span>}
                        <button onClick={() => setExpandedId(isExpanded ? null : order.id)} className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-300">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? "Hide" : "Details"}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-200 pt-4 space-y-4">
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 text-sm mb-3">Items in this Order</h4>
                            <div className="space-y-2">
                              {lineItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-xs">
                                  {item.imageCID && <img src={`${PINATA}${item.imageCID}`} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" onError={e => { e.target.style.display = "none"; }} />}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900">{item.name}</p>
                                    {item.hasVariant && item.variantLabel && <span className="inline-block text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold mt-0.5">{item.variantLabel}</span>}
                                    <p className="text-gray-400">{item.category} · ×{item.quantity} · {parseFloat(item.pricePerUnit).toFixed(2)} AGT/unit</p>
                                  </div>
                                  <p className="font-semibold text-gray-900 flex-shrink-0">{parseFloat(item.productPrice).toFixed(2)} AGT</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <h4 className="font-semibold text-gray-900 text-sm mb-3">Price Breakdown</h4>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between"><span className="text-gray-500">Products</span><span className="font-semibold">{parseFloat(order.totalProductPrice).toFixed(2)} AGT</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Platform fee</span><span>{parseFloat(order.platformFee).toFixed(4)} AGT</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Logistics</span><span>{parseFloat(order.logisticsFee).toFixed(2)} AGT</span></div>
                                <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span className="text-green-600">{parseFloat(order.totalPrice).toFixed(2)} AGT</span></div>
                              </div>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                              <h4 className="font-semibold text-gray-900 text-sm mb-3">Timeline</h4>
                              <div className="space-y-1.5 text-xs">
                                {[["Created",order.createdAt],["Shipped",order.confirmAt],["Picked Up",order.pickedUpAt],["Out for Delivery",order.outForDeliveryAt],["Delivered",order.deliveredAt],["Completed",order.completedAt],["Cancelled",order.cancelledAt]]
                                  .filter(([,ts]) => ts && ts > 0).map(([label, ts]) => (
                                  <div key={label} className="flex justify-between gap-2">
                                    <span className="text-gray-500 flex-shrink-0">{label}:</span>
                                    <span className="font-medium text-right">{fmtTime(ts)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          {order.deliveryAddress && (
                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                              <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Delivery Address</h4>
                              <p className="text-xs font-medium text-gray-800">{order.deliveryAddress.fullAddress}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{order.deliveryAddress.phone}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
}