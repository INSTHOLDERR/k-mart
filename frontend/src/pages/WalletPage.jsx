import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet, Plus, ArrowUpRight, ArrowDownLeft,
  RefreshCw, CreditCard, CheckCircle
} from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function WalletPage() {
  const [balance, setBalance]           = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [rechargeAmt, setRechargeAmt]   = useState("");
  const [recharging, setRecharging]     = useState(false);
  const [searchParams]                  = useSearchParams();

  useEffect(() => {
    // Handle recharge success redirect
    const sessionId = searchParams.get("session_id");
    const success   = searchParams.get("recharge_success");
    const cancel    = searchParams.get("recharge_cancel");

    if (success && sessionId) {
      handleRechargeSuccess(sessionId);
    } else if (cancel) {
      toast.error("Recharge cancelled");
    }

    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const { data } = await axios.get("/users/me/wallet");
      setBalance(data.balance);
      setTransactions(data.transactions);
    } catch {
      toast.error("Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleRechargeSuccess = async (sessionId) => {
    try {
      const { data } = await axios.post("/users/me/wallet/recharge-success", { sessionId });
      if (!data.alreadyProcessed) {
        toast.success("Wallet recharged successfully! 💰");
        fetchWallet();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecharge = async () => {
    const amt = parseFloat(rechargeAmt);
    if (!amt || amt < 10) { toast.error("Minimum recharge is ₹10"); return; }

    setRecharging(true);
    try {
      const { data } = await axios.post("/users/me/wallet/recharge", { amount: amt });
      const stripe   = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: data.id });
    } catch (e) {
      toast.error(e.response?.data?.message || "Recharge failed");
    } finally {
      setRecharging(false);
    }
  };

  const quickAmounts = [100, 250, 500, 1000];

  if (loading) {
    return (
      <div className="wrap py-20 text-center">
        <div className="inline-block w-8 h-8 rounded-full border-4 animate-spin"
          style={{ borderColor: "var(--blue-light)", borderTopColor: "var(--blue)" }} />
        <p className="mt-3 text-sm" style={{ color: "var(--ink-4)" }}>Loading wallet…</p>
      </div>
    );
  }

  return (
    <div className="wrap py-8 max-w-2xl">
      <h1 className="text-2xl font-black mb-6" style={{ color: "var(--ink)" }}>My Wallet</h1>

      {/* Balance card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 mb-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: "#fff" }} />
        <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full opacity-10"
          style={{ background: "#fff" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 opacity-80">
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-semibold">K Mart Wallet</span>
          </div>
          <p className="text-4xl font-black mb-1">₹{balance.toFixed(2)}</p>
          <p className="text-sm opacity-70">Available Balance</p>
        </div>
      </motion.div>

      {/* Recharge section */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-5 mb-6">
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--ink)" }}>
          <Plus className="w-4 h-4" style={{ color: "var(--blue)" }} />
          Add Money
        </h2>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-4">
          {quickAmounts.map(amt => (
            <button key={amt}
              onClick={() => setRechargeAmt(String(amt))}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: rechargeAmt === String(amt) ? "var(--blue)" : "var(--blue-pale)",
                color:      rechargeAmt === String(amt) ? "#fff" : "var(--blue)",
                border:     "1.5px solid",
                borderColor: rechargeAmt === String(amt) ? "var(--blue)" : "var(--blue-light)",
              }}>
              ₹{amt}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: "var(--ink-3)" }}>₹</span>
            <input
              type="number"
              value={rechargeAmt}
              onChange={e => setRechargeAmt(e.target.value)}
              placeholder="Enter amount"
              className="w-full pl-7 pr-4 py-3 rounded-xl text-sm font-semibold"
              style={{
                border: "1.5px solid var(--border)",
                outline: "none",
                color: "var(--ink)",
                background: "var(--bg-2)",
              }}
            />
          </div>
          <button
            onClick={handleRecharge}
            disabled={recharging || !rechargeAmt}
            className="btn btn-primary px-6">
            <CreditCard className="w-4 h-4" />
            {recharging ? "Redirecting…" : "Pay"}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--ink-4)" }}>
          Secured by Stripe · Minimum ₹10
        </p>
      </motion.div>

      {/* Transactions */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-5">
        <h2 className="font-bold mb-4" style={{ color: "var(--ink)" }}>Transaction History</h2>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--ink-5)" }} />
            <p className="text-sm" style={{ color: "var(--ink-4)" }}>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0"
                style={{ borderColor: "var(--border)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: tx.type === "credit" ? "var(--green-pale)" : "var(--red-pale)",
                  }}>
                  {tx.type === "credit"
                    ? <ArrowDownLeft className="w-4 h-4" style={{ color: "var(--green)" }} />
                    : <ArrowUpRight  className="w-4 h-4" style={{ color: "var(--red)" }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1" style={{ color: "var(--ink)" }}>
                    {tx.description}
                  </p>
                  <p className="text-xs" style={{ color: "var(--ink-4)" }}>
                    {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                <p className="font-black text-sm shrink-0"
                  style={{ color: tx.type === "credit" ? "var(--green)" : "var(--red)" }}>
                  {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toFixed(0)}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
