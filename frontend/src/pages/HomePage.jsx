import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Truck, ShieldCheck, Clock, Leaf, ShoppingCart, Heart, Zap, Tag, ChevronRight, X, ZoomIn, Package } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useUserStore } from "../stores/useUserStore";
import axios from "../lib/axios";
import toast from "react-hot-toast";

/* ─────────────────────────────────────────────────────────────────────────────
   IMAGE LIGHTBOX  (click any product image to open)
───────────────────────────────────────────────────────────────────────────── */
function ImageLightbox({ images, startIdx = 0, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const all = images?.length ? images : [];

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
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
      style={{ background: "rgba(0,0,0,.92)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
        style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      {all.length > 1 && (
        <p className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-semibold" style={{ color: "rgba(255,255,255,.6)" }}>
          {idx + 1} / {all.length}
        </p>
      )}

      {/* Main image */}
      <motion.div
        key={idx}
        className="relative flex items-center justify-center px-16"
        style={{ maxWidth: "90vw", maxHeight: "80vh" }}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .18 }}
      >
        <img
          src={all[idx]}
          alt={`Image ${idx + 1}`}
          className="rounded-2xl object-contain shadow-2xl"
          style={{ maxHeight: "75vh", maxWidth: "85vw" }}
        />
        {/* Prev / Next arrows */}
        {idx > 0 && (
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}
            onClick={() => setIdx(i => i - 1)}
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        )}
        {idx < all.length - 1 && (
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}
            onClick={() => setIdx(i => i + 1)}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </motion.div>

      {/* Thumbnail strip */}
      {all.length > 1 && (
        <div className="flex gap-2 mt-4 px-4 overflow-x-auto max-w-lg" onClick={e => e.stopPropagation()}>
          {all.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all"
              style={{ borderColor: i === idx ? "#fff" : "rgba(255,255,255,.2)", opacity: i === idx ? 1 : 0.55 }}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PRODUCT CARD  (used on homepage, category page, search page)
───────────────────────────────────────────────────────────────────────────── */
export function ProductCard({ product }) {
  const { user }    = useUserStore();
  const { addToCart } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const [lightbox, setLightbox] = useState(false);
  const inWish   = isInWishlist(product._id);
  const pct      = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : null;
  const isOOS    = product.quantity === 0 || product.isInStock === false;
  const isLow    = !isOOS && product.quantity > 0 && product.quantity <= 5;
  const allImgs  = product.images?.length ? product.images : product.image ? [product.image] : [];

  const cartClick = (e) => {
    e.preventDefault();
    if (!user) { toast.error("Please login to add to cart"); return; }
    if (isOOS)  { toast.error("This product is out of stock"); return; }
    addToCart(product);
  };

  const wishClick = (e) => {
    e.preventDefault();
    if (!user) { toast.error("Please login"); return; }
    inWish ? removeFromWishlist(product._id) : addToWishlist(product);
  };

  return (
    <>
      <div className={`card group relative flex flex-col overflow-hidden transition-all duration-200
        ${!isOOS ? "card-hover" : "opacity-80"}`}
      >
        {/* Badges */}
        {isOOS && (
          <div className="absolute top-2.5 left-2.5 z-10 badge badge-red">Out of stock</div>
        )}
        {!isOOS && pct && (
          <div className="absolute top-2.5 left-2.5 z-10 badge badge-red">{pct}% off</div>
        )}
        {isLow && !isOOS && (
          <div className="absolute top-2.5 left-2.5 z-10 badge badge-yellow">Only {product.quantity} left</div>
        )}

        {/* Wishlist */}
        <button
          onClick={wishClick}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110"
          style={{ background: "#fff", border: "1px solid var(--border)" }}
        >
          <Heart className={`w-3.5 h-3.5 transition-colors ${inWish ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>

        {/* Image — clicking opens lightbox */}
        <div
          className="relative cursor-zoom-in overflow-hidden"
          style={{ background: "var(--bg-2)" }}
          onClick={() => allImgs.length && setLightbox(true)}
        >
          <div className="aspect-square overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-500 ${!isOOS ? "group-hover:scale-105" : ""}`}
              loading="lazy"
            />
          </div>
          {/* Multiple images indicator */}
          {allImgs.length > 1 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}>
              <ZoomIn className="w-3 h-3" /> {allImgs.length}
            </div>
          )}
          {/* OOS overlay */}
          {isOOS && (
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: "rgba(255,255,255,.7)", backdropFilter: "blur(2px)" }}>
              <Package className="w-8 h-8 mb-1" style={{ color: "var(--red)" }} />
              <p className="text-xs font-bold" style={{ color: "var(--red)" }}>Out of Stock</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          <p className="text-[11px] font-medium capitalize mb-0.5" style={{ color: "var(--ink-4)" }}>
            {product.category}
          </p>
          <Link to={`/product/${product._id}`}>
            <h3 className="text-sm font-semibold leading-snug mb-2 line-clamp-2 hover:text-blue-600 transition-colors"
              style={{ color: "var(--ink)" }}>
              {product.name}
            </h3>
          </Link>
          <div className="flex items-baseline gap-1.5 mb-3 mt-auto">
            <span className="font-bold text-sm" style={{ color: "var(--blue)" }}>₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs line-through" style={{ color: "var(--ink-4)" }}>₹{product.originalPrice}</span>
            )}
            {product.unit && (
              <span className="text-xs" style={{ color: "var(--ink-4)" }}>/{product.unit}</span>
            )}
          </div>
          <button
            onClick={cartClick}
            disabled={isOOS}
            className="btn btn-sm w-full justify-center transition-all"
            style={{
              background: isOOS ? "var(--bg-3)" : "var(--bg-2)",
              color: isOOS ? "var(--ink-4)" : "var(--ink-2)",
              border: "1px solid var(--border)",
              cursor: isOOS ? "not-allowed" : "pointer",
            }}
            onMouseEnter={e => {
              if (!isOOS) {
                e.currentTarget.style.background = "var(--blue)";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = "var(--blue)";
              }
            }}
            onMouseLeave={e => {
              if (!isOOS) {
                e.currentTarget.style.background = "var(--bg-2)";
                e.currentTarget.style.color = "var(--ink-2)";
                e.currentTarget.style.borderColor = "var(--border)";
              }
            }}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {isOOS ? "Out of Stock" : "Add to cart"}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <ImageLightbox images={allImgs} startIdx={0} onClose={() => setLightbox(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────────────────────────────────────────── */
const BANNERS = [
  { tag: "Today's Deal",    title: "Farm-Fresh Vegetables", sub: "Up to 40% off daily harvest", emoji: "🥬", from: "#2563eb", to: "#4f81f5" },
  { tag: "Weekend Special", title: "Organic Fruits",        sub: "Buy 2 Get 1 Free",             emoji: "🍓", from: "#0d9488", to: "#14b8a6" },
  { tag: "New Arrival",     title: "Artisan Bakery",        sub: "Baked fresh every morning",    emoji: "🥐", from: "#7c3aed", to: "#a78bfa" },
];
const TRUST = [
  { icon: Truck,      label: "Free Delivery", sub: "Orders ₹499+",      bg: "var(--blue-pale)",   ic: "var(--blue)"   },
  { icon: ShieldCheck,label: "100% Fresh",   sub: "Quality guaranteed", bg: "var(--green-pale)",  ic: "var(--green)"  },
  { icon: Clock,      label: "Same Day",     sub: "Order by 4 PM",      bg: "var(--yellow-pale)", ic: "var(--yellow)" },
  { icon: Leaf,       label: "Farm Direct",  sub: "Zero middlemen",     bg: "var(--purple-pale)", ic: "var(--purple)" },
];
const PALETTES = [
  "var(--blue-pale)", "var(--green-pale)", "var(--yellow-pale)", "var(--orange-pale)",
  "var(--purple-pale)", "var(--red-pale)", "#f0fdfa", "#fffbeb",
];

export default function HomePage() {
  const { fetchFeaturedProducts, products } = useProductStore();
  const [bannerIdx, setBannerIdx] = useState(0);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchFeaturedProducts();
    axios.get("/categories").then(r => setCategories(r.data.categories || [])).catch(() => {});
    const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4500);
    return () => clearInterval(t);
  }, [fetchFeaturedProducts]);

  const inStockProducts = products.filter(p => (p.quantity ?? 1) > 0);

  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
        <div className="wrap py-10 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .55 }}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
                style={{ background: "var(--blue-light)", color: "var(--blue)" }}>
                <Zap className="w-3 h-3 fill-current" /> Express delivery in 30 mins
              </div>
              <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4" style={{ color: "var(--ink)" }}>
                Fresh groceries,<br />
                <span style={{ color: "var(--blue)" }}>right at your door</span>
              </h1>
              <p className="text-base mb-7 leading-relaxed" style={{ color: "var(--ink-3)" }}>
                Kerala's freshest online grocery — premium quality produce delivered the same day.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to={categories[0] ? `/category/${categories[0].name}` : "#"} className="btn btn-lg btn-primary">
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to={categories[1] ? `/category/${categories[1].name}` : "#"} className="btn btn-lg btn-outline">
                  Today's Deals
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .55, delay: .1 }}>
              <AnimatePresence mode="wait">
                <motion.div key={bannerIdx}
                  className="rounded-2xl p-8 text-white relative overflow-hidden min-h-[210px] flex flex-col justify-between"
                  style={{ background: `linear-gradient(135deg,${BANNERS[bannerIdx].from},${BANNERS[bannerIdx].to})` }}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .32 }}>
                  <div>
                    <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
                      style={{ background: "rgba(255,255,255,.18)" }}>
                      {BANNERS[bannerIdx].tag}
                    </span>
                    <h2 className="text-2xl font-black mb-1">{BANNERS[bannerIdx].title}</h2>
                    <p className="text-sm opacity-80 mb-5">{BANNERS[bannerIdx].sub}</p>
                    <Link to={categories[0] ? `/category/${categories[0].name}` : "#"}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-white/20 hover:bg-white/30 transition-colors">
                      Shop Now <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="absolute right-6 bottom-4 text-6xl" style={{ opacity: .85, transform: "rotate(-8deg)" }}>
                    {BANNERS[bannerIdx].emoji}
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-center gap-2 mt-3">
                {BANNERS.map((_, i) => (
                  <button key={i} onClick={() => setBannerIdx(i)}
                    className="rounded-full transition-all duration-300"
                    style={{ width: i === bannerIdx ? 20 : 7, height: 7, background: i === bannerIdx ? "var(--blue)" : "var(--border-2)" }} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust ──────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--border)", background: "#fff" }}>
        <div className="wrap py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TRUST.map(({ icon: Icon, label, sub, bg, ic }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: bg }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white">
                  <Icon className="w-4 h-4" style={{ color: ic }} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none" style={{ color: "var(--ink)" }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--ink-4)" }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-2xl md:text-3xl font-black" style={{ color: "var(--ink)" }}>Shop by Category</h2>
                <p className="text-sm mt-1" style={{ color: "var(--ink-4)" }}>Everything fresh, everything you need</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {categories.map((cat, i) => (
                <motion.div key={cat._id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .05 }}>
                  <Link to={`/category/${cat.name}`}
                    className="block rounded-xl text-center overflow-hidden group transition-all hover:-translate-y-1 hover:shadow-md"
                    style={{ background: PALETTES[i % PALETTES.length], border: "1px solid var(--border)" }}>
                    {cat.image ? (
                      <div className="aspect-square overflow-hidden">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                      </div>
                    ) : (
                      <div className="aspect-square flex items-center justify-center">
                        <Tag className="w-8 h-8" style={{ color: "var(--blue)" }} />
                      </div>
                    )}
                    <div className="py-2 px-1">
                      <p className="font-semibold text-xs capitalize truncate" style={{ color: "var(--ink)" }}>{cat.name}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Products ───────────────────────────────── */}
      {products.length > 0 && (
        <section className="section" style={{ background: "var(--bg-2)" }}>
          <div className="wrap">
            <div className="flex items-center justify-between mb-7">
              <h2 className="text-2xl md:text-3xl font-black" style={{ color: "var(--ink)" }}>Featured Products</h2>
              <Link to={categories[0] ? `/category/${categories[0].name}` : "#"}
                className="flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--blue)" }}>
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.slice(0, 10).map((p, i) => (
                <motion.div key={p._id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .05 }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Promo ──────────────────────────────────────────── */}
      <section className="section">
        <div className="wrap">
          <div className="rounded-2xl p-10 md:p-14 text-white text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,var(--blue),#4f81f5)" }}>
            <div className="absolute inset-0 pointer-events-none opacity-[.05]"
              style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-4xl mb-3">🎁</p>
              <h2 className="text-2xl md:text-4xl font-black mb-3">First Order? Get ₹100 OFF!</h2>
              <p className="mb-7 text-blue-200 text-sm">
                Use code <span className="font-black text-white bg-white/20 px-3 py-1 rounded-lg inline-block mx-1">KMART100</span> at checkout
              </p>
              <Link to="/signup" className="btn btn-lg btn-orange">
                Sign Up &amp; Save <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{ background: "var(--ink)", color: "#fff" }} className="pt-14 pb-6">
        <div className="wrap">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-base"
                  style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>K</div>
                <span className="font-black text-lg" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>K Mart</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>Kerala's freshest online grocery. Farm-fresh produce delivered same day.</p>
            </div>
            {[
              { title: "Quick Links", links: ["Home", "About Us", "Blog", "Careers"] },
              { title: "Categories",  links: categories.slice(0, 4).map(c => c.name) },
              { title: "Support",     links: ["Help Centre", "Track Order", "Returns", "Contact Us"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-bold text-xs mb-4 uppercase tracking-widest" style={{ color: "#6b7280" }}>{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l}>
                      <a href="#" className="text-sm capitalize transition-colors" style={{ color: "#9ca3af" }}
                        onMouseEnter={e => e.target.style.color = "#fff"}
                        onMouseLeave={e => e.target.style.color = "#9ca3af"}>{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
            style={{ borderColor: "rgba(255,255,255,.08)", color: "#6b7280" }}>
            <p>© 2025 K Mart. All rights reserved.</p>
            <p>Made with 💙 in Kerala, India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
