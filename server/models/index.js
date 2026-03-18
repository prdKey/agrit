// models/index.js

import sequelize    from "../config/database.js";
import User         from "./User.model.js";
import Address      from "./Address.js";
import Cart         from "./Cart.js";
import Application  from "./Application.js";
import OrderAddress from "./OrderAddress.js";
import Rating       from "./Rating.js";
import Notification from "./Notification.js";
import WalletTransaction from "./WalletTransaction.js";
import AgtRate      from "./Agtrate.js";
import ProductFlag from "./ProductFlag.js";
import ProductAppeal from "./ProductAppeal.js";
import Dispute from "./Dispute.js";

ProductFlag.hasMany(ProductAppeal, { foreignKey: "flagId" });
ProductAppeal.belongsTo(ProductFlag, { foreignKey: "flagId" });

Dispute.belongsTo(User, { as: "openedBy",   foreignKey: "openedById"   });
Dispute.belongsTo(User, { as: "resolvedBy", foreignKey: "resolvedById" });

User.hasMany(Address,       { foreignKey: "userId", onDelete: "CASCADE", sourceKey: "id" });
Address.belongsTo(User,     { foreignKey: "userId", targetKey: "id", constraints: false });

User.hasMany(Cart,          { foreignKey: "userId", onDelete: "CASCADE", sourceKey: "id" });
Cart.belongsTo(User,        { foreignKey: "userId", targetKey: "id", constraints: false });

User.hasMany(Application,   { foreignKey: "userId", onDelete: "CASCADE", sourceKey: "id" });
Application.belongsTo(User, { foreignKey: "userId", targetKey: "id", constraints: false });

User.hasMany(Notification,  { foreignKey: "userId", onDelete: "CASCADE", sourceKey: "id" });
Notification.belongsTo(User,{ foreignKey: "userId", targetKey: "id", constraints: false });

// ← added
User.hasMany(WalletTransaction,        { foreignKey: "userId", onDelete: "CASCADE", sourceKey: "id" });
WalletTransaction.belongsTo(User,      { foreignKey: "userId", targetKey: "id", constraints: false });

// OrderAddress has no FK constraint to orders table (orders are on-chain)
// orderId references the blockchain order ID, not a DB table

export {
  sequelize,
  User,
  Address,
  Cart,
  Application,
  OrderAddress,
  Rating,
  Notification,
  WalletTransaction,   // ← added
  AgtRate,
  ProductFlag,
  ProductAppeal,
  Dispute  // ← added
};