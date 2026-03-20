import { useState, useEffect } from "react";
import { useUserContext } from "../../context/UserContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers } from "ethers";
import { checkoutOrder } from "../../services/orderService.js";
import { getAddresses } from "../../services/addressService.js";
import { removeBulkCartItems } from "../../services/cartService.js";
import { getBalance } from "../../services/agtTokenService.js";
import {
  ShoppingBag, MapPin, Wallet, Truck, ChevronRight, ChevronLeft,
  CheckCircle, Loader2, Tag, X, Lock,
  Plus, Minus, Trash2, AlertCircle, Home, Briefcase
} from "lucide-react";
import axios from "axios";
import { getToken } from "../../services/tokenService.js";
import { SKALE_RPC } from "../../utils/skaleNetwork.js";

const API_URL               = import.meta.env.VITE_API_URL;
const ORDER_MANAGER_ADDRESS = import.meta.env.VITE_ORDER_MANAGER_ADDRESS;
const TOKEN_ADDRESS         = import.meta.env.VITE_TOKEN_ADDRESS;
const authHeader            = () => ({ Authorization: `Bearer ${getToken()}` });

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

const STEPS = [
  { id: 0, label: "Cart",    icon: ShoppingBag },
  { id: 1, label: "Address", icon: MapPin },
  { id: 2, label: "Review",  icon: CheckCircle },
];

const LABEL_ICON = { Home, Work: Briefcase, Other: MapPin };

const fmtAddr = (a) =>
  [a.houseNumber, a.street, a.barangay, a.city, a.zipCode]
    .filter(Boolean).join(", ");

const itemKey = (item) => `${item.productId}__${item.variantIndex ?? "null"}`;

const buildSellerGroups = (cartItems) => {
  const groups = {};
  for (const item of cartItems) {
    const key = item.sellerAddress?.toLowerCase();
    if (!key) throw new Error(`Item "${item.name ?? item.productId}" is missing sellerAddress.`);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.values(groups);
};

const groupTotal = (group) => {
  const sub      = group.reduce((s, i) => s + Number(i.pricePerUnit) * i.quantity, 0);
  const platform = sub * 0.0005;
  return sub + platform + 50;
};

export default function CheckoutPage() {
  const { user }   = useUserContext();
  const navigate   = useNavigate();
  const location   = useLocation();

  const { address: connectedAddress, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const [step, setStep]               = useState(0);
  const [cartItems, setCartItems]     = useState([]);
  const [addresses, setAddresses]     = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [couponCode, setCouponCode]   = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [note, setNote]               = useState("");
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [submitProgress, setSubmitProgress] = useState({ done: 0, total: 0 });
  const [submitError, setSubmitError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [agtBalance, setAgtBalance]         = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [walletReady, setWalletReady]       = useState(false);

  // Tracks raw input values per item key while typing
  const [qtyInputs, setQtyInputs] = useState({});

  useEffect(() => {
    setWalletReady(isConnected && !!walletProvider);
  }, [isConnected, walletProvider]);

  const approveAGT = async (amountInAGT) => {
    if (!walletProvider) throw new Error("Wallet not connected. Please reconnect.");

    const provider     = new ethers.BrowserProvider(walletProvider);
    const signer       = await provider.getSigner();
    const owner        = await signer.getAddress();

    const readProvider = new ethers.JsonRpcProvider(SKALE_RPC);
    const tokenRead    = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, readProvider);
    const tokenWrite   = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
    const amountWei    = ethers.parseEther(String(amountInAGT));

    try {
      const allowance = await tokenRead.allowance(owner, ORDER_MANAGER_ADDRESS);
      if (allowance >= amountWei) return;
    } catch (err) {
      console.warn("allowance check failed, proceeding with approve:", err.message);
    }

    try {
      const tx = await tokenWrite.approve(ORDER_MANAGER_ADDRESS, amountWei);
      await tx.wait();
    } catch (err) {
      if (err.code === 4001 || err.message?.includes("rejected")) {
        throw new Error("Transaction rejected. Please approve in your wallet.");
      }
      throw err;
    }
  };

  useEffect(() => {
    if (!user) return;
    const passedItems = location.state?.items;
    if (!passedItems || passedItems.length === 0) { navigate("/cart"); return; }
    const load = async () => {
      try {
        setLoading(true);
        setCartItems(passedItems);
        // Seed qtyInputs from passed items
        const inputs = {};
        passedItems.forEach(i => { inputs[itemKey(i)] = String(i.quantity); });
        setQtyInputs(inputs);
        const addrs = await getAddresses();
        setAddresses(addrs);
        const def = addrs.find(a => a.isDefault);
        if (def) setSelectedAddress(def.id);
      } catch (err) { console.error("Failed to load checkout:", err); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    const checkBalance = async () => {
      setBalanceLoading(true);
      try {
        if (!isConnected || !connectedAddress) { setAgtBalance(null); return; }
        const balance = await getBalance(connectedAddress);
        if (!cancelled) setAgtBalance(Number(balance));
      } catch (err) {
        console.error("Balance check failed:", err);
        if (!cancelled) setAgtBalance(null);
      } finally { if (!cancelled) setBalanceLoading(false); }
    };
    checkBalance();
    return () => { cancelled = true; };
  }, [step, isConnected, connectedAddress]);

  // ── Quantity helpers ──────────────────────────────────────────────────────
  const handleQtyStep = (key, delta, stock) => {
    setCartItems(prev =>
      prev.map(i => {
        if (itemKey(i) !== key) return i;
        const newQty = Math.min(Math.max(i.quantity + delta, 1), stock);
        setQtyInputs(p => ({ ...p, [key]: String(newQty) }));
        return { ...i, quantity: newQty };
      })
    );
  };

  const handleQtyInput = (key, val) => {
    setQtyInputs(prev => ({ ...prev, [key]: val }));
  };

  const handleQtyBlur = (key, stock) => {
    setCartItems(prev =>
      prev.map(i => {
        if (itemKey(i) !== key) return i;
        const num  = parseInt(qtyInputs[key] ?? "", 10);
        const safe = isNaN(num) || num < 1 ? 1 : Math.min(num, stock);
        setQtyInputs(p => ({ ...p, [key]: String(safe) }));
        return { ...i, quantity: safe };
      })
    );
  };

  const removeItem = (key) => {
    setCartItems(prev => prev.filter(i => itemKey(i) !== key));
    setQtyInputs(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(""); setCouponLoading(true);
    try {
      const res = await axios.post(`${API_URL}/coupons/validate`, { code: couponCode }, { headers: authHeader() });
      setAppliedCoupon(res.data.coupon);
    } catch (err) { setCouponError(err.response?.data?.error || "Invalid coupon code."); }
    finally { setCouponLoading(false); }
  };

  const subtotal      = cartItems.reduce((s, i) => s + (Number(i.pricePerUnit) * i.quantity), 0);
  const discount      = appliedCoupon
    ? appliedCoupon.type === "percent" ? (subtotal * appliedCoupon.value) / 100 : appliedCoupon.value
    : 0;
  const platformFee   = subtotal * 0.0005;
  const uniqueSellers = cartItems.length === 0 ? 0 :
    new Set(
      cartItems.map(i =>
        i.sellerAddress?.toLowerCase() ||
        i.sellerId?.toString() ||
        `unknown_${i.productId}`
      )
    ).size;
  const logisticsFee  = uniqueSellers * 50;
  const total         = Math.max(0, subtotal + platformFee + logisticsFee - discount);
  const totalQty      = cartItems.reduce((s, i) => s + i.quantity, 0);

  const selectedAddr     = addresses.find(a => a.id === selectedAddress);
  const hasEnoughBalance = agtBalance === null ? true : agtBalance >= total;

  const placeOrder = async () => {
    if (!selectedAddr) { setSubmitError("Please select a delivery address."); return; }
    if (!isConnected || !walletProvider) {
      setSubmitError("Wallet disconnected. Please go back to login and reconnect.");
      return;
    }

    setSubmitError("");
    setBalanceLoading(true);

    try {
      const latestBalance = Number(await getBalance(connectedAddress));
      setAgtBalance(latestBalance);
      if (latestBalance < total) {
        setSubmitError(`Insufficient AGT balance. You need ${total.toFixed(4)} AGT but your wallet only has ${latestBalance.toFixed(4)} AGT. You're short by ${(total - latestBalance).toFixed(4)} AGT.`);
        setBalanceLoading(false);
        return;
      }
    } catch (err) { console.error("Balance re-check failed:", err); }
    finally { setBalanceLoading(false); }

    setSubmitting(true);

    const deliveryAddress = {
      addressId:   selectedAddr.id,
      name:        selectedAddr.name,
      phone:       selectedAddr.phone,
      fullAddress: fmtAddr(selectedAddr),
      houseNumber: selectedAddr.houseNumber,
      street:      selectedAddr.street,
      barangay:    selectedAddr.barangay,
      city:        selectedAddr.city,
      zipCode:     selectedAddr.zipCode,
    };

    try {
      let groups;
      try {
        groups = buildSellerGroups(cartItems);
      } catch (groupErr) {
        setSubmitError(groupErr.message);
        setSubmitting(false);
        return;
      }

      const cumulativeTotal = groups.reduce((sum, g) => sum + groupTotal(g), 0);
      await approveAGT(cumulativeTotal);

      const orderIds = [];
      setSubmitProgress({ done: 0, total: groups.length });

      for (const group of groups) {
        const data = await checkoutOrder(group, deliveryAddress, groupTotal(group));
        orderIds.push(data.orderId);
        setSubmitProgress(prev => ({ ...prev, done: prev.done + 1 }));
      }

      try {
        await removeBulkCartItems(
          cartItems.map(i => ({ productId: i.productId, variantIndex: i.variantIndex ?? null }))
        );
      } catch (_) {}

      setOrderSuccess({ orderIds, total, groups });
    } catch (err) {
      console.error(err);
      setSubmitError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to place order. Please try again."
      );
    } finally { setSubmitting(false); }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {orderSuccess.orderIds.length > 1 ? "Orders Placed!" : "Order Placed!"}
          </h1>
          <p className="text-gray-500 mb-1">
            {orderSuccess.orderIds.length} order{orderSuccess.orderIds.length > 1 ? "s" : ""} confirmed
          </p>
          <p className="text-sm text-gray-400 mb-2">
            {orderSuccess.total.toFixed(2)} AGT · held in escrow until delivery
          </p>
          {selectedAddr && (
            <p className="text-xs text-gray-400 mb-6 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" /> Delivering to {selectedAddr.name} — {fmtAddr(selectedAddr)}
            </p>
          )}
          <div className="space-y-3 mb-8">
            {orderSuccess.orderIds.map((orderId, i) => {
              const group = orderSuccess.groups[i] || [];
              return (
                <div key={orderId} className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Order</span>
                    <span className="font-mono text-sm text-green-600 font-bold">#{orderId}</span>
                  </div>
                  <div className="space-y-1">
                    {group.map(item => (
                      <div key={itemKey(item)} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">
                          {item.name}
                          {item.variantLabel && <span className="ml-1 text-green-600">({item.variantLabel})</span>}
                          <span className="text-gray-400 ml-1">×{item.quantity}</span>
                        </span>
                        <span className="text-gray-600 font-medium">
                          {(Number(item.pricePerUnit) * item.quantity).toFixed(2)} AGT
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("/user/purchase")}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
              View Orders
            </button>
            <button onClick={() => navigate("/")}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Shop More
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon; const isActive = i === step; const isDone = i < step;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isDone ? "bg-green-600" : isActive ? "bg-green-600 ring-4 ring-green-100" : "bg-gray-100"}`}>
                      {isDone ? <CheckCircle className="w-5 h-5 text-white" /> : <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />}
                    </div>
                    <span className={`text-xs mt-1 font-medium hidden sm:block ${isActive ? "text-green-600" : isDone ? "text-green-500" : "text-gray-400"}`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${isDone ? "bg-green-500" : "bg-gray-200"}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">

            {/* STEP 0 — Cart */}
            {step === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-green-600" />
                    Cart ({totalQty} item{totalQty !== 1 ? "s" : ""})
                  </h2>
                </div>
                {cartItems.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {cartItems.map(item => {
                      const key      = itemKey(item);
                      const inputVal = qtyInputs[key] ?? String(item.quantity);
                      return (
                        <div key={key} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                          <img src={`https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/${item.imageCID}`}
                            alt={item.name} className="w-14 h-14 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                            onError={e => { e.target.style.display = "none"; }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                            {item.variantLabel && (
                              <span className="inline-block text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold mt-0.5">
                                {item.variantLabel}
                              </span>
                            )}
                            <p className="text-xs text-gray-400">{item.category} · Product #{item.productId}</p>
                            <p className="text-green-600 font-bold text-sm mt-0.5">{Number(item.pricePerUnit).toFixed(2)} AGT / unit</p>
                          </div>
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => handleQtyStep(key, -1, item.stock)}
                              disabled={item.quantity <= 1}
                              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors">
                              <Minus className="w-3 h-3 text-gray-600" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={item.stock}
                              value={inputVal}
                              onChange={e => handleQtyInput(key, e.target.value)}
                              onBlur={() => handleQtyBlur(key, item.stock)}
                              className="w-10 text-center font-semibold text-gray-900 text-sm border-x border-gray-200 focus:outline-none py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => handleQtyStep(key, 1, item.stock)}
                              disabled={item.quantity >= item.stock}
                              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors">
                              <Plus className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <p className="font-bold text-gray-900 text-sm">{(Number(item.pricePerUnit) * item.quantity).toFixed(2)} AGT</p>
                          </div>
                          <button onClick={() => removeItem(key)} className="text-red-400 hover:text-red-600 transition-colors ml-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STEP 1 — Address */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" /> Delivery Address
                  </h2>
                  <button onClick={() => navigate("/address/new", { state: { from: "/checkout" } })}
                    className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-semibold">
                    <Plus className="w-4 h-4" /> Add New
                  </button>
                </div>
                <div className="p-6 space-y-3">
                  {addresses.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium mb-1">No saved addresses yet</p>
                      <button onClick={() => navigate("/address/new", { state: { from: "/checkout" } })}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors mt-2">
                        Add Address
                      </button>
                    </div>
                  ) : addresses.map(addr => {
                    const LabelIcon = LABEL_ICON[addr.label] || MapPin;
                    const isSelected = selectedAddress === addr.id;
                    return (
                      <label key={addr.id} className={`flex gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <input type="radio" name="address" value={addr.id} checked={isSelected}
                          onChange={() => setSelectedAddress(addr.id)} className="accent-green-600 mt-1 flex-shrink-0" />
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? "bg-green-100" : "bg-gray-100"}`}>
                          <LabelIcon className={`w-4 h-4 ${isSelected ? "text-green-600" : "text-gray-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-bold text-gray-900 text-sm">{addr.name}</span>
                            {addr.label && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{addr.label}</span>}
                            {addr.isDefault && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Default</span>}
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{fmtAddr(addr)}</p>
                          <p className="text-xs text-gray-400 mt-1">{addr.phone}</p>
                        </div>
                        {isSelected && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />}
                      </label>
                    );
                  })}
                </div>
                <div className="px-6 pb-6 border-t border-gray-50 pt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Order Note (optional)</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Special instructions, gate code, etc." rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            )}

            {/* STEP 2 — Review */}
            {step === 2 && (
              <div className="space-y-4">
                {(() => {
                  const groups = {};
                  for (const item of cartItems) {
                    const key = item.sellerAddress?.toLowerCase() ?? item.productId;
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(item);
                  }
                  return Object.values(groups).map((group, gi) => (
                    <div key={gi} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-green-600" />
                          Order {gi + 1} — {group.length} item{group.length !== 1 ? "s" : ""}
                        </h2>
                        <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-semibold">
                          50 AGT logistics
                        </span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {group.map((item) => (
                          <div key={itemKey(item)} className="px-6 py-3 flex items-center gap-3">
                            <img src={`https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/${item.imageCID}`}
                              alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                              onError={e => { e.target.style.display = "none"; }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {item.name}
                                {item.variantLabel && (
                                  <span className="ml-1.5 text-[11px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                                    {item.variantLabel}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400">×{item.quantity} · #{item.productId}</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {(Number(item.pricePerUnit) * item.quantity).toFixed(2)} AGT
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}

                {/* Wallet balance */}
                <div className={`rounded-2xl border-2 p-4 flex items-center gap-4 transition-all ${
                  balanceLoading ? "border-gray-200 bg-gray-50"
                  : agtBalance === null ? "border-amber-200 bg-amber-50"
                  : hasEnoughBalance ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    balanceLoading ? "bg-gray-200" : agtBalance === null ? "bg-amber-100"
                    : hasEnoughBalance ? "bg-green-100" : "bg-red-100"}`}>
                    {balanceLoading
                      ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      : <Wallet className={`w-5 h-5 ${agtBalance === null ? "text-amber-500" : hasEnoughBalance ? "text-green-600" : "text-red-500"}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">Wallet Balance</p>
                    {balanceLoading ? (
                      <p className="text-xs text-gray-400 mt-0.5">Checking balance...</p>
                    ) : agtBalance === null ? (
                      <p className="text-xs text-amber-600 mt-0.5">Could not read balance — make sure your wallet is connected.</p>
                    ) : (
                      <p className={`text-xs mt-0.5 font-semibold ${hasEnoughBalance ? "text-green-600" : "text-red-500"}`}>
                        {Number(agtBalance).toFixed(4)} AGT available
                        {connectedAddress && <span className="ml-2 font-normal text-gray-400">({connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)})</span>}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">Required</p>
                    <p className="text-sm font-bold text-gray-900">{total.toFixed(4)} AGT</p>
                  </div>
                </div>

                {!balanceLoading && agtBalance !== null && !hasEnoughBalance && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4 text-sm text-red-700">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">Insufficient AGT Balance</p>
                        <p className="text-xs mt-0.5">
                          You need <span className="font-bold">{total.toFixed(4)} AGT</span> but your wallet only has{" "}
                          <span className="font-bold">{Number(agtBalance).toFixed(4)} AGT</span>.{" "}
                          You're short by <span className="font-bold">{(total - agtBalance).toFixed(4)} AGT</span>.
                        </p>
                      </div>
                    </div>
                    <button onClick={() => navigate("/wallet")}
                      className="mt-3 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
                      <Wallet className="w-3.5 h-3.5" /> Go to Wallet to Deposit AGT
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Delivering To
                    </p>
                    {selectedAddr ? (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-sm">{selectedAddr.name}</span>
                          {selectedAddr.label && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{selectedAddr.label}</span>}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{fmtAddr(selectedAddr)}</p>
                        <p className="text-xs text-gray-500 mt-1">{selectedAddr.phone}</p>
                      </div>
                    ) : <p className="text-sm text-red-400 italic">No address selected</p>}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                      <Wallet className="w-3 h-3" /> Payment
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">⛓️</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">AGT Token</p>
                        <p className="text-xs text-gray-400">On-chain via OrderManager</p>
                      </div>
                    </div>
                    {note && (
                      <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2 text-xs text-yellow-800">
                        <span className="font-semibold">Note: </span>{note}
                      </div>
                    )}
                  </div>
                </div>

                {submitting && (
                  <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                      <p className="font-semibold text-gray-900">
                        Placing orders ({submitProgress.done}/{submitProgress.total})
                      </p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: submitProgress.total ? `${(submitProgress.done / submitProgress.total) * 100}%` : "0%" }} />
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {submitError}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < 2 ? (
                <button
                  onClick={() => { setStep(s => s + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  disabled={(step === 0 && cartItems.length === 0) || (step === 1 && !selectedAddress)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={placeOrder}
                  disabled={submitting || balanceLoading || !walletReady || (!hasEnoughBalance && agtBalance !== null)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                    : balanceLoading
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Checking balance...</>
                    : !walletReady
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Connecting wallet...</>
                    : !hasEnoughBalance && agtBalance !== null
                    ? <><AlertCircle className="w-4 h-4" /> Insufficient Balance</>
                    : <><Lock className="w-4 h-4" /> Confirm & Pay {total.toFixed(2)} AGT</>
                  }
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Price Breakdown</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({totalQty} items)</span>
                  <span className="font-medium">{subtotal.toFixed(2)} AGT</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Platform fee (0.05%)</span>
                  <span>{platformFee.toFixed(4)} AGT</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Logistics ({uniqueSellers} order{uniqueSellers !== 1 ? "s" : ""} × 50 AGT)</span>
                  <span>{logisticsFee.toFixed(2)} AGT</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>−{discount.toFixed(2)} AGT</span>
                  </div>
                )}
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-green-600 text-lg">{total.toFixed(2)} AGT</span>
                </div>
              </div>

              {step === 2 && (
                <div className="mx-5 mb-4 space-y-2">
                  <div className={`rounded-xl px-3 py-2.5 text-xs font-medium flex items-center justify-between ${
                    balanceLoading ? "bg-gray-100 text-gray-400"
                    : agtBalance === null ? "bg-amber-50 text-amber-600"
                    : hasEnoughBalance ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-600"}`}>
                    <span className="flex items-center gap-1.5">
                      <Wallet className="w-3 h-3" />
                      {balanceLoading ? "Checking..." : agtBalance === null ? "Wallet not connected" : `${Number(agtBalance).toFixed(4)} AGT`}
                    </span>
                    {!balanceLoading && agtBalance !== null && (
                      <span>{hasEnoughBalance ? "✓ Sufficient" : "✗ Insufficient"}</span>
                    )}
                  </div>
                  {!balanceLoading && agtBalance !== null && !hasEnoughBalance && (
                    <button onClick={() => navigate("/wallet")}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                      <Wallet className="w-3 h-3" /> Deposit AGT
                    </button>
                  )}
                </div>
              )}

              <div className="px-5 pb-4">
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                  ⛓️ Final fees are enforced by the <strong>OrderManager</strong> smart contract on-chain.
                </div>
              </div>
            </div>

            {selectedAddr && step > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-green-600" /> Delivery Address
                </p>
                <p className="text-sm font-semibold text-gray-900">{selectedAddr.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{fmtAddr(selectedAddr)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{selectedAddr.phone}</p>
                {step === 2 && (
                  <button onClick={() => setStep(1)} className="text-xs text-green-600 hover:text-green-700 font-semibold mt-2">
                    Change address
                  </button>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600" /> Coupon Code
              </p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                  <div>
                    <p className="text-sm font-bold text-green-700">{appliedCoupon.code}</p>
                    <p className="text-xs text-green-600">{appliedCoupon.label}</p>
                  </div>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Enter code" value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                      onKeyDown={e => e.key === "Enter" && applyCoupon()}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 uppercase" />
                    <button onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40">
                      {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{couponError}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              {[
                { e: "⛓️", t: "On-chain escrow — funds locked until delivery" },
                { e: "🔒", t: "ReentrancyGuard protected contract" },
                { e: "⚖️", t: "Dispute resolution by platform admin" },
                { e: "↩️", t: "Cancellation available before shipment" },
              ].map(({ e, t }) => (
                <div key={t} className="flex items-start gap-3 text-xs text-gray-500">
                  <span>{e}</span> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}