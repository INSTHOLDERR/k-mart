import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

export default function ResetPasswordPage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { email, resetToken } = location.state || {};
  const { loading, resetPassword } = useUserStore();

  const [form, setForm]   = useState({ password: "", confirm: "" });
  const [show, setShow]   = useState({ password: false, confirm: false });
  const [error, setError] = useState("");

  if (!email || !resetToken) {
    navigate("/forgot-password");
    return null;
  }

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    resetPassword(email, resetToken, form.password, navigate);
  };

  const fields = [
    { k: "password", label: "New Password",     ph: "Min 6 characters" },
    { k: "confirm",  label: "Confirm Password", ph: "Repeat password"  },
  ];

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
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">Set a new<br />password 🔐</h2>
          <p className="text-blue-200 text-base leading-relaxed">
            Choose a strong password to keep your account secure.
          </p>
          <div className="mt-8 space-y-2.5">
            {["At least 6 characters", "Mix of letters & numbers", "Avoid common passwords"].map(tip => (
              <div key={tip} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                <p className="text-blue-200 text-sm">{tip}</p>
              </div>
            ))}
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

          <h1 className="text-2xl font-black mb-1" style={{ color: "var(--ink)" }}>Reset Password</h1>
          <p className="text-sm mb-8" style={{ color: "var(--ink-4)" }}>
            For <strong style={{ color: "var(--ink-2)" }}>{email}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ k, label, ph }) => (
              <div key={k}>
                <label className="label">{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-4)" }} />
                  <input type={show[k] ? "text" : "password"} required value={form[k]} onChange={set(k)}
                    placeholder={ph} className="input pl-10 pr-10" />
                  <button type="button" onClick={() => setShow(p => ({ ...p, [k]: !p[k] }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {show[k]
                      ? <EyeOff className="w-4 h-4" style={{ color: "var(--ink-4)" }} />
                      : <Eye    className="w-4 h-4" style={{ color: "var(--ink-4)" }} />}
                  </button>
                </div>
              </div>
            ))}

            {error && (
              <p className="text-xs font-medium rounded-lg px-3 py-2"
                style={{ color: "var(--red)", background: "var(--red-pale)" }}>{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-2"
              style={{ padding: ".75rem" }}>
              {loading ? <><Loader className="w-4 h-4 animate-spin" /> Resetting…</> : "Reset Password"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--ink-4)" }}>
            <Link to="/login" className="font-semibold" style={{ color: "var(--blue)" }}>← Back to Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
