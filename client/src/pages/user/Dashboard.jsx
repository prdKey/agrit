import { useState, useEffect } from "react";
import { useUserContext } from "../../context/UserContext.jsx";
import { getOrdersByBuyer } from "../../services/orderService.js";
import { 
  ShoppingBag, 
  Package, 
  Truck,
  CheckCircle,
  Clock,
  TrendingUp,
  MapPin,
  Store,
  Eye,
  Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BuyerDashboard() {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getOrdersByBuyer();
        setOrders(data.orders || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user]);

  // Calculate stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 1).length;
  const inTransitOrders = orders.filter(o => o.status >= 2 && o.status <= 4).length;
  const deliveredOrders = orders.filter(o => o.status === 5).length;
  const completedOrders = orders.filter(o => o.status === 6).length;
  
  const totalSpent = orders
    .filter(o => o.status >= 1)
    .reduce((sum, o) => sum + parseFloat(o.totalPrice || 0), 0);

  const totalItems = orders.reduce((sum, o) => sum + o.quantity, 0);

  // Recent orders (last 5)
  const recentOrders = [...orders]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  // Active deliveries (orders in transit)
  const activeDeliveries = orders.filter(o => o.status >= 2 && o.status <= 5);

  // Get category breakdown
  const categoryStats = {};
  orders.forEach(order => {
    if (order.status >= 1) {
      categoryStats[order.category] = (categoryStats[order.category] || 0) + 1;
    }
  });
  const topCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const getStatusInfo = (status) => {
    const statusMap = {
      1: { label: "PAID", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      2: { label: "SHIPPED", color: "bg-blue-100 text-blue-800", icon: Package },
      3: { label: "PICKED UP", color: "bg-indigo-100 text-indigo-800", icon: Truck },
      4: { label: "OUT FOR DELIVERY", color: "bg-purple-100 text-purple-800", icon: Truck },
      5: { label: "DELIVERED", color: "bg-teal-100 text-teal-800", icon: MapPin },
      6: { label: "COMPLETED", color: "bg-green-100 text-green-800", icon: CheckCircle },
    };
    return statusMap[status] || { label: "UNKNOWN", color: "bg-gray-100 text-gray-800", icon: Package };
  };

  const getStatusBadge = (status) => {
    const info = getStatusInfo(status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${info.color}`}>
        {info.label}
      </span>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 rounded-lg">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.firstName}! Track your orders and purchases.</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Spent */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Spent</p>
              <p className="text-3xl font-bold mt-2">{totalSpent.toFixed(2)} AGT</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-100 text-sm">
            <ShoppingBag size={16} />
            <span>{totalItems} items purchased</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold mt-2">{totalOrders}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Package size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-blue-100 text-sm">
            <CheckCircle size={16} />
            <span>{completedOrders} completed</span>
          </div>
        </div>

        {/* In Transit */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm font-medium">In Transit</p>
              <p className="text-3xl font-bold mt-2">{inTransitOrders}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Truck size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-purple-100 text-sm">
            <Clock size={16} />
            <span>On the way</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-orange-100 text-sm font-medium">Awaiting Shipment</p>
              <p className="text-3xl font-bold mt-2">{pendingOrders}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Clock size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-orange-100 text-sm">
            <Package size={16} />
            <span>Processing</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Delivered</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">{deliveredOrders}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{completedOrders}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Order Value</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : "0.00"} AGT
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Categories</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {Object.keys(categoryStats).length}
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Deliveries */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Truck size={20} className="text-purple-600" />
                Active Deliveries
              </h2>
              <button
                onClick={() => navigate('/user/purchase')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {activeDeliveries.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No active deliveries</p>
              </div>
            ) : (
              activeDeliveries.map((order) => {
                const StatusIcon = getStatusInfo(order.status).icon;
                return (
                  <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <StatusIcon className="text-purple-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{order.name}</p>
                          <p className="text-sm text-gray-600">Order #{order.id}</p>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm mt-3 ml-11">
                      <span className="text-gray-500">{order.quantity} units</span>
                      <button
                        onClick={() => navigate(`/track-order/${order.id}`)}
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <MapPin size={14} />
                        Track
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package size={20} className="text-blue-600" />
                Recent Orders
              </h2>
              <button
                onClick={() => navigate('/user/purchase')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No orders yet</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{order.name}</p>
                      <p className="text-sm text-gray-600">Order #{order.id}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">{order.quantity} units</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-green-600">{order.totalPrice} AGT</span>
                      <span className="text-gray-400">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Purchase Categories */}
      {topCategories.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" />
            Your Top Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {topCategories.map(([category, count], index) => (
              <div key={category} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-gray-900">#{index + 1}</span>
                  <span className="text-sm font-semibold text-green-600">{count} orders</span>
                </div>
                <p className="font-medium text-gray-700">{category}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Actions */}
      {deliveredOrders > 0 && (
        <div className="mt-6 bg-teal-50 border-l-4 border-teal-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Package className="text-teal-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-teal-900">Action Required</h3>
              <p className="text-sm text-teal-700 mt-1">
                You have {deliveredOrders} delivered order{deliveredOrders > 1 ? 's' : ''} waiting for confirmation.
                Please confirm receipt to complete your orders.
              </p>
              <button
                onClick={() => navigate('/orders')}
                className="mt-3 text-sm font-medium text-teal-700 hover:text-teal-800 underline"
              >
                Confirm Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/')}
          className="bg-white border-2 border-gray-200 hover:border-green-500 rounded-lg p-6 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-600 transition-colors">
              <Store className="text-green-600 group-hover:text-white" size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Browse Marketplace</p>
              <p className="text-sm text-gray-500">Discover new products</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/user/purchase')}
          className="bg-white border-2 border-gray-200 hover:border-blue-500 rounded-lg p-6 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-600 transition-colors">
              <Package className="text-blue-600 group-hover:text-white" size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">My Orders</p>
              <p className="text-sm text-gray-500">Track your purchases</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/user/purchase')}
          className="bg-white border-2 border-gray-200 hover:border-purple-500 rounded-lg p-6 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-600 transition-colors">
              <Search className="text-purple-600 group-hover:text-white" size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Track Orders</p>
              <p className="text-sm text-gray-500">See delivery status</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}