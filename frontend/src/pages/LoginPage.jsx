import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Loader, Eye, EyeOff } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import GoogleAuthButton from "../components/GoogleAuthButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const { login, loading } = useUserStore();
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    login(email, password, navigate);
  };

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
            Fresh groceries,<br />delivered fast 🥦
          </h2>
          <p className="text-blue-200 text-base leading-relaxed">
            Kerala's freshest online grocery store. Farm-fresh produce, same-day delivery.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { l: "Products", v: "500+" },
              { l: "Customers", v: "10K+" },
              { l: "Cities", v: "15+" },
              { l: "Satisfaction", v: "98%" }
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,.12)" }}
              >
                <p className="text-2xl font-black text-white">{s.v}</p>
                <p className="text-blue-200 text-sm">{s.l}</p>
              </div>
            ))}
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
            Welcome back
          </h1>
          <p className="text-sm mb-7" style={{ color: "var(--ink-4)" }}>
            Sign in to your account
          </p>

          {/* Divider - removed Google button from here */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--ink-4)" }}>
              sign in with email
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Email field */}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Password field - removed Forgot Password from here */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--ink-4)" }}
                />
                <input
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                >
                  {show ? (
                    <EyeOff className="w-4 h-4" style={{ color: "var(--ink-4)" }} />
                  ) : (
                    <Eye className="w-4 h-4" style={{ color: "var(--ink-4)" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center mt-2"
              style={{ padding: ".75rem" }}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" /> Verifying…
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Forgot Password link - moved here under the button */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm font-semibold"
                style={{ color: "var(--blue)" }}
              >
                Forgot password?
              </Link>
            </div>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm mt-6" style={{ color: "var(--ink-4)" }}>
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold" style={{ color: "var(--blue)" }}>
              Create one
            </Link>
          </p>

          {/* Google button - moved here under everything */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-xs" style={{ color: "var(--ink-4)" }}>
                or continue with
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
            <GoogleAuthButton />
          </div>
        </motion.div>
      </div>
    </div>
  );
}