// models/ProductFlag.js
import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";

const ProductFlag = sequelize.define("ProductFlag", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("FLAGGED", "UNDER_REVIEW", "RESTORED", "PERMANENTLY_HIDDEN"),
    defaultValue: "FLAGGED",
  },
});

export default ProductFlag;