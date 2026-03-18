import express from "express";
import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from "../controllers/Address.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
 
const router = express.Router();
 
router.get("/",           authMiddleware, getAddresses);
router.get("/:id",        authMiddleware, getAddressById);
router.post("/",          authMiddleware, createAddress);
router.put("/:id",        authMiddleware, updateAddress);
router.patch("/:id/default", authMiddleware, setDefaultAddress);
router.delete("/:id",     authMiddleware, deleteAddress);
 
export default router;