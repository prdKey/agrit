import { useEffect, useState } from "react";
import { getAllUsers, toggleUserStatus, changeUserRole } from "../../services/userService.js";
import {
  User, Mail, Phone, MapPin, Wallet, Calendar,
  ChevronDown, Search, Shield, ShieldOff, ChevronUp,
  Loader2, CheckCircle, XCircle
} from "lucide-react";

const ROLES    = ["USER", "SELLER", "ADMIN", "LOGISTICS"];
const ROLE_COLORS = {
  USER:      "bg-blue-100 text-blue-800 border-blue-200",
  SELLER:    "bg-purple-100 text-purple-800 border-purple-200",
  ADMIN:     "bg-red-100 text-red-800 border-red-200",
  LOGISTICS: "bg-green-100 text-green-800 border-green-200",
};

const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", {
  month: "short", day: "numeric", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

const fmtAddress = (a) => {
  if (!a) return "—";
  const { houseNumber, street, barangay, city, postalCode } = a;
  return `#${houseNumber} ${street}, ${barangay}, ${city} ${postalCode ?? ""}`.trim();
};

const RoleBadge = ({ role }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${ROLE_COLORS[role] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
    {role}
  </span>
);

const StatusBadge = ({ status }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
    status === "ACTIVE"
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-red-100 text-red-700 border-red-200"
  }`}>{status}</span>
);

export default function UserManagement() {
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [roleFilter,    setRoleFilter]    = useState("ALL");
  const [statusFilter,  setStatusFilter]  = useState("ALL");
  const [expandedId,    setExpandedId]    = useState(null);
  const [togglingId,    setTogglingId]    = useState(null);
  const [changingRole,  setChangingRole]  = useState(null); // userId
  const [roleSelect,    setRoleSelect]    = useState({});   // { [userId]: role }
  const [toast,         setToast]         = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch { showToast("Failed to load users", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleStatus = async (id) => {
    setTogglingId(id);
    try {
      const updated = await toggleUserStatus(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: updated.status } : u));
      showToast(`User ${updated.status === "ACTIVE" ? "activated" : "suspended"}`);
    } catch { showToast("Failed to update status", "error"); }
    finally { setTogglingId(null); }
  };

  const handleChangeRole = async (id) => {
    const role = roleSelect[id];
    if (!role) return;
    setChangingRole(id);
    try {
      const updated = await changeUserRole(id, role);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: updated.role } : u));
      setRoleSelect(prev => ({ ...prev, [id]: "" }));
      showToast(`Role changed to ${updated.role}`);
    } catch { showToast("Failed to change role", "error"); }
    finally { setChangingRole(null); }
  };

  const filtered = users.filter(u => {
    const name = `${u.firstName} ${u.lastName}`.toLowerCase();
    const q    = search.toLowerCase();
    const matchSearch = name.includes(q) || u.email.toLowerCase().includes(q) || String(u.id).includes(q);
    return matchSearch
      && (roleFilter   === "ALL" || u.role   === roleFilter)
      && (statusFilter === "ALL" || u.status === statusFilter);
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${
          toast.type === "error" ? "bg-red-600" : "bg-green-600"
        }`}>
          {toast.type === "error" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-1">Manage all users, roles, and account status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users",  value: users.length,                               color: "text-gray-900" },
          { label: "Active",       value: users.filter(u => u.status === "ACTIVE").length,   color: "text-green-600" },
          { label: "Suspended",    value: users.filter(u => u.status === "SUSPENDED").length, color: "text-red-600" },
          { label: "Showing",      value: filtered.length,                             color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Search by name, email, or ID…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full md:w-40 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="ALL">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full md:w-40 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Users list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
          <User className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(u => {
            const expanded = expandedId === u.id;
            const toggling = togglingId === u.id;
            const changing = changingRole === u.id;

            return (
              <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Main row */}
                <div className="flex flex-col lg:flex-row">

                  {/* Left panel */}
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-5 lg:w-72 border-b lg:border-b-0 lg:border-r border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-xs text-gray-400 font-medium">ID #{u.id}</p>
                      <div className="flex gap-1.5">
                        <RoleBadge role={u.role} />
                        <StatusBadge status={u.status} />
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900 leading-tight mb-3">
                      {u.firstName} {u.middleName ? u.middleName + " " : ""}{u.lastName}
                    </p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{u.mobileNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right panel */}
                  <div className="flex-1 p-5 space-y-4">

                    {/* Address */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Address
                      </p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        {fmtAddress(u.address)}
                      </p>
                    </div>

                    {/* Wallet */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <Wallet className="w-3 h-3" /> Wallet
                      </p>
                      <p className="text-xs font-mono text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 break-all">
                        {u.walletAddress}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">

                      {/* Toggle status */}
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        disabled={toggling}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                          u.status === "ACTIVE"
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {toggling ? <Loader2 className="w-4 h-4 animate-spin" />
                          : u.status === "ACTIVE" ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />
                        }
                        {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </button>

                      {/* Change role */}
                      <div className="flex items-center gap-1.5">
                        <select
                          value={roleSelect[u.id] || ""}
                          onChange={e => setRoleSelect(prev => ({ ...prev, [u.id]: e.target.value }))}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Change role…</option>
                          {ROLES.filter(r => r !== u.role).map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleChangeRole(u.id)}
                          disabled={!roleSelect[u.id] || changing}
                          className="px-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors"
                        >
                          {changing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                        </button>
                      </div>

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpandedId(expanded ? null : u.id)}
                        className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                      >
                        {expanded ? "Hide" : "Details"}
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Expanded details */}
                    {expanded && (
                      <div className="border-t border-gray-100 pt-4 grid md:grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Timeline
                          </h4>
                          <div className="space-y-1.5 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>Registered:</span>
                              <span className="font-medium text-gray-900">{fmtDate(u.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Last updated:</span>
                              <span className="font-medium text-gray-900">{fmtDate(u.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Account Info</h4>
                          <div className="space-y-1.5 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>Gender:</span>
                              <span className="font-medium text-gray-900">{u.gender}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Date of Birth:</span>
                              <span className="font-medium text-gray-900">{u.dob}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Verified:</span>
                              <span className={`font-bold ${u.isVerified ? "text-green-600" : "text-red-500"}`}>
                                {u.isVerified ? "Yes" : "No"}
                              </span>
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
      )}
    </div>
  );
}