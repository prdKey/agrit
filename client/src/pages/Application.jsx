import { useState, useEffect } from "react";
import { useUserContext } from "../context/UserContext.jsx";
import { submitApplication, getMyApplications } from "../services/userService.js";
import {
  ClipboardList, Truck, Store, Clock, CheckCircle2,
  XCircle, Loader2, Send, AlertCircle
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

export default function ApplicationPage() {
  const { user }  = useUserContext();

  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [applying,     setApplying]     = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getMyApplications();
      setApplications(data);
    } catch {
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  const hasPending = applications.some(a => a.status === "PENDING");

  const handleSubmit = async () => {
    if (!selected) return;
    setError(""); setSuccess("");
    setApplying(true);
    try {
      await submitApplication(selected);
      setSuccess(`Application for ${selected} submitted! Please wait for admin review.`);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit application.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-green-600" /> Apply for a Role
          </h1>
          <p className="text-gray-500 mt-1">Become a Seller or Logistics provider on the platform</p>
        </div>

        {/* Apply card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-base font-bold text-gray-900">Select a Role</h2>
            <p className="text-sm text-gray-400 mt-0.5">Choose the role you want to apply for</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Role cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { role: "SELLER",    icon: Store, title: "Seller",    desc: "List and sell agricultural products" },
                { role: "LOGISTICS", icon: Truck, title: "Logistics", desc: "Deliver orders to buyers" },
              ].map(({ role, icon: Icon, title, desc }) => (
                <button
                  key={role}
                  onClick={() => setSelected(role === selected ? null : role)}
                  disabled={hasPending || user?.role === role}
                  className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    selected === role
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    selected === role ? "bg-green-100" : "bg-gray-100"
                  }`}>
                    <Icon className={`w-5 h-5 ${selected === role ? "text-green-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  {selected === role && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 absolute top-3 right-3" />
                  )}
                </button>
              ))}
            </div>

            {/* Warnings */}
            {hasPending && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                You already have a pending application. Wait for admin review.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!selected || applying || hasPending}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {applying
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                : <><Send className="w-4 h-4" /> Submit Application</>
              }
            </button>
          </div>
        </div>

        {/* My applications history */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-green-600" /> My Applications
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              No applications yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {applications.map(app => (
                <div key={app.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {app.roleApplying === "SELLER"
                        ? <Store className="w-4 h-4 text-purple-500" />
                        : <Truck className="w-4 h-4 text-green-500" />
                      }
                      <span className="font-semibold text-gray-900 text-sm">{app.roleApplying}</span>
                    </div>
                    <p className="text-xs text-gray-400">{fmtDate(app.createdAt)}</p>
                    {app.adminNotes && (
                      <div className="mt-1.5 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        <p className="text-xs text-gray-500">
                          <span className="font-semibold">Admin note:</span> {app.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}