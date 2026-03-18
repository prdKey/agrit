import { useEffect, useState } from "react";
import { getMyFlags, submitAppeal } from "../../services/productService.js";
import { useUserContext } from "../../context/UserContext.jsx";
import {
  Flag, CheckCircle, XCircle, Clock, EyeOff,
  ChevronDown, ChevronUp, Loader2, RefreshCw,
  AlertTriangle, Package, Send,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const FLAG_STATUS = {
  FLAGGED:            { label: "Flagged",      color: "bg-red-100 text-red-700 border-red-200",       icon: <Flag className="w-3 h-3" /> },
  UNDER_REVIEW:       { label: "Under Review", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Clock className="w-3 h-3" /> },
  RESTORED:           { label: "Restored",     color: "bg-green-100 text-green-700 border-green-200",  icon: <CheckCircle className="w-3 h-3" /> },
  PERMANENTLY_HIDDEN: { label: "Removed",      color: "bg-gray-200 text-gray-600 border-gray-300",     icon: <EyeOff className="w-3 h-3" /> },
};

const APPEAL_STATUS = {
  PENDING:  { label: "Appeal Pending",  color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  APPROVED: { label: "Appeal Approved", color: "bg-green-100 text-green-700 border-green-200"   },
  REJECTED: { label: "Appeal Rejected", color: "bg-red-100 text-red-700 border-red-200"         },
};

const STATUS_TABS = [
  { id: "ALL",                label: "All"          },
  { id: "NEEDS_ACTION",       label: "Needs Action" },
  { id: "UNDER_REVIEW",       label: "Under Review" },
  { id: "RESTORED",           label: "Restored"     },
  { id: "PERMANENTLY_HIDDEN", label: "Removed"      },
];

const Badge = ({ label, colorClass, icon }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 w-fit ${colorClass}`}>
    {icon} {label}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function SellerAppeals() {
  const { user } = useUserContext();

  const [flags, setFlags]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState("ALL");
  const [expandedId, setExpandedId]   = useState(null);
  const [appealOpenId, setAppealOpenId] = useState(null); // which flag has form open
  const [message, setMessage]         = useState("");
  const [submitting, setSubmitting]   = useState(null);  // flagId being submitted
  const [successId, setSuccessId]     = useState(null);  // flagId just submitted

  useEffect(() => { if (user) fetchMyFlags(); }, [user]);

  const fetchMyFlags = async () => {
    try {
      setLoading(true);
      const res = await getMyFlags();
      setFlags(res.flags || []);
    } catch (err) {
      console.error("Failed to fetch flags:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAppeal = async (flagId, productId) => {
    if (!message.trim()) return alert("Please write your appeal message.");
    try {
      setSubmitting(flagId);
      await submitAppeal(flagId, productId, message);
      setSuccessId(flagId);
      setAppealOpenId(null);
      setMessage("");
      await fetchMyFlags();
      setTimeout(() => setSuccessId(null), 5000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit appeal.");
    } finally {
      setSubmitting(null);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const needsAction = flags.filter(
    f => f.status === "FLAGGED" && !(f.ProductAppeals?.length)
  ).length;

  const counts = {
    ALL:                flags.length,
    NEEDS_ACTION:       needsAction,
    UNDER_REVIEW:       flags.filter(f => f.status === "UNDER_REVIEW").length,
    RESTORED:           flags.filter(f => f.status === "RESTORED").length,
    PERMANENTLY_HIDDEN: flags.filter(f => f.status === "PERMANENTLY_HIDDEN").length,
  };

  const filtered = (() => {
    if (activeTab === "NEEDS_ACTION")
      return flags.filter(f => f.status === "FLAGGED" && !f.ProductAppeals?.length);
    if (activeTab !== "ALL")
      return flags.filter(f => f.status === activeTab);
    return flags;
  })().slice().sort((a, b) => b.id - a.id);

  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Flagged Products</h1>
          <p className="text-gray-600 mt-1">View flags on your products and submit appeals</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {needsAction > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4" />
              {needsAction} product{needsAction > 1 ? "s" : ""} need{needsAction === 1 ? "s" : ""} attention
            </div>
          )}
          <button
            onClick={fetchMyFlags}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* All clear */}
      {flags.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">All clear!</h3>
          <p className="text-gray-500 text-sm">None of your products have been flagged.</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { key: "ALL",                label: "Total",        Icon: Flag,          val: counts.ALL,                color: "text-gray-900"   },
              { key: "NEEDS_ACTION",       label: "Needs Action", Icon: AlertTriangle,  val: counts.NEEDS_ACTION,       color: "text-red-600"    },
              { key: "UNDER_REVIEW",       label: "Under Review", Icon: Clock,          val: counts.UNDER_REVIEW,       color: "text-yellow-600" },
              { key: "RESTORED",           label: "Restored",     Icon: CheckCircle,    val: counts.RESTORED,           color: "text-green-600"  },
              { key: "PERMANENTLY_HIDDEN", label: "Removed",      Icon: EyeOff,         val: counts.PERMANENTLY_HIDDEN, color: "text-gray-500"   },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setActiveTab(s.key)}
                className={`bg-white rounded-xl p-4 shadow-sm border-2 text-left transition-all hover:shadow-md ${
                  activeTab === s.key ? "border-green-600" : "border-transparent"
                }`}
              >
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1 mb-1">
                  <s.Icon className="w-3.5 h-3.5" /> {s.label}
                </p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              </button>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-green-50 border border-gray-200"
                }`}
              >
                {tab.label}
                {counts[tab.id] > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id ? "bg-white text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {counts[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Empty filtered */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No records found</h3>
              <p className="text-gray-500 text-sm">No flags match this filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(flag => {
                const fs         = FLAG_STATUS[flag.status] || FLAG_STATUS.FLAGGED;
                const appeal     = flag.ProductAppeals?.[0] || null;
                const as_        = appeal ? APPEAL_STATUS[appeal.status] : null;
                const isExpanded = expandedId === flag.id;
                const canAppeal  = flag.status === "FLAGGED" && !appeal;
                const isFormOpen = appealOpenId === flag.id;
                const isSubmitting = submitting === flag.id;
                const isSuccess  = successId === flag.id;

                return (
                  <div
                    key={flag.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 overflow-hidden"
                  >
                    <div className="flex flex-col lg:flex-row">

                      {/* Left Panel */}
                      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-5 lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Flag ID</p>
                            <p className="text-2xl font-bold text-gray-900">#{flag.id}</p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Badge label={fs.label} colorClass={fs.color} icon={fs.icon} />
                            {as_ && <Badge label={as_.label} colorClass={as_.color} />}
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Product</p>
                            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                              <Package className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="text-sm font-semibold text-gray-900">#{flag.productId}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Flagged On</p>
                            <p className="text-sm text-gray-700">
                              {new Date(flag.createdAt).toLocaleDateString("en-PH", {
                                year: "numeric", month: "short", day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Panel */}
                      <div className="flex-1 p-5 space-y-4">

                        {/* Admin flag reason */}
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Admin Flag Reason</p>
                          <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                            <p className="text-sm text-gray-800">"{flag.reason}"</p>
                          </div>
                        </div>

                        {/* Existing appeal */}
                        {appeal && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Your Appeal</p>
                            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                              <p className="text-sm text-gray-800 italic">"{appeal.message}"</p>
                              <p className="text-xs text-gray-400 mt-1.5">
                                Submitted {new Date(appeal.createdAt).toLocaleDateString("en-PH", {
                                  year: "numeric", month: "short", day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Success banner */}
                        {isSuccess && (
                          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-green-700 text-sm font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            Appeal submitted! The admin will review it shortly.
                          </div>
                        )}

                        {/* Appeal textarea form */}
                        {canAppeal && isFormOpen && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Write Your Appeal</p>
                            <textarea
                              rows={4}
                              placeholder="Explain why this product should be restored. Be specific and honest — this goes directly to the admin for review."
                              value={message}
                              onChange={e => setMessage(e.target.value)}
                              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                            />
                            <div className="flex justify-end mt-1 mb-3">
                              <span className="text-xs text-gray-400">{message.length} chars</span>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">

                          {/* Status messages for non-actionable states */}
                          {flag.status === "PERMANENTLY_HIDDEN" && (
                            <span className="text-sm text-gray-500 font-medium flex items-center gap-1 self-center">
                              <XCircle className="w-4 h-4" /> Product permanently removed
                            </span>
                          )}
                          {flag.status === "RESTORED" && (
                            <span className="text-sm text-green-600 font-semibold flex items-center gap-1 self-center">
                              <CheckCircle className="w-4 h-4" /> Your product is visible again
                            </span>
                          )}
                          {flag.status === "UNDER_REVIEW" && (
                            <span className="text-sm text-yellow-600 font-medium flex items-center gap-1 self-center">
                              <Clock className="w-4 h-4" /> Appeal is under admin review
                            </span>
                          )}

                          {/* Can appeal — form not yet open */}
                          {canAppeal && !isFormOpen && !isSuccess && (
                            <button
                              onClick={() => { setAppealOpenId(flag.id); setMessage(""); }}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" /> Submit Appeal
                            </button>
                          )}

                          {/* Form is open — send + cancel */}
                          {canAppeal && isFormOpen && (
                            <>
                              <button
                                disabled={isSubmitting || !message.trim()}
                                onClick={() => handleSubmitAppeal(flag.id, flag.productId)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                {isSubmitting
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Send className="w-3.5 h-3.5" />
                                }
                                {isSubmitting ? "Submitting..." : "Send Appeal"}
                              </button>
                              <button
                                onClick={() => { setAppealOpenId(null); setMessage(""); }}
                                className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {/* Expand/collapse details */}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : flag.id)}
                            className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-300"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {isExpanded ? "Hide" : "Details"}
                          </button>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 pt-4 grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <h4 className="font-semibold text-gray-900 text-sm mb-3">Flag Details</h4>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Flag ID</span>
                                  <span className="font-medium">#{flag.id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Product ID</span>
                                  <span className="font-medium">#{flag.productId}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">Status</span>
                                  <Badge label={fs.label} colorClass={fs.color} icon={fs.icon} />
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Flagged</span>
                                  <span className="font-medium">{new Date(flag.createdAt).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                              <h4 className="font-semibold text-gray-900 text-sm mb-3">Appeal Details</h4>
                              {appeal ? (
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Appeal ID</span>
                                    <span className="font-medium">#{appeal.id}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Status</span>
                                    <Badge label={as_?.label} colorClass={as_?.color} />
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Submitted</span>
                                    <span className="font-medium">{new Date(appeal.createdAt).toLocaleString()}</span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">No appeal submitted yet.</p>
                              )}
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
        </>
      )}
    </div>
  );
}