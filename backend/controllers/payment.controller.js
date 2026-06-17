import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { stripe } from "../lib/stripe.js";



async function decrementStock(items) {
  const failed = [];
  for (const item of items) {
    const product = await Product.findOneAndUpdate(
      { _id: item.productId || item.id, quantity: { $gte: item.quantity } },
      { $inc: { quantity: -item.quantity } },
      { new: true }
    );
    if (!product) {
      const p = await Product.findById(item.productId || item.id).select("name quantity");
      failed.push({
        id: item.productId || item.id,
        name: item.name || p?.name || "Unknown",
        requested: item.quantity,
        available: p?.quantity || 0,
      });
    } else {
      if (product.quantity === 0) {
        product.isInStock = false;
        await product.save();
        await Notification.create({
          userId: null, isAdminNotification: true,
          type: "out_of_stock",
          title: "Product Out of Stock",
          message: `"${product.name}" just sold its last unit.`,
          productId: product._id,
        });
      } else if (product.quantity <= product.lowStockThreshold) {
        await Notification.create({
          userId: null, isAdminNotification: true,
          type: "low_stock",
          title: "Low Stock Alert",
          message: `"${product.name}" has only ${product.quantity} unit(s) remaining.`,
          productId: product._id,
        });
      }
    }
  }
  return { ok: failed.length === 0, failed };
}



export const createCODOrder = async (req, res) => {
  try {
    const { products, couponCode, shippingAddress, notes } = req.body;
    if (!Array.isArray(products) || products.length === 0)
      return res.status(400).json({ error: "No products provided" });
    if (!shippingAddress)
      return res.status(400).json({ error: "Shipping address is required" });

    const stockItems = products.map(p => ({ productId: p._id, name: p.name, quantity: p.quantity || 1 }));
    const { ok, failed } = await decrementStock(stockItems);

    if (!ok) {
      const msg = failed.map(f =>
        f.available === 0
          ? `"${f.name}" is out of stock`
          : `"${f.name}": only ${f.available} left (you requested ${f.requested})`
      ).join(", ");

      await Notification.create({
        userId: req.user._id, type: "payment_failed",
        title: "Order Failed — Stock Issue",
        message: `Your order couldn't be placed: ${msg}`,
        isAdminNotification: false,
      });

      return res.status(409).json({ error: "stock_issue", message: "Some items are no longer available", failed });
    }

    let totalAmount = products.reduce((s, p) => s + p.price * (p.quantity || 1), 0);
    let discount = 0;
    const deliveryCharge = totalAmount >= 499 ? 0 : 49;

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
      if (coupon) {
        discount = Math.round(totalAmount * (coupon.discountPercentage / 100));
        totalAmount -= discount;
        coupon.isActive = false;
        await coupon.save();
      }
    }

    const estimatedDelivery = new Date();
    estimatedDelivery.setHours(estimatedDelivery.getHours() + 24);

    const order = await Order.create({
      user: req.user._id,
      products: products.map(p => ({ product: p._id, name: p.name, image: p.image, quantity: p.quantity || 1, price: p.price })),
      totalAmount: totalAmount + deliveryCharge,
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "placed",
      shippingAddress,
      couponCode: couponCode || "",
      discount,
      deliveryCharge,
      estimatedDelivery,
      notes: notes || "",
    });

    await Notification.create({
      userId: req.user._id, type: "order_placed",
      title: "Order Placed! 🎉",
      message: `Your COD order #${order._id.toString().slice(-6).toUpperCase()} has been placed successfully.`,
      orderId: order._id,
    });

    await Notification.create({
      userId: null, isAdminNotification: true, type: "order_placed",
      title: "New COD Order",
      message: `A new COD order was placed by ${req.user.name || req.user.email}.`,
      orderId: order._id,
    });

    res.status(201).json({ success: true, orderId: order._id, order });
  } catch (e) {
    console.error("COD order error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};



export const createWalletOrder = async (req, res) => {
  try {
    const { products, couponCode, shippingAddress, notes } = req.body;
    if (!Array.isArray(products) || products.length === 0)
      return res.status(400).json({ error: "No products provided" });
    if (!shippingAddress)
      return res.status(400).json({ error: "Shipping address is required" });

    let totalAmount = products.reduce((s, p) => s + p.price * (p.quantity || 1), 0);
    let discount = 0;
    const deliveryCharge = totalAmount >= 499 ? 0 : 49;

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
      if (coupon) {
        discount = Math.round(totalAmount * (coupon.discountPercentage / 100));
        totalAmount -= discount;
      }
    }

    const finalAmount = totalAmount + deliveryCharge;

    // Check wallet balance
    const user = await User.findById(req.user._id);
    if (user.walletBalance < finalAmount) {
      return res.status(400).json({
        error: "insufficient_wallet",
        message: `Insufficient wallet balance. Available: ₹${user.walletBalance.toFixed(0)}, Required: ₹${finalAmount.toFixed(0)}`,
      });
    }

    
    const stockItems = products.map(p => ({ productId: p._id, name: p.name, quantity: p.quantity || 1 }));
    const { ok, failed } = await decrementStock(stockItems);

    if (!ok) {
      const msg = failed.map(f =>
        f.available === 0 ? `"${f.name}" is out of stock` : `"${f.name}": only ${f.available} left`
      ).join(", ");
      return res.status(409).json({ error: "stock_issue", message: "Some items are no longer available", failed });
    }

  
    user.walletBalance -= finalAmount;
    user.walletTransactions.push({
      type: "debit",
      amount: finalAmount,
      description: "Payment for order",
    });

    if (coupon) {
      coupon.isActive = false;
      await coupon.save();
    }

    const estimatedDelivery = new Date();
    estimatedDelivery.setHours(estimatedDelivery.getHours() + 24);

    const order = await Order.create({
      user: req.user._id,
      products: products.map(p => ({ product: p._id, name: p.name, image: p.image, quantity: p.quantity || 1, price: p.price })),
      totalAmount: finalAmount,
      paymentMethod: "wallet",
      paymentStatus: "paid",
      orderStatus: "confirmed",
      shippingAddress,
      couponCode: couponCode || "",
      discount,
      deliveryCharge,
      estimatedDelivery,
      notes: notes || "",
    });


    user.walletTransactions[user.walletTransactions.length - 1].orderId = order._id;
    await user.save();

    await Notification.create({
      userId: req.user._id, type: "order_placed",
      title: "Order Placed! 💰",
      message: `Wallet order #${order._id.toString().slice(-6).toUpperCase()} confirmed. ₹${finalAmount} deducted from wallet.`,
      orderId: order._id,
    });

    await Notification.create({
      userId: null, isAdminNotification: true, type: "order_placed",
      title: "New Wallet Order",
      message: `Wallet order #${order._id.toString().slice(-6).toUpperCase()} — ₹${finalAmount} by ${req.user.name}.`,
      orderId: order._id,
    });

    res.status(201).json({ success: true, orderId: order._id, order });
  } catch (e) {
    console.error("Wallet order error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};



export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode, shippingAddress } = req.body;
    if (!Array.isArray(products) || products.length === 0)
      return res.status(400).json({ error: "Invalid or empty products array" });

    const stockProblems = [];
    for (const p of products) {
      const product = await Product.findById(p._id).select("name quantity isInStock");
      if (!product || !product.isInStock || product.quantity < (p.quantity || 1)) {
        stockProblems.push({ id: p._id, name: p.name, available: product?.quantity || 0, requested: p.quantity || 1 });
      }
    }

    if (stockProblems.length > 0) {
      const msg = stockProblems.map(f => f.available === 0 ? `"${f.name}" is out of stock` : `"${f.name}": only ${f.available} left`).join(", ");
      await Notification.create({ userId: req.user._id, type: "payment_failed", title: "Checkout Blocked — Stock Issue", message: `Cannot checkout: ${msg}` });
      return res.status(409).json({ error: "stock_issue", message: "Some items are no longer available", failed: stockProblems });
    }

    let totalAmount = 0;
    const lineItems = products.map(p => {
      const amount = Math.round(p.price * 100);
      totalAmount += amount * (p.quantity || 1);
      return {
        price_data: { currency: "inr", product_data: { name: p.name, images: [p.image] }, unit_amount: amount },
        quantity: p.quantity || 1,
      };
    });

    const deliveryCharge = totalAmount / 100 >= 499 ? 0 : 49;
    if (deliveryCharge > 0) {
      lineItems.push({
        price_data: { currency: "inr", product_data: { name: "Delivery Charge" }, unit_amount: deliveryCharge * 100 },
        quantity: 1,
      });
      totalAmount += deliveryCharge * 100;
    }

    let coupon = null;
    let stripeCouponId;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
      if (coupon) {
        totalAmount -= Math.round(totalAmount * coupon.discountPercentage / 100);
        const sc = await stripe.coupons.create({ percent_off: coupon.discountPercentage, duration: "once" });
        stripeCouponId = sc.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        shippingAddress: JSON.stringify(shippingAddress || {}),
        products: JSON.stringify(products.map(p => ({ id: p._id, name: p.name, image: p.image, quantity: p.quantity || 1, price: p.price }))),
      },
    });

    if (totalAmount / 100 >= 20000) {
      const code = "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase();
      await Coupon.findOneAndDelete({ userId: req.user._id });
      await Coupon.create({ code, discountPercentage: 10, expirationDate: new Date(Date.now() + 30*24*60*60*1000), userId: req.user._id });
    }

    res.status(200).json({ id: session.id, url: session.url, totalAmount: totalAmount / 100 });
  } catch (e) {
    console.error("Checkout session error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// ── Stripe success webhook ────────────────────────────────────────────────────

export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const products = JSON.parse(session.metadata.products);

    const { ok, failed } = await decrementStock(
      products.map(p => ({ productId: p.id, name: p.name, quantity: p.quantity }))
    );

    if (!ok) {
      const msg = failed.map(f => `"${f.name}": ${f.available === 0 ? "out of stock" : `only ${f.available} left`}`).join(", ");
      await Notification.create({ userId: session.metadata.userId, type: "payment_failed", title: "⚠️ Payment Received — Stock Issue", message: `Your payment was received but some items ran out: ${msg}. Contact support for a refund.` });
      await Notification.create({ userId: null, isAdminNotification: true, type: "out_of_stock", title: "⚠️ Race Condition — Oversell Detected", message: `Order session ${sessionId.slice(-8)} was paid but stock was insufficient: ${msg}. Manual refund may be needed.` });
    }

    if (session.metadata.couponCode) {
      await Coupon.findOneAndUpdate({ code: session.metadata.couponCode, userId: session.metadata.userId }, { isActive: false });
    }

    const shippingAddress = JSON.parse(session.metadata.shippingAddress || "{}");
    const deliveryCharge = products.reduce((s, p) => s + p.price * p.quantity, 0) >= 499 ? 0 : 49;
    const estimatedDelivery = new Date();
    estimatedDelivery.setHours(estimatedDelivery.getHours() + 24);

    const order = await Order.create({
      user: session.metadata.userId,
      products: products.map(p => ({ product: p.id, name: p.name, image: p.image, quantity: p.quantity, price: p.price })),
      totalAmount: session.amount_total / 100,
      paymentMethod: "online",
      paymentStatus: "paid",
      orderStatus: ok ? "confirmed" : "placed",
      stripeSessionId: sessionId,
      shippingAddress,
      couponCode: session.metadata.couponCode || "",
      deliveryCharge,
      estimatedDelivery,
    });

    if (ok) {
      await Notification.create({ userId: session.metadata.userId, type: "order_placed", title: "Payment Successful! 🎉", message: `Your order #${order._id.toString().slice(-6).toUpperCase()} was paid and confirmed.`, orderId: order._id });
      await Notification.create({ userId: null, isAdminNotification: true, type: "order_placed", title: "New Online Order", message: `Online order #${order._id.toString().slice(-6).toUpperCase()} — ₹${(session.amount_total / 100).toFixed(0)} received.`, orderId: order._id });
    }

    res.status(200).json({ success: true, orderId: order._id, stockOk: ok, stockFailed: failed });
  } catch (e) {
    console.error("Checkout success error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
