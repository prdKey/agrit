// controllers/Flag.controller.js
import ProductFlag from "../models/ProductFlag.js";
import ProductAppeal from "../models/ProductAppeal.js";
import { productManagerContract } from "../blockchain/contract.js";

// Admin flags a product
export const flagProduct = async (req, res) => {
  try {
    const { productId, reason } = req.body;
    const adminId = req.user.id;

    // Check if already flagged
    const existing = await ProductFlag.findOne({
      where: { productId, status: "FLAGGED" }
    });
    if (existing) {
      return res.status(400).json({ message: "Product is already flagged" });
    }

    const flag = await ProductFlag.create({ productId, adminId, reason });
    res.status(201).json({ message: "Product flagged and hidden from users", flag });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all flags (admin)
export const getFlags = async (req, res) => {
  try {
    const flags = await ProductFlag.findAll({
      include: [{ model: ProductAppeal }]
    });
    res.json({ flags });
  } catch (err) {
    
    res.status(500).json({ message: err.message });
  }
};

// Get flagged product IDs (used to filter products)
export const getFlaggedProductIds = async () => {
  const flags = await ProductFlag.findAll({
    where: { status: "FLAGGED" }
  });
  return flags.map(f => f.productId);
};

// Seller submits appeal
export const submitAppeal = async (req, res) => {
  try {
    const { flagId, productId, message } = req.body;
    const sellerId = req.user.id;

    // Check if appeal already exists
    const existing = await ProductAppeal.findOne({ where: { flagId } });
    if (existing) {
      return res.status(400).json({ message: "Appeal already submitted for this flag" });
    }

    // Update flag status
    await ProductFlag.update(
      { status: "UNDER_REVIEW" },
      { where: { id: flagId } }
    );

    const appeal = await ProductAppeal.create({ flagId, productId, sellerId, message });
    res.status(201).json({ message: "Appeal submitted successfully", appeal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin resolves appeal
export const resolveAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body; // "APPROVED" or "REJECTED"

    const appeal = await ProductAppeal.findByPk(id);
    if (!appeal) return res.status(404).json({ message: "Appeal not found" });

    await appeal.update({ status: decision });

    // Update flag based on decision
    if (decision === "APPROVED") {
      await ProductFlag.update(
        { status: "RESTORED" },
        { where: { id: appeal.flagId } }
      );
    } else {
      await ProductFlag.update(
        { status: "PERMANENTLY_HIDDEN" },
        { where: { id: appeal.flagId } }
      );
    }

    res.json({ message: `Appeal ${decision}`, appeal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyFlags = async (req, res) => {
  try {
    const walletAddress = req.user.walletAddress
    const raw  = await productManagerContract.getProductsBySeller(walletAddress);
    const productIds = raw.map(p => Number(p.id));

    const flags = await ProductFlag.findAll({
      where: { productId: productIds },
      include: [{ model: ProductAppeal, required: false }],
    });

    res.json({ flags });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
};