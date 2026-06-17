import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/notifications");
      set({ notifications: res.data.notifications, unreadCount: res.data.unreadCount, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchAdminNotifications: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/notifications/admin");
      set({ notifications: res.data.notifications, unreadCount: res.data.unreadCount, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  markAllRead: async (isAdmin = false) => {
    try {
      await axios.patch("/notifications/read", { ids: "all" });
      set(s => ({ notifications: s.notifications.map(n => ({ ...n, isRead: true })), unreadCount: 0 }));
    } catch {}
  },

  markRead: async (ids) => {
    try {
      await axios.patch("/notifications/read", { ids });
      set(s => ({
        notifications: s.notifications.map(n => ids.includes(n._id) ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, s.unreadCount - ids.length),
      }));
    } catch {}
  },

  deleteNotification: async (id) => {
    try {
      await axios.delete(`/notifications/${id}`);
      set(s => ({
        notifications: s.notifications.filter(n => n._id !== id),
        unreadCount: s.notifications.find(n => n._id === id && !n.isRead) ? s.unreadCount - 1 : s.unreadCount,
      }));
    } catch {}
  },
}));
