import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Loader, Eye, EyeOff, User } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import GoogleAuthButton from "../components/GoogleAuthButton";

export default function SignUpPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const { signup, loading } = useUserStore();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  
  const submit = (e) => {
    e.preventDefault();
    signup(form, navigate);
  };

  const passMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-2)" }}>
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12"
        style={{ background: "linear-gradient(160deg,var(--blue) 0%,#4f81f5 100%)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-white"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
          >
            K
          </div>
          <span
            className="text-white font-black text-lg"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
          >
            K Mart
          </span>
        </div>
        
        <div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Join thousands of<br />happy customers 🛒
          </h2>
          <p className="text-blue-200 text-base leading-relaxed">
            Get fresh produce delivered to your door. Sign up today and get ₹100 off your first order.
          </p>
          <div className="mt-8 p-5 rounded-2xl" style={{ background: "rgba(255,255,255,.12)" }}>
            <p className="text-white font-semibold mb-1">🎁 First order offer</p>
            <p className="text-blue-200 text-sm">
              Use <strong className="text-white">KMART100</strong> for ₹100 off.
            </p>
          </div>
        </div>
        
        <p className="text-blue-300 text-sm">© 2025 K Mart</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white"
              style={{ background: "var(--blue)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            >
              K
            </div>
            <span
              className="font-black text-xl"
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--ink)" }}
            >
              K Mart
            </span>
          </div>

          <h1 className="text-2xl font-black mb-1" style={{ color: "var(--ink)" }}>
            Create your account
          </h1>
          <p className="text-sm mb-7" style={{ color: "var(--ink-4)" }}>
            Shop smarter with K Mart
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--ink-4)" }}>
              or sign up with email
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--ink-4)" }}
                />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Your full name"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--ink-4)" }}
                />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@example.com"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--ink-4)" }}
                />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min 6 characters"
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" style={{ color: "var(--ink-4)" }} />
                  ) : (
                    <Eye className="w-4 h-4" style={{ color: "var(--ink-4)" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--ink-4)" }}
                />
                <input
                  type={showConf ? "text" : "password"}
                  required
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  placeholder="Repeat password"
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConf((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                >
                  {showConf ? (
                    <EyeOff className="w-4 h-4" style={{ color: "var(--ink-4)" }} />
                  ) : (
                    <Eye className="w-4 h-4" style={{ color: "var(--ink-4)" }} />
                  )}
                </button>
              </div>
              {passMismatch && (
                <p className="text-xs font-medium mt-1.5" style={{ color: "var(--red)" }}>
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !!passMismatch}
              className="btn btn-primary w-full justify-center mt-2"
              style={{ padding: ".75rem" }}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" /> Processing…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--ink-4)" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold" style={{ color: "var(--blue)" }}>
              Sign in
            </Link>
          </p>

          {/* Google button */}
          <GoogleAuthButton />
        </motion.div>
      </div>
    </div>
  );
}