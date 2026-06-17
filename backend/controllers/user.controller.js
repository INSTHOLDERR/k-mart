import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Notification from "../models/notification.model.js";
import cloudinary from "../lib/cloudinary.js";


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password -cartItems");
    res.json({ users });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user._id.toString() === req.user._id.toString())
      return res.status(400).json({ message: "Cannot delete yourself" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -cartItems");
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (name)  user.name  = name.trim();
    if (phone) user.phone = phone.trim();
    await user.save();
    const { password, cartItems, ...safe } = user.toObject();
    res.json(safe);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const uploadProfilePic = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: "No image provided" });
    const user = await User.findById(req.user._id);

    if (user.profilePic) {
      const publicId = user.profilePic.split("/").pop().split(".")[0];
      try { await cloudinary.uploader.destroy(`kmart/profiles/${publicId}`); } catch {}
    }

    const result = await cloudinary.uploader.upload(image, { folder: "kmart/profiles", transformation: [{ width: 400, height: 400, crop: "fill" }] });
    user.profilePic = result.secure_url;
    await user.save();
    res.json({ profilePic: result.secure_url });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// ── Addresses ─────────────────────────────────────────────────────────────────
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    res.json({ addresses: user.addresses });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = req.body;
    if (addr.isDefault || user.addresses.length === 0) {
      user.addresses.forEach(a => a.isDefault = false);
      addr.isDefault = true;
    }
    user.addresses.push(addr);
    await user.save();
    res.status(201).json({ addresses: user.addresses });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.addrId);
    if (!addr) return res.status(404).json({ message: "Address not found" });
    Object.assign(addr, req.body);
    if (req.body.isDefault) user.addresses.forEach(a => { if (!a._id.equals(addr._id)) a.isDefault = false; });
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addrId);
    if (user.addresses.length > 0 && !user.addresses.find(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// ── My Orders ─────────────────────────────────────────────────────────────────
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("products.product", "name image category");
    res.json({ orders });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// ── Request Cancel (user submits cancel note) ─────────────────────────────────
export const requestCancelOrder = async (req, res) => {
  try {
    const { note } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!["placed", "confirmed", "packed"].includes(order.orderStatus))
      return res.status(400).json({ message: "Cannot request cancellation at this stage" });

    if (order.cancelRequest?.requested)
      return res.status(400).json({ message: "Cancellation already requested" });

    order.cancelRequest = {
      requested: true,
      note: note || "",
      requestedAt: new Date(),
      status: "pending",
      adminNote: "",
    };
    await order.save();

    // Notify admin
    await Notification.create({
      userId: null,
      isAdminNotification: true,
      type: "order_cancelled",
      title: "Cancel Request",
      message: `User ${req.user.name} requested cancellation for order #${order._id.toString().slice(-6).toUpperCase()}. Reason: ${note || "No reason given"}`,
      orderId: order._id,
    });

    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// ── Wallet ────────────────────────────────────────────────────────────────────
export const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("walletBalance walletTransactions");
    res.json({
      balance: user.walletBalance,
      transactions: user.walletTransactions.sort((a, b) => b.createdAt - a.createdAt),
    });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};


export const rechargeWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10) return res.status(400).json({ message: "Minimum recharge is ₹10" });

    const { stripe } = await import("../lib/stripe.js");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "inr",
          product_data: { name: "K-Mart Wallet Recharge" },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/wallet?recharge_success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/wallet?recharge_cancel=1`,
      metadata: {
        userId: req.user._id.toString(),
        type: "wallet_recharge",
        amount: amount.toString(),
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const walletRechargeSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const { stripe } = await import("../lib/stripe.js");
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }
    if (session.metadata.type !== "wallet_recharge") {
      return res.status(400).json({ message: "Invalid session type" });
    }


    const existingUser = await User.findOne({
      "walletTransactions.stripeSessionId": sessionId,
    });
    if (existingUser) return res.json({ success: true, alreadyProcessed: true });

    const amount = parseFloat(session.metadata.amount);
    const user = await User.findById(session.metadata.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.walletBalance += amount;
    user.walletTransactions.push({
      type: "credit",
      amount,
      description: "Wallet recharge via Stripe",
      stripeSessionId: sessionId,
    });
    await user.save();

    await Notification.create({
      userId: user._id,
      type: "order_placed",
      title: "Wallet Recharged 💰",
      message: `₹${amount} has been added to your K-Mart wallet.`,
    });

    res.json({ success: true, balance: user.walletBalance });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// ── Admin: get all cancel requests ───────────────────────────────────────────
export const getAdminCancelRequests = async (req, res) => {
  try {
    const orders = await Order.find({ "cancelRequest.requested": true })
      .sort({ "cancelRequest.requestedAt": -1 })
      .populate("user", "name email")
      .populate("products.product", "name image");
    res.json({ orders });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// ── Admin: resolve cancel request (approve/reject) ────────────────────────────
export const resolveCancelRequest = async (req, res) => {
  try {
    const { action, adminNote } = req.body; // action: "approve" | "reject"
    const order = await Order.findById(req.params.id).populate("user");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.cancelRequest?.requested) return res.status(400).json({ message: "No cancel request found" });

    if (action === "approve") {
      order.orderStatus = "cancelled";
      order.cancelRequest.status = "approved";
      order.cancelRequest.adminNote = adminNote || "";
      order.cancelRequest.resolvedAt = new Date();

      // Refund to wallet if paid (online or wallet payment)
      let refunded = 0;
      if (["online", "wallet"].includes(order.paymentMethod) && order.paymentStatus === "paid") {
        refunded = order.totalAmount;
        const user = await User.findById(order.user._id || order.user);
        if (user) {
          user.walletBalance += refunded;
          user.walletTransactions.push({
            type: "credit",
            amount: refunded,
            description: `Refund for cancelled order #${order._id.toString().slice(-6).toUpperCase()}`,
            refundFor: order._id,
          });
          await user.save();
        }
        order.refundAmount = refunded;
        order.refundedToWallet = true;
        order.paymentStatus = "refunded";
      }

      await order.save();

      const userId = order.user._id || order.user;
      await Notification.create({
        userId,
        type: "order_cancelled",
        title: "Order Cancelled ✅",
        message: refunded > 0
          ? `Your order #${order._id.toString().slice(-6).toUpperCase()} has been cancelled and ₹${refunded} refunded to your wallet.`
          : `Your order #${order._id.toString().slice(-6).toUpperCase()} has been cancelled.`,
        orderId: order._id,
      });

      return res.json({ success: true, order, refunded });
    }

    if (action === "reject") {
      order.cancelRequest.status = "rejected";
      order.cancelRequest.adminNote = adminNote || "";
      order.cancelRequest.resolvedAt = new Date();
      await order.save();

      const userId = order.user._id || order.user;
      await Notification.create({
        userId,
        type: "order_placed",
        title: "Cancellation Rejected",
        message: `Your cancel request for order #${order._id.toString().slice(-6).toUpperCase()} was rejected. ${adminNote || ""}`,
        orderId: order._id,
      });

      return res.json({ success: true, order });
    }

    res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'" });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// ── Admin: update order status ────────────────────────────────────────────────
export const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus = status;
    if (status === "delivered") order.paymentStatus = "paid";
    await order.save();

    await Notification.create({
      userId: order.user,
      type: "order_placed",
      title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} is now ${status}.`,
      orderId: order._id,
    });

    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// ── Admin: get all orders ─────────────────────────────────────────────────────
export const adminGetAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { orderStatus: status } : {};
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("user", "name email")
      .populate("products.product", "name image");
    const total = await Order.countDocuments(filter);
    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
