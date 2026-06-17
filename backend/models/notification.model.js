import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // null = admin-wide broadcast, otherwise specific user
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      enum: [
        "out_of_stock",      // product went OOS
        "low_stock",         // product stock is low
        "back_in_stock",     // product restocked
        "stock_updated",     // admin updated stock
        "order_placed",      // user placed order
        "order_status",      // order status changed
        "payment_failed",    // payment failed / session expired due to OOS
        "cart_item_oos",     // item in cart went OOS
        "product_deleted",   // product removed by admin
        "product_edited",    // product edited by admin
        "category_deleted",  // category deleted
        "general",
      ],
      required: true,
    },
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    orderId:   { type: mongoose.Schema.Types.ObjectId, ref: "Order",   default: null },
    isRead:    { type: Boolean, default: false },
    isAdminNotification: { type: Boolean, default: false }, // show in admin panel
  },
  { timestamps: true }
);

// Index for fast queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ isAdminNotification: 1, isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
