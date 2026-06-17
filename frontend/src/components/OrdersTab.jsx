import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, ChevronDown, CheckCircle, Truck, XCircle,
  Clock, Eye, RefreshCw, Filter, MessageSquare, Wallet,
  User, Calendar
} from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const ORDER_STATUSES = ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"];

const STATUS_CONFIG = {
  placed:    { label: "Placed",    color: "#1565c0", bg: "#e3f2fd" },
  confirmed: { label: "Confirmed", color: "#2e7d32", bg: "#e8f5e9" },
  packed:    { label: "Packed",    color: "#e65100", bg: "#fff3e0" },
  shipped:   { label: "Shipped",   color: "#7b1fa2", bg: "#f3e5f5" },
  delivered: { label: "Delivered", color: "#166534", bg: "#f0fdf4" },
  cancelled: { label: "Cancelled", color: "#c62828", bg: "#fef2f2" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.placed;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function ResolveCancelModal({ order, onClose, onResolve }) {
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading]     = useState(false);

  const handle = async (action) => {
    setLoading(true);
    await onResolve(order._id, action, adminNote);
    setLoading(false);
    onClose();
  };

  const willRefund = ["online", "wallet"].includes(order.paymentMethod) && order.paymentStatus === "paid";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
        className="card w-full max-w-lg p-6">
        <h3 className="font-bold text-lg mb-1" style={{ color: "var(--ink)" }}>
          Cancel Request
        </h3>
        <p className="text-xs mb-4" style={{ color: "var(--ink-4)" }}>
          Order #{String(order._id).slice(-8).toUpperCase()} · {order.user?.name}
        </p>

        {/* User note */}
        <div className="p-3 rounded-xl mb-4" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: "var(--ink-2)" }}>
            <MessageSquare className="w-3.5 h-3.5" /> User's Note
          </p>
          <p className="text-sm" style={{ color: "var(--ink)" }}>{order.cancelRequest?.note || "No reason given"}</p>
          <p className="text-[10px] mt-1" style={{ color: "var(--ink-4)" }}>
            Requested: {new Date(order.cancelRequest?.requestedAt).toLocaleDateString("en-IN")}
          </p>
        </div>

        {willRefund && (
          <div className="p-3 rounded-xl mb-4 flex items-center gap-2"
            style={{ background: "var(--purple-pale)", border: "1px solid #ddd6fe" }}>
            <Wallet className="w-4 h-4 shrink-0" style={{ color: "var(--purple)" }} />
            <p className="text-xs font-semibold" style={{ color: "var(--purple)" }}>
              Approving will refund ₹{order.totalAmount?.toFixed(0)} to user's wallet
            </p>
          </div>
        )}

        <textarea
          value={adminNote}
          onChange={e => setAdminNote(e.target.value)}
          placeholder="Admin note to user (optional)..."
          rows={3}
          className="w-full p-3 rounded-xl text-sm resize-none mb-4"
          style={{ border: "1.5px solid var(--border)", outline: "none", color: "var(--ink)", background: "var(--bg-2)" }}
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-outline flex-1">Close</button>
          <button onClick={() => handle("reject")} disabled={loading}
            className="btn flex-1" style={{ background: "var(--bg-3)", color: "var(--ink-2)", border: "1.5px solid var(--border-2)" }}>
            Reject
          </button>
          <button onClick={() => handle("approve")} disabled={loading}
            className="btn flex-1" style={{ background: "var(--red)", color: "#fff" }}>
            {loading ? "Processing…" : "Approve"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function OrderRow({ order, onUpdateStatus, onResolveCancel }) {
  const [expanded, setExpanded]           = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.orderStatus);
  const [updating, setUpdating]           = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleStatusUpdate = async () => {
    if (selectedStatus === order.orderStatus) return;
    setUpdating(true);
    await onUpdateStatus(order._id, selectedStatus);
    setUpdating(false);
  };

  const hasPendingCancel = order.cancelRequest?.requested && order.cancelRequest?.status === "pending";

  return (
    <div className="card overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs font-bold" style={{ color: "var(--ink-4)" }}>
              #{String(order._id).slice(-8).toUpperCase()}
            </span>
            <StatusBadge status={order.orderStatus} />
            {order.paymentMethod === "cod"
              ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--orange-pale)", color: "var(--orange)" }}>COD</span>
              : order.paymentMethod === "wallet"
              ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--purple-pale)", color: "var(--purple)" }}>Wallet</span>
              : <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--blue-pale)", color: "var(--blue)" }}>Online</span>
            }
            {hasPendingCancel && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold animate-pulse"
                style={{ background: "var(--yellow-pale)", color: "var(--yellow)" }}>
                ⚠ Cancel Requested
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <p className="font-black text-base" style={{ color: "var(--blue)" }}>₹{order.totalAmount?.toFixed(0)}</p>
            <button onClick={() => setExpanded(v => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--bg-3)" }}>
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                style={{ color: "var(--ink-3)" }} />
            </button>
          </div>
        </div>

        {/* User + date info */}
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-4)" }}>
            <User className="w-3 h-3" />
            {order.user?.name || "Unknown"} · {order.user?.email}
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-4)" }}>
            <Calendar className="w-3 h-3" />
            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>

        {/* Quick status update */}
        {order.orderStatus !== "cancelled" && (
          <div className="flex items-center gap-2 mt-3">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ border: "1.5px solid var(--border)", outline: "none", background: "var(--bg-2)", color: "var(--ink)" }}>
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
              ))}
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={updating || selectedStatus === order.orderStatus}
              className="btn btn-primary text-xs py-2 px-4">
              {updating ? "Saving…" : "Update"}
            </button>
            {hasPendingCancel && (
              <button onClick={() => setShowCancelModal(true)}
                className="btn text-xs py-2 px-4"
                style={{ background: "var(--red-pale)", color: "var(--red)" }}>
                Resolve Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t pt-4 space-y-4" style={{ borderColor: "var(--border)" }}>
              {/* Products */}
              <div className="space-y-2">
                <p className="text-xs font-bold" style={{ color: "var(--ink-2)" }}>Items</p>
                {order.products.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold line-clamp-1" style={{ color: "var(--ink)" }}>{item.name}</p>
                      <p className="text-[10px]" style={{ color: "var(--ink-4)" }}>Qty: {item.quantity} · ₹{item.price}</p>
                    </div>
                    <p className="text-xs font-bold" style={{ color: "var(--ink)" }}>₹{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                ))}
              </div>

              {/* Shipping address */}
              {order.shippingAddress?.fullName && (
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--ink-2)" }}>Ship To</p>
                  <p className="text-xs" style={{ color: "var(--ink-3)" }}>
                    {order.shippingAddress.fullName}, {order.shippingAddress.phone}<br/>
                    {order.shippingAddress.line1}{order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`},
                    {" "}{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
                  </p>
                </div>
              )}

              {/* Cancel request detail */}
              {order.cancelRequest?.requested && (
                <div className="p-3 rounded-xl" style={{ background: "var(--red-pale)", border: "1px solid #fecaca" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--red)" }}>Cancel Request</p>
                  <p className="text-xs" style={{ color: "#7f1d1d" }}>{order.cancelRequest.note || "No reason given"}</p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--ink-4)" }}>
                    Status: {order.cancelRequest.status}
                    {order.cancelRequest.adminNote && ` · Admin: ${order.cancelRequest.adminNote}`}
                  </p>
                </div>
              )}

              {/* Refund info */}
              {order.refundedToWallet && (
                <div className="p-3 rounded-xl flex items-center gap-2"
                  style={{ background: "var(--purple-pale)", border: "1px solid #ddd6fe" }}>
                  <Wallet className="w-4 h-4" style={{ color: "var(--purple)" }} />
                  <p className="text-xs font-semibold" style={{ color: "var(--purple)" }}>
                    ₹{order.refundAmount} refunded to wallet
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCancelModal && (
        <ResolveCancelModal
          order={order}
          onClose={() => setShowCancelModal(false)}
          onResolve={onResolveCancel}
        />
      )}
    </div>
  );
}

export default function OrdersTab() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [tab, setTab]               = useState("all"); // "all" | "cancel_requests"

  useEffect(() => { fetchOrders(); }, [filterStatus, tab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (tab === "cancel_requests") {
        const { data } = await axios.get("/users/admin/cancel-requests");
        setOrders(data.orders);
      } else {
        const params = filterStatus ? `?status=${filterStatus}` : "";
        const { data } = await axios.get(`/users/admin/orders${params}`);
        setOrders(data.orders);
      }
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await axios.patch(`/users/admin/orders/${orderId}/status`, { status });
      toast.success("Status updated!");
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update");
    }
  };

  const handleResolveCancel = async (orderId, action, adminNote) => {
    try {
      await axios.patch(`/users/admin/orders/${orderId}/resolve-cancel`, { action, adminNote });
      toast.success(action === "approve" ? "Cancellation approved & refunded!" : "Request rejected");
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to resolve");
    }
  };

  const pendingCancelCount = orders.filter(o => o.cancelRequest?.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-black" style={{ color: "var(--ink)" }}>Orders</h2>
        <button onClick={fetchOrders} className="btn btn-soft text-xs gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("all")}
          className="btn text-xs py-2 px-4"
          style={{
            background: tab === "all" ? "var(--blue)" : "var(--bg-3)",
            color:      tab === "all" ? "#fff" : "var(--ink-2)",
          }}>
          All Orders
        </button>
        <button onClick={() => setTab("cancel_requests")}
          className="btn text-xs py-2 px-4 relative"
          style={{
            background: tab === "cancel_requests" ? "var(--red)" : "var(--bg-3)",
            color:      tab === "cancel_requests" ? "#fff" : "var(--ink-2)",
          }}>
          Cancel Requests
          {pendingCancelCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: "var(--red)", color: "#fff" }}>
              {pendingCancelCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter bar (only for all orders) */}
      {tab === "all" && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setFilterStatus("")}
            className="btn text-xs py-1.5 px-3"
            style={{
              background: filterStatus === "" ? "var(--blue)" : "var(--bg-3)",
              color:      filterStatus === "" ? "#fff" : "var(--ink-3)",
            }}>
            All
          </button>
          {ORDER_STATUSES.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="btn text-xs py-1.5 px-3 capitalize"
              style={{
                background: filterStatus === s ? "var(--blue)" : "var(--bg-3)",
                color:      filterStatus === s ? "#fff" : "var(--ink-3)",
              }}>
              {STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block w-7 h-7 rounded-full border-4 animate-spin"
            style={{ borderColor: "var(--blue-light)", borderTopColor: "var(--blue)" }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center">
          <Package className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--ink-5)" }} />
          <p className="text-sm" style={{ color: "var(--ink-4)" }}>
            {tab === "cancel_requests" ? "No cancel requests" : "No orders found"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <OrderRow
              key={order._id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
              onResolveCancel={handleResolveCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
