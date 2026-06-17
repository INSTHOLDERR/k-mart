import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createCheckoutSession, checkoutSuccess, createCODOrder, createWalletOrder } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.post("/checkout-success",        protectRoute, checkoutSuccess);
router.post("/cod-order",               protectRoute, createCODOrder);
router.post("/wallet-order",            protectRoute, createWalletOrder);

export default router;
