// pages/TransactionHistory.jsx
import { useEffect, useState, useMemo } from "react";
import {
  ArrowUpRight, RefreshCw, ExternalLink, Copy,
  CheckCheck, Loader2, FileCode, Coins, Zap,
  Box, Filter, ChevronLeft, ChevronRight
} from "lucide-react";


const ORDER_MANAGER_CONTRACT = import.meta.env.VITE_ORDER_MANAGER_ADDRESS
const PRODUCT_MANAGER_CONTRACT = import.meta.env.VITE_PRODUCT_MANAGER_ADDRESS
const TOKEN_CONTRACT = import.meta.env.VITE_TOKEN_ADDRESS

const EXPLORER_BASE = "https://internal.explorer.testnet.skalenodes.com:10021";
const EXPLORER_TX   = "https://internal.explorer.testnet.skalenodes.com:10021/tx";
const PAGE_SIZE     = 10;

const CONTRACTS = [
  { address: TOKEN_CONTRACT, name: "AGT Token",       color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { address: ORDER_MANAGER_CONTRACT, name: "Order Manager",   color: "bg-blue-100 text-blue-800 border-blue-200"       },
  { address: PRODUCT_MANAGER_CONTRACT, name: "Product Manager", color: "bg-purple-100 text-purple-800 border-purple-200"  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const shortHash  = (h) => h ? `${h.slice(0,8)}…${h.slice(-6)}` : "—";
const formatAGT  = (w) => { try { return (Number(w)/1e18).toFixed(4); } catch { return "0"; } };
const formatFee  = (w) => { try { return (Number(w)/1e18).toFixed(8); } catch { return "—"; } };
const formatTime = (iso) => new Date(iso).toLocaleString("en-US", {
  month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit", hour12:true,
});

const METHOD_CONFIG = {
  approve:                    { label:"Approve",           color:"bg-yellow-100 text-yellow-800 border-yellow-200", icon:CheckCheck   },
  mint:                       { label:"Mint",              color:"bg-green-100 text-green-800 border-green-200",    icon:Coins        },
  transfer:                   { label:"Transfer",          color:"bg-blue-100 text-blue-800 border-blue-200",       icon:ArrowUpRight },
  placeOrder:                 { label:"Place Order",       color:"bg-indigo-100 text-indigo-800 border-indigo-200", icon:Box          },
  confirmShipment:            { label:"Confirm Shipment",  color:"bg-cyan-100 text-cyan-800 border-cyan-200",       icon:Box          },
  pickupOrder:                { label:"Pickup Order",      color:"bg-orange-100 text-orange-800 border-orange-200", icon:Box          },
  confirmDeliveryByLogistics: { label:"Confirm Delivery",  color:"bg-teal-100 text-teal-800 border-teal-200",       icon:Box          },
  confirmReceipt:             { label:"Confirm Receipt",   color:"bg-green-100 text-green-800 border-green-200",    icon:CheckCheck   },
  acceptOrder:                { label:"Accept Order",      color:"bg-sky-100 text-sky-800 border-sky-200",           icon:Box          },
  cancelOrderByBuyer:         { label:"Cancel (Buyer)",    color:"bg-red-100 text-red-800 border-red-200",           icon:Box          },
  cancelOrderBySeller:        { label:"Cancel (Seller)",   color:"bg-red-100 text-red-800 border-red-200",           icon:Box          },
  openDispute:                { label:"Open Dispute",      color:"bg-rose-100 text-rose-800 border-rose-200",        icon:Zap          },
  resolveDispute:             { label:"Resolve Dispute",   color:"bg-violet-100 text-violet-800 border-violet-200", icon:Zap          },
  addProduct:                 { label:"Add Product",       color:"bg-lime-100 text-lime-800 border-lime-200",        icon:Box          },
  updateProduct:              { label:"Update Product",    color:"bg-lime-100 text-lime-800 border-lime-200",        icon:Box          },
  contract_creation:          { label:"Deploy Contract",   color:"bg-gray-100 text-gray-700 border-gray-200",        icon:FileCode     },
};

const getMethodCfg = (tx) => {
  if (tx.transaction_types?.includes("contract_creation")) return METHOD_CONFIG.contract_creation;
  return METHOD_CONFIG[tx.method] || { label: tx.method || "Contract Call", color:"bg-gray-100 text-gray-700 border-gray-200", icon:Zap };
};

const getContract = (tx) => {
  const addr = (tx.to?.hash || tx.created_contract?.hash || "").toLowerCase();
  return CONTRACTS.find(c => c.address.toLowerCase() === addr) || null;
};

// ── CopyButton ────────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),1500); }}
      className="text-gray-400 hover:text-green-600 transition-colors">
      {copied ? <CheckCheck className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
    </button>
  );
}

// ── TxRow ─────────────────────────────────────────────────────────────────────
function TxRow({ tx }) {
  const [open, setOpen] = useState(false);
  const cfg      = getMethodCfg(tx);
  const Icon     = cfg.icon;
  const contract = getContract(tx);
  const params   = tx.decoded_input?.parameters || [];
  const amount   = params.find(p => p.name === "amount")?.value;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-sm transition-shadow">
      <button onClick={() => setOpen(v=>!v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-gray-500"/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
            {contract && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${contract.color}`}>{contract.name}</span>}
            {tx.status !== "ok" && <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Failed</span>}
          </div>
          <p className="text-xs text-gray-500 font-mono truncate">{shortHash(tx.hash)}</p>
        </div>
        {amount && (
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-gray-800">{formatAGT(amount)}</p>
            <p className="text-[10px] text-gray-400">AGT</p>
          </div>
        )}
        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="text-xs text-gray-600">{formatTime(tx.timestamp)}</p>
          <p className="text-[10px] text-gray-400">Block #{tx.block_number?.toLocaleString()}</p>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-2 text-xs">
          {[
            ["Tx Hash",  tx.hash,                    true ],
            ["From",     tx.from?.hash,               false],
            ["To",       tx.to?.hash,                 false],
          ].map(([label, val, showLink]) => val && (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className="text-gray-500 w-24 flex-shrink-0">{label}</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-gray-700 truncate">{shortHash(val)}</span>
                <CopyButton text={val}/>
                {showLink && (
                  <a href={`${EXPLORER_TX}/${val}`} target="_blank" rel="noreferrer"
                    className="text-gray-400 hover:text-blue-600">
                    <ExternalLink className="w-3 h-3"/>
                  </a>
                )}
              </div>
            </div>
          ))}
          {tx.decoded_input && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-gray-500 w-24 flex-shrink-0">Method</span>
              <span className="font-mono text-gray-700 text-[11px] break-all">{tx.decoded_input.method_call}</span>
            </div>
          )}
          {params.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 space-y-1.5">
              {params.map((p, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <span className="text-gray-400 flex-shrink-0">{p.name} ({p.type})</span>
                  <span className="font-mono text-gray-700 text-right break-all max-w-[60%]">
                    {p.type==="uint256" && p.name==="amount" ? `${formatAGT(p.value)} AGT`
                     : p.type==="address" ? shortHash(p.value) : p.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
            <div><p className="text-gray-400">Gas Used</p><p className="font-semibold">{Number(tx.gas_used).toLocaleString()}</p></div>
            <div><p className="text-gray-400">Gas Price</p><p className="font-semibold">{tx.gas_price}</p></div>
            <div><p className="text-gray-400">Fee</p><p className="font-semibold">{formatFee(tx.fee?.value)} sFUEL</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pagination controls ───────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  // Show max 5 page buttons
  const getPages = () => {
    if (totalPages <= 5) return Array.from({length: totalPages}, (_, i) => i + 1);
    if (page <= 3) return [1,2,3,4,5];
    if (page >= totalPages - 2) return [totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages];
    return [page-2, page-1, page, page+1, page+2];
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button onClick={() => onPage(page - 1)} disabled={page === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft className="w-4 h-4"/>
      </button>

      {page > 3 && totalPages > 5 && (
        <>
          <button onClick={() => onPage(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            1
          </button>
          <span className="text-gray-400 text-xs px-1">…</span>
        </>
      )}

      {getPages().map(p => (
        <button key={p} onClick={() => onPage(p)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-medium transition-colors
            ${p === page
              ? "bg-green-600 border-green-600 text-white"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
          {p}
        </button>
      ))}

      {page < totalPages - 2 && totalPages > 5 && (
        <>
          <span className="text-gray-400 text-xs px-1">…</span>
          <button onClick={() => onPage(totalPages)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            {totalPages}
          </button>
        </>
      )}

      <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronRight className="w-4 h-4"/>
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TransactionHistory() {
  const [allTxs,       setAllTxs]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [errors,       setErrors]       = useState([]);
  const [contractFilter, setContractFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [page,         setPage]         = useState(1);

  const fetchAll = async () => {
    setLoading(true); setErrors([]); setPage(1);
    const results = await Promise.allSettled(
      CONTRACTS.map(async (c) => {
        const res  = await fetch(`${EXPLORER_BASE}/api/v2/addresses/${c.address}/transactions`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return (data.items || []).map(tx => ({ ...tx, _contract: c }));
      })
    );
    const errs = [], txs = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") txs.push(...r.value);
      else errs.push(CONTRACTS[i].name);
    });
    // Deduplicate by hash
    const seen = new Set();
    const unique = txs.filter(tx => !seen.has(tx.hash) && seen.add(tx.hash));
    unique.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setAllTxs(unique);
    setErrors(errs);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [contractFilter, methodFilter]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = allTxs;
    if (contractFilter !== "all") {
      list = list.filter(tx => {
        const addr = (tx.to?.hash || tx.created_contract?.hash || "").toLowerCase();
        return addr === contractFilter.toLowerCase();
      });
    }
    if (methodFilter !== "all") {
      list = list.filter(tx =>
        methodFilter === "contract_creation"
          ? tx.transaction_types?.includes("contract_creation")
          : tx.method === methodFilter
      );
    }
    return list;
  }, [allTxs, contractFilter, methodFilter]);

  // Pagination
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Unique methods
  const methods = [...new Set(
    allTxs.map(tx => tx.transaction_types?.includes("contract_creation") ? "contract_creation" : tx.method).filter(Boolean)
  )];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">All AgriTrust contract activity</p>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}/> Refresh
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-800">
          ⚠ Could not load: {errors.join(", ")}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{allTxs.length}</p>
        </div>
        {CONTRACTS.map(c => (
          <div key={c.address} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{c.name}</p>
            <p className="text-2xl font-bold text-gray-900">
              {allTxs.filter(tx => (tx.to?.hash||tx.created_contract?.hash||"").toLowerCase() === c.address.toLowerCase()).length}
            </p>
          </div>
        ))}
      </div>

      {/* Contract filter */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {[{ address:"all", name:"All Contracts" }, ...CONTRACTS].map(c => (
          <button key={c.address} onClick={() => setContractFilter(c.address)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0
              ${contractFilter === c.address ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-green-50"}`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Method filter */}
      {methods.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 items-center">
          <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"/>
          {[{id:"all", label:"All Methods"}, ...methods.map(m => ({ id:m, label:(METHOD_CONFIG[m]?.label || m) }))].map(m => (
            <button key={m.id} onClick={() => setMethodFilter(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0
                ${methodFilter === m.id ? "bg-gray-800 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin"/>
          <p className="text-sm text-gray-500">Loading from all contracts…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Zap className="w-12 h-12 mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500 text-sm">No transactions found</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">
              {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} &nbsp;·&nbsp;
              Page {page} of {totalPages}
            </p>
          </div>
          <div className="space-y-2">
            {paginated.map(tx => <TxRow key={`${tx.hash}-${tx._contract?.address}`} tx={tx}/>)}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage}/>
        </>
      )}
    </div>
  );
}