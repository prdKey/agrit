import { useState, useEffect } from "react";
import { useUserContext } from "../../context/UserContext.jsx";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../services/tokenService.js";
import axios from "axios";
import {
  Scale, Users, ShoppingBag, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle, Clock, BarChart2,
  Package, RefreshCw, Activity
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

const formatDate = (ts) => (!ts || ts === 0) ? "N/A" : new Date(ts * 1000).toLocaleDateString();

export default function AdminDashboard() {
  const { user }  = useUserContext();
  const navigate  = useNavigate();
  const [allOrders, setAllOrders] = useState([]);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        setLoading(true);
        const [ordersRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/orders/all`,  { headers: authHeader() }).catch(() => ({ data: { orders: [] } })),
          axios.get(`${API_URL}/users`,        { headers: authHeader() }).catch(() => ({ data: { users: [] } })),
        ]);
        setAllOrders(ordersRes.data.orders || []);
        setUsers(usersRes.data.users || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalOrders      = allOrders.length;
  const completedOrders  = allOrders.filter(o => o.status === 6);
  const disputedOrders   = allOrders.filter(o => o.status === 7);
  const activeOrders     = allOrders.filter(o => o.status >= 1 && o.status <= 5);
  const cancelledOrders  = allOrders.filter(o => o.status === 9 || o.status === 10);
  const refundedOrders   = allOrders.filter(o => o.status === 8);

  const platformFees  = completedOrders.reduce((s, o) => s + parseFloat(o.platformFee || 0), 0);
  const logisticsFees = completedOrders.reduce((s, o) => s + parseFloat(o.logisticsFee || 0), 0);
  const totalVolume   = allOrders.reduce((s, o) => s + parseFloat(o.totalPrice || 0), 0);

  const buyerCount    = users.filter(u => u.role === "buyer").length;
  const sellerCount   = users.filter(u => u.role === "seller").length;
  const logisticsCount = users.filter(u => u.role === "logistics").length;

  const recentOrders = [...allOrders].sort((a, b) => b.id - a.id).slice(0, 5);

  const statusBreakdown = [
    { status: 1, label: "Paid",             color: "bg-yellow-500" },
    { status: 2, label: "Shipped",          color: "bg-blue-500" },
    { status: 3, label: "Picked Up",        color: "bg-indigo-500" },
    { status: 4, label: "Out for Delivery", color: "bg-purple-500" },
    { status: 5, label: "Delivered",        color: "bg-teal-500" },
    { status: 6, label: "Completed",        color: "bg-green-500" },
    { status: 7, label: "Disputed",         color: "bg-red-500" },
    { status: 8, label: "Refunded",         color: "bg-orange-500" },
    { status: 9, label: "Cancelled",        color: "bg-gray-400" },
  ].map(s => ({ ...s, count: allOrders.filter(o => o.status === s.status).length }))
   .filter(s => s.count > 0);

  const getStatusBadge = (status) => {
    const config = {
      1: { label: "PAID",             color: "bg-yellow-100 text-yellow-800" },
      2: { label: "SHIPPED",          color: "bg-blue-100 text-blue-800" },
      3: { label: "PICKED UP",        color: "bg-indigo-100 text-indigo-800" },
      4: { label: "OUT FOR DELIVERY", color: "bg-purple-100 text-purple-800" },
      5: { label: "DELIVERED",        color: "bg-teal-100 text-teal-800" },
      6: { label: "COMPLETED",        color: "bg-green-100 text-green-800" },
      7: { label: "DISPUTED",         color: "bg-red-100 text-red-800" },
      8: { label: "REFUNDED",         color: "bg-orange-100 text-orange-800" },
      9: { label: "CANCELLED",        color: "bg-gray-200 text-gray-600" },
      10:{ label: "CANCELLED",        color: "bg-gray-200 text-gray-600" },
    }[status] || { label: "UNKNOWN", color: "bg-gray-100 text-gray-800" };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>{config.label}</span>;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100 p-6 rounded-lg">
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6 rounded-lg">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.firstName}! Here's your platform overview.</p>
      </div>

      {/* Dispute alert */}
      {disputedOrders.length > 0 && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">
                {disputedOrders.length} Disputed Order{disputedOrders.length > 1 ? "s" : ""} Require Attention
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {disputedOrders.length === 1 ? "There is 1 disputed order" : `There are ${disputedOrders.length} disputed orders`} waiting for your resolution.
              </p>
              <button onClick={() => navigate("/admin/disputes")}
                className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 underline">
                Resolve Disputes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm font-medium">Platform Fees Earned</p>
              <p className="text-3xl font-bold mt-2">{platformFees.toFixed(2)} AGT</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg"><DollarSign size={24} /></div>
          </div>
          <div className="flex items-center gap-2 text-green-100 text-sm">
            <TrendingUp size={16} />
            <span>From {completedOrders.length} completed orders</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold mt-2">{totalOrders}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg"><ShoppingBag size={24} /></div>
          </div>
          <div className="flex items-center gap-2 text-blue-100 text-sm">
            <Clock size={16} />
            <span>{activeOrders.length} active</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold mt-2">{users.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg"><Users size={24} /></div>
          </div>
          <div className="flex items-center gap-2 text-purple-100 text-sm">
            <CheckCircle size={16} />
            <span>{sellerCount} sellers · {buyerCount} buyers</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Volume</p>
              <p className="text-3xl font-bold mt-2">{totalVolume.toFixed(0)} AGT</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg"><BarChart2 size={24} /></div>
          </div>
          <div className="flex items-center gap-2 text-orange-100 text-sm">
            <AlertTriangle size={16} />
            <span>{disputedOrders.length} disputed · {cancelledOrders.length} cancelled</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{completedOrders.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Disputed</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{disputedOrders.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Logistics Fees</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{logisticsFees.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Refunded</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{refundedOrders.length}</p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingBag size={20} className="text-blue-600" /> Recent Orders
              </h2>
              <button onClick={() => navigate("/admin/orders")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No orders yet</p>
              </div>
            ) : recentOrders.map(order => (
              <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">{order.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Buyer: {order.buyerName || "Unknown"}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500">{order.quantity} units</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-green-600">{parseFloat(order.totalPrice || 0).toFixed(2)} AGT</span>
                    <span className="text-gray-400">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* User Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users size={20} className="text-purple-600" /> User Breakdown
                </h2>
                <button onClick={() => navigate("/admin/users")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium">Manage Users</button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { role: "Buyers",    count: buyerCount,     bar: "bg-blue-500",   text: "text-blue-600",   Icon: ShoppingBag },
                { role: "Sellers",   count: sellerCount,    bar: "bg-green-500",  text: "text-green-600",  Icon: Package },
                { role: "Logistics", count: logisticsCount, bar: "bg-purple-500", text: "text-purple-600", Icon: Activity },
              ].map(({ role, count, bar, text, Icon }) => {
                const pct = users.length ? Math.round((count / users.length) * 100) : 0;
                return (
                  <div key={role} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className={text} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1.5">
                          <p className="text-sm font-semibold text-gray-900">{role}</p>
                          <p className={`text-sm font-bold ${text}`}>{count}</p>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart2 size={20} className="text-blue-600" /> Order Status Breakdown
              </h2>
            </div>
            <div className="p-6">
              {statusBreakdown.length === 0
                ? <p className="text-gray-500 text-sm text-center py-4">No orders yet</p>
                : <div className="space-y-3">
                    {statusBreakdown.map(({ label, count, color, status }) => {
                      const pct = totalOrders ? Math.round((count / totalOrders) * 100) : 0;
                      return (
                        <div key={status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{label}</span>
                            <span className="font-semibold text-gray-900">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => navigate("/admin/disputes")}
          className="bg-white border-2 border-gray-200 hover:border-red-500 rounded-lg p-6 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-lg group-hover:bg-red-600 transition-colors">
              <Scale className="text-red-600 group-hover:text-white" size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Resolve Disputes</p>
              <p className="text-sm text-gray-500">{disputedOrders.length} pending resolution</p>
            </div>
          </div>
        </button>

        <button onClick={() => navigate("/admin/users")}
          className="bg-white border-2 border-gray-200 hover:border-purple-500 rounded-lg p-6 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-600 transition-colors">
              <Users className="text-purple-600 group-hover:text-white" size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Manage Users</p>
              <p className="text-sm text-gray-500">{users.length} registered users</p>
            </div>
          </div>
        </button>

        <button onClick={() => navigate("/admin/orders")}
          className="bg-white border-2 border-gray-200 hover:border-blue-500 rounded-lg p-6 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-600 transition-colors">
              <ShoppingBag className="text-blue-600 group-hover:text-white" size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">All Orders</p>
              <p className="text-sm text-gray-500">{totalOrders} total orders</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}