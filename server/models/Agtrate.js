// models/AgtRate.model.js

import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";

const AgtRate = sequelize.define(
  "AgtRate",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ratePhp: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 1.0,
      field: "rate_php",
      comment: "1 AGT = ratePhp PHP",
    },
    setBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "set_by",
      comment: "userId of admin who set the rate",
    },
  },
  {
    tableName: "agt_rate",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default AgtRate ;