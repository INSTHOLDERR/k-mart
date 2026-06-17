// Shows inline stock warnings on product cards and cart items
import { AlertTriangle, Package } from "lucide-react";

export function StockBadge({ quantity, className = "" }) {
  if (quantity === undefined || quantity === null) return null;
  if (quantity === 0)
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${className}`}
        style={{ background: "#fef2f2", color: "#dc2626" }}>
        <AlertTriangle className="w-3 h-3"/> Out of stock
      </span>
    );
  if (quantity <= 5)
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${className}`}
        style={{ background: "#fefce8", color: "#ca8a04" }}>
        <AlertTriangle className="w-3 h-3"/> Only {quantity} left
      </span>
    );
  return null; // plenty in stock — no need to show
}

export function OutOfStockOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ background: "rgba(255,255,255,.85)", backdropFilter: "blur(2px)" }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
        style={{ background: "#fef2f2" }}>
        <Package className="w-5 h-5" style={{ color: "#dc2626" }}/>
      </div>
      <p className="text-xs font-bold" style={{ color: "#dc2626" }}>Out of Stock</p>
    </div>
  );
}
