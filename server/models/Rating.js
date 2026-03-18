import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Rating = sequelize.define("Rating", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // one rating per order only
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  buyerAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: "Ratings",
  timestamps: true,
});

export default Rating;