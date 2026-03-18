import { useState, useEffect } from "react";
import {
  getTotalSupply, getBalance, mintTokens, transferTokens
} from "../../services/agtTokenService.js";
import {
  Coins, Search, Send, Zap, BarChart3,
  Loader2, CheckCircle2, XCircle, RefreshCw, Copy
} from "lucide-react";

const fmt = (val) => {
  if (val === null || val === undefined) return "—";
  const n = parseFloat(val);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(4);
};

const shortAddr = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";

const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
};

export default function TokenManagement() {
  const { toast, show } = useToast();

  const [totalSupply,   setTotalSupply]   = useState(null);
  const [loadingSupply, setLoadingSupply] = useState(false);

  const [checkAddr,   setCheckAddr]   = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [checking,    setChecking]    = useState(false);

  const [mintAddr,   setMintAddr]   = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [minting,    setMinting]    = useState(false);

  const [transferAddr,   setTransferAddr]   = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferring,   setTransferring]   = useState(false);

  useEffect(() => { fetchTotalSupply(); }, []);

  const fetchTotalSupply = async () => {
    setLoadingSupply(true);
    try {
      const supply = await getTotalSupply();
      setTotalSupply(supply);
    } catch { show("Failed to fetch total supply", "error"); }
    finally { setLoadingSupply(false); }
  };

  const handleCheckBalance = async () => {
    if (!checkAddr.trim()) return;
    setChecking(true); setCheckResult(null);
    try {
      const balance = await getBalance(checkAddr.trim());
      setCheckResult({ address: checkAddr.trim(), balance });
    } catch (err) {
      show(err.response?.data?.error || "Failed to check balance", "error");
    } finally { setChecking(false); }
  };

  const handleMint = async () => {
    if (!mintAddr.trim() || !mintAmount) return;
    setMinting(true);
    try {
      await mintTokens(mintAddr.trim(), mintAmount);
      show(`Minted ${mintAmount} AGT to ${shortAddr(mintAddr)}`);
      setMintAddr(""); setMintAmount("");
      fetchTotalSupply();
    } catch (err) {
      show(err.response?.data?.error || "Mint failed", "error");
    } finally { setMinting(false); }
  };

  const handleTransfer = async () => {
    if (!transferAddr.trim() || !transferAmount) return;
    setTransferring(true);
    try {
      await transferTokens(transferAddr.trim(), transferAmount);
      show(`Transferred ${transferAmount} AGT to ${shortAddr(transferAddr)}`);
      setTransferAddr(""); setTransferAmount("");
    } catch (err) {
      show(err.response?.data?.error || "Transfer failed", "error");
    } finally { setTransferring(false); }
  };

  const copyAddr = (addr) => {
    navigator.clipboard.writeText(addr);
    show("Address copied!");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${
          toast.type === "error" ? "bg-red-600" : "bg-green-600"
        }`}>
          {toast.type === "error" ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
           Management
        </h1>
        <p className="text-gray-500 mt-1">Manage AGT token supply and distribution</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" /> Total Supply
            </p>
            <button onClick={fetchTotalSupply} disabled={loadingSupply}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors disabled:opacity-40">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSupply ? "animate-spin" : ""}`} />
            </button>
          </div>
          {loadingSupply
            ? <div className="h-10 flex items-center"><Loader2 className="w-5 h-5 animate-spin text-green-500" /></div>
            : <p className="text-4xl font-black text-green-600">{fmt(totalSupply)} <span className="text-xl text-gray-400 font-semibold">AGT</span></p>
          }
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Token</p>
          <p className="text-2xl font-black text-gray-900">AGT</p>
          <p className="text-xs text-gray-400 mt-1">AgriTrust Token · ERC-20</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Check Balance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" /> Check Balance
            </h2>
          </div>
          <div className="p-5 space-y-3">
            <input
              value={checkAddr}
              onChange={e => setCheckAddr(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCheckBalance()}
              placeholder="0x... wallet address"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:font-sans placeholder:text-gray-300"
            />
            <button
              onClick={handleCheckBalance}
              disabled={!checkAddr.trim() || checking}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
            >
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Check Balance
            </button>
            {checkResult && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 font-semibold">Address</p>
                  <button onClick={() => copyAddr(checkResult.address)}
                    className="text-gray-300 hover:text-blue-500 transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs font-mono text-gray-600 break-all mb-3">{checkResult.address}</p>
                <p className="text-xs text-gray-400 font-semibold mb-1">Balance</p>
                <p className="text-2xl font-black text-blue-600">
                  {fmt(checkResult.balance)} <span className="text-sm text-gray-400 font-semibold">AGT</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mint Tokens */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" /> Mint Tokens
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Create new AGT and send to an address</p>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Recipient Address</label>
              <input
                value={mintAddr}
                onChange={e => setMintAddr(e.target.value)}
                placeholder="0x..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:font-sans placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Amount (AGT)</label>
              <div className="relative">
                <input
                  type="number" value={mintAmount} min="0"
                  onChange={e => setMintAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">AGT</span>
              </div>
            </div>
            <div className="flex gap-2">
              {[100, 500, 1000, 5000].map(amt => (
                <button key={amt} onClick={() => setMintAmount(String(amt))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    mintAmount === String(amt)
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400"
                  }`}>
                  {amt >= 1000 ? `${amt/1000}K` : amt}
                </button>
              ))}
            </div>
            <button
              onClick={handleMint}
              disabled={!mintAddr.trim() || !mintAmount || minting}
              className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
            >
              {minting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Mint {mintAmount ? `${mintAmount} AGT` : "Tokens"}
            </button>
            <p className="text-xs text-gray-400 text-center">⚠️ Minting increases total supply permanently</p>
          </div>
        </div>

        {/* Transfer Tokens */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-500" /> Transfer Tokens
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Send AGT from admin wallet to any address</p>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Recipient Address</label>
              <input
                value={transferAddr}
                onChange={e => setTransferAddr(e.target.value)}
                placeholder="0x..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:font-sans placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Amount (AGT)</label>
              <div className="relative">
                <input
                  type="number" value={transferAmount} min="0"
                  onChange={e => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">AGT</span>
              </div>
            </div>
            <div className="flex gap-2">
              {[50, 100, 500, 1000].map(amt => (
                <button key={amt} onClick={() => setTransferAmount(String(amt))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    transferAmount === String(amt)
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-400"
                  }`}>
                  {amt >= 1000 ? `${amt/1000}K` : amt}
                </button>
              ))}
            </div>
            <button
              onClick={handleTransfer}
              disabled={!transferAddr.trim() || !transferAmount || transferring}
              className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
            >
              {transferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Transfer {transferAmount ? `${transferAmount} AGT` : "Tokens"}
            </button>
            <p className="text-xs text-gray-400 text-center">Transfers from admin wallet — ensure sufficient balance</p>
          </div>
        </div>
      </div>
    </div>
  );
}