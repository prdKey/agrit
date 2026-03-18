import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Cart = sequelize.define("Cart", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1 },
  },
  // Snapshot fields — stored so cart shows correct info even if product changes
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pricePerUnit: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
  },
  imageCID: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  // FIX: Added sellerAddress so CheckoutPage can group items by seller
  // and satisfy the contract's BatchSellerMismatch guard.
  sellerAddress: {
    type: DataTypes.STRING,
    allowNull: true,   // nullable for backward-compat with existing rows
    defaultValue: null,
  },
  // Variant fields — null for non-variant products
  variantIndex: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  variantLabel: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: "Carts",
  timestamps: true,
});

export default Cart;