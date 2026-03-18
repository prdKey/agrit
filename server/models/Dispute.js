import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Dispute = sequelize.define(
  "Dispute",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Which order this dispute is for
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Who opened the dispute (buyer or seller)
    openedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },

    // Role of who opened it
    openedByRole: {
      type: DataTypes.ENUM("BUYER", "SELLER"),
      allowNull: false,
    },

    // Reason for opening the dispute
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Admin notes when resolving
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Who resolved it (admin)
    resolvedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },

    // Resolution outcome
    resolution: {
      type: DataTypes.ENUM("REFUND_BUYER", "RULE_FOR_SELLER"),
      allowNull: true,
    },

    // Current status of the dispute
    status: {
      type: DataTypes.ENUM("OPEN", "RESOLVED"),
      allowNull: false,
      defaultValue: "OPEN",
    },

    // When it was resolved
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "disputes",
    timestamps: true,
  }
);

export default Dispute;