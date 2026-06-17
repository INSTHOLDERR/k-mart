import { Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
export default function CartItem({ item }) {
  const { removeFromCart, updateQuantity } = useCartStore();
  return (
    <div className="card p-4 flex gap-4 items-center">
      <Link to={`/product/${item._id}`} className="shrink-0">
        <div className="w-20 h-20 rounded-xl overflow-hidden" style={{ background:"var(--bg-2)" }}>
          <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] capitalize mb-0.5" style={{ color:"var(--ink-4)" }}>{item.category}</p>
        <Link to={`/product/${item._id}`}>
          <p className="font-semibold text-sm leading-snug line-clamp-2 hover:text-blue-600 transition-colors" style={{ color:"var(--ink)" }}>{item.name}</p>
        </Link>
        <p className="font-bold text-sm mt-1.5" style={{ color:"var(--blue)" }}>₹{(item.price*item.quantity).toFixed(0)}</p>
      </div>
      <div className="flex flex-col items-end gap-3 shrink-0">
        <div className="flex items-center rounded-lg overflow-hidden" style={{ border:"1px solid var(--border)" }}>
          <button onClick={()=>updateQuantity(item._id,item.quantity-1)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Minus className="w-3.5 h-3.5" style={{ color:"var(--ink-2)" }}/>
          </button>
          <span className="w-8 text-center text-sm font-semibold" style={{ color:"var(--ink)" }}>{item.quantity}</span>
          <button onClick={()=>updateQuantity(item._id,item.quantity+1)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Plus className="w-3.5 h-3.5" style={{ color:"var(--ink-2)" }}/>
          </button>
        </div>
        <button onClick={()=>removeFromCart(item._id)}
          className="flex items-center gap-1 text-xs hover:text-red-600 transition-colors" style={{ color:"var(--ink-4)" }}>
          <Trash2 className="w-3.5 h-3.5"/> Remove
        </button>
      </div>
    </div>
  );
}
