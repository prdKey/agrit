// controllers/Order.controller.js

import { orderManagerContract } from "../blockchain/contract.js";
import { formatUnits }          from "ethers";
import { User, OrderAddress, Dispute } from "../models/index.js";
import { createNotification }   from "./Notification.controller.js";
import {
  emitOrderStatus,
  emitTrackingStart,
  emitTrackingStop,
} from "../config/socket.js";

// ── Format order from contract ───────────────────────────────────────────────
const formatOrder = (o) => ({
  id:                Number(o.id),
  buyerAddress:      o.buyerAddress,
  sellerAddress:     o.sellerAddress,
  logisticsAddress:  o.logisticsAddress,
  status:            Number(o.status),
  location:          o.location,
  totalProductPrice: formatUnits(o.totalProductPrice, 18),
  totalPrice:        formatUnits(o.totalPrice,        18),
  platformFee:       formatUnits(o.platformFee,       18),
  logisticsFee:      formatUnits(o.logisticsFee,      18),
  createdAt:         Number(o.createdAt),
  confirmAt:         Number(o.confirmAt),
  pickedUpAt:        Number(o.pickedUpAt),
  outForDeliveryAt:  Number(o.outForDeliveryAt),
  deliveredAt:       Number(o.deliveredAt),
  completedAt:       Number(o.completedAt),
  cancelledAt:       Number(o.cancelledAt),
});

// ── Format line items from contract ─────────────────────────────────────────
const formatLineItems = (items) => items.map(i => ({
  productId:    Number(i.productId),
  quantity:     Number(i.quantity),
  productPrice: formatUnits(i.productPrice, 18),
  pricePerUnit: formatUnits(i.pricePerUnit, 18),
  name:         i.name,
  category:     i.category,
  imageCID:     i.imageCID,
  hasVariant:   i.hasVariant,
  variantIndex: Number(i.variantIndex),
  variantLabel: i.variantLabel ?? null,
}));

// ── Enrich orders with user info + delivery address ──────────────────────────
const enrichOrders = async (data) => {
  const users     = await User.findAll();
  const orderIds  = data.map(o => Number(o.id));
  const addresses = await OrderAddress.findAll({ where: { orderId: orderIds } });

  // Fetch ALL disputes for these orders in one query
  const disputes  = await Dispute.findAll({ where: { orderId: orderIds } });

  return Promise.all(data.map(async (o) => {
    const seller    = users.find(u => u.walletAddress?.toLowerCase() === o.sellerAddress?.toLowerCase());
    const buyer     = users.find(u => u.walletAddress?.toLowerCase() === o.buyerAddress?.toLowerCase());
    const logistics = users.find(u => u.walletAddress?.toLowerCase() === o.logisticsAddress?.toLowerCase());
    const addr      = addresses.find(a => a.orderId === Number(o.id));
    const dispute   = disputes.find(d => d.orderId === Number(o.id)) || null;

    const rawItems  = await orderManagerContract.getOrderLineItems(o.id);
    const lineItems = formatLineItems(rawItems);

    return {
      ...formatOrder(o),
      sellerName:        seller    ? `${seller.firstName} ${seller.lastName}`       : "Unknown",
      sellerLocation:    seller?.address || null,
      sellerMobile:      seller?.mobileNumber || null,
      buyerName:         buyer     ? `${buyer.firstName} ${buyer.lastName}`         : "Unknown",
      buyerLocation:     addr?.fullAddress || null,
      buyerMobile:       buyer?.mobileNumber || null,
      logisticsName:     logistics ? `${logistics.firstName} ${logistics.lastName}` : null,
      logisticsMobile:   logistics?.mobileNumber || null,
      logisticsLocation: o.location || null,
      deliveryAddress:   addr ? {
        name:        addr.name,
        phone:       addr.phone,
        fullAddress: addr.fullAddress,
        houseNumber: addr.houseNumber,
        street:      addr.street,
        barangay:    addr.barangay,
        city:        addr.city,
        zipCode:     addr.zipCode,
      } : null,
      lineItems,
      // Always include dispute field — null if no dispute exists
      dispute: dispute ? {
        id:           dispute.id,
        openedByRole: dispute.openedByRole,
        reason:       dispute.reason,
        adminNotes:   dispute.adminNotes,
        status:       dispute.status,
        resolution:   dispute.resolution,
        resolvedAt:   dispute.resolvedAt,
      } : null,
    };
  }));
};

// ── Helper: parse orderId from OrderCreated event ────────────────────────────
const parseOrderIdFromReceipt = async (receipt) => {
  for (const log of receipt.logs) {
    try {
      const parsed = orderManagerContract.interface.parseLog(log);
      if (parsed?.name === "OrderCreated") return parsed.args.orderId?.toString();
    } catch (_) {}
  }
  const count = await orderManagerContract.orderCount();
  return count.toString();
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/checkout
// ─────────────────────────────────────────────────────────────────────────────
export const checkout = async (req, res) => {
  try {
    const buyerAddress               = req.user.walletAddress;
    const { items, deliveryAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array is required" });
    }

    const orderItems = items.map(i => ({
      productId:    i.productId,
      quantity:     i.quantity,
      hasVariant:   Boolean(i.hasVariant),
      variantIndex: i.hasVariant ? Number(i.variantIndex) : 0,
    }));

    const tx      = await orderManagerContract.placeOrder(orderItems, buyerAddress);
    const receipt = await tx.wait();
    const orderId = await parseOrderIdFromReceipt(receipt);

    if (orderId && deliveryAddress) {
      await OrderAddress.create({
        orderId:     Number(orderId),
        addressId:   deliveryAddress.addressId || null,
        name:        deliveryAddress.name,
        phone:       deliveryAddress.phone,
        fullAddress: deliveryAddress.fullAddress,
        houseNumber: deliveryAddress.houseNumber || null,
        street:      deliveryAddress.street      || null,
        barangay:    deliveryAddress.barangay,
        city:        deliveryAddress.city,
        zipCode:     deliveryAddress.zipCode     || null,
      });
    }

    const order     = await orderManagerContract.getOrderById(orderId);
    const rawItems2 = await orderManagerContract.getOrderLineItems(orderId);
    const itemNames = rawItems2.map(i =>
      i.hasVariant && i.variantLabel ? `${i.name} (${i.variantLabel})` : i.name
    ).join(", ");

    await createNotification(order.sellerAddress, {
      type:    "ORDER",
      title:   "New Order Received!",
      message: `You have a new order #${orderId}: ${itemNames}. Please confirm shipment.`,
      orderId: Number(orderId),
    });

    res.json({ message: "Order created successfully", orderId, txHash: tx.hash });
  } catch (err) {
    console.error("[checkout]", err);
    res.status(500).json({ error: err.reason || err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ORDER LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────
export const confirmShipment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const tx = await orderManagerContract.confirmShipment(orderId, req.user.walletAddress);
    await tx.wait();

    const order     = await orderManagerContract.getOrderById(orderId);
    const rawItems  = await orderManagerContract.getOrderLineItems(orderId);
    const itemNames = rawItems.map(i =>
      i.hasVariant && i.variantLabel ? `${i.name} (${i.variantLabel})` : i.name
    ).join(", ");

    await createNotification(order.buyerAddress, {
      type:    "ORDER",
      title:   "Order Shipped!",
      message: `Your order #${orderId} (${itemNames}) has been shipped and is waiting for logistics pickup.`,
      orderId: Number(orderId),
    });

    emitOrderStatus(orderId, 2); // Shipped

    res.json({ message: "Shipment confirmed", txHash: tx.hash });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

export const markOutForDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;
    const tx = await orderManagerContract.markOutForDelivery(orderId, req.user.walletAddress);
    await tx.wait();

    const order = await orderManagerContract.getOrderById(orderId);
    await createNotification(order.buyerAddress, {
      type:    "DELIVERY",
      title:   "Out for Delivery!",
      message: `Your order #${orderId} is now out for delivery!`,
      orderId: Number(orderId),
    });

    emitOrderStatus(orderId, 4); // OutForDelivery

    res.json({ message: "Marked out for delivery", txHash: tx.hash });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

// ── pickupOrder — starts live tracking ───────────────────────────────────────
export const pickupOrder = async (req, res) => {
  try {
    const { orderId, location } = req.body;
    const tx = await orderManagerContract.pickupOrder(orderId, req.user.walletAddress, location);
    await tx.wait();

    const order = await orderManagerContract.getOrderById(orderId);
    await createNotification(order.buyerAddress, {
      type:    "DELIVERY",
      title:   "Order Picked Up",
      message: `Your order #${orderId} has been picked up and is on its way!`,
      orderId: Number(orderId),
    });

    emitOrderStatus(orderId, 3);  // PickedUp
    emitTrackingStart(orderId);   // → MapTracker shows live marker

    res.json({ message: "Order picked up", txHash: tx.hash });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

// ── confirmDelivery — stops live tracking ────────────────────────────────────
export const confirmDelivery = async (req, res) => {
  try {
    const { orderId, location } = req.body;
    const tx = await orderManagerContract.confirmDeliveryByLogistics(orderId, location, req.user.walletAddress);
    await tx.wait();

    const order = await orderManagerContract.getOrderById(orderId);
    await createNotification(order.buyerAddress, {
      type:    "SUCCESS",
      title:   "Order Delivered!",
      message: `Your order #${orderId} has been delivered. Please confirm receipt to release payment.`,
      orderId: Number(orderId),
    });

    emitOrderStatus(orderId, 5);  // Delivered
    emitTrackingStop(orderId);    // → MapTracker hides live marker

    res.json({ message: "Delivery confirmed", txHash: tx.hash });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

export const confirmReceipt = async (req, res) => {
  try {
    const { orderId } = req.body;
    const tx = await orderManagerContract.confirmReceipt(orderId, req.user.walletAddress);
    await tx.wait();

    const order = await orderManagerContract.getOrderById(orderId);
    await createNotification(order.sellerAddress, {
      type:    "SUCCESS",
      title:   "Payment Released!",
      message: `Order #${orderId} completed. ${formatUnits(order.totalProductPrice, 18)} AGT released to your wallet.`,
      orderId: Number(orderId),
    });
    await createNotification(order.buyerAddress, {
      type:    "SUCCESS",
      title:   "Order Completed!",
      message: `Your order #${orderId} is complete. Don't forget to rate the products!`,
      orderId: Number(orderId),
    });

    emitOrderStatus(orderId, 6); // Completed

    res.json({ message: "Order completed", txHash: tx.hash });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

export const cancelOrderBySeller = async (req, res) => {
  try {
    const { orderId } = req.body;
    const tx = await orderManagerContract.cancelOrderBySeller(orderId, req.user.walletAddress);
    await tx.wait();

    const order = await orderManagerContract.getOrderById(orderId);
    await createNotification(order.buyerAddress, {
      type:    "ALERT",
      title:   "Order Cancelled by Seller",
      message: `Order #${orderId} cancelled. Full refund of ${formatUnits(order.totalPrice, 18)} AGT returned.`,
      orderId: Number(orderId),
    });

    emitOrderStatus(orderId, 9); // CancelledBySeller

    res.json({ message: "Order cancelled", txHash: tx.hash });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

export const cancelOrderByBuyer = async (req, res) => {
  try {
    const { orderId } = req.body;
    const tx = await orderManagerContract.cancelOrderByBuyer(orderId, req.user.walletAddress);
    await tx.wait();

    const order = await orderManagerContract.getOrderById(orderId);
    await createNotification(order.sellerAddress, {
      type:    "ALERT",
      title:   "Order Cancelled by Buyer",
      message: `Order #${orderId} cancelled by buyer. Stock restored.`,
      orderId: Number(orderId),
    });

    emitOrderStatus(orderId, 10); // CancelledByBuyer

    res.json({ message: "Order cancelled", txHash: tx.hash });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// DISPUTES
// ─────────────────────────────────────────────────────────────────────────────

export const openDispute = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const senderAddress = req.user.walletAddress;

    const tx = await orderManagerContract.openDispute(orderId, senderAddress);
    await tx.wait();

    const order   = await orderManagerContract.getOrderById(orderId);
    const isBuyer = senderAddress.toLowerCase() === order.buyerAddress.toLowerCase();

    // ── Find the DB user who opened the dispute ──────────────────────────────
    const opener = await User.findOne({ where: { walletAddress: senderAddress } });
    if (!opener) return res.status(404).json({ error: "User not found" });

    // ── Save dispute record to DB ────────────────────────────────────────────
    await Dispute.create({
      orderId:      Number(orderId),
      openedById:   opener.id,
      openedByRole: isBuyer ? "BUYER" : "SELLER",
      reason:       reason || null,
      status:       "OPEN",
    });
    await createNotification(isBuyer ? order.sellerAddress : order.buyerAddress, {
      type:    "ALERT",
      title:   "Dispute Opened",
      message: `A dispute has been opened for Order #${orderId}. Admin will review. Funds remain in escrow.`,
      orderId: Number(orderId),
    });

    emitOrderStatus(orderId, 7); // Disputed

    res.json({ message: "Dispute opened", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.reason || err.message }); 
  }
};

export const resolveDispute = async (req, res) => {
  try {
    const { orderId, refundBuyer, adminNotes } = req.body;

    const tx = await orderManagerContract.resolveDispute(orderId, refundBuyer);
    await tx.wait();

    // ── Update dispute record in DB ──────────────────────────────────────────
    await Dispute.update(
      {
        status:     "RESOLVED",
        resolution: refundBuyer ? "REFUND_BUYER" : "RULE_FOR_SELLER",
        adminNotes: adminNotes || null,
        resolvedAt: new Date(),
      },
      { where: { orderId: Number(orderId) } }
    );

    const order = await orderManagerContract.getOrderById(orderId);

    if (refundBuyer) {
      await createNotification(order.buyerAddress, {
        type:    "SUCCESS",
        title:   "Dispute Resolved — Refunded",
        message: `Dispute for Order #${orderId} resolved. ${formatUnits(order.totalPrice, 18)} AGT refunded.`,
        orderId: Number(orderId),
      });
      await createNotification(order.sellerAddress, {
        type:    "ALERT",
        title:   "Dispute Resolved",
        message: `Dispute for Order #${orderId} resolved. Buyer was refunded.`,
        orderId: Number(orderId),
      });
      emitOrderStatus(orderId, 8); // Refunded
    } else {
      await createNotification(order.sellerAddress, {
        type:    "SUCCESS",
        title:   "Dispute Resolved — Payment Released",
        message: `Dispute for Order #${orderId} resolved. ${formatUnits(order.totalProductPrice, 18)} AGT released.`,
        orderId: Number(orderId),
      });
      await createNotification(order.buyerAddress, {
        type:    "ALERT",
        title:   "Dispute Resolved",
        message: `Dispute for Order #${orderId} resolved. Payment released to seller.`,
        orderId: Number(orderId),
      });
      emitOrderStatus(orderId, 6); // Completed
    }

    res.json({ message: "Dispute resolved", txHash: tx.hash });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export const getOrderById = async (req, res) => {
  try {
    const data    = await orderManagerContract.getOrderById(req.params.orderId);
    const [order] = await enrichOrders([data]);
    res.json({ order });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

export const getOrdersBySeller = async (req, res) => {
  try {
    const data   = await orderManagerContract.getOrdersBySeller(req.user.walletAddress);
    const orders = await enrichOrders(data);
    res.json({ orders });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

export const getOrdersByBuyer = async (req, res) => {
  try {
    const data   = await orderManagerContract.getOrdersByBuyer(req.user.walletAddress);
    const orders = await enrichOrders(data);
    res.json({ orders });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

export const getAvailableOrders = async (req, res) => {
  try {
    const data   = await orderManagerContract.getAvailableOrders();
    const orders = await enrichOrders(data);
    res.json({ orders });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

export const getAllOrders = async (req, res) => {
  try {
    const data   = await orderManagerContract.getAllOrders();
    const orders = await enrichOrders(data);
    res.json({ orders });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

export const getOrdersByLogistics = async (req, res) => {
  try {
    const data   = await orderManagerContract.getOrdersByLogistics(req.user.walletAddress);
    const orders = await enrichOrders(data);
    res.json({ orders });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

export const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const tx = await orderManagerContract.acceptOrder(orderId, req.user.walletAddress);
    await tx.wait();
    res.json({ message: "Order accepted", txHash: tx.hash });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

export const getDisputedOrders = async (req, res) => {
  try {
    const all      = await orderManagerContract.getAllOrders();
    const disputed = all.filter(o => Number(o.status) === 7);
    const orders   = await enrichOrders(disputed);
    res.json({ orders });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

export const updateOrderLocation = async (req, res) => {
  try {
    const { orderId, location } = req.body;
    const tx = await orderManagerContract.updateLocation(orderId, location, req.user.walletAddress);
    await tx.wait();
    res.json({ message: "Location updated", txHash: tx.hash });
  } catch (err) { res.status(500).json({ error: err.reason || err.message }); }
};

export const getOrderAddress = async (req, res) => {
  try {
    const address = await OrderAddress.findOne({ where: { orderId: Number(req.params.orderId) } });
    if (!address) return res.status(404).json({ error: "Delivery address not found" });
    res.json({ address });
  } catch (err) { res.status(500).json({ error: err.message }); }
};