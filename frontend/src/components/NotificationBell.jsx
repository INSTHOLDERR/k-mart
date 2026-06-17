import { Bell, X, CheckCheck, Trash2, Package, AlertTriangle, ShoppingCart, CheckCircle, Tag, Info } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "../stores/useNotificationStore";
import { useUserStore } from "../stores/useUserStore";
import { Link } from "react-router-dom";

const TYPE_CONFIG = {
  out_of_stock:    { icon: AlertTriangle, color: "#dc2626", bg: "#fef2f2" },
  low_stock:       { icon: AlertTriangle, color: "#ca8a04", bg: "#fefce8" },
  back_in_stock:   { icon: Package,       color: "#16a34a", bg: "#f0fdf4" },
  stock_updated:   { icon: Package,       color: "#2563eb", bg: "#eff6ff" },
  order_placed:    { icon: ShoppingCart,  color: "#16a34a", bg: "#f0fdf4" },
  order_status:    { icon: CheckCircle,   color: "#2563eb", bg: "#eff6ff" },
  payment_failed:  { icon: AlertTriangle, color: "#dc2626", bg: "#fef2f2" },
  cart_item_oos:   { icon: AlertTriangle, color: "#ca8a04", bg: "#fefce8" },
  product_deleted: { icon: Trash2,        color: "#dc2626", bg: "#fef2f2" },
  product_edited:  { icon: Package,       color: "#7c3aed", bg: "#f5f3ff" },
  category_deleted:{ icon: Tag,           color: "#dc2626", bg: "#fef2f2" },
  general:         { icon: Info,          color: "#6b7280", bg: "#f9fafb" },
};

function timeAgo(date) {
  const d = new Date(date);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell({ isAdmin = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { notifications, unreadCount, fetchNotifications, fetchAdminNotifications, markAllRead, markRead, deleteNotification } = useNotificationStore();

  useEffect(() => {
    if (isAdmin) fetchAdminNotifications();
    else fetchNotifications();

    // Poll every 30s
    const interval = setInterval(() => {
      if (isAdmin) fetchAdminNotifications();
      else fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
    // Mark unread as read when opened
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
    if (unreadIds.length && !open) markRead(unreadIds);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-gray-100"
        style={{ background: open ? "var(--blue-pale)" : "var(--bg-2)" }}>
        <Bell className="w-4 h-4" style={{ color: open ? "var(--blue)" : "var(--ink-3)" }}/>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center"
            style={{ background: "var(--red)", zIndex: 1 }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-11 w-96 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            style={{ background: "#fff", border: "1px solid var(--border)", maxHeight: "500px" }}
            initial={{ opacity: 0, y: -8, scale: .97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: .97 }}
            transition={{ duration: .15 }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--ink)" }}>Notifications</p>
                {unreadCount > 0 && <p className="text-xs" style={{ color: "var(--ink-4)" }}>{unreadCount} unread</p>}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={() => markAllRead(isAdmin)}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors hover:bg-gray-50"
                    style={{ color: "var(--blue)" }}>
                    <CheckCheck className="w-3 h-3"/> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                  <X className="w-3.5 h-3.5" style={{ color: "var(--ink-3)" }}/>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12" style={{ color: "var(--ink-4)" }}>
                  <Bell className="w-8 h-8 opacity-30"/>
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
                  const Icon = cfg.icon;
                  return (
                    <div key={n._id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group relative"
                      style={{ borderBottom: "1px solid var(--border)", background: n.isRead ? "#fff" : "var(--blue-pale)" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: cfg.bg }}>
                        <Icon className="w-4 h-4" style={{ color: cfg.color }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-snug" style={{ color: "var(--ink)" }}>{n.title}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--ink-3)" }}>{n.message}</p>
                        <p className="text-[10px] mt-1" style={{ color: "var(--ink-4)" }}>{timeAgo(n.createdAt)}</p>
                      </div>
                      <button onClick={() => deleteNotification(n._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-50 shrink-0"
                        style={{ color: "var(--red)" }}>
                        <X className="w-3 h-3"/>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
