import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,

  /* ── Coupons ── */
  getMyCoupon: async () => {
    try {
      const res = await axios.get("/coupons");
      set({ coupon: res.data });
    } catch { /* no coupon is fine */ }
  },

  applyCoupon: async (code) => {
    try {
      const res = await axios.post("/coupons/validate", { code });
      set({ coupon: res.data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid coupon");
    }
  },

  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },

  /* ── Cart CRUD ── */
  getCartItems: async () => {
    try {
      const res = await axios.get("/cart");
      // Server returns full product objects merged with quantity
      set({ cart: res.data });
      get().calculateTotals();
    } catch (err) {
      console.error("getCartItems:", err.message);
      set({ cart: [] });
    }
  },

  clearCart: async () => {
    try { await axios.delete("/cart"); } catch {}
    set({ cart: [], coupon: null, total: 0, subtotal: 0, isCouponApplied: false });
  },

  addToCart: async (product) => {
    try {
      await axios.post("/cart", { productId: product._id });
      // Optimistic update
      set(s => {
        const existing = s.cart.find(i => i._id === product._id);
        const newCart = existing
          ? s.cart.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i)
          : [...s.cart, { ...product, quantity: 1, stockLeft: product.quantity, isInStock: product.isInStock }];
        return { cart: newCart };
      });
      get().calculateTotals();
      toast.success("Added to cart!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add to cart");
    }
  },

  removeFromCart: async (productId) => {
    try {
      await axios.delete("/cart", { data: { productId } });
      set(s => ({ cart: s.cart.filter(i => i._id !== productId) }));
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not remove item");
    }
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity === 0) {
      get().removeFromCart(productId);
      return;
    }
    try {
      await axios.put(`/cart/${productId}`, { quantity });
      set(s => ({
        cart: s.cart.map(i => i._id === productId ? { ...i, quantity } : i),
      }));
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update quantity");
      // Refresh cart from server to get real state
      get().getCartItems();
    }
  },

  calculateTotals: () => {
    const { cart, coupon } = get();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let total = subtotal;
    if (coupon && coupon.discountPercentage) {
      total = subtotal - subtotal * (coupon.discountPercentage / 100);
    }
    set({ subtotal, total });
  },
}));
