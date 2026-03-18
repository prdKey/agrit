import { useUserContext } from "../../context/UserContext";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { getBalance } from "../../services/agtTokenService.js";
import {
  ShoppingCart, Search, Bell, BadgeQuestionMark, Wallet,
  Store, Truck, LogOut, ChevronDown, ShoppingBag, ReceiptText, UserCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

const PINATA_GATEWAY = "https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/";

const resolveAvatar = (user) => {
  if (!user?.profileImage) return null;
  if (user.profileImage.startsWith("http")) return user.profileImage;
  return `${PINATA_GATEWAY}${user.profileImage}`;
};

// Shared avatar component
function Avatar({ user, size = "sm" }) {
  const [imgError, setImgError] = useState(false);
  const src = resolveAvatar(user);
  const dim = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";

  if (src && !imgError) {
    return (
      <img src={src} alt="avatar"
        onError={() => setImgError(true)}
        className={`${dim} rounded-full object-cover border-2 border-white flex-shrink-0`} />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-amber-400 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {user?.firstName?.[0]?.toUpperCase() ?? "U"}
    </div>
  );
}

export default function Header() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  const [search, setSearch]               = useState("");
  const [balance, setBalance]             = useState(null);
  const [profileOpen, setProfileOpen]     = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useUserContext();
  const navigate     = useNavigate();
  const location     = useLocation();
  const profileRef   = useRef(null);
  const mobileMenuRef = useRef(null);

  const isSellerPanel    = location.pathname.startsWith("/seller");
  const isLogisticsPanel = location.pathname.startsWith("/logistic");
  const isPanelPage      = isSellerPanel || isLogisticsPanel;

  useEffect(() => { setSearch(keyword); }, [keyword]);

  useEffect(() => {
    if (!user?.walletAddress) return;
    getBalance(user.walletAddress)
      .then(bal => setBalance(parseFloat(bal)))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const handleSearch = () => {
    if (!search.trim()) return;
    navigate(`/search?keyword=${search}`);
  };

  const fmtBalance = (b) => {
    if (b === null) return "—";
    if (b >= 1000000) return `${(b / 1000000).toFixed(1)}M`;
    if (b >= 1000)    return `${(b / 1000).toFixed(1)}K`;
    return b.toFixed(2);
  };

  const handleSellerClick = () => {
    if (!user) return navigate("/login");
    if (user.role === "SELLER" || user.role === "ADMIN") return navigate("/seller");
    navigate("/applications");
  };

  const handleLogisticsClick = () => {
    if (!user) return navigate("/login");
    if (user.role === "LOGISTICS" || user.role === "ADMIN") return navigate("/logistic");
    navigate("/applications");
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout?.();
    navigate("/login");
  };

  const handleSwitchToBuyer = () => {
    setProfileOpen(false);
    navigate("/");
  };

  // ── Shared profile dropdown content ──────────────────────────────────────
  const ProfileDropdown = ({ isPanelMode }) => (
    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
      {/* User info header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className=" cursor-pointer flex items-center gap-2.5">
          <Avatar user={user} size="lg" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{user.firstName} {user.lastName}</p>
            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wide bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* My Account */}
      <button
        onClick={() => { setProfileOpen(false); navigate("/user"); }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors group">
        <div className="w-6 h-6 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors flex-shrink-0">
          <UserCircle size={12} className="text-blue-600" />
        </div>
        <div className="text-left">
          <p className="font-medium">My Account</p>
          <p className="text-[10px] text-gray-400">Profile & settings</p>
        </div>
      </button>

      {/* Switch to Buyer — only on panel pages */}
      {isPanelMode && (
        <button onClick={handleSwitchToBuyer}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors group">
          <div className="w-6 h-6 rounded-full bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors flex-shrink-0">
            <ShoppingBag size={12} className="text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-medium">Switch to Buyer</p>
            <p className="text-[10px] text-gray-400">Go to Marketplace</p>
          </div>
        </button>
      )}

      <div className="border-t border-gray-100" />

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors group">
        <div className="w-6 h-6 rounded-full bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0">
          <LogOut size={12} className="text-red-500" />
        </div>
        <div className="text-left">
          <p className="font-medium">Logout</p>
          <p className="text-[10px] text-gray-400">Sign out of account</p>
        </div>
      </button>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm border-b border-gray-100">

      {/* ── Green top bar ────────────────────────────────────────────────── */}
      <div className="bg-green-600 px-3 h-9 flex items-center">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">

          {/* Left */}
          {!isPanelPage ? (
            <div className="hidden sm:flex items-center divide-x divide-green-500">
              <button onClick={handleSellerClick}
                className="cursor-pointer flex items-center gap-1 text-white text-xs hover:text-green-200 transition-colors pr-3">
                <Store size={12} />
                <span>Seller Centre</span>
                {user && user.role !== "SELLER" && user.role !== "ADMIN" && (
                  <span className="ml-1 bg-green-500 text-green-100 text-[10px] px-1 rounded">Apply</span>
                )}
              </button>
              <button onClick={handleLogisticsClick}
                className="cursor-pointer flex items-center gap-1 text-white text-xs hover:text-green-200 transition-colors pl-3">
                <Truck size={12} />
                <span>Logistic Centre</span>
                {user && user.role !== "LOGISTICS" && user.role !== "ADMIN" && (
                  <span className="ml-1 bg-green-500 text-green-100 text-[10px] px-1 rounded">Apply</span>
                )}
              </button>
            </div>
          ) : (
            <span className="text-green-200 text-xs font-medium tracking-wide uppercase">
              {isSellerPanel ? "Seller Centre" : "Logistic Centre"}
            </span>
          )}

          {/* Mobile hamburger */}
          {!isPanelPage && (
            <div className="sm:hidden" ref={mobileMenuRef}>
              <button onClick={() => setMobileMenuOpen(v => !v)}
                className="flex flex-col gap-[3px] p-1 text-white">
                <span className={`block w-4 h-[2px] bg-white transition-all ${mobileMenuOpen ? "rotate-45 translate-y-[5px]" : ""}`} />
                <span className={`block w-4 h-[2px] bg-white transition-all ${mobileMenuOpen ? "opacity-0" : ""}`} />
                <span className={`block w-4 h-[2px] bg-white transition-all ${mobileMenuOpen ? "-rotate-45 -translate-y-[5px]" : ""}`} />
              </button>
              {mobileMenuOpen && (
                <div className="absolute top-9 left-0 w-full bg-green-700 z-50 border-t border-green-500 shadow-lg">
                  <div className="flex flex-col py-1">
                    <button onClick={() => { handleSellerClick(); setMobileMenuOpen(false); }}
                      className="cursor-pointer flex items-center gap-2 px-4 py-2.5 text-white text-sm hover:bg-green-600 transition-colors">
                      <Store size={14} /> Seller Centre
                      {user && user.role !== "SELLER" && user.role !== "ADMIN" && (
                        <span className="ml-auto bg-green-500 text-green-100 text-[10px] px-1.5 py-0.5 rounded">Apply</span>
                      )}
                    </button>
                    <button onClick={() => { handleLogisticsClick(); setMobileMenuOpen(false); }}
                      className="cursor-pointer flex items-center gap-2 px-4 py-2.5 text-white text-sm hover:bg-green-600 transition-colors">
                      <Truck size={14} /> Logistic Centre
                      {user && user.role !== "LOGISTICS" && user.role !== "ADMIN" && (
                        <span className="ml-auto bg-green-500 text-green-100 text-[10px] px-1.5 py-0.5 rounded">Apply</span>
                      )}
                    </button>
                    <button onClick={() => { navigate("/transaction-history"); setMobileMenuOpen(false); }}
                      className="cursor-pointer flex items-center gap-2 px-4 py-2.5 text-white text-sm hover:bg-green-600 transition-colors">
                      <ReceiptText size={14} /> Transactions
                      <span className="ml-auto bg-green-500 text-green-100 text-[10px] px-1.5 py-0.5 rounded">Public</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right */}
          <div className="flex items-center gap-3">
            {!isPanelPage && (
              <button onClick={() => navigate("/transaction-history")}
                className="cursor-pointer hidden sm:flex items-center gap-1 text-white text-xs hover:text-green-200 transition-colors">
                <ReceiptText size={12} /><span>Transactions</span>
              </button>
            )}
            {!isPanelPage && (
              <button onClick={() => navigate("/user/notifications")}
                className="cursor-pointer text-white hover:text-green-200 transition-colors">
                <Bell size={15} />
              </button>
            )}
            <button onClick={() => navigate("/about")} className="cursor-pointer  text-white hover:text-green-200 transition-colors">
              <BadgeQuestionMark size={15} />
            </button>

            {user && (
              <div onClick={() => navigate("/wallet")}
                className="flex items-center gap-1 bg-green-500 border border-green-400 rounded-full px-2.5 py-0.5 cursor-pointer">
                <Wallet size={11} className="text-green-200 flex-shrink-0" />
                <span className="text-xs font-bold text-white whitespace-nowrap">{fmtBalance(balance)} AGT</span>
              </div>
            )}

            {user && <div className="w-px h-4 bg-green-500" />}

            {/* ── Profile button — same for both panel and buyer view ────── */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(prev => !prev)}
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <Avatar user={user} size="sm" />
                  <span className="text-white text-xs font-medium max-w-[100px] truncate hidden sm:block">
                    {user.firstName} {user.lastName}
                  </span>
                  <ChevronDown size={12} className={`text-white transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && <ProfileDropdown isPanelMode={isPanelPage} />}
              </div>
            ) : (
              <button onClick={() => navigate("/login")}
                className="cursor-pointer text-xs bg-white text-green-600 font-semibold px-3 py-1 rounded-full hover:bg-green-50 transition-colors">
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main row: Logo · Search · Cart ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 py-2.5 flex items-center gap-3">
        {isPanelPage ? (
          <div className="cursor-pointer flex items-center gap-2 flex-shrink-0 select-none">
            <img className="w-8 h-8 object-contain opacity-80" src="/icon/AgritrustIcon.png" alt="AgriTrust" />
            <span className="hidden md:block text-lg font-black text-green-600 tracking-tight">AgriTrust</span>
          </div>
        ) : (
          <button onClick={() => navigate("/")} className="cursor-pointer  flex items-center gap-2 flex-shrink-0 group">
            <img className="cursor-pointer w-8 h-8 object-contain" src="/icon/AgritrustIcon.png" alt="AgriTrust" />
            <span className="hidden md:block text-lg font-black text-green-600 tracking-tight group-hover:text-green-500 transition-colors">AgriTrust</span>
          </button>
        )}

        {!isPanelPage && (
          <div className="flex-1 flex justify-center">
            <div className="flex w-full max-w-md rounded-full overflow-hidden border-2 border-green-600 focus-within:border-green-500 focus-within:shadow-md transition-all">
              <input value={search} type="text" placeholder="Search products..."
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-0 px-4 py-2 text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none" />
              <button onClick={handleSearch}
                className="bg-green-600 hover:bg-green-700 text-white px-4 flex items-center justify-center transition-colors flex-shrink-0">
                <Search size={16} />
              </button>
            </div>
          </div>
        )}

        {!isPanelPage && (
          <button onClick={() => navigate("/cart")}
            className="cursor-pointer flex-shrink-0 text-green-600 hover:text-green-500 transition-colors p-1">
            <ShoppingCart size={24} />
          </button>
        )}
      </div>
    </header>
  );
}