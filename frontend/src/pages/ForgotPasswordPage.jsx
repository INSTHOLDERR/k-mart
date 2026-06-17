import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Loader } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState("");
  const { loading, sendResetOTP } = useUserStore();
  const navigate                = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    sendResetOTP(email, navigate);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-2)" }}>

      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12"
        style={{ background: "linear-gradient(160deg,var(--blue) 0%,#4f81f5 100%)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-white"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>K</div>
          <span className="text-white font-black text-lg" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>K Mart</span>
        </div>
        <div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">Forgot your<br />password? 🔑</h2>
          <p className="text-blue-200 text-base leading-relaxed">
            Enter your registered email and we'll send a 3-minute OTP to reset your password securely.
          </p>
          <div className="mt-8 p-5 rounded-2xl" style={{ background: "rgba(255,255,255,.12)" }}>
            <p className="text-white font-semibold mb-1">🛡️ Secure Reset</p>
            <p className="text-blue-200 text-sm">Your OTP expires in 3 minutes and can only be used once.</p>
          </div>
        </div>
        <p className="text-blue-300 text-sm">© 2025 K Mart</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div className="w-full max-w-sm"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }}>

          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white"
              style={{ background: "var(--blue)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>K</div>
            <span className="font-black text-xl" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--ink)" }}>K Mart</span>
          </div>

          <h1 className="text-2xl font-black mb-1" style={{ color: "var(--ink)" }}>Forgot Password</h1>
          <p className="text-sm mb-8" style={{ color: "var(--ink-4)" }}>
            We'll send a 6-digit OTP to your registered email
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-4)" }} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" className="input pl-10" autoFocus />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-2"
              style={{ padding: ".75rem" }}>
              {loading ? <><Loader className="w-4 h-4 animate-spin" /> Sending OTP…</> : "Send OTP"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--ink-4)" }}>
            Remember your password?{" "}
            <Link to="/login" className="font-semibold" style={{ color: "var(--blue)" }}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
