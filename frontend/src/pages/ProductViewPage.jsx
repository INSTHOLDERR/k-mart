import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Heart, Star, ChevronLeft, ChevronRight,
  Truck, Shield, Leaf, Plus, Minus, Check, X,
  ZoomIn, Package, AlertTriangle
} from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useUserStore } from "../stores/useUserStore";
import { ProductCard } from "./HomePage";
import toast from "react-hot-toast";

/* ─────────────────────────────────────────────────────────────────
   FULL-SCREEN LIGHTBOX
───────────────────────────────────────────────────────────────── */
function ImageLightbox({ images, startIdx = 0, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const all = images?.length ? images : [];

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") setIdx(i => Math.min(all.length - 1, i + 1));
      if (e.key === "ArrowLeft")  setIdx(i => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [all.length, onClose]);

  if (!all.length) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,.93)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
        style={{ background: "rgba(255,255,255,.14)", color: "#fff" }}
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </button>

      {all.length > 1 && (
        <p className="absolute top-5 left-1/2 -translate-x-1/2 text-sm font-semibold"
          style={{ color: "rgba(255,255,255,.55)" }}>
          {idx + 1} / {all.length}
        </p>
      )}

      <motion.div
        key={idx}
        className="relative flex items-center justify-center px-14 md:px-20"
        style={{ maxWidth: "95vw", maxHeight: "82vh" }}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .18 }}
      >
        <img
          src={all[idx]}
          alt={`${idx + 1}`}
          className="rounded-2xl object-contain shadow-2xl"
          style={{ maxHeight: "78vh", maxWidth: "88vw" }}
        />
        {idx > 0 && (
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}
            onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {idx < all.length - 1 && (
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}
            onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </motion.div>

      {all.length > 1 && (
        <div className="flex gap-2 mt-4 px-4 overflow-x-auto max-w-lg pb-1"
          onClick={e => e.stopPropagation()}>
          {all.map((img, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className="shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all"
              style={{ borderColor: i === idx ? "#fff" : "rgba(255,255,255,.2)", opacity: i === idx ? 1 : .5 }}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PRODUCT VIEW PAGE
───────────────────────────────────────────────────────────────── */
export default function ProductViewPage() {
  const { id }    = useParams();
  const { products, fetchAllProducts } = useProductStore();
  const { addToCart }  = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { user }  = useUserStore();

  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [qty,      setQty]      = useState(1);
  const [imgIdx,   setImgIdx]   = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [added,    setAdded]    = useState(false);

  useEffect(() => {
    setLoading(true); setImgIdx(0); setQty(1);
    if (products.length) {
      const p = products.find(p => p._id === id);
      if (p) { setProduct(p); setLoading(false); return; }
    }
    fetchAllProducts().then(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (products.length) {
      const p = products.find(p => p._id === id);
      if (p) { setProduct(p); setLoading(false); }
    }
  }, [products, id]);

  const allImgs  = product?.images?.length ? product.images : product?.image ? [product.image] : [];
  const similar  = products.filter(p => p.category === product?.category && p._id !== id).slice(0, 5);
  const inWish   = product ? isInWishlist(product._id) : false;
  const discount = product?.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : null;
  const isOOS    = product ? (product.quantity === 0 || product.isInStock === false) : false;
  const isLow    = product && !isOOS && product.quantity > 0 && product.quantity <= 5;
  const maxQty   = product?.quantity > 0 ? product.quantity : 99;

  const handleAddCart = () => {
    if (!user)  { toast.error("Please login"); return; }
    if (isOOS)  { toast.error("This product is out of stock"); return; }
    if (qty > maxQty) { toast.error(`Only ${maxQty} unit(s) available`); return; }
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleWish = () => {
    if (!user) { toast.error("Please login"); return; }
    inWish ? removeFromWishlist(product._id) : addToWishlist(product);
  };

  /* ── Skeleton ── */
  if (loading) return (
    <div className="wrap py-12">
      <div className="grid md:grid-cols-2 gap-10 animate-pulse">
        <div className="skeleton aspect-square rounded-3xl" />
        <div className="space-y-4 pt-4">
          <div className="skeleton h-7 w-2/3 rounded-xl" />
          <div className="skeleton h-9 w-1/2 rounded-xl" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="skeleton h-12 rounded-2xl" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="wrap py-24 text-center">
      <p className="text-5xl mb-4">😕</p>
      <h2 className="text-2xl font-black mb-4" style={{ color: "var(--blue)" }}>Product not found</h2>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );

  return (
    <>
      <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
        <div className="wrap py-6 md:py-10">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs mb-6" style={{ color: "var(--ink-4)" }}>
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>/</span>
            <Link to={`/category/${product.category}`}
              className="hover:text-blue-600 transition-colors capitalize">{product.category}</Link>
            <span>/</span>
            <span className="truncate max-w-[180px]" style={{ color: "var(--ink)" }}>{product.name}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-14">

            {/* ── Gallery ── */}
            <div>
              {/* Main image */}
              <motion.div
                key={imgIdx}
                className="relative rounded-2xl overflow-hidden aspect-square mb-3 cursor-zoom-in"
                style={{ background: "var(--bg-3)" }}
                initial={{ opacity: .8, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .2 }}
                onClick={() => setLightbox(true)}
              >
                {/* Badges */}
                {isOOS && (
                  <div className="absolute top-4 left-4 z-10 badge badge-red px-3 py-1">Out of Stock</div>
                )}
                {!isOOS && discount && (
                  <div className="absolute top-4 left-4 z-10 badge badge-red px-3 py-1">{discount}% OFF</div>
                )}
                {isLow && (
                  <div className="absolute top-4 left-4 z-10 badge badge-yellow px-3 py-1">
                    Only {product.quantity} left!
                  </div>
                )}

                {/* Zoom hint */}
                <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,.3)", color: "#fff" }}>
                  <ZoomIn className="w-4 h-4" />
                </div>

                <img src={allImgs[imgIdx] || product.image} alt={product.name}
                  className="w-full h-full object-cover" />

                {/* OOS overlay */}
                {isOOS && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ background: "rgba(255,255,255,.65)", backdropFilter: "blur(3px)" }}>
                    <Package className="w-12 h-12 mb-2" style={{ color: "var(--red)" }} />
                    <p className="text-base font-black" style={{ color: "var(--red)" }}>Out of Stock</p>
                  </div>
                )}

                {/* Prev / Next */}
                {allImgs.length > 1 && !isOOS && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); setImgIdx(i => Math.max(0, i - 1)); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:scale-110 transition-all">
                      <ChevronLeft className="w-4 h-4" style={{ color: "var(--blue)" }} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setImgIdx(i => Math.min(allImgs.length - 1, i + 1)); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:scale-110 transition-all">
                      <ChevronRight className="w-4 h-4" style={{ color: "var(--blue)" }} />
                    </button>
                  </>
                )}
              </motion.div>

              {/* Thumbnails */}
              {allImgs.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImgs.map((img, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all"
                      style={{ borderColor: i === imgIdx ? "var(--blue)" : "var(--border)" }}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Product info ── */}
            <div>
              <p className="text-sm font-medium capitalize mb-2" style={{ color: "var(--ink-4)" }}>
                {product.category}
              </p>
              <h1 className="text-2xl md:text-3xl font-black mb-3 leading-tight" style={{ color: "var(--ink)" }}>
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>4.2</span>
                <span className="text-xs" style={{ color: "var(--ink-4)" }}>(48 reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-3xl font-black" style={{ color: "var(--blue)" }}>₹{product.price}</span>
                {product.originalPrice && (
                  <span className="text-lg line-through" style={{ color: "var(--ink-4)" }}>₹{product.originalPrice}</span>
                )}
                {product.unit && (
                  <span className="text-sm" style={{ color: "var(--ink-4)" }}>per {product.unit}</span>
                )}
              </div>

              {/* Stock status banner */}
              {isOOS ? (
                <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl"
                  style={{ background: "var(--red-pale)", border: "1px solid #fecaca" }}>
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "var(--red)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--red)" }}>
                    Currently out of stock — check back soon!
                  </p>
                </div>
              ) : isLow ? (
                <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl"
                  style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#d97706" }} />
                  <p className="text-sm font-semibold" style={{ color: "#d97706" }}>
                    Only {product.quantity} left — order soon!
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl"
                  style={{ background: "var(--green-pale)", border: "1px solid #bbf7d0" }}>
                  <Check className="w-4 h-4 shrink-0" style={{ color: "var(--green)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--green)" }}>
                    In stock · Same day delivery
                  </p>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--ink-2)" }}>
                  {product.description}
                </p>
              )}

              {/* Quantity selector */}
              {!isOOS && (
                <div className="flex items-center gap-4 mb-5">
                  <p className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}>Quantity</p>
                  <div className="flex items-center rounded-xl overflow-hidden"
                    style={{ border: "1.5px solid var(--border)" }}>
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <Minus className="w-4 h-4" style={{ color: "var(--ink-2)" }} />
                    </button>
                    <span className="w-10 text-center text-sm font-bold" style={{ color: "var(--ink)" }}>{qty}</span>
                    <button
                      onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <Plus className="w-4 h-4" style={{ color: "var(--ink-2)" }} />
                    </button>
                  </div>
                  {product.quantity > 0 && (
                    <span className="text-xs" style={{ color: "var(--ink-4)" }}>
                      {product.quantity} available
                    </span>
                  )}
                </div>
              )}

              {/* CTA */}
              <div className="flex gap-3 mb-6">
                <motion.button
                  onClick={handleAddCart}
                  disabled={isOOS}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all"
                  style={{
                    background: isOOS ? "var(--bg-3)" : added ? "var(--green)" : "var(--blue)",
                    color:      isOOS ? "var(--ink-4)" : "#fff",
                    cursor:     isOOS ? "not-allowed" : "pointer",
                  }}
                  whileHover={!isOOS ? { scale: 1.02 } : {}}
                  whileTap={!isOOS ? { scale: .98 } : {}}
                >
                  <AnimatePresence mode="wait">
                    {added ? (
                      <motion.span key="added" className="flex items-center gap-2"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <Check className="w-4 h-4" /> Added to Cart!
                      </motion.span>
                    ) : (
                      <motion.span key="add" className="flex items-center gap-2"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <ShoppingCart className="w-4 h-4" />
                        {isOOS ? "Out of Stock" : "Add to Cart"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <button
                  onClick={handleWish}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    background: inWish ? "#fef2f2" : "var(--bg-2)",
                    border: `2px solid ${inWish ? "#fca5a5" : "var(--border)"}`,
                  }}>
                  <Heart className={`w-5 h-5 transition-colors ${inWish ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
                </button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Truck,  label: "Free Delivery", sub: "₹499+"         },
                  { icon: Shield, label: "Fresh Guarantee", sub: "Full refund" },
                  { icon: Leaf,   label: "Farm Direct",   sub: "No chemicals"  },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex flex-col items-center text-center p-3 rounded-xl"
                    style={{ background: "var(--blue-pale)" }}>
                    <Icon className="w-5 h-5 mb-1" style={{ color: "var(--blue)" }} />
                    <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{label}</p>
                    <p className="text-[10px]" style={{ color: "var(--ink-4)" }}>{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Similar products */}
          {similar.length > 0 && (
            <section className="mt-14">
              <h2 className="text-2xl font-black mb-6" style={{ color: "var(--blue)" }}>
                You might also like
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {similar.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <ImageLightbox images={allImgs} startIdx={imgIdx} onClose={() => setLightbox(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
