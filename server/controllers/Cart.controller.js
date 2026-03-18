import Cart from "../models/Cart.js";
import { Op } from "sequelize";

/* GET /api/carts — get all cart items of logged-in user */
export const getCart = async (req, res) => {
  try {
    const items = await Cart.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Helper: build correct WHERE clause for variantIndex ──────────────────────
// SQL "WHERE variantIndex = NULL" never matches any row — must use IS NULL.
const variantWhere = (variantIndex) => {
  const parsed =
    variantIndex !== undefined && variantIndex !== null && variantIndex !== ""
      ? Number(variantIndex)
      : null;

  return {
    parsed,
    where: parsed === null
      ? { variantIndex: { [Op.is]: null } }
      : { variantIndex: parsed },
  };
};

/* POST /api/carts — add item or increment quantity if already in cart */
export const addToCart = async (req, res) => {
  try {
    const {
      productId,
      quantity = 1,
      name,
      pricePerUnit,
      imageCID,
      category,
      stock,
      sellerAddress = null,   // FIX: accept and persist sellerAddress
      variantIndex,
      variantLabel = null,
    } = req.body;
    if (!productId || !name || pricePerUnit == null) {
      return res
        .status(400)
        .json({ error: "productId, name, and pricePerUnit are required" });
    }

    const { parsed: parsedVariantIndex, where: vWhere } = variantWhere(variantIndex);

    // Find existing row for this exact product + variant combo
    const existing = await Cart.findOne({
      where: { userId: req.user.id, productId, ...vWhere },
    });

    if (existing) {
      // Already in cart — increment (cap at stock)
      const newQty = Math.min(existing.quantity + quantity, stock ?? existing.stock);
      await existing.update({
        quantity: newQty,
        stock: stock ?? existing.stock,
        pricePerUnit,
        variantLabel: variantLabel ?? existing.variantLabel,
        // FIX: update sellerAddress in case it was missing on an old row
        sellerAddress: sellerAddress ?? existing.sellerAddress,
      });
      return res.status(200).json({ item: existing, created: false });
    }

    // New row
    const item = await Cart.create({
      userId: req.user.id,
      productId,
      quantity,
      name,
      pricePerUnit,
      imageCID,
      category,
      stock,
      sellerAddress: sellerAddress ?? null,   // FIX: store sellerAddress
      variantIndex: parsedVariantIndex,
      variantLabel: variantLabel ?? null,
    });

    return res.status(201).json({ item, created: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* PUT /api/carts/:id — update quantity (uses cart row id, not productId) */
export const updateCartItem = async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);

    console.log("[updateCartItem] params.id:", req.params.id, "quantity:", quantity, "userId:", req.user.id);

    if (isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    const item = await Cart.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    console.log("[updateCartItem] found item:", item ? item.id : null);

    if (!item) return res.status(404).json({ error: "Cart item not found" });

    const capped = Math.min(quantity, item.stock);
    await item.update({ quantity: capped });
    res.json({ item });
  } catch (err) {
    console.error("[updateCartItem] ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/* DELETE /api/carts/:id — remove single item (uses cart row id, not productId) */
export const removeCartItem = async (req, res) => {
  try {
    const deleted = await Cart.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!deleted) return res.status(404).json({ error: "Cart item not found" });
    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DELETE /api/carts/clear — clear entire cart */
export const clearCart = async (req, res) => {
  try {
    await Cart.destroy({ where: { userId: req.user.id } });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DELETE /api/carts/bulk — remove selected items (after checkout) */
export const removeBulkCartItems = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "productIds array is required" });
    }

    const isObjectFormat = typeof productIds[0] === "object";

    if (isObjectFormat) {
      // New format: [{ productId, variantIndex }, ...]
      for (const { productId, variantIndex } of productIds) {
        const { where: vWhere } = variantWhere(variantIndex);
        await Cart.destroy({
          where: { userId: req.user.id, productId, ...vWhere },
        });
      }
    } else {
      // Legacy format: [1, 2, 3, ...]
      await Cart.destroy({
        where: { userId: req.user.id, productId: { [Op.in]: productIds } },
      });
    }

    res.json({ message: "Items removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};