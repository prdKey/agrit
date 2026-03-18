import { useState, useEffect } from "react";
import { useUserContext } from "../../context/UserContext.jsx";
import { useNavigate } from "react-router-dom";
import { getOrdersByLogistics, getAvailableOrders, acceptOrder } from "../../services/orderService.js";
import {
  Truck, DollarSign, Package, CheckCircle, Clock,
  Navigation, Star, TrendingUp, MapPin, AlertCircle,
  ArrowRight, Loader2, RefreshCw, Zap, Activity
} from "lucide-react";

const fmtDate = (ts) => (!ts || ts === 0) ? "N/A" : new Date(ts * 1000).toLocaleDateString();
const fmtAddr = (loc) => {
  if (!loc) return "N/A";
  if (typeof loc === "string") return loc;
  return `${loc.barangay}, ${loc.city}`;
};

export default function LogisticsDashboard() {
  const { user }  = useUserContext();
  const navigate  = useNavigate();

  const [myOrders, setMyOrders]           = useState([]);
  const [available, setAvailable]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [acceptingId, setAcceptingId]     = useState(null);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [myRes, avRes] = await Promise.all([
        getOrdersByLogistics(),
        getAvailableOrders(),
      ]);
      setMyOrders(myRes.orders || []);
      setAvailable(avRes.orders || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [user]);

  const handleAccept = async (orderId) => {
    setAcceptingId(orderId);
    try {
      await acceptOrder(orderId);
      await fetchAll();
      navigate("/logistic/orders");
    } catch (e) { alert(e.response?.data?.error || "Failed to accept order"); }
    finally { setAcceptingId(null); }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalDeliveries   = myOrders.length;
  const completed         = myOrders.filter(o => o.status === 6);
  const inProgress        = myOrders.filter(o => o.status >= 2 && o.status <= 4);
  const readyForPickup    = myOrders.filter(o => o.status === 2);
  const outForDelivery    = myOrders.filter(o => o.status === 4);
  const delivered         = myOrders.filter(o => o.status === 5);

  const totalEarned       = completed.reduce((s, o) => s + parseFloat(o.logisticsFee || 0), 0);
  const pendingPayout     = myOrders.filter(o => o.status === 5).reduce((s, o) => s + parseFloat(o.logisticsFee || 0), 0);
  const inEscrow          = inProgress.reduce((s, o) => s + parseFloat(o.logisticsFee || 0), 0);

  const recentCompleted   = [...completed].sort((a, b) => b.completedAt - a.completedAt).slice(0, 4);
  const activeJobs        = myOrders.filter(o => o.status >= 2 && o.status <= 5).sort((a, b) => b.id - a.id);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Logistics</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Dashboard</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Welcome back, {user?.firstName}!</p>
        </div>
        <button onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Available jobs banner */}
      {available.length > 0 && (
        <button onClick={() => navigate("/logistic/orders")}
          className="w-full mb-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 flex items-center justify-between hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-white">{available.length} New Job{available.length > 1 ? "s" : ""} Available!</p>
              <p className="text-green-100 text-xs mt-0.5">Tap to browse and accept delivery jobs</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-green-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-green-100 text-xs font-semibold uppercase tracking-wide">Total Earned</p>
              <p className="text-3xl font-black mt-1.5">{totalEarned.toFixed(2)}</p>
              <p className="text-green-200 text-xs">AGT</p>
            </div>
            <div className="bg-white/20 p-2.5 rounded-xl"><DollarSign className="w-5 h-5" /></div>
          </div>
          <p className="text-green-100 text-xs">From {completed.length} completed deliveries</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide">In Progress</p>
              <p className="text-3xl font-black mt-1.5">{inProgress.length}</p>
              <p className="text-blue-200 text-xs">Active deliveries</p>
            </div>
            <div className="bg-white/20 p-2.5 rounded-xl"><Activity className="w-5 h-5" /></div>
          </div>
          <p className="text-blue-100 text-xs">{readyForPickup.length} to pick up · {outForDelivery.length} out for delivery</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-amber-100 text-xs font-semibold uppercase tracking-wide">Pending Payout</p>
              <p className="text-3xl font-black mt-1.5">{pendingPayout.toFixed(2)}</p>
              <p className="text-amber-200 text-xs">AGT · released on buyer confirm</p>
            </div>
            <div className="bg-white/20 p-2.5 rounded-xl"><Clock className="w-5 h-5" /></div>
          </div>
          <p className="text-amber-100 text-xs">{delivered.length} waiting for buyer confirmation</p>
        </div>

        <div className="bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl p-5 text-white shadow-lg shadow-purple-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-violet-100 text-xs font-semibold uppercase tracking-wide">Total Deliveries</p>
              <p className="text-3xl font-black mt-1.5">{totalDeliveries}</p>
              <p className="text-violet-200 text-xs">All time</p>
            </div>
            <div className="bg-white/20 p-2.5 rounded-xl"><Truck className="w-5 h-5" /></div>
          </div>
          <p className="text-violet-100 text-xs">{available.length} new jobs available</p>
        </div>
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Ready to Pick Up", val: readyForPickup.length, color: "text-yellow-600" },
          { label: "Out for Delivery", val: outForDelivery.length, color: "text-purple-600" },
          { label: "Awaiting Confirm", val: delivered.length,      color: "text-teal-600" },
          { label: "In Escrow",        val: `${inEscrow.toFixed(2)} AGT`, color: "text-blue-600" },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
            <p className={`text-xl font-black mt-1 ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Active jobs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Active Jobs
            </h2>
            <button onClick={() => navigate("/logistic/orders")}
              className="text-xs text-green-600 font-semibold hover:text-green-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {activeJobs.length === 0 ? (
              <div className="p-10 text-center">
                <Truck className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 text-sm font-medium">No active jobs</p>
                <button onClick={() => navigate("/logistic/orders")}
                  className="mt-3 text-xs text-green-600 font-semibold hover:text-green-700">Browse available jobs →</button>
              </div>
            ) : activeJobs.slice(0, 5).map(order => {
              const statusConfig = {
                2: { label: "Ready for Pickup", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
                3: { label: "Picked Up",        color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-400" },
                4: { label: "Out for Delivery", color: "bg-purple-100 text-purple-700", dot: "bg-purple-400" },
                5: { label: "Delivered",        color: "bg-teal-100 text-teal-700",     dot: "bg-teal-400" },
              };
              const cfg = statusConfig[order.status] || { label: "Active", color: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
              return (
                <div key={order.id} className="px-6 py-4 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${cfg.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{order.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-500 truncate">{fmtAddr(order.buyerLocation)}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-600">{parseFloat(order.logisticsFee).toFixed(2)} AGT</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Available jobs preview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-green-500" /> Available Jobs
                {available.length > 0 && (
                  <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">{available.length}</span>
                )}
              </h2>
              <button onClick={() => navigate("/logistic/orders")}
                className="text-xs text-green-600 font-semibold hover:text-green-700 flex items-center gap-1">
                Browse All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {available.length === 0 ? (
                <div className="p-8 text-center">
                  <Star className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                  <p className="text-gray-500 text-sm">No available jobs right now</p>
                  <p className="text-gray-400 text-xs mt-1">Check back later</p>
                </div>
              ) : available.slice(0, 3).map(order => (
                <div key={order.id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{order.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{fmtAddr(order.sellerLocation)}</span>
                        <span>→</span>
                        <span className="flex items-center gap-1"><Navigation className="w-2.5 h-2.5" />{fmtAddr(order.buyerLocation)}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-black text-green-600">{parseFloat(order.logisticsFee).toFixed(2)} AGT</p>
                      <button
                        onClick={() => handleAccept(order.id)}
                        disabled={acceptingId === order.id}
                        className="mt-1.5 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {acceptingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Accept"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {available.length > 3 && (
                <div className="px-6 py-3 text-center">
                  <button onClick={() => navigate("/logistic/orders")}
                    className="text-xs text-green-600 font-semibold hover:text-green-700">
                    +{available.length - 3} more jobs available →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent completions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" /> Recent Completions
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {recentCompleted.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No completed deliveries yet</div>
              ) : recentCompleted.map(order => (
                <div key={order.id} className="px-6 py-3 flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{order.name}</p>
                    <p className="text-xs text-gray-400">Completed {fmtDate(order.completedAt)}</p>
                  </div>
                  <p className="text-sm font-bold text-green-600 flex-shrink-0">+{parseFloat(order.logisticsFee).toFixed(2)} AGT</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate("/logistic/orders")}
              className="bg-white border-2 border-gray-200 hover:border-green-500 rounded-2xl p-4 transition-all group text-left">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-600 transition-colors">
                <Truck className="w-4 h-4 text-green-600 group-hover:text-white" />
              </div>
              <p className="text-sm font-bold text-gray-900">My Deliveries</p>
              <p className="text-xs text-gray-400 mt-0.5">{totalDeliveries} orders</p>
            </button>
            <button onClick={() => navigate("/logistic/orders")}
              className="bg-white border-2 border-gray-200 hover:border-amber-500 rounded-2xl p-4 transition-all group text-left">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-500 transition-colors">
                <Star className="w-4 h-4 text-amber-600 group-hover:text-white" />
              </div>
              <p className="text-sm font-bold text-gray-900">Available Jobs</p>
              <p className="text-xs text-gray-400 mt-0.5">{available.length} new jobs</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}