import express from "express"
import {
    getAllProducts,
    getProductsBySeller,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/Product.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
const router = express.Router();

//private routes
router.post("/", authMiddleware, createProduct);
router.put("/", authMiddleware, updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);

//public routes
router.get("/", getAllProducts);
router.get("/user/:id",getProductsBySeller);
router.get("/:id", getProductById);

export default router;