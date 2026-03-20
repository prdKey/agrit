// services/orderService.js (FRONTEND)

import axios        from "axios";
import { ethers }   from "ethers";
import { getToken } from "./tokenService";
import { SKALE_RPC } from "../utils/skaleNetwork.js";

const API_URL               = import.meta.env.VITE_API_URL;
const ORDER_MANAGER_ADDRESS = import.meta.env.VITE_ORDER_MANAGER_ADDRESS;
const TOKEN_ADDRESS         = import.meta.env.VITE_TOKEN_ADDRESS;
const authHeader            = () => ({ Authorization: `Bearer ${getToken()}` });

// ── Dedicated SKALE RPC for READ calls ───────────────────────────────────────
// Using a direct JsonRpcProvider for reads avoids the mobile BrowserProvider
// instability (eth_blockNumber coalesce errors on WalletConnect/mobile).
const readProvider   = new ethers.JsonRpcProvider(SKALE_RPC);

// ── Raw JSON-RPC helpers (mobile-safe, no ethers polling) ────────────────────

// Raw read via direct HTTP fetch to SKALE RPC — zero BrowserProvider involvement
const rpcCall = async (method, params) => {
  const res = await fetch(SKALE_RPC, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
};

// Encode allowance(owner, spender) call data
const encodeAllowance = (owner, spender) => {
  const sig    = "0xdd62ed3e"; // keccak256("allowance(address,address)")[0:4]
  const pad    = (addr) => addr.replace("0x", "").toLowerCase().padStart(64, "0");
  return sig + pad(owner) + pad(spender);
};

// Encode approve(spender, amount) call data
const encodeApprove = (spender, amountWei) => {
  const sig    = "0x095ea7b3"; // keccak256("approve(address,uint256)")[0:4]
  const pad    = (addr) => addr.replace("0x", "").toLowerCase().padStart(64, "0");
  const padInt = (n)    => BigInt(n).toString(16).padStart(64, "0");
  return sig + pad(spender) + padInt(amountWei);
};

// Poll tx receipt via direct HTTP — no ethers provider needed
const pollReceiptRaw = async (txHash, retries = 60, intervalMs = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const receipt = await rpcCall("eth_getTransactionReceipt", [txHash]);
      if (receipt) return receipt;
    } catch (_) { /* transient — keep polling */ }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error("Transaction confirmation timed out. Please check your wallet.");
};

// ── Approve AGT spending (fully mobile-safe, no ethers polling) ──────────────
const approveAGT = async (amountInAGT, walletProvider) => {
  if (!walletProvider) throw new Error("Wallet not connected");

  // Get signer address via wallet (this is a simple request, no polling)
  const accounts = await walletProvider.request({ method: "eth_accounts" });
  const owner    = accounts[0];
  if (!owner) throw new Error("No account found. Please reconnect your wallet.");

  const amountWei = ethers.parseEther(String(amountInAGT));

  // ── READ: allowance via raw fetch to SKALE RPC ───────────────────────────
  let skipApprove = false;
  try {
    const data   = encodeAllowance(owner, ORDER_MANAGER_ADDRESS);
    const result = await rpcCall("eth_call", [{ to: TOKEN_ADDRESS, data }, "latest"]);
    const allowance = BigInt(result);
    if (allowance >= amountWei) skipApprove = true;
  } catch (err) {
    console.warn("[approveAGT] allowance check failed, proceeding with approve:", err.message);
  }

  if (skipApprove) return;

  // ── WRITE: approve via raw wallet request — no ethers Contract ───────────
  const data = encodeApprove(ORDER_MANAGER_ADDRESS, amountWei);
  let txHash;
  try {
    txHash = await walletProvider.request({
      method: "eth_sendTransaction",
      params: [{ from: owner, to: TOKEN_ADDRESS, data }],
    });
  } catch (err) {
    if (err.code === 4001 || err.message?.includes("rejected")) {
      throw new Error("Transaction rejected. Please approve in your wallet.");
    }
    throw err;
  }

  // ── CONFIRM: poll receipt via raw fetch — no BrowserProvider polling ─────
  await pollReceiptRaw(txHash);
};

// ─────────────────────────────────────────────────────────────────────────────
// checkoutOrder — creates ONE order for ONE seller
// ─────────────────────────────────────────────────────────────────────────────
export const checkoutOrder = async (items, deliveryAddress, totalPrice) => {
  console.log("[checkoutOrder] totalPrice:", totalPrice, "items:", items.length);

  const res = await axios.post(
    `${API_URL}/orders/checkout`,
    {
      items: items.map(i => ({
        productId:    i.productId,
        quantity:     i.quantity,
        hasVariant:   i.variantIndex !== null && i.variantIndex !== undefined,
        variantIndex: i.variantIndex ?? 0,
      })),
      deliveryAddress,
    },
    { headers: authHeader() }
  );
  return res.data; // { orderId, txHash }
};

// ─────────────────────────────────────────────────────────────────────────────
// checkoutAll — groups cart items by sellerAddress, approves cumulative
// total ONCE, then places one order per seller group.
// ─────────────────────────────────────────────────────────────────────────────
export const checkoutAll = async (items, deliveryAddress, walletProvider) => {
  if (!items || items.length === 0) throw new Error("No items to checkout");

  const sellerGroups = {};
  for (const item of items) {
    const key = item.sellerAddress?.toLowerCase();
    if (!key) throw new Error(`Item ${item.productId} is missing sellerAddress`);
    if (!sellerGroups[key]) sellerGroups[key] = [];
    sellerGroups[key].push(item);
  }

  const groups = Object.values(sellerGroups);

  const cumulativeTotal = groups.reduce((sum, group) => {
    const groupSubtotal = group.reduce((s, i) => s + Number(i.pricePerUnit) * i.quantity, 0);
    const groupPlatform = groupSubtotal * 0.0005;
    return sum + groupSubtotal + groupPlatform + 50;
  }, 0);

  await approveAGT(cumulativeTotal, walletProvider);

  const orderIds = [];
  for (const group of groups) {
    const groupSubtotal = group.reduce((s, i) => s + Number(i.pricePerUnit) * i.quantity, 0);
    const groupPlatform = groupSubtotal * 0.0005;
    const groupTotal    = groupSubtotal + groupPlatform + 50;

    const data = await checkoutOrder(group, deliveryAddress, groupTotal);
    orderIds.push(data.orderId);
  }

  return { orderIds, groups, cumulativeTotal };
};

// ── buyProduct — single item alias ───────────────────────────────────────────
export const buyProduct = async (productId, quantity, deliveryAddress, totalPrice, walletProvider, variantIndex = null) => {
  await approveAGT(totalPrice, walletProvider);
  return checkoutOrder(
    [{ productId, quantity, variantIndex }],
    deliveryAddress,
    totalPrice
  );
};

export const getOrdersBySeller    = async () => (await axios.get(`${API_URL}/orders/seller`,           { headers: authHeader() })).data;
export const getOrdersByBuyer     = async () => (await axios.get(`${API_URL}/orders/buyer`,            { headers: authHeader() })).data;
export const getAvailableOrders   = async () => (await axios.get(`${API_URL}/orders/available-orders`, { headers: authHeader() })).data;
export const getOrdersByLogistics = async () => (await axios.get(`${API_URL}/orders/logistics`,        { headers: authHeader() })).data;
export const getAllOrders          = async () => (await axios.get(`${API_URL}/orders/all`,              { headers: authHeader() })).data;
export const getDisputedOrders    = async () => (await axios.get(`${API_URL}/orders/disputed`,         { headers: authHeader() })).data;

export const getOrderById = async (orderId) =>
  (await axios.get(`${API_URL}/orders/${orderId}`, { headers: authHeader() })).data;

export const confirmReceipt      = async (orderId) =>
  (await axios.put(`${API_URL}/orders/confirm-receipt`,       { orderId }, { headers: authHeader() })).data;
export const confirmShipment     = async (orderId) =>
  (await axios.put(`${API_URL}/orders/confirm-shipment`,      { orderId }, { headers: authHeader() })).data;
export const pickupOrder         = async (orderId, location) =>
  (await axios.put(`${API_URL}/orders/pickup-order`,          { orderId, location }, { headers: authHeader() })).data;
export const confirmDelivery     = async (orderId, location) =>
  (await axios.put(`${API_URL}/orders/confirm-delivery`,      { orderId, location }, { headers: authHeader() })).data;
export const acceptOrder         = async (orderId) =>
  (await axios.put(`${API_URL}/orders/accept-order`,          { orderId }, { headers: authHeader() })).data;
export const updateOrderLocation = async (orderId, location) =>
  (await axios.put(`${API_URL}/orders/update-location`,       { orderId, location }, { headers: authHeader() })).data;
export const markOutForDelivery  = async (orderId) =>
  (await axios.put(`${API_URL}/orders/mark-out-for-delivery`, { orderId }, { headers: authHeader() })).data;
export const cancelOrderBySeller = async (orderId) =>
  (await axios.put(`${API_URL}/orders/cancel-by-seller`,      { orderId }, { headers: authHeader() })).data;
export const cancelOrderByBuyer  = async (orderId) =>
  (await axios.put(`${API_URL}/orders/cancel-by-buyer`,       { orderId }, { headers: authHeader() })).data;
export const openDispute         = async (orderId, reason = "") =>
  (await axios.put(`${API_URL}/orders/open-dispute`,          { orderId, reason }, { headers: authHeader() })).data;
export const resolveDispute      = async (orderId, refundBuyer, adminNotes = "") =>
  (await axios.put(`${API_URL}/orders/resolve-dispute`,       { orderId, refundBuyer, adminNotes }, { headers: authHeader() })).data;