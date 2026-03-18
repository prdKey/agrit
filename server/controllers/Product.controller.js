// controllers/Product.controller.js

import { productManagerContract } from "../blockchain/contract.js";
import { User }                   from "../models/index.js";
import { parseUnits, formatUnits } from "ethers";
import { getFlaggedProductIds } from "./Flag.controller.js";

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtProduct = (p) => ({
  id:           Number(p.id),
  sellerAddress:p.sellerAddress,
  imageCID:     p.imageCID,
  name:         p.name,
  category:     p.category,
  pricePerUnit: Number(formatUnits(p.pricePerUnit, 18)),
  stock:        Number(p.stock),
  active:       p.active,
  hasVariants:  p.hasVariants ?? false,
});

const fmtVariant = (v) => ({
  label:        v.label,
  pricePerUnit: Number(formatUnits(v.pricePerUnit, 18)),
  stock:        Number(v.stock),
});

// Fetch variants for a product (returns [] if no variants)
const fetchVariants = async (productId) => {
  try {
    const raw = await productManagerContract.getProductVariants(productId);
    return raw.map(fmtVariant);
  } catch {
    return [];
  }
};

// Attach variants to a list of products
const withVariants = async (products) => {
  return Promise.all(
    products.map(async (p) => {
      if (!p.hasVariants) return p;
      const variants = await fetchVariants(p.id);
      return { ...p, variants };
    })
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products  — all active products
// ─────────────────────────────────────────────────────────────────────────────
export const getAllProducts = async (req, res) => {
  try {
    const data = await productManagerContract.getAllActiveProducts();
    const users = await User.findAll();

    // Get flagged product IDs
    const flaggedIds = await getFlaggedProductIds();

    const products = await withVariants(
      data
        .filter(p => !flaggedIds.includes(Number(p.id))) // ✅ Hide flagged
        .map((p) => {
          const owner = users.find(
            u => u.walletAddress?.toLowerCase() === p.sellerAddress?.toLowerCase()
          );
          return {
            ...fmtProduct(p),
            sellerName: owner ? `${owner.firstName} ${owner.lastName}` : "Unknown",
            ownerAddress: owner?.address ?? "Unknown",
          };
        })
    );

    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/user/:id  — products by seller
// ─────────────────────────────────────────────────────────────────────────────
export const getProductsBySeller = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const raw      = await productManagerContract.getProductsBySeller(user.walletAddress);
    const products = await withVariants(raw.map(fmtProduct));

    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getProductById = async (req, res) => {
  try {
    const raw = await productManagerContract.getProduct(req.params.id);
    if (raw.sellerAddress === "0x0000000000000000000000000000000000000000") {
      return res.status(404).json({ message: "Product not found" });
    }

    const product  = fmtProduct(raw);
    product.productId = product.id; // alias for frontend

    if (product.hasVariants) {
      product.variants = await fetchVariants(product.id);
    }

    res.status(200).json({ product });
    console.log({product})
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/products  — create product
// Body: { name, category, imageCID, pricePerUnit?, stock?, variants? }
// If variants array is provided → calls listProductWithVariants
// ─────────────────────────────────────────────────────────────────────────────
export const createProduct = async (req, res) => {
  try {
    const walletAddress = req.user.walletAddress;
    const { name, category, imageCID, pricePerUnit, stock, variants } = req.body;

    let tx;

    if (variants && variants.length > 0) {
      // ── With variants ──
      const labels = variants.map(v => v.label);
      const prices = variants.map(v => parseUnits(v.pricePerUnit.toString(), 18));
      const stocks = variants.map(v => Number(v.stock));

      tx = await productManagerContract.listProductWithVariants(
        name, imageCID, category, walletAddress,
        labels, prices, stocks
      );
    } else {
      // ── Single price (no variants) ──
      tx = await productManagerContract.listProduct(
        name, imageCID, category,
        parseUnits(pricePerUnit.toString(), 18),
        Number(stock),
        walletAddress
      );
    }

    await tx.wait();

    const raw      = await productManagerContract.getProductsBySeller(walletAddress);
    const products = await withVariants(raw.map(fmtProduct));

    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/products  — update product
// Body: { id, name, category, imageCID, pricePerUnit?, stock?, variants? }
// ─────────────────────────────────────────────────────────────────────────────
export const updateProduct = async (req, res) => {
  try {
    const walletAddress = req.user.walletAddress;
    const { id, name, category, imageCID, pricePerUnit, stock, variants } = req.body;

    let tx;

    if (variants && variants.length > 0) {
      const labels = variants.map(v => v.label);
      const prices = variants.map(v => parseUnits(v.pricePerUnit.toString(), 18));
      const stocks = variants.map(v => Number(v.stock));

      tx = await productManagerContract.updateProductWithVariants(
        id, name, imageCID, category, walletAddress,
        labels, prices, stocks
      );
    } else {
      tx = await productManagerContract.updateProduct(
        id, name, imageCID, category,
        parseUnits(pricePerUnit.toString(), 18),
        Number(stock),
        walletAddress
      );
    }

    await tx.wait();

    const raw      = await productManagerContract.getProductsBySeller(walletAddress);
    const products = await withVariants(raw.map(fmtProduct));

    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/products/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteProduct = async (req, res) => {
  try {
    const walletAddress = req.user.walletAddress;
    const tx = await productManagerContract.deleteProduct(req.params.id, walletAddress);
    await tx.wait();

    const raw      = await productManagerContract.getProductsBySeller(walletAddress);
    const products = await withVariants(raw.map(fmtProduct));

    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};