import Notification from "../models/notification.model.js";

export const getUserNotifications = async (req, res) => {
  try {
    const notes = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("productId", "name image")
      .lean();
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ notifications: notes, unreadCount });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getAdminNotifications = async (req, res) => {
  try {
    const notes = await Notification.find({ isAdminNotification: true })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("productId", "name image")
      .populate("orderId", "_id totalAmount")
      .lean();
    const unreadCount = await Notification.countDocuments({ isAdminNotification: true, isRead: false });
    res.json({ notifications: notes, unreadCount });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { ids } = req.body;
    if (ids === "all") {
    
      if (req.user.role === "admin") {
        await Notification.updateMany({ isAdminNotification: true, isRead: false }, { isRead: true });
      } else {
        await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
      }
    } else if (Array.isArray(ids) && ids.length) {
      await Notification.updateMany({ _id: { $in: ids } }, { isRead: true });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
