import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  // ── Signup: validate → store pending → send OTP ───────────────────────────
  signup: async ({ name, email, password, confirmPassword }, navigate) => {
    set({ loading: true });
    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }
    try {
      await axios.post("/auth/signup", { name, email, password });
      // Now send signup OTP
      await axios.post("/otp/send", { email, purpose: "signup" });
      set({ loading: false });
      toast.success("OTP sent! Check your email.");
      navigate("/otp", { state: { email, purpose: "signup" } });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occurred");
    }
  },

  // ── Login: verify credentials → send OTP ─────────────────────────────────
  login: async (email, password, navigate) => {
    set({ loading: true });
    try {
      await axios.post("/auth/login", { email, password });
      // Credentials OK → send login OTP
      await axios.post("/otp/send", { email, purpose: "login" });
      set({ loading: false });
      toast.success("OTP sent! Check your email.");
      navigate("/otp", { state: { email, purpose: "login" } });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occurred");
    }
  },

  // ── Google OAuth (no OTP needed) ──────────────────────────────────────────
  googleAuth: async (credential) => {
    set({ loading: true });
    try {
      const res = await axios.post("/auth/google", { credential });
      set({ user: res.data, loading: false });
      toast.success(`Welcome, ${res.data.name}!`);
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Google sign-in failed");
    }
  },

  // ── OTP: verify and finalize session ─────────────────────────────────────
  verifyOTP: async (email, otp, purpose) => {
    set({ loading: true });
    try {
      const res = await axios.post("/otp/verify", { email, otp, purpose });
      set({ loading: false });
      // For login/signup the backend returns the user object + sets cookies
      if (purpose === "login" || purpose === "signup") {
        set({ user: res.data });
      }
      return res.data;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Invalid OTP");
      throw error;
    }
  },

  // ── Resend OTP ────────────────────────────────────────────────────────────
  resendOTP: async (email, purpose) => {
    set({ loading: true });
    try {
      await axios.post("/otp/send", { email, purpose });
      set({ loading: false });
      toast.success("New OTP sent!");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Failed to resend OTP");
      throw error;
    }
  },

  // ── Forgot Password: send reset OTP ──────────────────────────────────────
  sendResetOTP: async (email, navigate) => {
    set({ loading: true });
    try {
      await axios.post("/otp/send", { email, purpose: "reset" });
      set({ loading: false });
      toast.success("OTP sent! Check your email.");
      navigate("/otp", { state: { email, purpose: "reset" } });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Failed to send OTP");
    }
  },

  // ── Reset Password ────────────────────────────────────────────────────────
  resetPassword: async (email, resetToken, newPassword, navigate) => {
    set({ loading: true });
    try {
      await axios.post("/otp/reset-password", { email, resetToken, newPassword });
      set({ loading: false });
      toast.success("Password reset! Please sign in.");
      navigate("/login", { replace: true });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Failed to reset password");
      throw error;
    }
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await axios.post("/auth/logout");
      set({ user: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred during logout");
    }
  },

  // ── Check Auth ────────────────────────────────────────────────────────────
  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get("/auth/profile");
      set({ user: response.data, checkingAuth: false });
    } catch {
      set({ checkingAuth: false, user: null });
    }
  },

  refreshToken: async () => {
    if (get().checkingAuth) return;
    set({ checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      set({ checkingAuth: false });
      return response.data;
    } catch (error) {
      set({ user: null, checkingAuth: false });
      throw error;
    }
  },
}));

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalRequest);
        }
        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;
        return axios(originalRequest);
      } catch (refreshError) {
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
