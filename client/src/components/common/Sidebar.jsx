// components/common/Sidebar.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Menu, LogOut } from "lucide-react";

export default function Sidebar({ menuItems, title }) {
  const location   = useLocation();
  const path       = location.pathname.split("/")[2] || "dashboard";
  const [active, setActive] = useState(path);
  const [open,   setOpen]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setActive(path); }, [path]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleNav = (item) => {
    setActive(item.path);
    navigate(item.path);
    setOpen(false);
  };

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────────────────────────── */}
      <div className="flex h-12 w-full items-center gap-3 px-4 bg-white border-b border-gray-200 md:hidden">
        <button  onClick={() => setOpen(true)}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>

      {/* ── Overlay ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 bg-white shadow-xl
        transition-transform duration-300 ease-in-out
        w-64 p-4 flex flex-col
        md:static md:h-auto md:z-auto md:shadow-md md:rounded-xl md:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-green-600">{title}</h1>
          <button
            className="md:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Menu items */}
        <div className="flex flex-col gap-1 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNav(item)}
              className={`cursor-pointer   flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full text-left transition-colors duration-200 font-medium text-sm
                ${active === item.path
                  ? "bg-green-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                }`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}