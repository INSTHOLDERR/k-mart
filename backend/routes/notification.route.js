import express from "express";
import {
  getUserNotifications, getAdminNotifications,
  markAsRead, deleteNotification,
} from "../controllers/notification.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",          protectRoute, getUserNotifications);
router.get("/admin",     protectRoute, adminRoute, getAdminNotifications);
router.patch("/read",    protectRoute, markAsRead);
router.delete("/:id",   protectRoute, deleteNotification);

export default router;
