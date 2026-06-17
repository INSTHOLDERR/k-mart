import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCartStore } from "../stores/useCartStore";
import { Tag, X, Check } from "lucide-react";
const GiftCouponCard = () => {
  const [code, setCode] = useState("");
  const { coupon, isCouponApplied, applyCoupon, getMyCoupon, removeCoupon } = useCartStore();
  useEffect(()=>{ getMyCoupon(); },[getMyCoupon]);
  useEffect(()=>{ if(coupon) setCode(coupon.code); },[coupon]);
  return (
    <motion.div className="card p-4" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.35,delay:.1}}>
      <p className="text-sm font-semibold mb-3" style={{ color:"var(--ink)" }}>Have a coupon?</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:"var(--ink-4)" }}/>
          <input type="text" placeholder="Enter code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}
            className="input pl-9" style={{ fontSize:".8125rem" }}/>
        </div>
        <button onClick={()=>code&&applyCoupon(code)} className="btn btn-primary btn-sm" style={{ padding:".65rem 1rem" }}>Apply</button>
      </div>
      {isCouponApplied && coupon && (
        <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg"
          style={{ background:"var(--green-pale)", border:"1px solid #bbf7d0" }}>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" style={{ color:"var(--green)" }}/>
            <span className="text-sm font-semibold" style={{ color:"var(--green)" }}>{coupon.code} — {coupon.discountPercentage}% off</span>
          </div>
          <button onClick={async()=>{ await removeCoupon(); setCode(""); }} className="btn btn-icon" style={{ color:"var(--green)" }}>
            <X className="w-3.5 h-3.5"/>
          </button>
        </div>
      )}
      {coupon && !isCouponApplied && (
        <p className="mt-2 text-xs" style={{ color:"var(--ink-4)" }}>Available: {coupon.code} ({coupon.discountPercentage}% off)</p>
      )}
    </motion.div>
  );
};
export default GiftCouponCard;
