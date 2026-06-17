import { CheckCircle, ArrowRight, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";
import Confetti from "react-confetti";

export default function PurchaseSuccessPage() {
  const [processing, setProcessing] = useState(true);
  const [error,      setError]      = useState(null);
  const [orderId,    setOrderId]    = useState(null);
  const { clearCart } = useCartStore();

  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const method    = params.get("method");
    const oid       = params.get("orderId");

    if (method === "cod") {
      // COD — no Stripe session needed
      clearCart();
      setOrderId(oid);
      setProcessing(false);
      return;
    }

    if (!sessionId) {
      setError("No session ID found in URL.");
      setProcessing(false);
      return;
    }

    axios.post("/payments/checkout-success", { sessionId })
      .then(r => setOrderId(r.data.orderId))
      .catch(e => console.error("checkout-success:", e))
      .finally(() => { clearCart(); setProcessing(false); });
  }, []);

  if (processing) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-2)" }}>
      <div className="w-9 h-9 rounded-full border-4 animate-spin"
        style={{ borderColor: "var(--blue-light)", borderTopColor: "var(--blue)" }} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-2)" }}>
      <div className="card p-8 text-center max-w-sm w-full">
        <p className="font-semibold mb-4" style={{ color: "var(--red)" }}>{error}</p>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-2)" }}>
      <Confetti width={window.innerWidth} height={window.innerHeight}
        gravity={0.1} numberOfPieces={600} recycle={false} style={{ zIndex: 99 }} />
      <motion.div className="card p-8 text-center max-w-sm w-full relative z-10"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "var(--green-pale)" }}>
          <CheckCircle className="w-8 h-8" style={{ color: "var(--green)" }} />
        </div>
        <h1 className="text-2xl font-black mb-2" style={{ color: "var(--ink)" }}>Order Placed! 🎉</h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>
          Thank you! Your order is confirmed and being processed.
        </p>
        <div className="rounded-xl p-4 mb-6 text-left space-y-2.5" style={{ background: "var(--bg-2)" }}>
          {orderId && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--ink-3)" }}>Order ID</span>
              <span className="font-mono font-bold" style={{ color: "var(--blue)" }}>
                #{String(orderId).slice(-8).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--ink-3)" }}>Estimated delivery</span>
            <span className="font-semibold" style={{ color: "var(--ink)" }}>Same day / Next day</span>
          </div>
        </div>
        <div className="space-y-3">
          <Link to="/orders" className="btn btn-primary w-full justify-center">
            <Package className="w-4 h-4" /> Track Order
          </Link>
          <Link to="/" className="btn btn-outline w-full justify-center">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
