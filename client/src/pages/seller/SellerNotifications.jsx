import { useState, useEffect } from "react";
import { useUserContext } from "../../context/UserContext.jsx";
import { ShoppingBag, Truck, CheckCircle, AlertCircle, Info, Trash2, Check, Filter, BellOff, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllRead } from "../../services/notificationService.js";

const ICON_MAP = {
  ORDER:    { icon: ShoppingBag, color: "text-blue-600",   bg: "bg-blue-100"   },
  DELIVERY: { icon: Truck,       color: "text-purple-600", bg: "bg-purple-100" },
  SUCCESS:  { icon: CheckCircle, color: "text-green-600",  bg: "bg-green-100"  },
  ALERT:    { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100" },
  INFO:     { icon: Info,        color: "text-gray-600",   bg: "bg-gray-100"   },
};

const FILTERS = ["ALL","UNREAD","READ","ORDER","SUCCESS","ALERT","INFO"];
const PAGE_SIZE = 10;

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const getPages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3)              return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) return [totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages];
    return [page-2, page-1, page, page+1, page+2];
  };
  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button onClick={() => onPage(page - 1)} disabled={page === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {page > 3 && totalPages > 5 && (
        <>
          <button onClick={() => onPage(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">1</button>
          <span className="text-gray-400 text-xs px-1">…</span>
        </>
      )}
      {getPages().map(p => (
        <button key={p} onClick={() => onPage(p)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
            p === page ? "bg-green-600 border-green-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}>
          {p}
        </button>
      ))}
      {page < totalPages - 2 && totalPages > 5 && (
        <>
          <span className="text-gray-400 text-xs px-1">…</span>
          <button onClick={() => onPage(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">{totalPages}</button>
        </>
      )}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function SellerNotifications() {
  const { user }   = useUserContext();
  const navigate   = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("ALL");
  const [page,    setPage]    = useState(1);

  useEffect(() => { if (user) fetchNotifications(); }, [user]);
  useEffect(() => { setPage(1); }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleMarkAsRead = async (id) => {
    try { await markAsRead(id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); }
    catch (err) { console.error(err); }
  };

  const handleMarkAllAsRead = async () => {
    try { await markAllAsRead(); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }
    catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      const remaining = filteredNotifications.filter(n => n.id !== id);
      const newTotal  = Math.max(1, Math.ceil(remaining.length / PAGE_SIZE));
      if (page > newTotal) setPage(newTotal);
    } catch (err) { console.error(err); }
  };

  const handleDeleteAllRead = async () => {
    if (!window.confirm("Delete all read notifications?")) return;
    try { await deleteAllRead(); setNotifications(prev => prev.filter(n => !n.read)); setPage(1); }
    catch (err) { console.error(err); }
  };

  const formatTimestamp = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1)  return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24)  return `${hrs}h ago`;
    if (days < 7)  return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "ALL")    return true;
    if (filter === "UNREAD") return !n.read;
    if (filter === "READ")   return n.read;
    return n.type === filter;
  });

  const totalPages  = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
  const paginated   = filteredNotifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6 rounded-lg">


        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0
                ? <span className="font-semibold text-green-600">{unreadCount} unread</span>
                : "You're all caught up!"}
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2">
                  <Check size={16} /> Mark all read
                </button>
              )}
              <button onClick={handleDeleteAllRead}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2">
                <Trash2 size={16} /> Clear read
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          <Filter size={18} className="text-gray-500 flex-shrink-0" />
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f ? "bg-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}>
              {f}
            </button>
          ))}
        </div>

        {filteredNotifications.length > 0 && (
          <p className="text-xs text-gray-400 mb-3">
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""} &nbsp;·&nbsp; Page {page} of {totalPages}
          </p>
        )}

        {/* List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <BellOff className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h2>
            <p className="text-gray-500 text-sm">
              {filter === "ALL" ? "You don't have any notifications yet" : `No ${filter.toLowerCase()} notifications`}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginated.map(n => {
                const iconData = ICON_MAP[n.type] || ICON_MAP.INFO;
                const Icon     = iconData.icon;
                return (
                  <div key={n.id} className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all ${
                    !n.read ? "border-l-4 border-l-blue-500 border-gray-200" : "border-gray-200 hover:shadow-md"
                  }`}>
                    <div className="p-4 flex items-start gap-4">
                      <div className={`flex-shrink-0 ${iconData.bg} p-3 rounded-lg`}>
                        <Icon className={iconData.color} size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-semibold text-sm ${!n.read ? "text-gray-900" : "text-gray-700"}`}>
                            {n.title}
                            {!n.read && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" />}
                          </h3>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{formatTimestamp(n.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{n.message}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          {n.orderId && (
                            <button onClick={() => navigate("/seller/orders")}
                              className="text-xs text-green-600 hover:text-green-700 font-medium">
                              View Order #{n.orderId}
                            </button>
                          )}
                          {!n.read && (
                            <button onClick={() => handleMarkAsRead(n.id)}
                              className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
                              <Check size={13} /> Mark as read
                            </button>
                          )}
                          <button onClick={() => handleDelete(n.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 ml-auto">
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}

        {/* Stats */}
        {notifications.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total",      value: notifications.length,                                     color: "text-gray-900"   },
              { label: "Unread",     value: unreadCount,                                              color: "text-green-600"  },
              { label: "Orders",     value: notifications.filter(n => n.type === "ORDER").length,    color: "text-blue-600"   },
              { label: "Deliveries", value: notifications.filter(n => n.type === "DELIVERY").length, color: "text-purple-600" },
              { label: "Alerts",     value: notifications.filter(n => n.type === "ALERT").length,    color: "text-orange-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}