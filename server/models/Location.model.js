import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const OrderLocation = sequelize.define(
  "OrderLocation",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    },  

    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    }

  },
  {
    tableName: "order_locations",
    timestamps: true
  }
);

export default OrderLocation;
