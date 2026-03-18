import { useState, useEffect } from "react";
import { getAllOrders } from "../../services/orderService.js";
import {
  Package, Search, RefreshCw, ChevronDown, ChevronUp,
  Loader2, User, Truck, Store, MapPin, Clock,
  CheckCircle, XCircle, AlertTriangle, Scale, ShoppingBag,
} from "lucide-react";

const PINATA = "https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/";
const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  1:  { label: "Paid",             color: "bg-yellow-100 text-yellow-800 border-yellow-200",  dot: "bg-yellow-500"  },
  2:  { label: "Shipped",          color: "bg-blue-100 text-blue-800 border-blue-200",        dot: "bg-blue-500"    },
  3:  { label: "Picked Up",        color: "bg-indigo-100 text-indigo-800 border-indigo-200",  dot: "bg-indigo-500"  },
  4:  { label: "Out for Delivery", color: "bg-purple-100 text-purple-800 border-purple-200",  dot: "bg-purple-500"  },
  5:  { label: "Delivered",        color: "bg-teal-100 text-teal-800 border-teal-200",        dot: "bg-teal-500"    },
  6:  { label: "Completed",        color: "bg-green-100 text-green-800 border-green-200",     dot: "bg-green-500"   },
  7:  { label: "Disputed",         color: "bg-red-100 text-red-800 border-red-200",           dot: "bg-red-500"     },
  8:  { label: "Refunded",         color: "bg-orange-100 text-orange-800 border-orange-200",  dot: "bg-orange-500"  },
  9:  { label: "Cancelled",        color: "bg-gray-100 text-gray-600 border-gray-200",        dot: "bg-gray-400"    },
  10: { label: "Cancelled",        color: "bg-gray-100 text-gray-600 border-gray-200",        dot: "bg-gray-400"    },
};

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: 1,  label: "Paid"             },
  { id: 2,  label: "Shipped"          },
  { id: 3,  label: "Picked Up"        },
  { id: 4,  label: "Out for Delivery" },
  { id: 5,  label: "Delivered"        },
  { id: 6,  label: "Completed"        },
  { id: 7,  label: "Disputed"         },
  { id: 8,  label: "Refunded"         },
  { id: 9,  label: "Cancelled"        },
];

const fmtTime = (ts) =>
  (!ts || ts === 0) ? "—" : new Date(ts * 1000).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });

const fmtAddr = (loc) => {
  if (!loc) return "N/A";
  if (typeof loc === "string") return loc;
  return `#${loc.houseNumber}, ${loc.street}, ${loc.barangay}, ${loc.city}`;
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: "Unknown", color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (page <= 3) {
    pages.push(1, 2, 3, 4, 5);
  } else if (page >= totalPages - 2) {
    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
  } else {
    for (let i = page - 2; i <= page + 2; i++) pages.push(i);
  }
  return (
    <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
      <button onClick={() => onPage(page - 1)} disabled={page === 1}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        ← Prev
      </button>
      {pages.map(p => (
        <button key={p} onClick={() => onPage(p)}
          className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
            p === page ? "bg-green-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}>
          {p}
        </button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Next →
      </button>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [activeTab, setActiveTab]   = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage]             = useState(1);

  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => { setPage(1); }, [activeTab, search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      setOrders(data.orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const stats = {
    total:     orders.length,
    active:    orders.filter(o => [1,2,3,4,5].includes(o.status)).length,
    completed: orders.filter(o => o.status === 6).length,
    disputed:  orders.filter(o => o.status === 7).length,
    cancelled: orders.filter(o => [9,10].includes(o.status)).length,
    revenue:   orders.filter(o => o.status === 6).reduce((s, o) => s + parseFloat(o.totalPrice || 0), 0),
  };

  const filtered = orders
    .filter(o => activeTab === "all" || o.status === activeTab)
    .filter(o => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(o.id).includes(q) ||
        (o.buyerName  || "").toLowerCase().includes(q) ||
        (o.sellerName || "").toLowerCase().includes(q) ||
        (o.buyerAddress  || "").toLowerCase().includes(q) ||
        (o.sellerAddress || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.id - a.id);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5 sm:mb-6 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              Order Management
            </h1>
            <p className="text-gray-500 mt-0.5 text-xs sm:text-sm">Monitor all marketplace orders</p>
          </div>
          <button onClick={fetchOrders}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0 shadow-sm">
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        {/* 2-col on mobile, 3-col on sm, 6-col on lg */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-5 sm:mb-6">
          {[
            { label: "Total",     value: stats.total,                       color: "text-gray-900",  bg: "bg-gray-50",   icon: <Package className="w-4 h-4" />     },
            { label: "Active",    value: stats.active,                      color: "text-blue-600",  bg: "bg-blue-50",   icon: <Truck className="w-4 h-4" />       },
            { label: "Completed", value: stats.completed,                   color: "text-green-600", bg: "bg-green-50",  icon: <CheckCircle className="w-4 h-4" /> },
            { label: "Disputed",  value: stats.disputed,                    color: "text-red-600",   bg: "bg-red-50",    icon: <Scale className="w-4 h-4" />       },
            { label: "Cancelled", value: stats.cancelled,                   color: "text-gray-500",  bg: "bg-gray-50",   icon: <XCircle className="w-4 h-4" />     },
            { label: "Revenue",   value: `${stats.revenue.toFixed(0)} AGT`, color: "text-amber-600", bg: "bg-amber-50",  icon: <ShoppingBag className="w-4 h-4" /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
              <div className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${s.bg} ${s.color} mb-2`}>
                {s.icon}
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium mb-0.5">{s.label}</p>
              <p className={`text-lg sm:text-xl font-bold ${s.color} truncate`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order ID, buyer, or seller..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
            />
          </div>
          {search && (
            <button onClick={() => setSearch("")}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2.5 border border-gray-200 rounded-xl bg-white flex-shrink-0 shadow-sm">
              Clear
            </button>
          )}
        </div>

        {/* ── Status tabs ─────────────────────────────────────────────────── */}
        <div className="relative mb-4">
          {/* Fade hint on right edge */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-gray-100 to-transparent z-10 rounded-r-xl" />
          <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <div className="flex gap-1.5 min-w-max">
              {STATUS_TABS.map(tab => {
                const count = tab.id === "all"
                  ? orders.length
                  : orders.filter(o => o.status === tab.id).length;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"
                    }`}>
                    {tab.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Result count ────────────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 mb-3">
            {filtered.length} order{filtered.length !== 1 ? "s" : ""} · Page {page} of {totalPages}
          </p>
        )}

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 sm:p-16 text-center border border-gray-200">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-500 text-sm">
              {search ? "Try adjusting your search" : "No orders match this filter"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 sm:space-y-4">
              {paginated.map(order => {
                const isExpanded = expandedId === order.id;
                const lineItems  = order.lineItems || [];
                const dispute    = order.dispute || null;
                const cfg        = STATUS_CONFIG[order.status] || STATUS_CONFIG[9];

                return (
                  <div key={order.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden">

                    {/* Status color bar */}
                    <div className={`h-1 w-full ${cfg.dot}`} />

                    {/* ── Card body: stacks on mobile, side-by-side on lg ── */}
                    <div className="flex flex-col lg:flex-row">

                      {/* ── Left panel ─────────────────────────────────── */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-gray-200 lg:w-56 xl:w-64 lg:flex-shrink-0">

                        {/* Order ID + status */}
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Order</p>
                            <p className="text-2xl font-bold text-gray-900 leading-none">#{order.id}</p>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>

                        {/* Line items */}
                        <div className="mb-4">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2">
                            Items ({lineItems.length})
                          </p>
                          <div className="space-y-2">
                            {lineItems.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                {item.imageCID && (
                                  <img src={`${PINATA}${item.imageCID}`} alt={item.name}
                                    className="w-9 h-9 rounded-lg object-cover border border-white shadow-sm flex-shrink-0"
                                    onError={e => { e.target.style.display = "none"; }} />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{item.name}</p>
                                  {item.hasVariant && item.variantLabel && (
                                    <span className="inline-block text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold mt-0.5">
                                      {item.variantLabel}
                                    </span>
                                  )}
                                  <p className="text-[10px] text-gray-400">×{item.quantity} · {parseFloat(item.productPrice).toFixed(2)} AGT</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Price summary */}
                        <div className="pt-3 border-t border-gray-200 space-y-1 text-xs">
                          <div className="flex justify-between text-gray-500">
                            <span>Products</span>
                            <span className="font-semibold text-gray-700">{parseFloat(order.totalProductPrice).toFixed(2)} AGT</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>Platform</span>
                            <span>{parseFloat(order.platformFee).toFixed(4)} AGT</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>Logistics</span>
                            <span>{parseFloat(order.logisticsFee).toFixed(2)} AGT</span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-gray-200 font-bold text-sm">
                            <span>Total</span>
                            <span className="text-green-600">{parseFloat(order.totalPrice).toFixed(2)} AGT</span>
                          </div>
                        </div>
                      </div>

                      {/* ── Right panel ────────────────────────────────── */}
                      <div className="flex-1 p-4 sm:p-5 min-w-0">

                        {/* Parties grid: 1-col mobile → 3-col sm+ */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">

                          {/* Buyer */}
                          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                            <p className="text-[10px] text-blue-500 uppercase tracking-wide font-bold mb-1.5 flex items-center gap-1">
                              <User className="w-3 h-3" /> Buyer
                            </p>
                            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                              {order.buyerName || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {order.deliveryAddress?.fullAddress || fmtAddr(order.buyerLocation)}
                            </p>
                            {order.buyerMobile && (
                              <p className="text-xs text-blue-600 font-medium mt-1">{order.buyerMobile}</p>
                            )}
                          </div>

                          {/* Seller */}
                          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                            <p className="text-[10px] text-green-600 uppercase tracking-wide font-bold mb-1.5 flex items-center gap-1">
                              <Store className="w-3 h-3" /> Seller
                            </p>
                            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                              {order.sellerName || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {fmtAddr(order.sellerLocation)}
                            </p>
                            {order.sellerMobile && (
                              <p className="text-xs text-green-600 font-medium mt-1">{order.sellerMobile}</p>
                            )}
                          </div>

                          {/* Logistics */}
                          <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                            <p className="text-[10px] text-purple-600 uppercase tracking-wide font-bold mb-1.5 flex items-center gap-1">
                              <Truck className="w-3 h-3" /> Logistics
                            </p>
                            {order.logisticsName ? (
                              <>
                                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                                  {order.logisticsName}
                                </p>
                                {order.logisticsMobile && (
                                  <p className="text-xs text-purple-600 font-medium mt-1">{order.logisticsMobile}</p>
                                )}
                                {order.logisticsLocation && (
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">{order.logisticsLocation}</p>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-gray-400 italic mt-1">Not yet assigned</p>
                            )}
                          </div>
                        </div>

                        {/* Dispute info */}
                        {dispute && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                            <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5 mb-1 flex-wrap">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                              Dispute — {dispute.openedByRole}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                dispute.status === "OPEN"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}>{dispute.status}</span>
                            </p>
                            {dispute.reason    && <p className="text-xs text-gray-700 italic break-words">"{dispute.reason}"</p>}
                            {dispute.adminNotes && <p className="text-xs text-gray-500 mt-1 break-words">Admin: "{dispute.adminNotes}"</p>}
                          </div>
                        )}

                        {/* Footer row: timestamp + expand button */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            {fmtTime(order.createdAt)}
                          </p>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : order.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {isExpanded ? "Hide" : "View"} Timeline
                          </button>
                        </div>

                        {/* ── Expanded timeline ──────────────────────── */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 mt-4 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">

                            <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-100">
                              <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-500" /> Order Timeline
                              </h4>
                              <div className="space-y-1.5 text-xs">
                                {[
                                  ["Created",           order.createdAt],
                                  ["Confirmed/Shipped", order.confirmAt],
                                  ["Picked Up",         order.pickedUpAt],
                                  ["Out for Delivery",  order.outForDeliveryAt],
                                  ["Delivered",         order.deliveredAt],
                                  ["Completed",         order.completedAt],
                                  ["Cancelled",         order.cancelledAt],
                                ].filter(([, ts]) => ts && ts > 0).map(([label, ts]) => (
                                  <div key={label} className="flex justify-between gap-2">
                                    <span className="text-gray-500 flex-shrink-0">{label}:</span>
                                    <span className="font-medium text-right">{fmtTime(ts)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
                              <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-500" /> Delivery Address
                              </h4>
                              {order.deliveryAddress ? (
                                <div className="text-xs space-y-1">
                                  <p className="font-semibold text-gray-800">{order.deliveryAddress.name}</p>
                                  <p className="text-gray-600 break-words leading-relaxed">{order.deliveryAddress.fullAddress}</p>
                                  <p className="text-gray-500">{order.deliveryAddress.phone}</p>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">No delivery address recorded</p>
                              )}
                              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs">
                                <div>
                                  <span className="text-gray-400 block mb-0.5">Buyer wallet</span>
                                  <span className="font-mono text-gray-600 break-all text-[10px]">{order.buyerAddress}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block mb-0.5">Seller wallet</span>
                                  <span className="font-mono text-gray-600 break-all text-[10px]">{order.sellerAddress}</span>
                                </div>
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

            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}