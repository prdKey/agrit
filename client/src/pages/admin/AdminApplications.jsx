import { useState, useEffect } from "react";
import {
  getAllApplications, reviewApplication,
} from "../../services/userService.js";
import {
  ClipboardList, Truck, Store, Clock, CheckCircle2,
  XCircle, Loader2, ChevronDown, ChevronUp, Wallet
} from "lucide-react";

const STATUS_CONFIG = {
  PENDING:  { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  APPROVED: { color: "bg-green-100 text-green-800 border-green-200",   icon: CheckCircle2 },
  REJECTED: { color: "bg-red-100 text-red-800 border-red-200",         icon: XCircle },
};

const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", {
  month: "short", day: "numeric", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

const StatusBadge = ({ status }) => {
  const cfg  = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {status}
    </span>
  );
};

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [expandedId,   setExpandedId]   = useState(null);
  const [reviewing,    setReviewing]    = useState(null);
  const [notes,        setNotes]        = useState({});
  const [toast,        setToast]        = useState(null);

  useEffect(() => { load(); }, [statusFilter]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAllApplications(statusFilter === "ALL" ? "" : statusFilter);
      setApplications(data);
    } catch {
      showToast("Failed to load applications", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReview = async (id, status) => {
    setReviewing(id + status);
    try {
      await reviewApplication(id, status, notes[id] || "");
      showToast(`Application ${status === "APPROVED" ? "approved ✓" : "rejected"}`);
      setNotes(prev => ({ ...prev, [id]: "" }));
      setExpandedId(null);
      await load();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to review", "error");
    } finally {
      setReviewing(null);
    }
  };

  // Stats
  const counts = {
    ALL:      applications.length,
    PENDING:  applications.filter(a => a.status === "PENDING").length,
    APPROVED: applications.filter(a => a.status === "APPROVED").length,
    REJECTED: applications.filter(a => a.status === "REJECTED").length,
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${
          toast.type === "error" ? "bg-red-600" : "bg-green-600"
        }`}>
          {toast.type === "error" ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          Role Applications
        </h1>
        <p className="text-gray-500 mt-1">Review and approve/reject Seller and Logistics applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total",    value: applications.length,                              color: "text-gray-900" },
          { label: "Pending",  value: applications.filter(a=>a.status==="PENDING").length,  color: "text-yellow-600" },
          { label: "Approved", value: applications.filter(a=>a.status==="APPROVED").length, color: "text-green-600" },
          { label: "Rejected", value: applications.filter(a=>a.status==="REJECTED").length, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              statusFilter === s
                ? "bg-green-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s} {s !== "ALL" && <span className="ml-1 opacity-70">({counts[s]})</span>}
          </button>
        ))}
      </div>

      {/* Applications list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
          <ClipboardList className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No {statusFilter !== "ALL" ? statusFilter.toLowerCase() : ""} applications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const user     = app.User;
            const expanded = expandedId === app.id;
            const isRev    = reviewing?.startsWith(String(app.id));

            return (
              <div key={app.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5">

                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {/* Role icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        app.roleApplying === "SELLER" ? "bg-purple-100" : "bg-green-100"
                      }`}>
                        {app.roleApplying === "SELLER"
                          ? <Store className="w-5 h-5 text-purple-600" />
                          : <Truck className="w-5 h-5 text-green-600" />
                        }
                      </div>

                      {/* Applicant info */}
                      <div>
                        <p className="font-bold text-gray-900">
                          {user?.firstName} {user?.lastName}
                          <span className="ml-1.5 text-xs font-normal text-gray-400">#{user?.id}</span>
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-400">
                            Applying as <span className="font-semibold text-gray-700">{app.roleApplying}</span>
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{fmtDate(app.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: badge + expand */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={app.status} />
                      <button
                        onClick={() => setExpandedId(expanded ? null : app.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {expanded
                          ? <ChevronUp className="w-4 h-4 text-gray-400" />
                          : <ChevronDown className="w-4 h-4 text-gray-400" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-gray-50 space-y-4">

                      {/* Wallet */}
                      <div>
                        <p className="text-xs text-gray-400 font-semibold mb-1 flex items-center gap-1">
                          <Wallet className="w-3 h-3" /> Wallet Address
                        </p>
                        <p className="text-xs font-mono text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 break-all">
                          {user?.walletAddress}
                        </p>
                      </div>

                      {/* Current role */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Current role:</span>
                        <span className="font-bold text-gray-800">{user?.role}</span>
                      </div>

                      {/* PENDING — show review form */}
                      {app.status === "PENDING" && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                              Admin Notes
                              <span className="font-normal text-gray-400 ml-1">(optional — visible to applicant if rejected)</span>
                            </label>
                            <textarea
                              value={notes[app.id] || ""}
                              onChange={e => setNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                              placeholder="Add a reason or message for the applicant…"
                              rows={2}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-300"
                            />
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => handleReview(app.id, "APPROVED")}
                              disabled={isRev}
                              className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                            >
                              {reviewing === app.id + "APPROVED"
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <CheckCircle2 className="w-4 h-4" />
                              }
                              Approve as {app.roleApplying}
                            </button>
                            <button
                              onClick={() => handleReview(app.id, "REJECTED")}
                              disabled={isRev}
                              className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                            >
                              {reviewing === app.id + "REJECTED"
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <XCircle className="w-4 h-4" />
                              }
                              Reject
                            </button>
                          </div>
                        </>
                      )}

                      {/* Already reviewed */}
                      {app.status !== "PENDING" && (
                        <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 space-y-1">
                          <p className="text-xs font-semibold text-gray-500">Review Details</p>
                          <p className="text-xs text-gray-500">
                            Reviewed: <span className="font-medium text-gray-700">{fmtDate(app.reviewedAt)}</span>
                          </p>
                          {app.adminNotes && (
                            <p className="text-xs text-gray-600 mt-1">
                              <span className="font-semibold">Notes:</span> {app.adminNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}