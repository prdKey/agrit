import { useEffect, useState } from "react";
import { getOrdersByBuyer } from "../../services/orderService.js";
import { useUserContext } from "../../context/UserContext.jsx";
import {
  Scale, CheckCircle, XCircle, Loader2, RefreshCw,
  ChevronDown, ChevronUp, Package, MapPin, Clock, FileText,
} from "lucide-react";

const PINATA = "https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/";

const fmtTime = (ts) => (!ts || ts === 0) ? null : new Date(ts * 1000).toLocaleString();
const fmtAddr = (loc) => {
  if (!loc) return "N/A";
  if (typeof loc === "string") return loc;
  return `#${loc.houseNumber}, ${loc.street}, ${loc.barangay}, ${loc.city}`;
};

export default function BuyerDisputes() {
  const { user } = useUserContext();
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab]   = useState("all");

  useEffect(() => { if (user) fetchDisputes(); }, [user]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const data = await getOrdersByBuyer();
      setOrders((data.orders || []).filter(o => o.status === 7 || o.status === 8));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const underReview = orders.filter(o => o.status === 7).length;
  const refunded    = orders.filter(o => o.status === 8).length;

  const filtered = activeTab === "all"
    ? orders
    : orders.filter(o => o.status === Number(activeTab));

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            My Disputes
          </h1>
          <p className="text-gray-600 mt-1">Track disputes you have opened with the platform</p>
        </div>
        <button onClick={fetchDisputes} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Disputes", val: orders.length, color: "text-gray-900",   icon: <Scale className="w-4 h-4"       /> },
          { label: "Under Review",   val: underReview,   color: "text-red-600",    icon: <Clock className="w-4 h-4"       /> },
          { label: "Refunded",       val: refunded,      color: "text-orange-600", icon: <CheckCircle className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1 mb-1">{s.icon} {s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "all", label: `All (${orders.length})` },
          { id: "7",   label: `Under Review (${underReview})` },
          { id: "8",   label: `Refunded (${refunded})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              activeTab === tab.id ? "bg-green-600 text-white shadow-md" : "bg-white text-gray-700 hover:bg-green-50 border border-gray-200"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-200">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No disputes</h3>
          <p className="text-gray-500 text-sm">You haven't opened any disputes yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm">No disputes match this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.slice().sort((a, b) => b.id - a.id).map(order => {
            const isExpanded = expandedId === order.id;
            const isRefunded = order.status === 8;
            const lineItems  = order.lineItems || [];
            const dispute    = order.dispute || null;

            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 overflow-hidden">
                <div className={`h-1 w-full ${isRefunded ? "bg-orange-400" : "bg-red-400"}`} />

                <div className="flex flex-col lg:flex-row">

                  {/* Left panel */}
                  <div className="bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 p-5 lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Order ID</p>
                        <p className="text-2xl font-bold text-gray-900">#{order.id}</p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 w-fit ${
                        isRefunded
                          ? "bg-orange-100 text-orange-700 border-orange-200"
                          : "bg-red-100 text-red-700 border-red-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isRefunded ? "bg-orange-500" : "bg-red-500"}`} />
                        {isRefunded ? "Refunded" : "Under Review"}
                      </span>

                      {/* Line items */}
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Items ({lineItems.length})</p>
                        <div className="space-y-1.5">
                          {lineItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              {item.imageCID && (
                                <img src={`${PINATA}${item.imageCID}`} alt={item.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-white flex-shrink-0"
                                  onError={e => { e.target.style.display = "none"; }} />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                                {item.hasVariant && item.variantLabel && (
                                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">{item.variantLabel}</span>
                                )}
                                <p className="text-[10px] text-gray-400">×{item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Amount in Escrow</p>
                        <p className={`font-bold text-lg ${isRefunded ? "text-orange-600" : "text-red-600"}`}>
                          {parseFloat(order.totalPrice).toFixed(2)} AGT
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right panel */}
                  <div className="flex-1 p-5 space-y-4">

                    {/* Status message */}
                    {!isRefunded ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <Scale className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-800">Dispute Under Review</p>
                          <p className="text-xs text-red-600 mt-1">
                            Your dispute has been submitted. The admin is reviewing the case. Funds of{" "}
                            <span className="font-bold">{parseFloat(order.totalPrice).toFixed(2)} AGT</span>{" "}
                            remain in escrow until resolved.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-orange-800">Dispute Resolved — Refunded</p>
                          <p className="text-xs text-orange-600 mt-1">
                            The admin ruled in your favor. Your refund of{" "}
                            <span className="font-bold">{parseFloat(order.totalPrice).toFixed(2)} AGT</span>{" "}
                            has been returned to your wallet.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── Dispute reason from DB ── */}
                    {dispute?.reason && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> Your Dispute Reason
                        </p>
                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                          <p className="text-sm text-gray-800 italic">"{dispute.reason}"</p>
                        </div>
                      </div>
                    )}

                    {/* ── Admin notes (shown if resolved) ── */}
                    {dispute?.adminNotes && isRefunded && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> Admin Decision Notes
                        </p>
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                          <p className="text-sm text-gray-700 italic">"{dispute.adminNotes}"</p>
                        </div>
                      </div>
                    )}

                    {/* Seller info */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Seller</p>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{order.sellerName || "Unknown"}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{fmtAddr(order.sellerLocation)}</p>
                      </div>
                    </div>

                    {/* Price breakdown */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 grid grid-cols-3 gap-3 text-sm">
                      <div><p className="text-xs text-gray-500 mb-0.5">Products</p><p className="font-semibold text-gray-700">{parseFloat(order.totalProductPrice).toFixed(2)} AGT</p></div>
                      <div><p className="text-xs text-gray-500 mb-0.5">Platform Fee</p><p className="font-semibold text-gray-700">{parseFloat(order.platformFee).toFixed(4)} AGT</p></div>
                      <div><p className="text-xs text-gray-500 mb-0.5">Logistics</p><p className="font-semibold text-gray-700">{parseFloat(order.logisticsFee).toFixed(2)} AGT</p></div>
                    </div>

                    {/* Expand */}
                    <div className="flex pt-1">
                      <button onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-300">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isExpanded ? "Hide" : "View"} Timeline
                      </button>
                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 pt-4 grid md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <h4 className="font-semibold text-gray-900 text-sm mb-3">Order Timeline</h4>
                          <div className="space-y-1.5 text-xs">
                            {[
                              ["Ordered",          order.createdAt],
                              ["Shipped",          order.confirmAt],
                              ["Picked Up",        order.pickedUpAt],
                              ["Out for Delivery", order.outForDeliveryAt],
                              ["Delivered",        order.deliveredAt],
                            ].filter(([, ts]) => ts && ts > 0).map(([label, ts]) => (
                              <div key={label} className="flex justify-between gap-2">
                                <span className="text-gray-500 flex-shrink-0">{label}:</span>
                                <span className="font-medium text-right">{fmtTime(ts)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {order.deliveryAddress && (
                          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                            <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> Delivery Address
                            </h4>
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
      )}
    </div>
  );
}