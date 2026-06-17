import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { getCoupon, validateCoupon } from "../controllers/coupon.controller.js";
import {
	getAllCoupons,
	createCoupon,
	toggleCoupon,
	deleteCoupon,
	getCouponAnalytics,
} from "../controllers/coupon.admin.controller.js";

const router = express.Router();

// ── User-facing routes ────────────────────────────────────────────────────────
router.get("/", protectRoute, getCoupon);
router.post("/validate", protectRoute, validateCoupon);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get("/admin/all", protectRoute, adminRoute, getAllCoupons);
router.get("/admin/analytics", protectRoute, adminRoute, getCouponAnalytics);
router.post("/admin/create", protectRoute, adminRoute, createCoupon);
router.patch("/admin/:id/toggle", protectRoute, adminRoute, toggleCoupon);
router.delete("/admin/:id", protectRoute, adminRoute, deleteCoupon);

export default router;