import { useEffect, useState } from "react";
import { resolveDispute, getDisputedOrders } from "../../services/orderService.js";
import { useUserContext } from "../../context/UserContext.jsx";
import {
  AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Loader2, ChevronDown, ChevronUp, Scale, User,
  Package, Clock, DollarSign, FileText,
} from "lucide-react";

const PINATA = "https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/";

const fmtTime = (ts) => (!ts || ts === 0) ? "N/A" : new Date(ts * 1000).toLocaleString();
const fmtAddr = (loc) => {
  if (!loc) return "N/A";
  if (typeof loc === "string") return loc;
  return `#${loc.houseNumber}, ${loc.street}, ${loc.barangay}, ${loc.city}`;
};

export default function AdminDisputes() {
  const { user }  = useUserContext();
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedId, setExpandedId]       = useState(null);
  const [modal, setModal]                 = useState(null); // { order, refundBuyer }
  const [adminNotes, setAdminNotes]       = useState("");

  useEffect(() => { fetchDisputed(); }, [user]);

  const fetchDisputed = async () => {
    setLoading(true);
    try {
      const res = await getDisputedOrders();
      setOrders(res.orders || res.data?.orders || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleResolve = async (orderId, refundBuyer) => {
    setModal(null);
    setActionLoading(orderId);
    try {
      await resolveDispute(orderId, refundBuyer, adminNotes);
      setAdminNotes("");
      await fetchDisputed();
    } catch (e) {
      alert(e.response?.data?.error || "Failed to resolve dispute");
    } finally {
      setActionLoading(null);
    }
  };

  const totalEscrow = orders.reduce((s, o) => s + parseFloat(o.totalPrice || 0), 0);

  // ── Confirm Modal ─────────────────────────────────────────────────────────
  const ResolveModal = () => {
    if (!modal) return null;
    const { order, refundBuyer } = modal;
    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => setModal(null)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          onClick={e => e.stopPropagation()}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${refundBuyer ? "bg-blue-100" : "bg-green-100"}`}>
            {refundBuyer
              ? <XCircle className="w-7 h-7 text-blue-600" />
              : <CheckCircle className="w-7 h-7 text-green-600" />
            }
          </div>

          <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
            {refundBuyer ? "Refund Buyer" : "Rule in Seller's Favor"}
          </h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            {refundBuyer
              ? `Buyer will receive a full refund of ${parseFloat(order.totalPrice).toFixed(2)} AGT.`
              : `Funds distributed normally — seller gets ${parseFloat(order.totalProductPrice).toFixed(2)} AGT.`
            }
          </p>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 text-center">
              <p className="text-xs text-gray-500 mb-1">Buyer</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{order.buyerName || "Unknown"}</p>
              <p className={`text-xs font-bold mt-1 ${refundBuyer ? "text-blue-700" : "text-gray-400"}`}>
                {refundBuyer ? `+${parseFloat(order.totalPrice).toFixed(2)} AGT` : "No refund"}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-200 text-center">
              <p className="text-xs text-gray-500 mb-1">Seller</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{order.sellerName || "Unknown"}</p>
              <p className={`text-xs font-bold mt-1 ${!refundBuyer ? "text-green-700" : "text-gray-400"}`}>
                {!refundBuyer ? `+${parseFloat(order.totalProductPrice).toFixed(2)} AGT` : "No payment"}
              </p>
            </div>
          </div>

          {/* Admin notes */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">
              Admin Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Add notes about your decision..."
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setModal(null)}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleResolve(order.id, refundBuyer)}
              className={`flex-1 py-2.5 text-white rounded-xl font-semibold text-sm transition-colors ${
                refundBuyer ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Confirm Resolution
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ResolveModal />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            Dispute Resolution
          </h1>
          <p className="text-gray-600 mt-1">
            {orders.length} disputed order{orders.length !== 1 ? "s" : ""} awaiting resolution
          </p>
        </div>
        <button
          onClick={fetchDisputed}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Needs Decision",  val: orders.length,                   color: "text-red-600",   icon: <AlertTriangle className="w-4 h-4" /> },
          { label: "Total Disputes",  val: orders.length,                   color: "text-gray-900",  icon: <Scale className="w-4 h-4"         /> },
          { label: "Escrow at Stake", val: `${totalEscrow.toFixed(2)} AGT`, color: "text-amber-600", icon: <DollarSign className="w-4 h-4"    /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1 mb-1">
              {s.icon} {s.label}
            </p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Empty */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-200">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-500">No disputed orders at the moment.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map(order => {
            const isExpanded = expandedId === order.id;
            const isActing   = actionLoading === order.id;
            const lineItems  = order.lineItems || [];
            const dispute    = order.dispute || null;

            // Derive opener name from order data using openedByRole
            const openerName = dispute?.openedByRole === "BUYER"
              ? (order.buyerName || "Unknown Buyer")
              : (order.sellerName || "Unknown Seller");

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden"
              >
                <div className="h-1.5 bg-gradient-to-r from-red-400 via-orange-400 to-red-500" />

                <div className="flex flex-col lg:flex-row">

                  {/* Left panel */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 p-5 lg:w-72 border-b lg:border-b-0 lg:border-r border-red-100 flex-shrink-0">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Order ID</p>
                          <p className="text-3xl font-bold text-gray-900">#{order.id}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> DISPUTED
                        </span>
                      </div>

                      {/* ── Dispute info block ── */}
                      <div className="bg-white/80 rounded-xl p-3 border border-red-100 space-y-2 text-xs">
                        <p className="font-semibold text-gray-700 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-red-400" /> Dispute Details
                        </p>

                        {/* Opened by */}
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-gray-500 flex-shrink-0">Opened by</span>
                          <span className="font-semibold text-gray-800 text-right">
                            {openerName}
                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              dispute?.openedByRole === "BUYER"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}>
                              {dispute?.openedByRole || "—"}
                            </span>
                          </span>
                        </div>

                        {/* Reason */}
                        {dispute?.reason ? (
                          <div>
                            <span className="text-gray-500 block mb-1">Reason</span>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                              <p className="text-gray-800 italic leading-relaxed">"{dispute.reason}"</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Reason</span>
                            <span className="text-gray-400 italic">No reason provided</span>
                          </div>
                        )}

                        {/* Status */}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Status</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            dispute?.status === "OPEN"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {dispute?.status || "OPEN"}
                          </span>
                        </div>
                      </div>

                      {/* Line items */}
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                          Items ({lineItems.length})
                        </p>
                        <div className="space-y-1.5">
                          {lineItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              {item.imageCID && (
                                <img
                                  src={`${PINATA}${item.imageCID}`} alt={item.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-white flex-shrink-0"
                                  onError={e => { e.target.style.display = "none"; }}
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                                {item.hasVariant && item.variantLabel && (
                                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                                    {item.variantLabel}
                                  </span>
                                )}
                                <p className="text-[10px] text-gray-400">×{item.quantity} · {parseFloat(item.productPrice).toFixed(2)} AGT</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Escrow breakdown */}
                      <div className="bg-white/70 rounded-xl p-3 border border-red-100 space-y-1.5 text-xs">
                        <p className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Escrowed Funds
                        </p>
                        <div className="flex justify-between"><span className="text-gray-500">Products</span><span className="font-medium">{parseFloat(order.totalProductPrice).toFixed(2)} AGT</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Platform fee</span><span className="font-medium">{parseFloat(order.platformFee).toFixed(4)} AGT</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Logistics</span><span className="font-medium">{parseFloat(order.logisticsFee).toFixed(2)} AGT</span></div>
                        <div className="flex justify-between border-t pt-1.5 font-bold">
                          <span>Total</span>
                          <span className="text-red-600">{parseFloat(order.totalPrice).toFixed(2)} AGT</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmtTime(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Right panel */}
                  <div className="flex-1 p-5 space-y-4">

                    {/* Parties */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1.5 flex items-center gap-1">
                          <User className="w-3 h-3" /> Buyer
                          {dispute?.openedByRole === "BUYER" && (
                            <span className="ml-1 text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">Dispute Opener</span>
                          )}
                        </p>
                        <div className={`rounded-xl p-3 border ${dispute?.openedByRole === "BUYER" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                          <p className="text-sm font-bold text-gray-900">{order.buyerName || "Unknown"}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{order.deliveryAddress?.fullAddress || fmtAddr(order.buyerLocation)}</p>
                          {order.buyerMobile && (
                            <a href={`tel:${order.buyerMobile}`} className="text-xs text-blue-600 font-medium mt-1 block">
                              📞 {order.buyerMobile}
                            </a>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1.5 flex items-center gap-1">
                          <Package className="w-3 h-3" /> Seller
                          {dispute?.openedByRole === "SELLER" && (
                            <span className="ml-1 text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">Dispute Opener</span>
                          )}
                        </p>
                        <div className={`rounded-xl p-3 border ${dispute?.openedByRole === "SELLER" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                          <p className="text-sm font-bold text-gray-900">{order.sellerName || "Unknown"}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{fmtAddr(order.sellerLocation)}</p>
                          {order.sellerMobile && (
                            <a href={`tel:${order.sellerMobile}`} className="text-xs text-green-600 font-medium mt-1 block">
                              📞 {order.sellerMobile}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Logistics */}
                    {order.logisticsName && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1.5">Logistics</p>
                        <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{order.logisticsName}</p>
                            {order.logisticsMobile && (
                              <a href={`tel:${order.logisticsMobile}`} className="text-xs text-purple-600 font-medium">
                                📞 {order.logisticsMobile}
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-purple-700 font-bold">{parseFloat(order.logisticsFee).toFixed(2)} AGT fee</p>
                        </div>
                      </div>
                    )}

                    {/* ── Delivery address ── */}
                    {order.deliveryAddress && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1.5">Delivery Address</p>
                        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200 text-xs space-y-0.5">
                          <p className="font-semibold text-gray-800">{order.deliveryAddress.name}</p>
                          <p className="text-gray-600">{order.deliveryAddress.fullAddress}</p>
                          <p className="text-gray-500">{order.deliveryAddress.phone}</p>
                        </div>
                      </div>
                    )}

                    {/* Resolution buttons */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5" /> Choose Resolution
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => setModal({ order, refundBuyer: true })}
                          disabled={isActing}
                          className="flex flex-col items-center gap-1.5 p-4 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 group"
                        >
                          <XCircle className="w-7 h-7 text-blue-500 group-hover:text-blue-600" />
                          <p className="font-bold text-gray-900 text-sm">Refund Buyer</p>
                          <p className="text-xs text-gray-500 text-center">
                            Full {parseFloat(order.totalPrice).toFixed(2)} AGT returned to buyer
                          </p>
                          {isActing && <Loader2 className="w-4 h-4 animate-spin text-blue-500 mt-1" />}
                        </button>

                        <button
                          onClick={() => setModal({ order, refundBuyer: false })}
                          disabled={isActing}
                          className="flex flex-col items-center gap-1.5 p-4 bg-white border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 group"
                        >
                          <CheckCircle className="w-7 h-7 text-green-500 group-hover:text-green-600" />
                          <p className="font-bold text-gray-900 text-sm">Rule for Seller</p>
                          <p className="text-xs text-gray-500 text-center">
                            Distribute normally — seller, platform & logistics paid
                          </p>
                          {isActing && <Loader2 className="w-4 h-4 animate-spin text-green-500 mt-1" />}
                        </button>
                      </div>
                    </div>

                    {/* Expand */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-300"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isExpanded ? "Hide" : "View"} Timeline
                    </button>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 pt-4 grid md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <h4 className="font-semibold text-gray-900 text-sm mb-3">Order Timeline</h4>
                          <div className="space-y-1.5 text-xs">
                            {[
                              ["Created",          order.createdAt],
                              ["Shipped",          order.confirmAt],
                              ["Picked Up",        order.pickedUpAt],
                              ["Out for Delivery", order.outForDeliveryAt],
                              ["Delivered",        order.deliveredAt],
                            ].map(([label, ts]) => (
                              <div key={label} className="flex justify-between gap-2">
                                <span className="text-gray-500 flex-shrink-0">{label}:</span>
                                <span className="font-medium">{fmtTime(ts)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 text-sm mb-3">Order Items Detail</h4>
                          <div className="space-y-2 text-xs">
                            {lineItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between gap-2">
                                <span className="text-gray-700 truncate">
                                  {item.name}{item.variantLabel ? ` (${item.variantLabel})` : ""} ×{item.quantity}
                                </span>
                                <span className="font-medium flex-shrink-0">
                                  {parseFloat(item.productPrice).toFixed(2)} AGT
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}