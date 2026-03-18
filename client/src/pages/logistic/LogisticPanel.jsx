// pages/logistics/SellerPanel.jsx
import { LayoutDashboard, ShoppingCart, BarChart3, Settings, Bell, Navigation } from "lucide-react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/common/Sidebar.jsx";
import { useUserContext } from "../../context/UserContext.jsx";
import useLocationTracker from "../../hooks/useLocationTracker.js";
import { useEffect, useState } from "react";
import { getOrdersByLogistics } from "../../services/orderService.js";

export default function LogisticPanel() {
  const { user } = useUserContext();
  const [activeOrderIds, setActiveOrderIds] = useState([]);

  useEffect(() => {
    if (!user) return;
    getOrdersByLogistics()
      .then(res => {
        const ids = (res.orders || [])
          .filter(o => o.status >= 2 && o.status <= 4)
          .map(o => String(o.id));
        setActiveOrderIds(ids);
      })
      .catch(() => {});
  }, [user]);

  const tracker = useLocationTracker(user?.walletAddress, activeOrderIds);
  const { isTracking, lastPosition, geoError } = tracker;

  const menu = [
    { name: "Dashboard",         icon: LayoutDashboard, path: "dashboard"     },
    { name: "Orders To Deliver", icon: ShoppingCart,    path: "orders"        },
    { name: "Notifications",     icon: Bell,            path: "notifications" },
    { name: "Analytics",         icon: BarChart3,       path: "analytics"     },
  ];

  return (
    <div className="w-full flex mt-0 md:mt-6 mx-auto">
      <div className="w-full flex flex-col md:flex-row gap-6">

        {/* Sidebar */}
        <Sidebar menuItems={menu} title="Logistic Panel" />

        {/* Main content */}
        <main className="flex-1 min-w-0">

          {/* GPS status bar — compact, only shows inside main */}
          <div className={`mx-4 md:mx-0 mb-3 rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold
            ${isTracking
              ? "bg-green-50 border border-green-200 text-green-700"
              : geoError
              ? "bg-red-50 border border-red-200 text-red-600"
              : "bg-gray-50 border border-gray-200 text-gray-400"
            }`}>

            {isTracking ? (
              <>
                {/* Pulsing dot */}
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <Navigation className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Location broadcasting</span>
                {lastPosition && (
                  <span className="ml-auto font-mono text-green-600 flex-shrink-0 text-[10px]">
                    {lastPosition.lat.toFixed(4)}, {lastPosition.lng.toFixed(4)}
                  </span>
                )}
              </>
            ) : geoError ? (
              <span className="truncate">⚠ GPS error: {geoError}</span>
            ) : (
              <>
                <Navigation className="w-3 h-3 flex-shrink-0" />
                <span>Waiting for GPS…</span>
              </>
            )}
          </div>

          {/* Page content */}
          <Outlet context={{ tracker, setActiveOrderIds }} />
        </main>

      </div>
    </div>
  );
}