import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const OrderSummary = () => {
  const { total, subtotal, coupon, isCouponApplied, cart } = useCartStore();
  const savings = subtotal - total;
  const handlePayment = async () => {
    const stripe = await stripePromise;
    const res = await axios.post("/payments/create-checkout-session",{ products:cart, couponCode:coupon?.code||null });
    const result = await stripe.redirectToCheckout({ sessionId:res.data.id });
    if(result.error) console.error(result.error);
  };
  return (
    <motion.div className="card p-5 space-y-4" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.35}}>
      <p className="font-bold text-base" style={{ color:"var(--ink)" }}>Order Summary</p>
      <div className="space-y-2.5">
        <div className="flex justify-between text-sm">
          <span style={{ color:"var(--ink-3)" }}>Subtotal</span>
          <span style={{ color:"var(--ink)" }}>₹{subtotal.toFixed(2)}</span>
        </div>
        {savings>0 && (
          <div className="flex justify-between text-sm">
            <span style={{ color:"var(--ink-3)" }}>Savings</span>
            <span style={{ color:"var(--green)" }}>−₹{savings.toFixed(2)}</span>
          </div>
        )}
        {coupon&&isCouponApplied && (
          <div className="flex justify-between text-sm">
            <span style={{ color:"var(--ink-3)" }}>Coupon ({coupon.code})</span>
            <span style={{ color:"var(--green)" }}>−{coupon.discountPercentage}%</span>
          </div>
        )}
        <div className="flex justify-between font-bold pt-2.5" style={{ borderTop:"1px solid var(--border)" }}>
          <span style={{ color:"var(--ink)" }}>Total</span>
          <span style={{ color:"var(--blue)" }}>₹{total.toFixed(2)}</span>
        </div>
      </div>
      <button onClick={handlePayment} className="btn btn-primary w-full justify-center" style={{ padding:".75rem" }}>
        Proceed to Checkout <ArrowRight className="w-4 h-4"/>
      </button>
      <div className="text-center">
        <Link to="/" className="text-xs font-medium" style={{ color:"var(--ink-4)" }}>Continue Shopping</Link>
      </div>
    </motion.div>
  );
};
export default OrderSummary;
