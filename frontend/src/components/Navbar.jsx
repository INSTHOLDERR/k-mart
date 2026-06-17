import { ShoppingCart, LogOut, Lock, Search, Heart, Menu, X, User, ChevronDown, Wallet } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../lib/axios";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useUserStore();
  const { cart } = useCartStore();
  const { wishlist } = useWishlistStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query,      setQuery]      = useState("");
  const [userMenu,   setUserMenu]   = useState(false);
  const [categories, setCategories] = useState([]);
  const searchRef   = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    axios.get("/categories").then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { setMobileOpen(false); setUserMenu(false); }, [location.pathname]);
  useEffect(() => { if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50); }, [searchOpen]);
  useEffect(() => {
    const h = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query.trim())}`); setSearchOpen(false); setQuery(""); }
  };

  const isAdmin      = user?.role === "admin";
  const avatarLetter = user?.name?.[0]?.toUpperCase() || "U";

  return (
    <>
      {/* Promo bar */}
      <div className="text-white text-xs py-1.5 text-center font-medium" style={{ background: "var(--blue)" }}>
        🚚 Free delivery on orders above ₹499 &nbsp;·&nbsp; Use <strong>KMART100</strong> for ₹100 off your first order
      </div>

      <header className="sticky top-0 z-40 transition-all duration-200"
        style={{ background: "#fff", borderBottom: "1px solid var(--border)", boxShadow: scrolled ? "var(--shadow-sm)" : "none" }}>
        <div className="wrap">
          <div className="flex items-center h-14 gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 mr-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-base"
                style={{ background: "var(--blue)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>K</div>
              <span className="font-black text-lg hidden sm:block tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--ink)" }}>K Mart</span>
            </Link>

            {/* Desktop search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-[420px]">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-4)" }}/>
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products…"
                  className="w-full pl-9 pr-20 py-2 rounded-lg text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", background: "var(--bg-2)", color: "var(--ink)", transition: "all .15s" }}
                  onFocus={e => { e.target.style.borderColor = "var(--blue)"; e.target.style.background = "#fff"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "var(--bg-2)"; }}/>
                <button type="submit" className="btn btn-sm btn-primary absolute right-1.5 top-1/2 -translate-y-1/2"
                  style={{ padding: ".3rem .75rem", fontSize: ".75rem" }}>Search</button>
              </div>
            </form>

            {/* Right side */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button onClick={() => setSearchOpen(v => !v)} className="md:hidden btn btn-icon btn-soft">
                <Search className="w-4 h-4"/>
              </button>

              {user && <NotificationBell isAdmin={false}/>}

              {user && (
                <Link to="/wishlist" className="btn btn-icon btn-soft relative">
                  <Heart className="w-4 h-4"/>
                  {wishlist?.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                      style={{ background: "var(--red)" }}>{wishlist.length}</span>
                  )}
                </Link>
              )}

              {user && (
                <Link to="/cart" className="btn btn-primary flex items-center gap-1.5" style={{ padding: ".5rem .875rem", fontSize: ".8125rem" }}>
                  <ShoppingCart className="w-4 h-4"/>
                  <span className="hidden sm:inline">Cart</span>
                  {cart.length > 0 && (
                    <span className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
                      style={{ background: "var(--orange)", color: "#fff" }}>{cart.length}</span>
                  )}
                </Link>
              )}

              {isAdmin && (
                <Link to="/secret-dashboard" className="btn btn-sm hidden md:flex items-center gap-1"
                  style={{ background: "var(--orange-pale)", color: "var(--orange)", border: "1px solid #fed7aa" }}>
                  <Lock className="w-3 h-3"/> Admin
                </Link>
              )}

              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setUserMenu(v => !v)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    {user.profilePic
                      ? <img src={user.profilePic} alt="" className="w-7 h-7 rounded-full object-cover"/>
                      : <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: "var(--blue)" }}>{avatarLetter}</div>
                    }
                    <ChevronDown className="w-3 h-3 hidden sm:block" style={{ color: "var(--ink-4)" }}/>
                  </button>
                  <AnimatePresence>
                    {userMenu && (
                      <motion.div className="absolute right-0 top-11 w-52 rounded-xl shadow-lg z-50 overflow-hidden"
                        style={{ background: "#fff", border: "1px solid var(--border)" }}
                        initial={{ opacity: 0, y: -6, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: .97 }} transition={{ duration: .14 }}>
                        <div className="px-3 py-2.5" style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                          <p className="font-semibold text-sm truncate" style={{ color: "var(--ink)" }}>{user.name}</p>
                          <p className="text-xs truncate" style={{ color: "var(--ink-4)" }}>{user.email}</p>
                        </div>
                        <div className="py-1">
                          {[
                            { label: "My Profile", href: "/profile" },
                            { label: "My Orders",  href: "/orders"  },
                            { label: "My Wallet",  href: "/wallet"  },
                            { label: "Wishlist",   href: "/wishlist" },
                          ].map(item => (
                            <Link key={item.href} to={item.href}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                              style={{ color: "var(--ink)" }}>
                              {item.label === "My Wallet" && <Wallet className="w-3.5 h-3.5" style={{ color: "var(--purple)" }} />}
                              {item.label}
                            </Link>
                          ))}
                          {isAdmin && (
                            <Link to="/secret-dashboard"
                              className="block px-3 py-2 text-sm font-semibold hover:bg-orange-50"
                              style={{ color: "var(--orange)" }}>
                              Admin Dashboard
                            </Link>
                          )}
                          <div className="divider my-1"/>
                          <button onClick={logout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-left"
                            style={{ color: "var(--red)" }}>
                            <LogOut className="w-3.5 h-3.5"/> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login"  className="btn btn-sm btn-outline">Login</Link>
                  <Link to="/signup" className="btn btn-sm btn-primary">Sign Up</Link>
                </div>
              )}

              <button onClick={() => setMobileOpen(true)} className="sm:hidden btn btn-icon btn-soft">
                <Menu className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>

        {/* Category strip */}
        {categories.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
            <div className="wrap">
              <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide py-1.5">
                {categories.map(cat => (
                  <Link key={cat._id} to={`/category/${cat.name}`}
                    className="whitespace-nowrap px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors hover:bg-white hover:text-blue-600"
                    style={{ color: "var(--ink-3)" }}>{cat.name}</Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
            style={{ background: "rgba(0,0,0,.5)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}>
            <motion.form onSubmit={handleSearch} className="w-full max-w-md relative" onClick={e => e.stopPropagation()}
              initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--ink-4)" }}/>
              <input ref={searchRef} type="text" placeholder="Search products…" value={query} onChange={e => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-base outline-none shadow-xl"
                style={{ background: "#fff", color: "var(--ink)", border: "2px solid var(--blue)" }}/>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,.45)" }} onClick={() => setMobileOpen(false)}/>
            <motion.div className="absolute right-0 top-0 h-full w-[280px] flex flex-col shadow-2xl" style={{ background: "#fff" }}
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: .3 }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="font-black text-base" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--blue)" }}>K Mart</span>
                <button onClick={() => setMobileOpen(false)} className="btn btn-icon btn-soft"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {user && (
                  <div className="flex items-center gap-3 p-3 rounded-xl mb-3" style={{ background: "var(--blue-pale)" }}>
                    {user.profilePic
                      ? <img src={user.profilePic} alt="" className="w-9 h-9 rounded-full object-cover"/>
                      : <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "var(--blue)" }}>{avatarLetter}</div>
                    }
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{user.name}</p>
                      <p className="text-xs" style={{ color: "var(--ink-4)" }}>{user.email}</p>
                    </div>
                  </div>
                )}
                {user ? (
                  <>
                    {[
                      { label: "🏠 Home",      href: "/" },
                      { label: "👤 Profile",   href: "/profile" },
                      { label: "📦 Orders",    href: "/orders" },
                      { label: "👛 Wallet",    href: "/wallet" },
                      { label: "🛒 Cart",      href: "/cart" },
                      { label: "❤️ Wishlist",  href: "/wishlist" },
                    ].map(item => (
                      <Link key={item.href} to={item.href}
                        className="block p-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        style={{ color: "var(--ink)" }}>{item.label}</Link>
                    ))}
                    {isAdmin && (
                      <Link to="/secret-dashboard"
                        className="block p-3 rounded-lg text-sm font-semibold"
                        style={{ color: "var(--orange)", background: "var(--orange-pale)" }}>
                        🔒 Admin Dashboard
                      </Link>
                    )}
                    <div className="divider my-2"/>
                    <button onClick={logout}
                      className="w-full text-left p-3 rounded-lg text-sm font-semibold"
                      style={{ color: "var(--red)", background: "var(--red-pale)" }}>
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 mt-2">
                    <Link to="/login"  className="btn btn-outline w-full justify-center">Login</Link>
                    <Link to="/signup" className="btn btn-primary w-full justify-center">Create Account</Link>
                  </div>
                )}
                {categories.length > 0 && (
                  <>
                    <div className="divider my-2"/>
                    <p className="text-xs font-semibold px-2 pt-1 pb-0.5 uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>Categories</p>
                    {categories.map(cat => (
                      <Link key={cat._id} to={`/category/${cat.name}`}
                        className="block px-3 py-2.5 rounded-lg text-sm capitalize hover:bg-gray-50 transition-colors"
                        style={{ color: "var(--ink-2)" }}>{cat.name}</Link>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
