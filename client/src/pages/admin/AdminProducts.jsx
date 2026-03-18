import { useEffect, useState } from "react";
import {
  getAllProducts,
  flagProduct as flagProductService,
  getFlags,
  resolveAppeal as resolveAppealService,
} from "../../services/productService.js";
import {
  Eye, AlertTriangle, CheckCircle, XCircle,
  Package, Store, DollarSign, Flag, Loader2,
  X, RefreshCw, Clock, EyeOff, ChevronDown,
  ChevronUp, ShieldCheck, ShieldX,
} from "lucide-react";

// ── Badge helper ─────────────────────────────────────────────────────────────
const Badge = ({ label, colorClass }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
    {label}
  </span>
);

// ── Config maps ───────────────────────────────────────────────────────────────
const FLAG_STATUS = {
  FLAGGED:            { label: "Flagged",      color: "bg-red-100 text-red-700 border-red-200" },
  UNDER_REVIEW:       { label: "Under Review", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  RESTORED:           { label: "Restored",     color: "bg-green-100 text-green-700 border-green-200" },
  PERMANENTLY_HIDDEN: { label: "Perm. Hidden", color: "bg-gray-200 text-gray-600 border-gray-300" },
};

const APPEAL_STATUS = {
  PENDING:  { label: "Appeal Pending",  color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  APPROVED: { label: "Appeal Approved", color: "bg-green-100 text-green-700 border-green-200" },
  REJECTED: { label: "Appeal Rejected", color: "bg-red-100 text-red-700 border-red-200" },
};

const FLAG_TABS = [
  { id: "ALL",                label: "All" },
  { id: "FLAGGED",            label: "Flagged" },
  { id: "UNDER_REVIEW",       label: "Under Review" },
  { id: "RESTORED",           label: "Restored" },
  { id: "PERMANENTLY_HIDDEN", label: "Perm. Hidden" },
];

// ── Flag Modal — OUTSIDE main component, owns its own reason state ────────────
function FlagModal({ flagModal, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [flagging, setFlagging] = useState(false);

  // Reset when modal opens for a new product
  useEffect(() => { setReason(""); }, [flagModal?.productId]);

  if (!flagModal) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) return alert("Please provide a reason.");
    setFlagging(true);
    try {
      await onSubmit(flagModal.productId, reason);
    } finally {
      setFlagging(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-100 p-2 rounded-xl">
              <Flag className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Flag Product</h3>
              <p className="text-xs text-gray-500">Product #{flagModal.productId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
          <p className="text-xs text-yellow-800 font-medium">
            ⚠️ Flagging this product will immediately hide it from all buyers until the seller submits an appeal and admin resolves it.
          </p>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">
            Reason for Flagging
          </label>
          <textarea
            rows={4}
            placeholder="Describe why this product violates marketplace guidelines..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-400">{reason.length} chars</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={flagging || !reason.trim()}
            className="flex-1 py-2.5 bg-yellow-600 text-white rounded-xl font-semibold text-sm hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {flagging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
            {flagging ? "Flagging..." : "Flag Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Resolve Appeal Modal — also OUTSIDE to be safe ───────────────────────────
function ResolveModal({ resolveModal, onClose, onResolve }) {
  if (!resolveModal) return null;
  const isApprove = resolveModal.decision === "APPROVED";
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        {isApprove
          ? <ShieldCheck className="w-12 h-12 text-green-600 mx-auto mb-3" />
          : <ShieldX className="w-12 h-12 text-red-500 mx-auto mb-3" />
        }
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
          {isApprove ? "Approve Appeal" : "Reject Appeal"}
        </h3>
        <p className="text-sm text-gray-600 text-center mb-6">
          {isApprove
            ? "Approving this appeal will restore the product and make it visible to buyers again."
            : "Rejecting this appeal will permanently hide the product from the marketplace."
          }
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={onResolve}
            className={`flex-1 py-2.5 text-white rounded-xl font-semibold text-sm transition-colors ${isApprove ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {isApprove ? "Yes, Approve" : "Yes, Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminProductManagement() {
  const [mainTab, setMainTab] = useState("products");

  // ── Products state ──────────────────────────────────────────────────────────
  const [products, setProducts]               = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [search, setSearch]                   = useState("");
  const [categoryFilter, setCategoryFilter]   = useState("ALL");
  const [statusFilter, setStatusFilter]       = useState("ALL");
  const [expandedProductId, setExpandedProductId] = useState(null);

  // ── Flag (products tab) state ───────────────────────────────────────────────
  const [flagModal, setFlagModal]     = useState(null);
  const [flaggedIds, setFlaggedIds]   = useState(new Set());
  const [flagSuccess, setFlagSuccess] = useState(null);

  // ── Flags tab state ─────────────────────────────────────────────────────────
  const [flags, setFlags]               = useState([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [flagTab, setFlagTab]           = useState("ALL");
  const [expandedFlagId, setExpandedFlagId] = useState(null);
  const [resolving, setResolving]       = useState(null);
  const [resolveModal, setResolveModal] = useState(null);

  useEffect(() => { fetchProducts(); fetchFlags(); }, []);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await getAllProducts();
      setProducts(res.products || []);
    } catch (err) { console.error(err); }
    finally { setProductsLoading(false); }
  };

  const fetchFlags = async () => {
    try {
      setFlagsLoading(true);
      const res = await getFlags();
      const fetched = res.flags || [];
      setFlags(fetched);
      const active = fetched
        .filter(f => f.status === "FLAGGED" || f.status === "UNDER_REVIEW")
        .map(f => f.productId);
      setFlaggedIds(new Set(active));
    } catch (err) { console.error(err); }
    finally { setFlagsLoading(false); }
  };

  // onSubmit receives reason from inside FlagModal
  const handleSubmitFlag = async (productId, reason) => {
    try {
      await flagProductService(productId, reason);
      setFlaggedIds(prev => new Set([...prev, productId]));
      setFlagSuccess(productId);
      setFlagModal(null);
      await fetchFlags();
      setTimeout(() => setFlagSuccess(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to flag product.");
      throw err; // re-throw so FlagModal can stop its loading state
    }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    const { appealId, decision } = resolveModal;
    try {
      setResolving(appealId);
      setResolveModal(null);
      await resolveAppealService(appealId, decision);
      await fetchFlags();
    } catch (err) {
      alert("Failed to resolve appeal: " + err.message);
    } finally {
      setResolving(null);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const formatAddress = (address) => {
    if (!address || address === "Unknown") return "N/A";
    if (typeof address === "string") return address;
    const { houseNumber, street, barangay, city, postalCode } = address;
    return `#${houseNumber} ${street}, ${barangay}, ${city}, ${postalCode}`;
  };

  const getStatusBadge = (active) =>
    active ? (
      <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit">
        <CheckCircle size={12} /> ACTIVE
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1 w-fit">
        <XCircle size={12} /> INACTIVE
      </span>
    );

  // ── Derived data ─────────────────────────────────────────────────────────────
  const categories = ["ALL", ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toString().includes(search) ||
      p.sellerName.toLowerCase().includes(search.toLowerCase());
    const matchCat    = categoryFilter === "ALL" || p.category === categoryFilter;
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && p.active) ||
      (statusFilter === "INACTIVE" && !p.active);
    return matchSearch && matchCat && matchStatus;
  });

  const totalInventoryValue = products.reduce((s, p) => s + p.pricePerUnit * p.stock, 0);

  const flagCounts = {
    ALL:                flags.length,
    FLAGGED:            flags.filter(f => f.status === "FLAGGED").length,
    UNDER_REVIEW:       flags.filter(f => f.status === "UNDER_REVIEW").length,
    RESTORED:           flags.filter(f => f.status === "RESTORED").length,
    PERMANENTLY_HIDDEN: flags.filter(f => f.status === "PERMANENTLY_HIDDEN").length,
  };

  const filteredFlags = (flagTab === "ALL" ? flags : flags.filter(f => f.status === flagTab))
    .slice().sort((a, b) => b.id - a.id);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Products Tab
  // ─────────────────────────────────────────────────────────────────────────────
  const ProductsTab = () => {
    if (productsLoading) return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );

    return (
      <>
        <p className="text-sm text-yellow-600 mb-4">
          ⚠️ Products are managed by sellers on the blockchain. Admin can only monitor and flag for violations.
        </p>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by product name, ID, or seller name..."
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-48 focus:ring-2 focus:ring-green-400" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-48 focus:ring-2 focus:ring-green-400" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Products",  icon: <Package size={12} />,     val: products.length,                       color: "text-gray-900"  },
            { label: "Active",          icon: <CheckCircle size={12} />, val: products.filter(p => p.active).length, color: "text-green-600" },
            { label: "Inactive",        icon: <XCircle size={12} />,     val: products.filter(p => !p.active).length,color: "text-gray-600"  },
            { label: "Inventory Value", icon: <DollarSign size={12} />,  val: `${totalInventoryValue.toFixed(2)} AGT`, color: "text-blue-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">{s.icon} {s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map(product => {
              const isAlreadyFlagged = flaggedIds.has(product.id);
              const isSuccessProduct = flagSuccess === product.id;
              const isExpanded       = expandedProductId === product.id;

              return (
                <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200">
                  <div className="flex flex-col lg:flex-row">

                    {/* Left */}
                    <div className="bg-gradient-to-br from-white-50 via-green-60 to-green-200 p-5 lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-200">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product ID</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">#{product.id}</p>
                          </div>
                          {isAlreadyFlagged && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-yellow-100 text-yellow-700 border-yellow-200 flex items-center gap-1">
                              <Flag size={11} /> Flagged
                            </span>
                          )}
                        </div>
                        {getStatusBadge(product.active)}
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Product Name</p>
                          <p className="text-lg font-bold text-gray-900 leading-tight">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                        </div>
                        <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Price</p>
                            <p className="text-lg font-bold text-green-600">{product.pricePerUnit} AGT</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Stock</p>
                            <p className="text-lg font-bold text-gray-900">{product.stock} units</p>
                          </div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                          <p className="text-xs text-gray-600">Total Value</p>
                          <p className="text-base font-bold text-blue-600">{(product.pricePerUnit * product.stock).toFixed(2)} AGT</p>
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex-1 p-5 space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <Store size={14} /> Seller Information
                        </p>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 space-y-2">
                          <div>
                            <span className="text-xs text-gray-600">Seller Name:</span>
                            <p className="text-sm font-mono text-gray-900 break-all">{product.sellerName}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-600">Physical Address:</span>
                            <p className="text-sm text-gray-700">{formatAddress(product.ownerAddress)}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">IPFS Image</p>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-sm text-gray-700 font-mono break-all">{product.imageCID}</p>
                          <a href={`https://ipfs.io/ipfs/${product.imageCID}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-flex items-center gap-1">
                            <Eye size={12} /> View Image
                          </a>
                        </div>
                      </div>

                      {isSuccessProduct && (
                        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 text-yellow-800 text-sm font-semibold">
                          <Flag className="w-4 h-4" />
                          Product flagged successfully! It is now hidden from buyers.
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {isAlreadyFlagged ? (
                          <span className="px-5 py-2.5 text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg flex items-center gap-2 cursor-default">
                            <Flag size={16} /> Already Flagged
                          </span>
                        ) : (
                          <button
                            onClick={() => setFlagModal({ productId: product.id })}
                            className="px-5 py-2.5 text-sm font-medium bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                          >
                            <AlertTriangle size={16} /> Flag Product
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                          className="ml-auto px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border border-gray-300"
                        >
                          <span className="font-medium">{isExpanded ? "Hide" : "View"} Details</span>
                          <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                              <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                                <Package size={14} className="text-purple-600" /> Product Details
                              </h4>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between"><span className="text-gray-600">Category:</span><span className="font-medium">{product.category}</span></div>
                                <div className="flex justify-between"><span className="text-gray-600">Price per Unit:</span><span className="font-medium">{product.pricePerUnit} AGT</span></div>
                                <div className="flex justify-between"><span className="text-gray-600">Available Stock:</span><span className="font-medium">{product.stock} units</span></div>
                                <div className="flex justify-between"><span className="text-gray-600">Total Value:</span><span className="font-medium text-blue-600">{(product.pricePerUnit * product.stock).toFixed(2)} AGT</span></div>
                              </div>
                            </div>
                            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Blockchain Info</h4>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="text-gray-600 block mb-1">Seller Wallet:</span>
                                  <span className="font-medium font-mono text-gray-900 break-all">{product.sellerAddress}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600 block mb-1">IPFS CID:</span>
                                  <span className="font-medium font-mono text-gray-900 break-all">{product.imageCID}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                  <span className="text-gray-600">On-Chain Status:</span>
                                  <span className={`font-medium ${product.active ? "text-green-600" : "text-gray-600"}`}>
                                    {product.active ? "Active" : "Inactive"}
                                  </span>
                                </div>
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
      </>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Flags Tab
  // ─────────────────────────────────────────────────────────────────────────────
  const FlagsTab = () => {
    if (flagsLoading) return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );

    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { key: "ALL",                label: "Total Flags",  Icon: Flag,          val: flagCounts.ALL,                color: "text-gray-900"   },
            { key: "FLAGGED",            label: "Flagged",      Icon: AlertTriangle, val: flagCounts.FLAGGED,            color: "text-red-600"    },
            { key: "UNDER_REVIEW",       label: "Under Review", Icon: Clock,         val: flagCounts.UNDER_REVIEW,       color: "text-yellow-600" },
            { key: "RESTORED",           label: "Restored",     Icon: CheckCircle,   val: flagCounts.RESTORED,           color: "text-green-600"  },
            { key: "PERMANENTLY_HIDDEN", label: "Perm. Hidden", Icon: EyeOff,        val: flagCounts.PERMANENTLY_HIDDEN, color: "text-gray-500"   },
          ].map(s => (
            <button key={s.key} onClick={() => setFlagTab(s.key)}
              className={`bg-white rounded-xl p-4 shadow-sm border-2 text-left transition-all hover:shadow-md ${flagTab === s.key ? "border-green-600" : "border-transparent"}`}>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1 mb-1">
                <s.Icon className="w-3.5 h-3.5" /> {s.label}
              </p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
          {FLAG_TABS.map(tab => (
            <button key={tab.id} onClick={() => setFlagTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                flagTab === tab.id ? "bg-green-600 text-white shadow-md" : "bg-white text-gray-700 hover:bg-green-50 border border-gray-200"
              }`}>
              {tab.label}
              {flagCounts[tab.id] > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${flagTab === tab.id ? "bg-white text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {flagCounts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredFlags.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <Flag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No flags found</h3>
            <p className="text-gray-500 text-sm">No records match this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFlags.map(flag => {
              const fs     = FLAG_STATUS[flag.status] || FLAG_STATUS.FLAGGED;
              const appeal = flag.ProductAppeals?.[0] || null;
              const as_    = appeal ? APPEAL_STATUS[appeal.status] : null;
              const isOpen = expandedFlagId === flag.id;
              const hasPendingAppeal = appeal?.status === "PENDING";

              return (
                <div key={flag.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 overflow-hidden">
                  <div className="flex flex-col lg:flex-row">

                    {/* Left */}
                    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-5 lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Flag ID</p>
                          <p className="text-2xl font-bold text-gray-900">#{flag.id}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge label={fs.label} colorClass={fs.color} />
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
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Flagged By</p>
                          <p className="text-sm font-semibold text-gray-700">Admin #{flag.adminId}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(flag.createdAt).toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex-1 p-5 space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Flag Reason</p>
                        <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                          <p className="text-sm text-gray-800">"{flag.reason}"</p>
                        </div>
                      </div>

                      {appeal && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Seller Appeal</p>
                          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                            <p className="text-sm text-gray-800 italic">"{appeal.message}"</p>
                            <p className="text-xs text-gray-400 mt-1.5">
                              Seller #{appeal.sellerId} · {new Date(appeal.createdAt).toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" })}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {hasPendingAppeal && (
                          <>
                            <button disabled={resolving === appeal.id} onClick={() => setResolveModal({ appealId: appeal.id, decision: "APPROVED" })}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
                              {resolving === appeal.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              Approve Appeal
                            </button>
                            <button disabled={resolving === appeal.id} onClick={() => setResolveModal({ appealId: appeal.id, decision: "REJECTED" })}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50">
                              {resolving === appeal.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Reject Appeal
                            </button>
                          </>
                        )}
                        {flag.status === "FLAGGED" && !appeal && (
                          <span className="text-sm text-gray-400 font-medium self-center">⏳ Awaiting seller appeal</span>
                        )}
                        {flag.status === "RESTORED" && (
                          <span className="text-sm text-green-600 font-semibold flex items-center gap-1 self-center">
                            <CheckCircle className="w-4 h-4" /> Product restored to marketplace
                          </span>
                        )}
                        {flag.status === "PERMANENTLY_HIDDEN" && (
                          <span className="text-sm text-gray-500 font-medium flex items-center gap-1 self-center">
                            <EyeOff className="w-4 h-4" /> Permanently removed
                          </span>
                        )}
                        <button onClick={() => setExpandedFlagId(isOpen ? null : flag.id)}
                          className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-300">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isOpen ? "Hide" : "Details"}
                        </button>
                      </div>

                      {isOpen && (
                        <div className="border-t border-gray-200 pt-4 grid md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 text-sm mb-3">Flag Details</h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between"><span className="text-gray-500">Flag ID</span><span className="font-medium">#{flag.id}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Product ID</span><span className="font-medium">#{flag.productId}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Admin ID</span><span className="font-medium">#{flag.adminId}</span></div>
                              <div className="flex justify-between items-center"><span className="text-gray-500">Status</span><Badge label={fs.label} colorClass={fs.color} /></div>
                              <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="font-medium">{new Date(flag.createdAt).toLocaleString()}</span></div>
                            </div>
                          </div>
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <h4 className="font-semibold text-gray-900 text-sm mb-3">Appeal Details</h4>
                            {appeal ? (
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between"><span className="text-gray-500">Appeal ID</span><span className="font-medium">#{appeal.id}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Seller ID</span><span className="font-medium">#{appeal.sellerId}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-500">Status</span><Badge label={as_?.label} colorClass={as_?.color} /></div>
                                <div className="flex justify-between"><span className="text-gray-500">Submitted</span><span className="font-medium">{new Date(appeal.createdAt).toLocaleString()}</span></div>
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
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <FlagModal
        flagModal={flagModal}
        onClose={() => setFlagModal(null)}
        onSubmit={handleSubmitFlag}
      />
      <ResolveModal
        resolveModal={resolveModal}
        onClose={() => setResolveModal(null)}
        onResolve={handleResolve}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">Monitor marketplace products and manage flags</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {flagCounts.UNDER_REVIEW > 0 && (
            <button onClick={() => setMainTab("flags")}
              className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-yellow-100 transition-colors">
              <AlertTriangle className="w-4 h-4" />
              {flagCounts.UNDER_REVIEW} appeal{flagCounts.UNDER_REVIEW > 1 ? "s" : ""} need{flagCounts.UNDER_REVIEW === 1 ? "s" : ""} review
            </button>
          )}
          <button onClick={() => { fetchProducts(); fetchFlags(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button onClick={() => setMainTab("products")}
          className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            mainTab === "products" ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}>
          <Package className="w-4 h-4" />
          Products
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${mainTab === "products" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {products.length}
          </span>
        </button>
        <button onClick={() => setMainTab("flags")}
          className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            mainTab === "flags" ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}>
          <Flag className="w-4 h-4" />
          Flag Management
          {flagCounts.ALL > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${mainTab === "flags" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {flagCounts.ALL}
            </span>
          )}
          {flagCounts.UNDER_REVIEW > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-700">
              {flagCounts.UNDER_REVIEW} pending
            </span>
          )}
        </button>
      </div>

      {mainTab === "products" ? <ProductsTab /> : <FlagsTab />}
    </div>
  );
}