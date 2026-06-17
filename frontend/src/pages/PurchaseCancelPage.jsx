import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
export default function PurchaseCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background:"var(--bg-2)" }}>
      <motion.div className="card p-8 text-center max-w-sm w-full" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.45}}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background:"var(--red-pale)" }}>
          <XCircle className="w-8 h-8" style={{ color:"var(--red)" }}/>
        </div>
        <h1 className="text-2xl font-black mb-2" style={{ color:"var(--ink)" }}>Payment Cancelled</h1>
        <p className="text-sm mb-2" style={{ color:"var(--ink-3)" }}>Your order has been cancelled. No charges have been made.</p>
        <p className="text-xs mb-7" style={{ color:"var(--ink-4)" }}>If you encountered any issues, please contact our support team.</p>
        <div className="space-y-3">
          <Link to="/cart" className="btn btn-primary w-full justify-center">
            <RefreshCw className="w-4 h-4"/> Try Again
          </Link>
          <Link to="/" className="btn btn-outline w-full justify-center">
            <ArrowLeft className="w-4 h-4"/> Return to Shop
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
