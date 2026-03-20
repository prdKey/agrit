import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../context/UserContext";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../../services/cartService.js";
import {
  ShoppingCart, Trash2, Plus, Minus, CheckSquare,
  Square, ShoppingBag, Loader2, AlertCircle, ArrowRight, X
} from "lucide-react";

const PINATA = "https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/";

const itemKey = (item) => `${item.productId}__${item.variantIndex ?? "null"}`;

const EmptyCart = ({ onShop }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-400 px-4">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
      <ShoppingCart className="w-10 h-10 text-gray-300" />
    </div>
    <p className="text-lg font-semibold text-gray-500">Your cart is empty</p>
    <p className="text-sm text-center">Add products from the marketplace to get started</p>
    <button onClick={onShop}
      className="mt-2 px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
      Browse Marketplace
    </button>
  </div>
);

const ProductImage = ({ imageCID, name }) => (
  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-gray-100 bg-gray-50 flex-shrink-0 overflow-hidden">
    {imageCID ? (
      <img src={`${PINATA}${imageCID}`} alt={name}
        className="w-full h-full object-cover"
        onError={e => { e.target.style.display = "none"; }} />
    ) : (
      <div className="w-full h-full flex items-center justify-center">
        <ShoppingBag className="w-5 h-5 text-gray-300" />
      </div>
    )}
  </div>
);

export default function CartPage() {
  const { user }  = useUserContext();
  const navigate  = useNavigate();

  const [items,        setItems]        = useState([]);
  const [selected,     setSelected]     = useState(new Set());
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState(null);
  const [removing,     setRemoving]     = useState(null);
  const [clearing,     setClearing]     = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error,        setError]        = useState("");

  // Tracks the raw input value per item key (allows empty string while typing)
  const [qtyInputs, setQtyInputs] = useState({});

  useEffect(() => {
    if (!user) return navigate("/login");
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getCart();
        if (!cancelled) {
          setItems(data);
          setSelected(new Set(data.map(itemKey)));
          // Seed qtyInputs from loaded data
          const inputs = {};
          data.forEach(i => { inputs[itemKey(i)] = String(i.quantity); });
          setQtyInputs(inputs);
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load cart.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  const allSelected = items.length > 0 && selected.size === items.length;
  const toggleAll   = () =>
    setSelected(allSelected ? new Set() : new Set(items.map(itemKey)));
  const toggleOne   = (key) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ── Quantity helpers ──────────────────────────────────────────────────────
  const commitQty = async (item, newQty) => {
    const key = itemKey(item);
    if (newQty === item.quantity) return;
    setUpdating(key);
    try {
      await updateCartItem(item.id, newQty);
      setItems(prev => prev.map(i => itemKey(i) === key ? { ...i, quantity: newQty } : i));
    } catch {
      setError("Failed to update quantity.");
      // Revert input to last confirmed value
      setQtyInputs(prev => ({ ...prev, [key]: String(item.quantity) }));
    } finally {
      setUpdating(null);
    }
  };

  const handleQtyStep = (item, delta) => {
    const key    = itemKey(item);
    const newQty = Math.min(Math.max(item.quantity + delta, 1), item.stock);
    setQtyInputs(prev => ({ ...prev, [key]: String(newQty) }));
    commitQty(item, newQty);
  };

  const handleQtyInput = (item, val) => {
    const key = itemKey(item);
    setQtyInputs(prev => ({ ...prev, [key]: val }));
  };

  const handleQtyBlur = (item) => {
    const key  = itemKey(item);
    const raw  = qtyInputs[key] ?? "";
    const num  = parseInt(raw, 10);
    const safe = isNaN(num) || num < 1 ? 1 : Math.min(num, item.stock);
    setQtyInputs(prev => ({ ...prev, [key]: String(safe) }));
    commitQty(item, safe);
  };

  const handleRemove = async (item) => {
    const key = itemKey(item);
    setRemoving(key);
    try {
      await removeCartItem(item.id);
      setItems(prev => prev.filter(i => itemKey(i) !== key));
      setSelected(prev => { const n = new Set(prev); n.delete(key); return n; });
      setQtyInputs(prev => { const n = { ...prev }; delete n[key]; return n; });
    } catch { setError("Failed to remove item."); }
    finally { setRemoving(null); }
  };

  const handleClear = async () => {
    setConfirmClear(false);
    setClearing(true);
    try {
      await clearCart();
      setItems([]);
      setSelected(new Set());
      setQtyInputs({});
    } catch { setError("Failed to clear cart."); }
    finally { setClearing(false); }
  };

  const handleCheckout = () => {
    const selectedItems = items.filter(i => selected.has(itemKey(i)));
    if (selectedItems.length === 0) return;
    const missing = selectedItems.filter(i => !i.sellerAddress);
    if (missing.length > 0) {
      setError(`Some items are missing seller info: ${missing.map(i => i.name).join(", ")}. Please remove and re-add them.`);
      return;
    }
    navigate("/checkout", { state: { items: selectedItems } });
  };

  // ── Pricing ──────────────────────────────────────────────────────────────
  const selectedItems = items.filter(i => selected.has(itemKey(i)));
  const subtotal      = selectedItems.reduce((s, i) => s + Number(i.pricePerUnit) * i.quantity, 0);
  const platformFee   = subtotal * 0.0005;

  const uniqueSellers = selectedItems.length === 0 ? 0 :
    new Set(
      selectedItems.map(i =>
        i.sellerAddress?.toLowerCase() ||
        i.sellerId?.toString() ||
        `unknown_${i.productId}`
      )
    ).size;

  const logisticsFee = uniqueSellers * 50;
  const total        = subtotal + platformFee + logisticsFee;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Confirm clear modal ───────────────────────────────────────────── */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmClear(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Clear Cart?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">All {items.length} items will be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClear(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleClear}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sm:py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" /> My Cart
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          {items.length > 0 && (
            <button onClick={() => setConfirmClear(true)} disabled={clearing}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium disabled:opacity-50">
              {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </span>
            <button onClick={() => setError("")} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {items.length === 0 ? (
          <EmptyCart onShop={() => navigate("/")} />
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">

            {/* ── Cart items ──────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-2 sm:space-y-3">

              {/* Select all row */}
              <div className="bg-white rounded-2xl border border-gray-100 px-4 sm:px-5 py-3 flex items-center justify-between shadow-sm">
                <button onClick={toggleAll}
                  className="flex items-center gap-2 sm:gap-2.5 text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors">
                  {allSelected
                    ? <CheckSquare className="w-5 h-5 text-green-600" />
                    : <Square className="w-5 h-5 text-gray-300" />}
                  Select All ({items.length})
                </button>
                {selected.size > 0 && (
                  <span className="text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full">
                    {selected.size} selected
                  </span>
                )}
              </div>

              {/* Item rows */}
              {items.map(item => {
                const key        = itemKey(item);
                const isSelected = selected.has(key);
                const isUpdating = updating === key;
                const isRemoving = removing === key;
                const inputVal   = qtyInputs[key] ?? String(item.quantity);

                return (
                  <div key={key}
                    className={`bg-white rounded-2xl border-2 shadow-sm transition-all ${
                      isSelected ? "border-green-400" : "border-gray-100"
                    }`}>
                    <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">

                      {/* Checkbox */}
                      <button onClick={() => toggleOne(key)} className="flex-shrink-0">
                        {isSelected
                          ? <CheckSquare className="w-5 h-5 text-green-600" />
                          : <Square className="w-5 h-5 text-gray-300" />}
                      </button>

                      <ProductImage imageCID={item.imageCID} name={item.name} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">{item.name}</p>
                        {item.variantLabel && (
                          <span className="inline-block text-[10px] sm:text-[11px] bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 rounded-full font-semibold mt-0.5">
                            {item.variantLabel}
                          </span>
                        )}
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">{item.category}</p>
                        <p className="text-green-600 font-bold text-xs sm:text-sm mt-0.5 sm:mt-1">
                          {Number(item.pricePerUnit).toFixed(2)} AGT
                        </p>
                        {item.stock <= 5 && item.stock > 0 && (
                          <p className="text-[10px] sm:text-xs text-orange-500 font-medium mt-0.5">
                            Only {item.stock} left!
                          </p>
                        )}
                        {!item.sellerAddress && (
                          <p className="text-[10px] sm:text-xs text-red-400 font-medium mt-0.5">
                            ⚠ Remove and re-add to enable checkout
                          </p>
                        )}
                      </div>

                      {/* Qty + remove */}
                      <div className="flex flex-col items-end gap-1.5 sm:gap-2 flex-shrink-0">
                        <button onClick={() => handleRemove(item)} disabled={isRemoving}
                          className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50">
                          {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleQtyStep(item, -1)}
                            disabled={item.quantity <= 1 || isUpdating}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 transition-colors">
                            <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-600" />
                          </button>
                          {isUpdating ? (
                            <span className="w-8 sm:w-10 flex justify-center">
                              <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={1}
                              max={item.stock}
                              value={inputVal}
                              onChange={e => handleQtyInput(item, e.target.value)}
                              onBlur={() => handleQtyBlur(item)}
                              className="w-8 sm:w-10 text-center font-bold text-gray-900 text-xs sm:text-sm border-x border-gray-200 focus:outline-none bg-transparent py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          )}
                          <button
                            onClick={() => handleQtyStep(item, 1)}
                            disabled={item.quantity >= item.stock || isUpdating}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 transition-colors">
                            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-600" />
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">
                          {(Number(item.pricePerUnit) * item.quantity).toFixed(2)} AGT
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Order summary sidebar ────────────────────────────────────── */}
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Order Summary</h3>
                </div>
                <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span>Items ({selectedItems.reduce((s, i) => s + i.quantity, 0)})</span>
                    <span>{subtotal.toFixed(2)} AGT</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span>Platform fee (0.05%)</span>
                    <span>{platformFee.toFixed(4)} AGT</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span>Logistics ({uniqueSellers} seller{uniqueSellers !== 1 ? "s" : ""} × 50 AGT)</span>
                    <span>{logisticsFee.toFixed(2)} AGT</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex justify-between font-bold text-gray-900">
                    <span className="text-sm sm:text-base">Total</span>
                    <span className="text-green-600 text-base sm:text-lg">{total.toFixed(2)} AGT</span>
                  </div>
                </div>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2">
                  <button onClick={handleCheckout} disabled={selected.size === 0}
                    className="w-full py-3 sm:py-3.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    Checkout ({selected.size} item{selected.size !== 1 ? "s" : ""})
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigate("/")}
                    className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    Continue Shopping
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 sm:p-4 text-xs text-amber-700 space-y-1.5">
                <p className="font-semibold">⛓️ AGT Token Payment</p>
                <p>Funds are locked in escrow by the OrderManager smart contract until delivery is confirmed.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}