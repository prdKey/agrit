import { useState, useEffect } from "react";
import { useUserContext } from "../../context/UserContext.jsx";
import { getProductsByUser } from "../../services/productService.js";
import { getOrdersBySeller } from "../../services/orderService.js";
import { 
  Package, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SellerDashboard() {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, ordersData] = await Promise.all([
          getProductsByUser(user.id),
          getOrdersBySeller()
        ]);
        setProducts(productsData.products || []);
        setOrders(ordersData.orders || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Calculate stats
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.active).length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10).length;
  
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 1).length;
  const completedOrders = orders.filter(o => o.status === 6).length;
  const totalRevenue = orders
    .filter(o => o.status === 6)
    .reduce((sum, o) => sum + parseFloat(o.productPrice || 0), 0);

  // Recent orders (last 5)
  const recentOrders = [...orders]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  // Top selling products
  const productSales = {};
  orders.forEach(order => {
    if (order.status === 6) {
      productSales[order.productId] = (productSales[order.productId] || 0) + order.quantity;
    }
  });
  
  const topProducts = products
    .map(p => ({
      ...p,
      soldCount: productSales[p.id] || 0
    }))
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, 5);

  const getStatusBadge = (status) => {
    const statusConfig = {
      1: { label: "PAID", color: "bg-yellow-100 text-yellow-800" },
      2: { label: "SHIPPED", color: "bg-blue-100 text-blue-800" },
      3: { label: "PICKED UP", color: "bg-indigo-100 text-indigo-800" },
      4: { label: "OUT FOR DELIVERY", color: "bg-purple-100 text-purple-800" },
      5: { label: "DELIVERED", color: "bg-teal-100 text-teal-800" },
      6: { label: "COMPLETED", color: "bg-green-100 text-green-800" },
    };
    const config = statusConfig[status] || { label: "UNKNOWN", color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
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
        <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.firstName}! Here's your store overview.</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold mt-2">{totalRevenue.toFixed(2)} AGT</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-100 text-sm">
            <TrendingUp size={16} />
            <span>From {completedOrders} completed orders</span>
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
              <ShoppingBag size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-blue-100 text-sm">
            <Clock size={16} />
            <span>{pendingOrders} pending</span>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm font-medium">Products Listed</p>
              <p className="text-3xl font-bold mt-2">{totalProducts}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Package size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-purple-100 text-sm">
            <CheckCircle size={16} />
            <span>{activeProducts} active</span>
          </div>
        </div>

        {/* Total Stock */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Stock</p>
              <p className="text-3xl font-bold mt-2">{totalStock}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Package size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-orange-100 text-sm">
            <AlertCircle size={16} />
            <span>{lowStockProducts} low stock items</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{completedOrders}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingOrders}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">In Transit</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {orders.filter(o => o.status >= 2 && o.status <= 4).length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Order Value</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {completedOrders > 0 ? (totalRevenue / completedOrders).toFixed(2) : "0.00"} AGT
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingBag size={20} className="text-blue-600" />
                Recent Orders
              </h2>
              <button
                onClick={() => navigate('/seller/orders')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
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
                      <p className="font-semibold text-gray-900">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">{order.name}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">{order.quantity} units</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-green-600">{order.productPrice} AGT</span>
                      <span className="text-gray-400">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-green-600" />
                Top Selling Products
              </h2>
              <button
                onClick={() => navigate('/seller/products')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage Products
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {topProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No products yet</p>
              </div>
            ) : (
              topProducts.map((product, index) => (
                <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500">{product.category}</span>
                        <span className="text-sm font-medium text-green-600">{product.pricePerUnit} AGT</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{product.soldCount}</p>
                      <p className="text-xs text-gray-500">sold</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts > 0 && (
        <div className="mt-6 bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">Low Stock Alert</h3>
              <p className="text-sm text-orange-700 mt-1">
                You have {lowStockProducts} product{lowStockProducts > 1 ? 's' : ''} with low stock (less than 10 units).
                Consider restocking to avoid running out.
              </p>
              <button
                onClick={() => navigate('/seller/products')}
                className="mt-3 text-sm font-medium text-orange-700 hover:text-orange-800 underline"
              >
                View Low Stock Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/seller/products')}
          className="bg-white border-2 border-gray-200 hover:border-green-500 rounded-lg p-6 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-600 transition-colors">
              <Package className="text-green-600 group-hover:text-white" size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Manage Products</p>
              <p className="text-sm text-gray-500">Add or edit your products</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/seller/orders')}
          className="bg-white border-2 border-gray-200 hover:border-blue-500 rounded-lg p-6 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-600 transition-colors">
              <ShoppingBag className="text-blue-600 group-hover:text-white" size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">View Orders</p>
              <p className="text-sm text-gray-500">Track and manage orders</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/')}
          className="bg-white border-2 border-gray-200 hover:border-purple-500 rounded-lg p-6 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-600 transition-colors">
              <Eye className="text-purple-600 group-hover:text-white" size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">View Marketplace</p>
              <p className="text-sm text-gray-500">See your store listing</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}