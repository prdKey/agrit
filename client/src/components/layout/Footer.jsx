import { useNavigate } from "react-router-dom";
import { Store, Truck, Bell, BadgeQuestionMark, Leaf, Mail, Phone } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-white border-t border-gray-100 shadow-inner mt-6">

      {/* ── Main footer content ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <img className="w-8 h-8 object-contain" src="/icon/AgritrustIcon.png" alt="AgriTrust Logo" />
            <span className="text-lg font-black text-green-600 tracking-tight">AgriTrust</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Connecting farmers, buyers, and logistics through blockchain-powered trust.
          </p>
          <div className="flex items-center gap-1.5 text-green-600">
            <Leaf size={14} />
            <span className="text-xs font-medium text-gray-500">Powered by AGT Token</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Quick Links</h4>
          <div className="flex flex-col gap-2">
            {[
              { label: "Marketplace",      path: "/" },
              { label: "Seller Centre",    path: "/seller" },
              { label: "Logistic Centre",  path: "/logistic" },
              { label: "My Orders",        path: "/user/purchase" },
              { label: "Cart",             path: "/cart" },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="text-sm text-gray-500 hover:text-green-600 transition-colors text-left"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Centers */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Centers</h4>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate("/seller")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors"
            >
              <Store size={14} /> Seller Centre
            </button>
            <button
              onClick={() => navigate("/logistic")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors"
            >
              <Truck size={14} /> Logistic Centre
            </button>
            <button
              onClick={() => navigate("/user/notifications")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors"
            >
              <Bell size={14} /> Notifications
            </button>
            <button
              onClick={() => navigate("/about")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors"
            >
              <BadgeQuestionMark size={14} /> About Us
            </button>
          </div>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Contact</h4>
          <div className="flex flex-col gap-2">
            <a
              href="mailto:support@agritrust.com"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors"
            >
              <Mail size={14} /> support@agritrust.com
            </a>
            <a
              href="tel:+63900000000"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors"
            >
              <Phone size={14} /> +63 900 000 0000
            </a>
          </div>
        </div>
      </div>

      {/* ── Bottom strip ─────────────────────────────────────────────── */}
      <div className="bg-green-600 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <p className="text-white text-xs">
            © {currentYear} AgriTrust. All rights reserved.
          </p>
          <p className="text-green-200 text-xs">
            Built with 🌱 for Filipino farmers
          </p>
        </div>
      </div>

    </footer>
  );
}