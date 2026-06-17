import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, ChevronDown, CheckCircle, Truck,
  XCircle, ShoppingBag, ArrowRight, AlertCircle,
  Clock, MessageSquare, Wallet
} from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  placed:    { label: "Order Placed", color: "#1565c0", bg: "#e3f2fd", icon: Package,      step: 1 },
  confirmed: { label: "Confirmed",    color: "#2e7d32", bg: "#e8f5e9", icon: CheckCircle,  step: 2 },
  packed:    { label: "Packed",       color: "#e65100", bg: "#fff3e0", icon: Package,       step: 3 },
  shipped:   { label: "Shipped",      color: "#7b1fa2", bg: "#f3e5f5", icon: Truck,         step: 4 },
  delivered: { label: "Delivered",    color: "#166534", bg: "#f0fdf4", icon: CheckCircle,  step: 5 },
  cancelled: { label: "Cancelled",    color: "#c62828", bg: "#fef2f2", icon: XCircle,      step: 0 },
};
const STEPS = ["placed", "confirmed", "packed", "shipped", "delivered"];

function StatusBadge({ status }) {
  const cfg  = STATUS_CONFIG[status] || STATUS_CONFIG.placed;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function ProgressBar({ status }) {
  if (status === "cancelled") return (
    <div className="flex items-center gap-2 py-3">
      <XCircle className="w-4 h-4 text-red-500" />
      <span className="text-xs font-semibold text-red-600">Order Cancelled</span>
    </div>
  );
  const cur = STATUS_CONFIG[status]?.step || 1;
  return (
    <div className="py-3">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 h-1 top-3.5 z-0" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${((cur - 1) / (STEPS.length - 1)) * 100}%`, background: "var(--blue)" }} />
        </div>
        {STEPS.map((step, i) => {
          const done   = i + 1 <= cur;
          const active = i + 1 === cur;
          return (
            <div key={step} className="flex flex-col items-center z-10 gap-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all"
                style={{
                  background:  done ? "var(--blue)" : "#fff",
                  borderColor: done ? "var(--blue)" : "var(--border)",
                  boxShadow:   active ? "0 0 0 3px rgba(37,99,235,.2)" : "none",
                }}>
                {done
                  ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                  : <div className="w-2 h-2 rounded-full" style={{ background: "var(--border)" }} />
                }
              </div>
              <span className="text-[9px] font-semibold capitalize hidden sm:block"
                style={{ color: done ? "var(--blue)" : "var(--ink-4)" }}>
                {STATUS_CONFIG[step]?.label || step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CancelRequestModal({ order, onClose, onSubmit }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit(order._id, note);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
        className="card w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--red-pale)" }}>
            <XCircle className="w-5 h-5" style={{ color: "var(--red)" }} />
          </div>
          <div>
            <h3 className="font-bold" style={{ color: "var(--ink)" }}>Request Cancellation</h3>
            <p className="text-xs" style={{ color: "var(--ink-4)" }}>
              Order #{String(order._id).slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        <p className="text-sm mb-4" style={{ color: "var(--ink-2)" }}>
          Please tell us why you want to cancel this order. The admin will review your request.
          {(order.paymentMethod === "online" || order.paymentMethod === "wallet") && order.paymentStatus === "paid" && (
            <span className="block mt-1 font-semibold" style={{ color: "var(--green)" }}>
              💰 Refund will be credited to your wallet if approved.
            </span>
          )}
        </p>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Reason for cancellation (optional but helpful)..."
          className="w-full p-3 rounded-xl text-sm resize-none"
          rows={4}
          style={{
            border: "1.5px solid var(--border)",
            outline: "none",
            color: "var(--ink)",
            background: "var(--bg-2)",
          }}
        />

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn flex-1"
            style={{ background: "var(--red)", color: "#fff" }}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CancelRequestBadge({ cancelRequest }) {
  if (!cancelRequest?.requested) return null;
  const { status } = cancelRequest;
  const cfg = {
    pending:  { color: "#b45309", bg: "#fef3c7", label: "Cancel Pending", icon: Clock },
    approved: { color: "#c62828", bg: "#fef2f2", label: "Cancellation Approved", icon: CheckCircle },
    rejected: { color: "#6b7280", bg: "#f3f4f6", label: "Cancel Rejected", icon: XCircle },
  }[status] || {};
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {Icon && <Icon className="w-3 h-3" />} {cfg.label}
    </span>
  );
}

function OrderCard({ order, onCancelRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const canRequestCancel = ["placed", "confirmed", "packed"].includes(order.orderStatus)
    && !order.cancelRequest?.requested;

  const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });

  return (
    <motion.div className="card overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="p-4 border-b" style={{
        borderColor: "var(--border)",
        background:  order.orderStatus === "delivered" ? "var(--green-pale)" : "#fff",
      }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold" style={{ color: "var(--ink-4)" }}>
                #{String(order._id).slice(-8).toUpperCase()}
              </span>
              <StatusBadge status={order.orderStatus} />
              {order.paymentMethod === "cod"
                ? <span className="badge badge-orange">💰 COD</span>
                : order.paymentMethod === "wallet"
                ? <span className="badge badge-blue">👛 Wallet</span>
                : <span className="badge badge-blue">💳 Online</span>
              }
              <CancelRequestBadge cancelRequest={order.cancelRequest} />
            </div>
            <p className="text-xs" style={{ color: "var(--ink-4)" }}>
              {date} · {order.products.length} item{order.products.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="font-black text-lg" style={{ color: "var(--blue)" }}>₹{order.totalAmount.toFixed(0)}</p>
            {order.paymentStatus === "paid"     && <p className="text-xs font-semibold" style={{ color: "var(--green)" }}>✓ Paid</p>}
            {order.paymentStatus === "pending"  && <p className="text-xs font-semibold" style={{ color: "#d97706" }}>⏳ Pending</p>}
            {order.paymentStatus === "refunded" && <p className="text-xs font-semibold" style={{ color: "var(--purple)" }}>↩ Refunded to Wallet</p>}
          </div>
        </div>
      </div>

      {/* Product thumbnails */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {order.products.slice(0, 5).map((item, i) => (
            <div key={i} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--blue-pale)" }}>
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-semibold line-clamp-1 max-w-[100px]" style={{ color: "var(--ink)" }}>
                  {item.name}
                </p>
                <p className="text-[10px]" style={{ color: "var(--ink-4)" }}>x{item.quantity} · ₹{item.price}</p>
              </div>
            </div>
          ))}
          {order.products.length > 5 && (
            <div className="shrink-0 flex items-center px-3 py-2 rounded-xl" style={{ background: "var(--blue-pale)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--ink-2)" }}>
                +{order.products.length - 5} more
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="px-4"><ProgressBar status={order.orderStatus} /></div>

      {/* Refund info */}
      {order.refundedToWallet && order.refundAmount > 0 && (
        <div className="mx-4 mb-3 p-3 rounded-xl flex items-center gap-2"
          style={{ background: "var(--purple-pale)", border: "1px solid #ddd6fe" }}>
          <Wallet className="w-4 h-4 shrink-0" style={{ color: "var(--purple)" }} />
          <p className="text-xs font-semibold" style={{ color: "var(--purple)" }}>
            ₹{order.refundAmount.toFixed(0)} refunded to your wallet
          </p>
        </div>
      )}

      {/* Cancel request note from admin */}
      {order.cancelRequest?.requested && order.cancelRequest.adminNote && (
        <div className="mx-4 mb-3 p-3 rounded-xl" style={{ background: "var(--bg-3)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold mb-0.5" style={{ color: "var(--ink-2)" }}>Admin Response:</p>
          <p className="text-xs" style={{ color: "var(--ink-3)" }}>{order.cancelRequest.adminNote}</p>
        </div>
      )}

      {/* Actions row */}
      <div className="px-4 pb-4 flex items-center justify-between gap-3">
        <button onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-xs font-semibold hover:underline transition-colors"
          style={{ color: "var(--blue)" }}>
          {expanded ? "Hide" : "View"} Details
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {canRequestCancel && (
          <button onClick={() => setShowCancelModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "var(--red-pale)", color: "var(--red)" }}>
            <XCircle className="w-3.5 h-3.5" />
            Request Cancel
          </button>
        )}

        {order.cancelRequest?.requested && order.cancelRequest.status === "pending" && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "var(--yellow-pale)", color: "var(--yellow)" }}>
            <Clock className="w-3.5 h-3.5" />
            Cancel Pending
          </span>
        )}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              {/* Items */}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--ink-2)" }}>Items</p>
                <div className="space-y-2">
                  {order.products.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold line-clamp-1" style={{ color: "var(--ink)" }}>{item.name}</p>
                        <p className="text-[10px]" style={{ color: "var(--ink-4)" }}>Qty: {item.quantity}</p>
                      </div>
                      <p className="text-xs font-bold" style={{ color: "var(--ink)" }}>₹{(item.price * item.quantity).toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price breakdown */}
              <div className="p-3 rounded-xl space-y-1.5" style={{ background: "var(--bg-2)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--ink-2)" }}>Price Breakdown</p>
                <div className="flex justify-between text-xs" style={{ color: "var(--ink-3)" }}>
                  <span>Subtotal</span>
                  <span>₹{(order.totalAmount - order.deliveryCharge + order.discount).toFixed(0)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-xs" style={{ color: "var(--green)" }}>
                    <span>Discount ({order.couponCode})</span>
                    <span>-₹{order.discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs" style={{ color: "var(--ink-3)" }}>
                  <span>Delivery</span>
                  <span>{order.deliveryCharge === 0 ? "Free" : `₹${order.deliveryCharge}`}</span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-1.5 border-t" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                  <span>Total</span>
                  <span>₹{order.totalAmount.toFixed(0)}</span>
                </div>
              </div>

              {/* Shipping address */}
              {order.shippingAddress?.fullName && (
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--ink-2)" }}>Delivery Address</p>
                  <p className="text-xs" style={{ color: "var(--ink-3)" }}>
                    {order.shippingAddress.fullName}, {order.shippingAddress.phone}<br/>
                    {order.shippingAddress.line1}
                    {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`},
                    {" "}{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
                  </p>
                </div>
              )}

              {/* Cancel request note */}
              {order.cancelRequest?.requested && (
                <div className="p-3 rounded-xl" style={{ background: "var(--red-pale)", border: "1px solid #fecaca" }}>
                  <p className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: "var(--red)" }}>
                    <MessageSquare className="w-3.5 h-3.5" /> Your Cancellation Note
                  </p>
                  <p className="text-xs" style={{ color: "#7f1d1d" }}>{order.cancelRequest.note || "No note provided"}</p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--ink-4)" }}>
                    Submitted {new Date(order.cancelRequest.requestedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              )}

              {order.estimatedDelivery && order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" && (
                <p className="text-xs" style={{ color: "var(--ink-4)" }}>
                  Estimated delivery: <span className="font-semibold" style={{ color: "var(--ink-2)" }}>
                    {new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCancelModal && (
        <CancelRequestModal
          order={order}
          onClose={() => setShowCancelModal(false)}
          onSubmit={onCancelRequest}
        />
      )}
    </motion.div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get("/users/me/orders");
      setOrders(data.orders);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (orderId, note) => {
    try {
      await axios.patch(`/users/me/orders/${orderId}/cancel-request`, { note });
      toast.success("Cancellation request submitted!");
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to submit request");
    }
  };

  if (loading) {
    return (
      <div className="wrap py-20 text-center">
        <div className="inline-block w-8 h-8 rounded-full border-4 animate-spin"
          style={{ borderColor: "var(--blue-light)", borderTopColor: "var(--blue)" }} />
        <p className="mt-3 text-sm" style={{ color: "var(--ink-4)" }}>Loading orders…</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="wrap py-20 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--ink-5)" }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--ink)" }}>No orders yet</h2>
        <p className="text-sm mb-6" style={{ color: "var(--ink-4)" }}>Start shopping to see your orders here.</p>
        <Link to="/" className="btn btn-primary">
          Shop Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: "var(--ink)" }}>My Orders</h1>
        <p className="text-sm mt-1" style={{ color: "var(--ink-4)" }}>{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="space-y-4 max-w-2xl">
        {orders.map(order => (
          <OrderCard key={order._id} order={order} onCancelRequest={handleCancelRequest} />
        ))}
      </div>
    </div>
  );
}
