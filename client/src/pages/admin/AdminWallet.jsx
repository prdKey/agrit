// pages/admin/AdminWallet.jsx

import { useState, useEffect, useCallback } from "react";
import {
  adminGetPending,
  adminGetAll,
  adminApprove,
  adminReject,
  adminCancel,
} from "../../services/walletService.js";
import {
  ArrowUpRight, ArrowDownLeft, CheckCircle2, XCircle,
  RefreshCw, Clock, AlertCircle, Wallet, User, Phone,
  Loader2, Trash2,
} from "lucide-react";

const fmt     = (n) => n == null ? "—" : Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
const fmtPhp  = (n) => n == null ? "—" : `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });

const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
};

const STATUS_STYLE = {
  PENDING:   "bg-amber-100 text-amber-700  border-amber-200",
  COMPLETED: "bg-green-100 text-green-700  border-green-200",
  REJECTED:  "bg-red-100   text-red-600    border-red-200",
};

export default function AdminWallet() {
  const { toast, show } = useToast();

  const [txs,           setTxs]           = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [filter,        setFilter]        = useState("PENDING");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal,   setRejectModal]   = useState(null);
  const [rejectReason,  setRejectReason]  = useState("");

  const loadTxs = useCallback(async () => {
    setLoading(true);
    try {
      const data = filter === "PENDING"
        ? await adminGetPending()
        : await adminGetAll();
      setTxs(data);
    } catch (e) {
      show(e.response?.data?.message ?? "Failed to fetch transactions", "error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadTxs(); }, [loadTxs]);

  const handleApprove = async (tx) => {
    setActionLoading(tx.id);
    try {
      await adminApprove(tx.id);
      show(`Withdrawal #${tx.id} approved. Send ${fmtPhp(tx.amountPhp)} to ${tx.gcashNumber}.`);
      loadTxs();
    } catch (e) {
      show(e.response?.data?.message ?? "Failed to approve", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    try {
      await adminReject(rejectModal.id, rejectReason || "Rejected by admin");
      show(`Transaction #${rejectModal.id} rejected.`);
      setRejectModal(null);
      setRejectReason("");
      loadTxs();
    } catch (e) {
      show(e.response?.data?.message ?? "Failed to reject", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (tx) => {
    if (!window.confirm(`Cancel transaction #${tx.id}? This cannot be undone.`)) return;
    setActionLoading(tx.id);
    try {
      await adminCancel(tx.id);
      show(`Transaction #${tx.id} cancelled.`);
      loadTxs();
    } catch (e) {
      show(e.response?.data?.message ?? "Failed to cancel", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount   = txs.filter((t) => t.status === "PENDING").length;
  const completedCount = txs.filter((t) => t.status === "COMPLETED").length;
  const rejectedCount  = txs.filter((t) => t.status === "REJECTED").length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white
          ${toast.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
          {toast.type === "error" ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Reject Transaction #{rejectModal.id}</h3>
            <p className="text-xs text-gray-500">
              Rejecting {rejectModal.type.toLowerCase()} of{" "}
              <strong>{fmt(rejectModal.amountAgt)} AGT</strong> ({fmtPhp(rejectModal.amountPhp)}).
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Invalid GCash number..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.id}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
              >
                {actionLoading === rejectModal.id
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Rejecting...</>
                  : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          Wallet Management
        </h1>
        <p className="text-gray-500 mt-1">Manage E-Wallet deposits and withdrawal requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pending
            </p>
            <button onClick={loadTxs} disabled={loading}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors disabled:opacity-40">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {loading
            ? <div className="h-10 flex items-center"><Loader2 className="w-5 h-5 animate-spin text-amber-500" /></div>
            : <p className="text-4xl font-black text-amber-500">{pendingCount} <span className="text-xl text-gray-400 font-semibold">txns</span></p>
          }
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold flex items-center gap-1 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </p>
          {loading
            ? <div className="h-10 flex items-center"><Loader2 className="w-5 h-5 animate-spin text-green-500" /></div>
            : <p className="text-4xl font-black text-green-600">{completedCount} <span className="text-xl text-gray-400 font-semibold">txns</span></p>
          }
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold flex items-center gap-1 mb-1">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </p>
          {loading
            ? <div className="h-10 flex items-center"><Loader2 className="w-5 h-5 animate-spin text-red-500" /></div>
            : <p className="text-4xl font-black text-red-500">{rejectedCount} <span className="text-xl text-gray-400 font-semibold">txns</span></p>
          }
        </div>
      </div>

      {/* Filter + Reminder */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2">
          {["PENDING", "ALL"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors
                ${filter === f
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
              {f === "PENDING" ? `Pending${pendingCount > 0 ? ` (${pendingCount})` : ""}` : "All Transactions"}
            </button>
          ))}
        </div>

        {txs.some((t) => t.status === "PENDING" && t.type === "WITHDRAW") && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Send GCash manually <strong>before</strong> clicking Approve.
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading && (
          <div className="py-12 text-center flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-green-500" /> Loading...
          </div>
        )}

        {!loading && txs.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            {filter === "PENDING" ? "No pending transactions 🎉" : "No transactions yet."}
          </div>
        )}

        {!loading && txs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["ID", "Type", "User", "Amount", "GCash", "Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {txs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">

                    <td className="px-4 py-3 text-xs font-mono text-gray-400">#{tx.id}</td>

                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                        ${tx.type === "DEPOSIT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {tx.type === "DEPOSIT"
                          ? <ArrowDownLeft className="w-3 h-3" />
                          : <ArrowUpRight  className="w-3 h-3" />}
                        {tx.type}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">User #{tx.userId}</p>
                          <p className="text-[10px] font-mono text-gray-400">{tx.walletAddress?.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className={`text-sm font-bold ${tx.type === "DEPOSIT" ? "text-green-600" : "text-red-500"}`}>
                        {tx.type === "DEPOSIT" ? "+" : "-"}{fmt(tx.amountAgt)} AGT
                      </p>
                      <p className="text-[10px] text-gray-400">{fmtPhp(tx.amountPhp)}</p>
                    </td>

                    <td className="px-4 py-3">
                      {tx.gcashNumber ? (
                        <div>
                          <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {tx.gcashNumber}
                          </div>
                          {tx.gcashName && <p className="text-[10px] text-gray-400">{tx.gcashName}</p>}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300 italic">Auto (PayMongo)</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">
                      {fmtDate(tx.created_at)}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS_STYLE[tx.status]}`}>
                        {tx.status === "PENDING"   && <Clock className="w-2.5 h-2.5" />}
                        {tx.status === "COMPLETED" && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {tx.status === "REJECTED"  && <XCircle className="w-2.5 h-2.5" />}
                        {tx.status}
                      </span>
                      {tx.adminNote && (
                        <p className="text-[10px] text-gray-400 mt-0.5 max-w-[100px] truncate">{tx.adminNote}</p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {tx.status === "PENDING" && tx.type === "WITHDRAW" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApprove(tx)}
                            disabled={actionLoading === tx.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors"
                          >
                            {actionLoading === tx.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <CheckCircle2 className="w-3 h-3" />}
                            Approve
                          </button>
                          <button
                            onClick={() => { setRejectModal(tx); setRejectReason(""); }}
                            disabled={actionLoading === tx.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-red-500 text-xs font-semibold hover:bg-red-50 disabled:opacity-40 transition-colors"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                          <button
                            onClick={() => handleCancel(tx)}
                            disabled={actionLoading === tx.id}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 text-xs font-semibold hover:bg-gray-50 hover:text-gray-600 disabled:opacity-40 transition-colors"
                            title="Cancel transaction"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {tx.status === "PENDING" && tx.type === "DEPOSIT" && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-amber-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Awaiting payment
                          </span>
                          <button
                            onClick={() => handleCancel(tx)}
                            disabled={actionLoading === tx.id}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 text-xs font-semibold hover:bg-gray-50 hover:text-gray-600 disabled:opacity-40 transition-colors"
                            title="Cancel transaction"
                          >
                            {actionLoading === tx.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      )}

                      {tx.status !== "PENDING" && (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}