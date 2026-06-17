import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name:     String,
        image:    String,
        quantity: { type: Number, default: 1 },
        price:    Number,
      },
    ],
    totalAmount:     { type: Number, required: true },
    paymentMethod:   { type: String, enum: ["online", "cod", "wallet"], default: "online" },
    paymentStatus:   { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    stripeSessionId: { type: String, default: "" },
    orderStatus:     {
      type: String,
      enum: ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
    shippingAddress: {
      fullName: String,
      phone:    String,
      line1:    String,
      line2:    String,
      city:     String,
      state:    String,
      pincode:  String,
    },
    couponCode:      { type: String, default: "" },
    discount:        { type: Number, default: 0 },
    deliveryCharge:  { type: Number, default: 0 },
    estimatedDelivery: { type: Date },
    notes:           { type: String, default: "" },

    // ── Cancel request ────────────────────────────────────────
    cancelRequest: {
      requested:   { type: Boolean, default: false },
      note:        { type: String, default: "" },          // user's reason
      requestedAt: { type: Date },
      status:      { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      adminNote:   { type: String, default: "" },          // admin's response
      resolvedAt:  { type: Date },
    },

    // ── Refund ────────────────────────────────────────────────
    refundAmount:   { type: Number, default: 0 },
    refundedToWallet: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
