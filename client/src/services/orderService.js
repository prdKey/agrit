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

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

// ── Approve AGT spending via AppKit walletProvider ───────────────────────────
// - READ  (allowance check) → dedicated SKALE JsonRpcProvider  ✓ mobile-safe
// - WRITE (approve tx)      → BrowserProvider from walletProvider
const approveAGT = async (amountInAGT, walletProvider) => {
  if (!walletProvider) throw new Error("Wallet not connected");

  const provider  = new ethers.BrowserProvider(walletProvider);
  const signer    = await provider.getSigner();
  const owner     = await signer.getAddress();
  const amountWei = ethers.parseEther(String(amountInAGT));

  // Use dedicated read provider for allowance — avoids mobile RPC coalesce error
  const tokenRead = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, readProvider);
  let allowance;
  try {
    allowance = await tokenRead.allowance(owner, ORDER_MANAGER_ADDRESS);
  } catch (err) {
    // If read still fails (e.g. network hiccup), proceed with approve anyway
    console.warn("[approveAGT] allowance check failed, proceeding with approve:", err.message);
    allowance = BigInt(0);
  }

  if (allowance >= amountWei) return;

  // Write via wallet signer
  const tokenWrite = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
  try {
    const tx = await tokenWrite.approve(ORDER_MANAGER_ADDRESS, amountWei);

    // ── Mobile-safe tx confirmation ────────────────────────────────────────
    // tx.wait() uses BrowserProvider polling (eth_blockNumber) which fails
    // on mobile WalletConnect. Poll the receipt via dedicated SKALE RPC instead.
    const pollReceipt = async (txHash, retries = 60, intervalMs = 3000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const receipt = await readProvider.getTransactionReceipt(txHash);
          if (receipt) return receipt;
        } catch (_) { /* ignore transient errors, keep polling */ }
        await new Promise(r => setTimeout(r, intervalMs));
      }
      throw new Error("Transaction confirmation timed out. Please check your wallet.");
    };

    await pollReceipt(tx.hash);
  } catch (err) {
    if (err.code === 4001 || err.message?.includes("rejected")) {
      throw new Error("Transaction rejected. Please approve in your wallet.");
    }
    throw err;
  }
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