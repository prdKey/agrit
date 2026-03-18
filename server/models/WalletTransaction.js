// models/wallet.model.js

import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import { Wallet } from "ethers";

// ─────────────────────────────────────────────────────────────────────────────
// WalletTransaction
// ─────────────────────────────────────────────────────────────────────────────
const WalletTransaction = sequelize.define(
  "WalletTransaction",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    walletAddress: {
      type: DataTypes.STRING(42),
      allowNull: false,
      field: "wallet_address",
    },
    type: {
      type: DataTypes.ENUM("DEPOSIT", "WITHDRAW"),
      allowNull: false,
    },
    amountAgt: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      field: "amount_agt",
    },
    amountPhp: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "amount_php",
    },
    gcashNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "gcash_number",
    },
    gcashName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "gcash_name",
    },
    referenceNo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "reference_no",
    },
    status: {
      type: DataTypes.ENUM("PENDING", "COMPLETED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    txHash: {
      type: DataTypes.STRING(66),
      allowNull: true,
      field: "tx_hash",
    },
    adminNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "admin_note",
    },
  },
  {
    tableName: "wallet_transactions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);



export default WalletTransaction;