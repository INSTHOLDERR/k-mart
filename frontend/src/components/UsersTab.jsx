import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Shield, User, Trash2, ChevronDown, Phone, MapPin, Package, X } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const S = {
  card: { background: "#fff", border: "1.5px solid #f0f0f0", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  input: {
    width: "100%", padding: "9px 14px 9px 36px", border: "1.5px solid #e5e7eb",
    borderRadius: 10, fontSize: 13, background: "#fff", color: "#111827", outline: "none",
  },
};

// ── User Detail Modal ─────────────────────────────────
function UserDetailModal({ user, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    // Admin fetch user's orders
    axios.get(`/users/admin/${user._id}/orders`)
      .then((r) => setOrders(r.data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [user._id]);

  const STATUS_COLOR = {
    placed: { bg: "#eff6ff", color: "#2563eb" },
    confirmed: { bg: "#f0fdf4", color: "#16a34a" },
    packed: { bg: "#fff7ed", color: "#ea580c" },
    shipped: { bg: "#faf5ff", color: "#9333ea" },
    delivered: { bg: "#f0fdf4", color: "#15803d" },
    cancelled: { bg: "#fef2f2", color: "#dc2626" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <motion.div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ ...S.card }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex items-center gap-3">
            {user.profilePic ? (
              <img src={user.profilePic} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ background: "var(--blue)" }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm" style={{ color: "#111827" }}>{user.name}</p>
              <p className="text-xs" style={{ color: "#9ca3af" }}>{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all">
            <X className="w-4 h-4" style={{ color: "#6b7280" }} />
          </button>
        </div>

        {/* User info */}
        <div className="p-5 grid grid-cols-2 gap-4 border-b" style={{ borderColor: "#f0f0f0" }}>
          {user.phone && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6b7280" }}>
              <Phone className="w-4 h-4" /> {user.phone}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm" style={{ color: "#6b7280" }}>
            <MapPin className="w-4 h-4" />
            {user.addresses?.length || 0} saved address{user.addresses?.length !== 1 ? "es" : ""}
          </div>
          <div className="text-sm" style={{ color: "#6b7280" }}>
            <span className="font-medium" style={{ color: "#111827" }}>Joined: </span>
            {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
          <div className="text-sm" style={{ color: "#6b7280" }}>
            <span className="font-medium" style={{ color: "#111827" }}>Role: </span>
            <span className="capitalize">{user.role}</span>
          </div>
        </div>

        {/* Orders */}
        <div className="p-5">
          <p className="font-semibold text-sm mb-4" style={{ color: "#111827" }}>
            Order History
          </p>
          {loadingOrders ? (
            <div className="py-8 text-center text-sm" style={{ color: "#9ca3af" }}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "var(--blue)" }} />
              <p className="text-sm" style={{ color: "#9ca3af" }}>No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const sc = STATUS_COLOR[order.orderStatus] || STATUS_COLOR.placed;
                return (
                  <div key={order._id} className="p-4 rounded-xl border" style={{ borderColor: "#f0f0f0" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-semibold" style={{ color: "#9ca3af" }}>
                        #{String(order._id).slice(-8).toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize" style={{ background: sc.bg, color: sc.color }}>
                          {order.orderStatus}
                        </span>
                        <span className="font-bold text-sm" style={{ color: "var(--blue)" }}>
                          ₹{order.totalAmount.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                      {order.products?.slice(0, 4).map((item, i) => (
                        <div key={i} className="shrink-0 w-10 h-10 rounded-lg overflow-hidden" style={{ background: "#f8f9fa" }}>
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {order.products?.length > 4 && (
                        <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold" style={{ background: "#f8f9fa", color: "#6b7280" }}>
                          +{order.products.length - 4}
                        </div>
                      )}
                    </div>
                    <p className="text-xs mt-2" style={{ color: "#9ca3af" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      {order.paymentMethod === "cod" ? "💰 COD" : "💳 Online"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── UsersTab ──────────────────────────────────────────
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    axios.get("/users/admin/all")
      .then((r) => setUsers(r.data.users || []))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      await axios.delete(`/users/admin/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success("User deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete");
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-green-200 border-t-green-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: users.length, color: "#111827" },
          { label: "Admins", value: users.filter((u) => u.role === "admin").length, color: "#9333ea" },
          { label: "Customers", value: users.filter((u) => u.role !== "admin").length, color: "var(--blue)" },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl" style={{ ...S.card }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>
              {s.label}
            </p>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={S.input}
          />
        </div>
        <div className="relative">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="appearance-none text-sm rounded-xl border px-4 pr-9 py-2.5 outline-none cursor-pointer"
            style={{ border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151" }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "#9ca3af" }} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ ...S.card }}>
        <div
          className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{ background: "#f8f9fa", color: "#9ca3af", borderBottom: "1.5px solid #f0f0f0" }}
        >
          <span className="w-10">Avatar</span>
          <span>User</span>
          <span>Addresses</span>
          <span>Role</span>
          <span>Action</span>
        </div>

        <div>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: "#9ca3af" }}>
              {searchQuery ? "No users match your search" : "No users found"}
            </div>
          ) : (
            filtered.map((user, i) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 transition-colors hover:bg-gray-50 cursor-pointer"
                style={{ borderBottom: "1px solid #f9fafb" }}
                onClick={() => setSelectedUser(user)}
              >
                {/* Avatar */}
                <div>
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white text-sm"
                      style={{ background: "var(--blue)" }}
                    >
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                {/* Name + email */}
                <div>
                  <p className="text-sm font-medium" style={{ color: "#111827" }}>{user.name}</p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>{user.email}</p>
                </div>

                {/* Addresses */}
                <span className="text-xs font-medium" style={{ color: "#6b7280" }}>
                  {user.addresses?.length || 0}
                </span>

                {/* Role */}
                <div>
                  {user.role === "admin" ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "#faf5ff", color: "#9333ea", border: "1px solid #e9d5ff" }}
                    >
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                    >
                      <User className="w-3 h-3" /> Customer
                    </span>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(user._id); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-50"
                  style={{ color: "#d1d5db" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#d1d5db"; }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

import { AnimatePresence } from "framer-motion";
export default UsersTab;