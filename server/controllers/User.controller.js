import User from "../models/User.model.js";
import { tokenContract } from "../blockchain/contract.js";
import { formatUnits } from "ethers";
import Application from "../models/Application.js";


/* ── PROFILE ─────────────────────────────────────────────────────────────────── */

export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["createdAt", "updatedAt"] },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("[getProfile]", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      middleName,
      lastName,
      email,
      mobileNumber,
      gender,
      dateOfBirth,
      address,
      profileImage, // IPFS CID
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    await user.update({
      firstName:    firstName    || user.firstName,
      middleName:   middleName   ?? user.middleName,
      lastName:     lastName     || user.lastName,
      email:        email        || user.email,
      mobileNumber: mobileNumber || user.mobileNumber,
      gender:       gender       || user.gender,
      dob:          dateOfBirth  || user.dob,
      address:      address      || user.address,
      profileImage: profileImage ?? user.profileImage, // save CID, allow null
    });

    const updated = await User.findByPk(userId);
    res.json({ message: "Profile updated successfully", user: updated });
  } catch (err) {
    console.error("[updateProfile]", err);
    res.status(500).json({ error: err.message });
  }
};

/* ── SELLER STATS ────────────────────────────────────────────────────────────── */

export const getSellerStats = async (req, res) => {
  const walletAddress = req.params.walletAddress;
  try {
    const data = await contract.getSellerStats(walletAddress);
    const stats = {
      totalProducts:    Number(data.totalProducts),
      activeProducts:   Number(data.activeProducts),
      totalOrders:      Number(data.totalOrders),
      activeOrders:     Number(data.activeOrders),
      completedOrders:  Number(data.completedOrders),
      totalRevenue:     Number(data.totalRevenue),
    };
    res.json({ stats });
  } catch (err) {
    res.status(400).json({ message: "Missing walletAddress or Invalid walletAddress" });
  }
};

/* ── USER MANAGEMENT ────────────────────────────────────────────────────────── */

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ order: [["createdAt", "DESC"]] });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    await user.update({ status: newStatus });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["USER", "SELLER", "ADMIN", "LOGISTICS"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await user.update({ role });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ── APPLICATIONS ────────────────────────────────────────────────────────────── */

export const submitApplication = async (req, res) => {
  try {
    const { roleApplying } = req.body;
    if (!["SELLER", "LOGISTICS"].includes(roleApplying)) {
      return res.status(400).json({ error: "roleApplying must be SELLER or LOGISTICS" });
    }
    const existing = await Application.findOne({
      where: { userId: req.user.id, status: "PENDING" },
    });
    if (existing) {
      return res.status(409).json({ error: "You already have a pending application." });
    }
    const user = await User.findByPk(req.user.id);
    if (user.role === roleApplying) {
      return res.status(409).json({ error: `You are already a ${roleApplying}.` });
    }
    const application = await Application.create({ userId: req.user.id, roleApplying });
    res.status(201).json({ application });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const applications = await Application.findAll({
      where,
      order: [["createdAt", "DESC"]],
      include: [{
        model: User,
        attributes: ["id", "firstName", "lastName", "email", "walletAddress", "role"],
      }],
    });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const reviewApplication = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "status must be APPROVED or REJECTED" });
    }
    const application = await Application.findByPk(req.params.id, {
      include: [{ model: User }],
    });
    if (!application) return res.status(404).json({ error: "Application not found" });
    if (application.status !== "PENDING") {
      return res.status(409).json({ error: "Application already reviewed" });
    }
    await application.update({
      status,
      adminNotes: adminNotes || null,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    });
    if (status === "APPROVED") {
      await application.User.update({ role: application.roleApplying });
    }
    res.json({ application });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};