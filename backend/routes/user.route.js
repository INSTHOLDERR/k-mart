import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
  getAllUsers, deleteUser,
  getMyProfile, updateProfile, uploadProfilePic,
  getAddresses, addAddress, updateAddress, deleteAddress,
  getMyOrders, requestCancelOrder,
  getWallet, rechargeWallet, walletRechargeSuccess,
  getAdminCancelRequests, resolveCancelRequest,
  adminUpdateOrderStatus, adminGetAllOrders,
} from "../controllers/user.controller.js";

const router = express.Router();

// ── Admin ─────────────────────────────────────────────
router.get("/admin/all",                   protectRoute, adminRoute, getAllUsers);
router.delete("/admin/:id",                protectRoute, adminRoute, deleteUser);
router.get("/admin/orders",                protectRoute, adminRoute, adminGetAllOrders);
router.patch("/admin/orders/:id/status",   protectRoute, adminRoute, adminUpdateOrderStatus);
router.get("/admin/cancel-requests",       protectRoute, adminRoute, getAdminCancelRequests);
router.patch("/admin/orders/:id/resolve-cancel", protectRoute, adminRoute, resolveCancelRequest);

// ── Profile ───────────────────────────────────────────
router.get("/me",         protectRoute, getMyProfile);
router.put("/me",         protectRoute, updateProfile);
router.post("/me/avatar", protectRoute, uploadProfilePic);

// ── Addresses ─────────────────────────────────────────
router.get("/me/addresses",              protectRoute, getAddresses);
router.post("/me/addresses",             protectRoute, addAddress);
router.put("/me/addresses/:addrId",      protectRoute, updateAddress);
router.delete("/me/addresses/:addrId",   protectRoute, deleteAddress);

// ── Orders ────────────────────────────────────────────
router.get("/me/orders",                       protectRoute, getMyOrders);
router.patch("/me/orders/:id/cancel-request",  protectRoute, requestCancelOrder);

// ── Wallet ────────────────────────────────────────────
router.get("/me/wallet",                  protectRoute, getWallet);
router.post("/me/wallet/recharge",        protectRoute, rechargeWallet);
router.post("/me/wallet/recharge-success", protectRoute, walletRechargeSuccess);

export default router;
