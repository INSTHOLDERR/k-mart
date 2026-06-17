import express from "express";
import {
  createProduct, updateProduct, deleteProduct,
  getAllProducts, getFeaturedProducts,
  getProductsByCategory, getRecommendedProducts,
  toggleFeaturedProduct, checkStock,
} from "../controllers/product.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",               protectRoute, adminRoute, getAllProducts);
router.get("/featured",       getFeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/recommendations",    getRecommendedProducts);
router.post("/",              protectRoute, adminRoute, createProduct);
router.put("/:id",            protectRoute, adminRoute, updateProduct);
router.patch("/:id",          protectRoute, adminRoute, toggleFeaturedProduct);
router.delete("/:id",         protectRoute, adminRoute, deleteProduct);
router.post("/check-stock",   protectRoute, checkStock);

export default router;
