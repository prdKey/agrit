import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    middleName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },

    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    address: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },

    gender: {
      type: DataTypes.ENUM("Male", "Female", "Other"),
      allowNull: false,
    },

    dob: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    walletAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "walletAddress_unique",
    },

    role: {
      type: DataTypes.ENUM("USER", "SELLER", "ADMIN", "LOGISTICS"),
      allowNull: false,
      defaultValue: "USER",
    },

    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "SUSPENDED"),
      defaultValue: "ACTIVE",
    },

    // ── Profile image stored as IPFS CID ─────────────────────────────────────
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

export default User;