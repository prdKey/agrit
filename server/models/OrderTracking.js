import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const OrderTracking = sequelize.define("OrderTracking", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // one tracking record per order
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    defaultValue: null,
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    defaultValue: null,
  },
  isTracking: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: "OrderTrackings",
  timestamps: true,
});

export default OrderTracking;