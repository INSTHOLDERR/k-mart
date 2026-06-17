import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,

  setProducts: (products) => set({ products }),

  createProduct: async (productData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/products", productData);
      set(s => ({ products: [...s.products, res.data], loading: false }));
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create product");
      set({ loading: false });
      throw error;
    }
  },

  updateProduct: async (productId, productData) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/products/${productId}`, productData);
      set(s => ({
        products: s.products.map(p => p._id === productId ? res.data : p),
        loading: false,
      }));
      toast.success("Product updated!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update product");
      set({ loading: false });
      throw error;
    }
  },

  deleteProduct: async (productId) => {
    set({ loading: true });
    try {
      await axios.delete(`/products/${productId}`);
      set(s => ({ products: s.products.filter(p => p._id !== productId), loading: false }));
      toast.success("Product deleted");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  },

  toggleFeaturedProduct: async (productId) => {
    set({ loading: true });
    try {
      const res = await axios.patch(`/products/${productId}`);
      set(s => ({
        products: s.products.map(p => p._id === productId ? { ...p, isFeatured: res.data.isFeatured } : p),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Failed to update product");
    }
  },

  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/products");
      set({ products: res.data.products, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
      toast.error(error.response?.data?.message || "Failed to fetch products");
    }
  },

  fetchProductsByCategory: async (category) => {
    set({ loading: true });
    try {
      const res = await axios.get(`/products/category/${category}`);
      set({ products: res.data.products, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
    }
  },

  fetchFeaturedProducts: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/products/featured");
      set({ products: res.data, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
    }
  },

  checkStock: async (items) => {
    try {
      const res = await axios.post("/products/check-stock", { items });
      return res.data;
    } catch {
      return { allAvailable: false, results: [] };
    }
  },
}));
