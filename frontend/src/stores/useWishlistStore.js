import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlist: [],

      addToWishlist: (product) => {
        const exists = get().wishlist.find((p) => p._id === product._id);
        if (exists) {
          toast("Already in wishlist!", { icon: "💚" });
          return;
        }
        set((state) => ({ wishlist: [...state.wishlist, product] }));
        toast.success("Added to wishlist!");
      },

      removeFromWishlist: (productId) => {
        set((state) => ({
          wishlist: state.wishlist.filter((p) => p._id !== productId),
        }));
        toast.success("Removed from wishlist");
      },

      isInWishlist: (productId) => {
        return get().wishlist.some((p) => p._id === productId);
      },

      clearWishlist: () => set({ wishlist: [] }),
    }),
    { name: "kmart-wishlist" }
  )
);