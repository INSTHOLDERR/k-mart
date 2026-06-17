import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader, RotateCcw, CheckCircle, Clock } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const OTP_DURATION   = 3 * 60; // 3 minutes — must match backend OTP_TTL
const RESEND_COOLDOWN = 60;     // 60 seconds before resend allowed

export default function OTPPage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { email, purpose = "login" } = location.state || {};

  const [otp, setOtp]         = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer]     = useState(OTP_DURATION);   // OTP validity countdown
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN); // Resend cooldown
  const [canResend, setCanResend] = useState(false);
  const [verified, setVerified]   = useState(false);
  const [expired, setExpired]     = useState(false);

  const inputRefs = useRef([]);
  const { loading, verifyOTP, resendOTP } = useUserStore();

  // Redirect if no state
  useEffect(() => {
    if (!email) {
      navigate(purpose === "reset" ? "/forgot-password" : "/login");
    }
  }, [email, navigate, purpose]);

  // ── OTP expiry countdown (3 min) ──────────────────────────────────────────
  useEffect(() => {
    if (!email) return;
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { clearInterval(interval); setExpired(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [email]);

  // ── Resend cooldown (60s) ─────────────────────────────────────────────────
  useEffect(() => {
    if (!email) return;
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [email]);

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── OTP input handlers ────────────────────────────────────────────────────
  const handleChange = (idx, val) => {
    const digit = val.replace(/\D/, "").slice(-1);
    const next  = [...otp];
    next[idx]   = digit;
    setOtp(next);
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = [...otp];
    text.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  };

  // ── Verify ────────────────────────────────────────────────────────────────
  const handleVerify = useCallback(async (currentOtp) => {
    const code = currentOtp || otp.join("");
    if (code.length < 6 || expired) return;
    try {
      const data = await verifyOTP(email, code, purpose);
      setVerified(true);
      setTimeout(() => {
        if (purpose === "reset") {
          navigate("/reset-password", { state: { email, resetToken: data.resetToken } });
        } else {
          navigate("/", { replace: true });
        }
      }, 1000);
    } catch {
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [otp, email, purpose, expired, verifyOTP, navigate]);

  // Auto-submit when all 6 filled
  useEffect(() => {
    if (otp.every(d => d !== "")) handleVerify(otp.join(""));
  }, [otp]); // eslint-disable-line

  // ── Resend ────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!canResend) return;
    try {
      await resendOTP(email, purpose);
      // Reset both timers
      setOtpTimer(OTP_DURATION);
      setResendTimer(RESEND_COOLDOWN);
      setCanResend(false);
      setExpired(false);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch { /* toast shown by store */ }
  };

  if (!email) return null;

  const purposeLabel = purpose === "reset" ? "password reset" : purpose === "signup" ? "registration" : "sign in";

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-2)" }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12"
        style={{ background: "linear-gradient(160deg,var(--blue) 0%,#4f81f5 100%)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-white"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>K</div>
          <span className="text-white font-black text-lg" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>K Mart</span>
        </div>
        <div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            {purpose === "reset" ? "Reset your\npassword 🔑" : purpose === "signup" ? "Almost there! ✅" : "One last step 🔒"}
          </h2>
          <p className="text-blue-200 text-base leading-relaxed">
            We sent a 6-digit OTP to your email to verify your {purposeLabel}.
          </p>
          <div className="mt-8 space-y-3">
            {["Check your inbox and spam folder", "OTP is valid for 3 minutes", "You can resend after 60 seconds"].map(tip => (
              <div key={tip} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                <p className="text-blue-200 text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300 text-sm">© 2025 K Mart</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div className="w-full max-w-sm"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white"
              style={{ background: "var(--blue)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>K</div>
            <span className="font-black text-xl" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--ink)" }}>K Mart</span>
          </div>

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto"
            style={{ background: verified ? "var(--green-pale)" : expired ? "var(--red-pale)" : "var(--blue-pale)" }}>
            {verified
              ? <CheckCircle className="w-7 h-7" style={{ color: "var(--green)" }} />
              : expired
                ? <Clock className="w-7 h-7" style={{ color: "var(--red)" }} />
                : <Mail  className="w-7 h-7" style={{ color: "var(--blue)" }} />}
          </div>

          <h1 className="text-2xl font-black mb-1 text-center" style={{ color: "var(--ink)" }}>
            {verified ? "Verified!" : expired ? "OTP Expired" : "Enter OTP"}
          </h1>
          {!verified && (
            <p className="text-sm mb-1 text-center" style={{ color: "var(--ink-4)" }}>
              {expired ? "Your OTP has expired." : "We sent a 6-digit code to"}
            </p>
          )}
          {!verified && !expired && (
            <p className="text-sm font-semibold mb-6 text-center" style={{ color: "var(--ink-2)" }}>{email}</p>
          )}

          <AnimatePresence mode="wait">
            {verified ? (
              <motion.div key="verified" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-center py-4">
                <p className="text-sm font-medium" style={{ color: "var(--green)" }}>Redirecting you now…</p>
              </motion.div>
            ) : expired ? (
              <motion.div key="expired" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <p className="text-sm mb-5" style={{ color: "var(--ink-4)" }}>
                  Please request a new OTP to continue.
                </p>
                <button onClick={handleResend} disabled={!canResend || loading}
                  className="btn btn-primary w-full justify-center" style={{ padding: ".75rem" }}>
                  {loading
                    ? <><Loader className="w-4 h-4 animate-spin" /> Sending…</>
                    : canResend
                      ? <><RotateCcw className="w-4 h-4" /> Resend OTP</>
                      : `Wait ${formatTime(resendTimer)}`}
                </button>
              </motion.div>
            ) : (
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* OTP boxes */}
                <div className="flex gap-2.5 justify-center mb-5" onPaste={handlePaste}>
                  {otp.map((digit, idx) => (
                    <input key={idx} ref={el => inputRefs.current[idx] = el}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleChange(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      disabled={loading}
                      className="text-center text-xl font-black border-2 rounded-xl outline-none transition-all"
                      style={{
                        width: "48px", height: "56px",
                        borderColor: digit ? "var(--blue)" : "var(--border)",
                        background:  digit ? "var(--blue-pale)" : "#fff",
                        color:       "var(--ink)",
                        boxShadow:   digit ? "0 0 0 3px rgba(37,99,235,.12)" : "none",
                        fontFamily:  "'Inter',sans-serif",
                        opacity:     loading ? 0.6 : 1,
                      }}
                    />
                  ))}
                </div>

                {/* OTP validity timer */}
                <div className="flex items-center justify-center gap-1.5 mb-5">
                  <Clock className="w-3.5 h-3.5" style={{ color: otpTimer < 60 ? "var(--red)" : "var(--ink-4)" }} />
                  <p className="text-xs font-medium tabular-nums"
                    style={{ color: otpTimer < 60 ? "var(--red)" : "var(--ink-4)" }}>
                    OTP expires in{" "}
                    <span className="font-bold">{formatTime(otpTimer)}</span>
                  </p>
                </div>

                {/* Verify button */}
                <button onClick={() => handleVerify()} disabled={loading || otp.join("").length < 6}
                  className="btn btn-primary w-full justify-center" style={{ padding: ".75rem" }}>
                  {loading
                    ? <><Loader className="w-4 h-4 animate-spin" /> Verifying…</>
                    : "Verify OTP"}
                </button>

                {/* Resend section — below the button */}
                <div className="mt-5 text-center">
                  {canResend ? (
                    <button onClick={handleResend} disabled={loading}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold"
                      style={{ color: "var(--blue)" }}>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Resend OTP
                    </button>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--ink-4)" }}>
                      Didn't get the code?{" "}
                      <span className="font-bold tabular-nums" style={{ color: "var(--blue)" }}>
                        Resend in {formatTime(resendTimer)}
                      </span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-sm mt-6" style={{ color: "var(--ink-4)" }}>
            <Link
              to={purpose === "reset" ? "/forgot-password" : purpose === "signup" ? "/signup" : "/login"}
              className="font-semibold" style={{ color: "var(--blue)" }}>
              ← Go back
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
