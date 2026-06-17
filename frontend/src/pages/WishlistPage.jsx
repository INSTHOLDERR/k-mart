import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();
  const { user } = useUserStore();

  const moveToCart = (p) => {
    if(!user){toast.error("Please login");return;}
    addToCart(p); removeFromWishlist(p._id); toast.success("Moved to cart!");
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-2)" }}>
      <div style={{ background:"var(--bg)", borderBottom:"1px solid var(--border)" }} className="py-8">
        <div className="wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"var(--red-pale)" }}>
              <Heart className="w-5 h-5 fill-red-500 text-red-500"/>
            </div>
            <div>
              <h1 className="text-xl font-black" style={{ color:"var(--ink)" }}>My Wishlist</h1>
              <p className="text-sm" style={{ color:"var(--ink-4)" }}>{wishlist.length} saved item{wishlist.length!==1?"s":""}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap py-8">
        {wishlist.length===0 ? (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="text-center py-24">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background:"var(--red-pale)" }}>
              <Heart className="w-10 h-10 text-red-400"/>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color:"var(--ink)" }}>Your wishlist is empty</h2>
            <p className="text-sm mb-7" style={{ color:"var(--ink-4)" }}>Save items you love and come back to them anytime.</p>
            <Link to="/" className="btn btn-primary">Browse Products <ArrowRight className="w-4 h-4"/></Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {wishlist.map((p,i)=>(
                <motion.div key={p._id} layout initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.96}} transition={{delay:i*.04}}>
                  <div className="card card-hover overflow-hidden group">
                    <div className="relative">
                      <Link to={`/product/${p._id}`} className="block aspect-square overflow-hidden" style={{ background:"var(--bg-2)" }}>
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                      </Link>
                      <button onClick={()=>removeFromWishlist(p._id)}
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center shadow-sm"
                        style={{ background:"#fff", border:"1px solid var(--border)" }}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500"/>
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] capitalize mb-0.5" style={{ color:"var(--ink-4)" }}>{p.category}</p>
                      <Link to={`/product/${p._id}`}>
                        <p className="font-semibold text-sm line-clamp-2 mb-2 hover:text-blue-600 transition-colors" style={{ color:"var(--ink)" }}>{p.name}</p>
                      </Link>
                      <p className="font-bold text-sm mb-3" style={{ color:"var(--blue)" }}>₹{p.price}</p>
                      <button onClick={()=>moveToCart(p)} className="btn btn-primary btn-sm w-full justify-center">
                        <ShoppingCart className="w-3.5 h-3.5"/> Move to Cart
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
