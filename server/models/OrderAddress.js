import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const OrderAddress = sequelize.define("OrderAddress", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "References the on-chain order ID from OrderManager contract",
  },
  addressId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Original address ID (nullable — address may be deleted later)",
  },
  // Snapshot of address at time of order — won't change even if user edits address
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  houseNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  street: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  barangay: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: "OrderAddresses",
  timestamps: true,
});

export default OrderAddress;