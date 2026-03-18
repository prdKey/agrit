// controllers/Wallet.controller.js

import axios                 from "axios";
import crypto                from "crypto";
import { ethers }            from "ethers";
import { tokenContract }     from "../blockchain/contract.js";
import WalletTransaction     from "../models/WalletTransaction.js";
import AgtRate               from "../models/Agtrate.js";

// ── PayMongo client ───────────────────────────────────────────────────────────
const paymongo = axios.create({
  baseURL: "https://api.paymongo.com/v1",
  headers: {
    Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
    "Content-Type": "application/json",
  },
});

// ── Internal helpers ──────────────────────────────────────────────────────────
const _getRate = async () => {
  console.log("[_getRate] Fetching rate from DB...");
  const row = await AgtRate.findOne({ order: [["id", "DESC"]] });
  const rate = parseFloat(row?.ratePhp ?? 1);
  console.log("[_getRate] Rate:", rate);
  return rate;
};

const _getBalance = async (walletAddress) => {
  console.log("[_getBalance] Fetching balance for:", walletAddress);
  const raw = await tokenContract.balanceOf(walletAddress);
  const balance = parseFloat(ethers.formatEther(raw));
  console.log("[_getBalance] Balance:", balance);
  return balance;
};

const _mint = async (walletAddress, amountAgt) => {
  console.log("[_mint] Minting", amountAgt, "AGT to", walletAddress);
  const amountWei = ethers.parseEther(amountAgt.toString());
  console.log("[_mint] Amount in wei:", amountWei.toString());
  const tx = await tokenContract.mint(walletAddress, amountWei);
  console.log("[_mint] Tx sent, waiting for confirmation... hash:", tx.hash);
  await tx.wait();
  console.log("[_mint] ✅ Confirmed! txHash:", tx.hash);
  return tx.hash;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/wallet/rate
// ─────────────────────────────────────────────────────────────────────────────
export const getRate = async (req, res) => {
  console.log("[getRate] GET /api/wallet/rate");
  try {
    const rate = await _getRate();
    console.log("[getRate] Responding with rate:", rate);
    res.json({ rate });
  } catch (e) {
    console.error("[getRate] Error:", e.message);
    res.status(500).json({ message: "Failed to fetch rate" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/wallet/balance
// ─────────────────────────────────────────────────────────────────────────────
export const getBalance = async (req, res) => {
  console.log("[getBalance] GET /api/wallet/balance | user:", req.user?.id, "| wallet:", req.user?.walletAddress);
  try {
    const balance = await _getBalance(req.user.walletAddress);
    console.log("[getBalance] Responding with balance:", balance);
    res.json({ balance, walletAddress: req.user.walletAddress });
  } catch (e) {
    console.error("[getBalance] Error:", e.message);
    res.status(500).json({ message: "Failed to fetch balance" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/wallet/transactions
// ─────────────────────────────────────────────────────────────────────────────
export const getTransactions = async (req, res) => {
  console.log("[getTransactions] GET /api/wallet/transactions | userId:", req.user?.id);
  try {
    const txs = await WalletTransaction.findAll({
      where:      { userId: req.user.id },
      order:      [["created_at", "DESC"]],
      limit:      50,
      attributes: [
        "id", "type", "amountAgt", "amountPhp",
        "gcashNumber", "referenceNo", "status",
        "txHash", "adminNote", "created_at",
      ],
    });
    console.log("[getTransactions] Found", txs.length, "transactions");
    res.json(txs);
  } catch (e) {
    console.error("[getTransactions] Error:", e.message);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/wallet/deposit/gcash
// ─────────────────────────────────────────────────────────────────────────────
export const depositGcash = async (req, res) => {
  console.log("[depositGcash] POST /api/wallet/deposit/gcash | body:", req.body, "| userId:", req.user?.id);
  const { amountPhp } = req.body;

  if (!amountPhp || parseFloat(amountPhp) <= 0) {
    console.warn("[depositGcash] Invalid amountPhp:", amountPhp);
    return res.status(400).json({ message: "Valid amountPhp is required" });
  }
  if (parseFloat(amountPhp) < 100) {
    console.warn("[depositGcash] Below minimum:", amountPhp);
    return res.status(400).json({ message: "Minimum deposit is ₱100" });
  }

  try {
    const rate      = await _getRate();
    const amountAgt = (parseFloat(amountPhp) / rate).toFixed(4);
    console.log("[depositGcash] PHP:", amountPhp, "| AGT:", amountAgt, "| rate:", rate);

    const tx = await WalletTransaction.create({
      userId:        req.user.id,
      walletAddress: req.user.walletAddress,
      type:          "DEPOSIT",
      amountAgt,
      amountPhp:     parseFloat(amountPhp),
      status:        "PENDING",
    });
    console.log("[depositGcash] WalletTransaction created, id:", tx.id);

    const centavos = Math.round(parseFloat(amountPhp) * 100);
    console.log("[depositGcash] Calling PayMongo, centavos:", centavos);

    const { data } = await paymongo.post("/links", {
      data: {
        attributes: {
          amount:      centavos,
          currency:    "PHP",
          description: `AgriTrust Deposit — ${amountAgt} AGT`,
          remarks:     `txId:${tx.id}|wallet:${req.user.walletAddress}`,
        },
      },
    });

    const checkoutUrl    = data.data.attributes.checkout_url;
    const paymongoLinkId = data.data.id;
    console.log("[depositGcash] PayMongo link created:", paymongoLinkId, "| checkoutUrl:", checkoutUrl);

    await tx.update({ referenceNo: paymongoLinkId });
    console.log("[depositGcash] WalletTransaction updated with referenceNo:", paymongoLinkId);

    res.status(201).json({ transactionId: tx.id, checkoutUrl, amountAgt, amountPhp });
  } catch (e) {
    console.error("[depositGcash] Error:", e.response?.data ?? e.message);
    res.status(500).json({ message: "Failed to create GCash payment link" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/wallet/webhook/paymongo
// ─────────────────────────────────────────────────────────────────────────────
export const paymongoWebhook = async (req, res) => {
  console.log("[paymongoWebhook] POST /api/wallet/webhook/paymongo");
  console.log("[paymongoWebhook] Headers:", JSON.stringify(req.headers, null, 2));
  console.log("[paymongoWebhook] Body:", JSON.stringify(req.body, null, 2));

  const sigHeader = req.headers["paymongo-signature"];
  if (!sigHeader) {
    console.warn("[paymongoWebhook] Missing paymongo-signature header");
    return res.status(400).json({ message: "Missing signature" });
  }

  try {
    const parts     = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=")));
    const timestamp = parts.t;
    const signature = parts.te ?? parts.li;
    console.log("[paymongoWebhook] Signature parts — timestamp:", timestamp, "| sig:", signature);

    const expected = crypto
      .createHmac("sha256", process.env.PAYMONGO_WEBHOOK_SECRET)
      .update(`${timestamp}.${JSON.stringify(req.body)}`)
      .digest("hex");

    console.log("[paymongoWebhook] Expected sig:", expected);
    console.log("[paymongoWebhook] Received sig:", signature);

    if (expected !== signature) {
      console.error("[paymongoWebhook] ❌ Signature mismatch!");
      return res.status(401).json({ message: "Invalid signature" });
    }
    console.log("[paymongoWebhook] ✅ Signature verified");
  } catch (e) {
    console.error("[paymongoWebhook] Signature verification error:", e.message);
    return res.status(400).json({ message: "Signature verification failed" });
  }

  res.status(200).json({ received: true });

  try {
    const event = req.body?.data?.attributes;
    console.log("[paymongoWebhook] Event type:", event?.type);

    const isPaid =
      event?.type === "payment.paid" ||
      event?.type === "link.payment.paid";

    if (!isPaid) {
      console.log("[paymongoWebhook] Not a paid event, skipping.");
      return;
    }

    const payment = event.data;
    const remarks = payment?.attributes?.remarks ?? "";
    console.log("[paymongoWebhook] Payment ID:", payment?.id, "| remarks:", remarks);

    const txIdMatch   = remarks.match(/txId:(\d+)/);
    const walletMatch = remarks.match(/wallet:(0x[a-fA-F0-9]+)/);

    if (!txIdMatch || !walletMatch) {
      console.error("[paymongoWebhook] Cannot parse txId/wallet from remarks:", remarks);
      return;
    }

    const txId          = parseInt(txIdMatch[1]);
    const walletAddress = walletMatch[1];
    console.log("[paymongoWebhook] Parsed txId:", txId, "| walletAddress:", walletAddress);

    const tx = await WalletTransaction.findByPk(txId);
    console.log("[paymongoWebhook] WalletTransaction found:", tx ? `id=${tx.id} status=${tx.status}` : "NOT FOUND");

    if (!tx || tx.status !== "PENDING") {
      console.log("[paymongoWebhook] Skipping — already processed or not found");
      return;
    }

    console.log("[paymongoWebhook] Minting", tx.amountAgt, "AGT to", walletAddress);
    const txHash = await _mint(walletAddress, tx.amountAgt);

    await tx.update({ status: "COMPLETED", txHash, referenceNo: payment.id });
    console.log("[paymongoWebhook] ✅ WalletTransaction updated — COMPLETED | txHash:", txHash);
  } catch (e) {
    console.error("[paymongoWebhook] Processing error:", e.message, e.stack);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/wallet/withdraw
// ─────────────────────────────────────────────────────────────────────────────
export const withdraw = async (req, res) => {
  console.log("[withdraw] POST /api/wallet/withdraw | body:", req.body, "| userId:", req.user?.id);
  const { amountAgt, gcashNumber, gcashName } = req.body;

  if (!amountAgt || !gcashNumber) {
    console.warn("[withdraw] Missing fields — amountAgt:", amountAgt, "gcashNumber:", gcashNumber);
    return res.status(400).json({ message: "amountAgt and gcashNumber are required" });
  }
  if (parseFloat(amountAgt) <= 0) {
    console.warn("[withdraw] Invalid amount:", amountAgt);
    return res.status(400).json({ message: "Amount must be greater than 0" });
  }

  try {
    const balance = await _getBalance(req.user.walletAddress);
    console.log("[withdraw] On-chain balance:", balance, "| Requested:", amountAgt);

    if (parseFloat(amountAgt) > balance) {
      console.warn("[withdraw] Insufficient balance");
      return res.status(400).json({ message: "Insufficient AGT balance" });
    }

    const rate      = await _getRate();
    const amountPhp = (parseFloat(amountAgt) * rate).toFixed(2);
    console.log("[withdraw] AGT:", amountAgt, "| PHP:", amountPhp, "| rate:", rate);

    const tx = await WalletTransaction.create({
      userId:        req.user.id,
      walletAddress: req.user.walletAddress,
      type:          "WITHDRAW",
      amountAgt:     parseFloat(amountAgt),
      amountPhp,
      gcashNumber,
      gcashName:     gcashName ?? "",
      status:        "PENDING",
    });
    console.log("[withdraw] WalletTransaction created, id:", tx.id);
    
    res.status(201).json({
      message:       "Withdrawal request submitted. GCash will be sent within 1–2 hours.",
      transactionId: tx.id,
      amountAgt,
      amountPhp,
      status:        "PENDING",
    });
  } catch (e) {
    console.error("[withdraw] Error:", e.message);
    res.status(500).json({ message: "Failed to submit withdrawal" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/wallet/admin/approve/:id
// ─────────────────────────────────────────────────────────────────────────────
export const adminApprove = async (req, res) => {
  console.log("[adminApprove] PATCH /api/wallet/admin/approve/:id | id:", req.params.id);
  try {
    const tx = await WalletTransaction.findByPk(parseInt(req.params.id));
    console.log("[adminApprove] Transaction found:", tx ? `id=${tx.id} type=${tx.type} status=${tx.status}` : "NOT FOUND");

    if (!tx)                     return res.status(404).json({ message: "Transaction not found" });
    if (tx.status !== "PENDING") return res.status(400).json({ message: "Transaction already processed" });
    if (tx.type !== "WITHDRAW")  return res.status(400).json({ message: "Only withdrawals need manual approval" });

    await tx.update({ status: "COMPLETED" });
    console.log("[adminApprove] ✅ Withdrawal marked as COMPLETED");
    res.json({ message: "Withdrawal marked as completed." });
  } catch (e) {
    console.error("[adminApprove] Error:", e.message);
    res.status(500).json({ message: "Failed to approve transaction" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/wallet/admin/reject/:id
// ─────────────────────────────────────────────────────────────────────────────
export const adminReject = async (req, res) => {
  console.log("[adminReject] PATCH /api/wallet/admin/reject/:id | id:", req.params.id, "| reason:", req.body?.reason);
  try {
    const tx = await WalletTransaction.findByPk(parseInt(req.params.id));
    console.log("[adminReject] Transaction found:", tx ? `id=${tx.id} status=${tx.status}` : "NOT FOUND");

    if (!tx)                     return res.status(404).json({ message: "Transaction not found" });
    if (tx.status !== "PENDING") return res.status(400).json({ message: "Transaction already processed" });

    await tx.update({ status: "REJECTED", adminNote: req.body.reason ?? "Rejected by admin" });
    console.log("[adminReject] ✅ Transaction REJECTED");
    res.json({ message: "Transaction rejected." });
  } catch (e) {
    console.error("[adminReject] Error:", e.message);
    res.status(500).json({ message: "Failed to reject transaction" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/wallet/admin/pending
// ─────────────────────────────────────────────────────────────────────────────
export const adminGetPending = async (req, res) => {
  console.log("[adminGetPending] GET /api/wallet/admin/pending");
  try {
    const pending = await WalletTransaction.findAll({
      where: { status: "PENDING" },
      order: [["created_at", "ASC"]],
    });
    console.log("[adminGetPending] Found", pending.length, "pending transactions");
    res.json(pending);
  } catch (e) {
    console.error("[adminGetPending] Error:", e.message);
    res.status(500).json({ message: "Failed to fetch pending transactions" });
  }
};

export const adminGetAll = async (req, res) => {
  try {
    const all = await WalletTransaction.findAll({
      order: [["created_at", "DESC"]],
      limit: 100,
    });
    res.json(all);
    console.log(all)
  } catch {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/wallet/admin/cancel/:id   [ADMIN]
// Cancels a PENDING transaction (marks as REJECTED with reason "Cancelled by admin")
// ─────────────────────────────────────────────────────────────────────────────
export const adminCancel = async (req, res) => {
  console.log("[adminCancel] DELETE /api/wallet/admin/cancel/:id | id:", req.params.id);
  try {
    const tx = await WalletTransaction.findByPk(parseInt(req.params.id));
    if (!tx)                     return res.status(404).json({ message: "Transaction not found" });
    if (tx.status !== "PENDING") return res.status(400).json({ message: "Only PENDING transactions can be cancelled" });

    await tx.update({ status: "REJECTED", adminNote: "Cancelled by admin" });
    console.log("[adminCancel] ✅ Transaction cancelled, id:", tx.id);
    res.json({ message: "Transaction cancelled." });
  } catch (e) {
    console.error("[adminCancel] Error:", e.message);
    res.status(500).json({ message: "Failed to cancel transaction" });
  }
};