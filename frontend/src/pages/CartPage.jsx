import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, ArrowRight, Trash2, Minus, Plus,
  CreditCard, Truck as TruckIcon, MapPin, CheckCircle,
  ShieldCheck, Tag, X, ChevronRight, AlertTriangle, Package,
  Wallet
} from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/* ─────────────────────────────────────────────────────────────────
   CART ITEM ROW
───────────────────────────────────────────────────────────────── */
function CartItemRow({ item }) {
  const { removeFromCart, updateQuantity } = useCartStore();
  const isOOS  = item.stockLeft === 0 || item.isInStock === false;
  const maxQty = item.stockLeft > 0 ? item.stockLeft : 99;

  return (
    <div className={`card p-4 flex gap-4 transition-opacity ${isOOS ? "opacity-70" : ""}`}>
      <Link to={`/product/${item._id}`} className="shrink-0">
        <div className="w-20 h-20 rounded-xl overflow-hidden relative" style={{ background: "var(--bg-2)" }}>
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          {isOOS && (
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: "rgba(255,255,255,.8)", backdropFilter: "blur(2px)" }}>
              <Package className="w-5 h-5 mb-0.5" style={{ color: "var(--red)" }} />
              <span className="text-[9px] font-black uppercase" style={{ color: "var(--red)" }}>Out of Stock</span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs capitalize mb-0.5" style={{ color: "var(--ink-4)" }}>{item.category}</p>
            <Link to={`/product/${item._id}`}>
              <p className="font-semibold text-sm leading-snug line-clamp-2 hover:text-blue-600 transition-colors"
                style={{ color: "var(--ink)" }}>{item.name}</p>
            </Link>
            {isOOS && (
              <p className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: "var(--red)" }}>
                <AlertTriangle className="w-3 h-3" /> Out of stock — remove this item to proceed
              </p>
            )}
            {!isOOS && item.stockLeft > 0 && item.stockLeft <= 5 && (
              <p className="text-xs font-semibold mt-1" style={{ color: "#d97706" }}>
                Only {item.stockLeft} left!
              </p>
            )}
          </div>
          <button
            onClick={() => removeFromCart(item._id)}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
            style={{ background: "var(--red-pale)" }}
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--red)" }} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          {!isOOS ? (
            <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1.5px solid var(--border)" }}>
              <button onClick={() => updateQuantity(item._id, item.quantity - 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Minus className="w-3.5 h-3.5" style={{ color: "var(--blue)" }} />
              </button>
              <span className="w-8 text-center text-sm font-bold" style={{ color: "var(--ink)" }}>
                {item.quantity}
              </span>
              <button
                onClick={() => {
                  if (item.quantity >= maxQty) { toast.error(`Only ${maxQty} unit(s) available`); return; }
                  updateQuantity(item._id, item.quantity + 1);
                }}
                disabled={item.quantity >= maxQty}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:cursor-not-allowed">
                <Plus className="w-3.5 h-3.5"
                  style={{ color: item.quantity >= maxQty ? "var(--ink-5)" : "var(--blue)" }} />
              </button>
            </div>
          ) : <div />}
          <div className="text-right">
            <p className="font-black" style={{ color: "var(--blue)" }}>
              ₹{(item.price * item.quantity).toFixed(0)}
            </p>
            {item.quantity > 1 && (
              <p className="text-xs" style={{ color: "var(--ink-4)" }}>₹{item.price} each</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ADDRESS PICKER
───────────────────────────────────────────────────────────────── */
function AddressPicker({ selected, onSelect }) {
  const [addresses, setAddresses] = useState([]);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const blank = { label: "Home", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    axios.get("/users/me/addresses")
      .then(r => {
        const list = r.data.addresses || [];
        setAddresses(list);
        if (list.length && !selected) onSelect(list.find(a => a.isDefault) || list[0]);
      })
      .catch(() => {});
  }, []);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const { fullName, phone, line1, city, state, pincode } = form;
    if (!fullName || !phone || !line1 || !city || !state || !pincode) {
      toast.error("Fill all required fields"); return;
    }
    setSaving(true);
    try {
      const r = await axios.post("/users/me/addresses", { ...form, isDefault: addresses.length === 0 });
      const list = r.data.addresses;
      setAddresses(list);
      onSelect(list[list.length - 1]);
      setShowForm(false);
      setForm(blank);
      toast.success("Address saved!");
    } catch { toast.error("Failed to save address"); }
    setSaving(false);
  };

  const inp = "w-full text-sm px-3 py-2.5 rounded-xl outline-none transition-all bg-white";

  return (
    <div>
      {addresses.length === 0 && !showForm && (
        <div className="text-center py-5">
          <p className="text-sm mb-3" style={{ color: "var(--ink-4)" }}>No saved addresses. Add one to continue.</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">+ Add Address</button>
        </div>
      )}

      <div className="space-y-2 mb-3">
        {addresses.map(addr => (
          <div key={addr._id} onClick={() => onSelect(addr)}
            className="p-4 rounded-xl cursor-pointer transition-all border-2"
            style={{
              borderColor: selected?._id === addr._id ? "var(--blue)" : "var(--border)",
              background:  selected?._id === addr._id ? "var(--blue-pale)" : "#fff",
            }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--ink)" }}>
                  {addr.label}
                  {addr.isDefault && <span className="badge badge-blue text-[10px]">Default</span>}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
                  {addr.fullName} · {addr.phone}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--ink-4)" }}>
                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} — {addr.pincode}
                </p>
              </div>
              {selected?._id === addr._id && (
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--blue)" }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {addresses.length > 0 && !showForm && (
        <button onClick={() => setShowForm(true)} className="text-sm font-semibold" style={{ color: "var(--blue)" }}>
          + Add new address
        </button>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={save}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="mt-4 p-4 rounded-2xl space-y-3"
            style={{ background: "var(--bg-2)", border: "1.5px solid var(--border)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>New Address</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: "label",    l: "Label",       ph: "Home / Work",    span: false },
                { k: "fullName", l: "Full Name *",  ph: "Recipient name", span: false },
                { k: "phone",    l: "Phone *",      ph: "Mobile number",  span: false },
                { k: "line1",    l: "Address *",    ph: "Street, Flat",   span: true  },
                { k: "line2",    l: "Landmark",     ph: "Optional",       span: false },
                { k: "city",     l: "City *",       ph: "City",           span: false },
                { k: "state",    l: "State *",      ph: "State",          span: false },
                { k: "pincode",  l: "Pincode *",    ph: "6-digit",        span: false },
              ].map(field => (
                <div key={field.k} className={field.span ? "col-span-2" : ""}>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-3)" }}>{field.l}</label>
                  <input type="text" placeholder={field.ph} value={form[field.k]} onChange={f(field.k)}
                    className={inp}
                    style={{ border: "1.5px solid var(--border)", color: "var(--ink)" }}
                    onFocus={e => e.target.style.borderColor = "var(--blue)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                {saving ? "Saving…" : "Save Address"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-soft btn-sm">Cancel</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PEOPLE ALSO BOUGHT
───────────────────────────────────────────────────────────────── */
function PeopleAlsoBought() {
  const [recs, setRecs] = useState([]);
  const { addToCart }   = useCartStore();
  const { user }        = useUserStore();

  useEffect(() => {
    axios.get("/products/recommendations").then(r => setRecs(r.data)).catch(() => {});
  }, []);

  if (!recs.length) return null;

  return (
    <div>
      <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>
        People Also Buy
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {recs.map(p => (
          <div key={p._id} className="shrink-0 w-36">
            <Link to={`/product/${p._id}`}>
              <div className="w-full aspect-square rounded-xl overflow-hidden mb-2" style={{ background: "var(--bg-2)" }}>
                <img src={p.image} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </div>
            </Link>
            <p className="text-xs font-semibold truncate" style={{ color: "var(--ink)" }}>{p.name}</p>
            <p className="text-xs font-black" style={{ color: "var(--blue)" }}>₹{p.price}</p>
            <button
              onClick={() => { if (!user) { toast.error("Login first"); return; } addToCart(p); }}
              className="mt-1.5 w-full text-[10px] font-bold py-1.5 rounded-lg transition-all"
              style={{ background: "var(--blue-pale)", color: "var(--blue)", border: "1px solid var(--blue-light)" }}>
              + Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN CART PAGE
───────────────────────────────────────────────────────────────── */
export default function CartPage() {
  const {
    cart, coupon, total, subtotal, isCouponApplied,
    getCartItems, applyCoupon, removeCoupon, clearCart
  } = useCartStore();
  const { user } = useUserStore();
  const navigate = useNavigate();

  const [step,         setStep]        = useState(1);
  const [selectedAddr, setSelectedAddr]= useState(null);
  const [payMethod,    setPayMethod]   = useState("online");
  const [notes,        setNotes]       = useState("");
  const [placing,      setPlacing]     = useState(false);
  const [couponInput,  setCouponInput] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => { getCartItems(); }, []);

  useEffect(() => {
    if (step === 2 && user) {
      axios.get("/users/me/wallet")
        .then(r => setWalletBalance(r.data.balance))
        .catch(() => {});
    }
  }, [step, user]);

  const delivery   = subtotal >= 499 ? 0 : 49;
  const finalTotal = total + delivery;
  const hasOOS     = cart.some(i => i.stockLeft === 0 || i.isInStock === false);
  const walletSufficient = walletBalance !== null && walletBalance >= finalTotal;

  /* ── COD ── */
  const handleCOD = async () => {
    if (!selectedAddr) { toast.error("Please select a delivery address"); return; }
    if (hasOOS)        { toast.error("Remove out-of-stock items before placing order"); return; }
    setPlacing(true);
    try {
      const r = await axios.post("/payments/cod-order", {
        products:        cart,
        couponCode:      coupon?.code || "",
        shippingAddress: selectedAddr,
        notes,
      });
      await clearCart();
      navigate(`/purchase-success?orderId=${r.data.orderId}&method=cod`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to place order");
      if (e.response?.data?.error === "stock_issue") getCartItems();
    }
    setPlacing(false);
  };

  /* ── Wallet ── */
  const handleWallet = async () => {
    if (!selectedAddr) { toast.error("Please select a delivery address"); return; }
    if (hasOOS)        { toast.error("Remove out-of-stock items before placing order"); return; }
    if (!walletSufficient) {
      toast.error(`Insufficient wallet balance. Available: ₹${walletBalance?.toFixed(0)}`);
      return;
    }
    setPlacing(true);
    try {
      const r = await axios.post("/payments/wallet-order", {
        products:        cart,
        couponCode:      coupon?.code || "",
        shippingAddress: selectedAddr,
        notes,
      });
      await clearCart();
      navigate(`/purchase-success?orderId=${r.data.orderId}&method=wallet`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to place order");
      if (e.response?.data?.error === "stock_issue") getCartItems();
      if (e.response?.data?.error === "insufficient_wallet") {
        setWalletBalance(prev => prev); // refresh would be better
      }
    }
    setPlacing(false);
  };

  /* ── Stripe online ── */
  const handleOnline = async () => {
    if (!selectedAddr) { toast.error("Please select a delivery address"); return; }
    if (hasOOS)        { toast.error("Remove out-of-stock items before checkout"); return; }
    setPlacing(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) { toast.error("Stripe failed to load. Check your publishable key."); setPlacing(false); return; }

      const r = await axios.post("/payments/create-checkout-session", {
        products:        cart,
        couponCode:      coupon?.code || "",
        shippingAddress: selectedAddr,
      });

      if (r.data.url) {
        window.location.href = r.data.url;
      } else if (r.data.id) {
        const result = await stripe.redirectToCheckout({ sessionId: r.data.id });
        if (result?.error) toast.error(result.error.message);
      } else {
        toast.error("No checkout URL received");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Payment failed. Please try again.");
      if (e.response?.data?.error === "stock_issue") getCartItems();
    }
    setPlacing(false);
  };

  const handlePay = () => {
    if (payMethod === "cod")    return handleCOD();
    if (payMethod === "wallet") return handleWallet();
    return handleOnline();
  };

  /* ── Empty cart ── */
  if (cart.length === 0) return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
      <div className="wrap py-24 text-center">
        <p className="text-7xl mb-5">🛒</p>
        <h2 className="text-2xl font-black mb-3" style={{ color: "var(--blue)" }}>Your cart is empty</h2>
        <p className="mb-7 text-sm" style={{ color: "var(--ink-4)" }}>Looks like you haven't added anything yet.</p>
        <Link to="/" className="btn btn-primary">Start Shopping <ArrowRight className="w-4 h-4" /></Link>
      </div>
    </div>
  );

  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
      <div className="wrap py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--blue-pale)" }}>
            <ShoppingCart className="w-5 h-5" style={{ color: "var(--blue)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: "var(--blue)" }}>Shopping Cart</h1>
            <p className="text-xs" style={{ color: "var(--ink-4)" }}>{cart.length} item{cart.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs font-semibold">
            {["Cart", "Checkout"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-3 h-3" style={{ color: "var(--ink-4)" }} />}
                <span className="px-3 py-1 rounded-full transition-all"
                  style={{
                    background: step === i + 1 ? "var(--blue)" : "transparent",
                    color: step === i + 1 ? "#fff" : "var(--ink-4)",
                  }}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* OOS banner */}
        {hasOOS && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
            style={{ background: "var(--red-pale)", border: "1.5px solid #fecaca" }}>
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "var(--red)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--red)" }}>
              Some items are out of stock. Remove them to proceed with checkout.
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left column */}
          <div className="flex-1 w-full space-y-3">
            {step === 1 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {cart.map(item => <CartItemRow key={item._id} item={item} />)}
                <div className="card p-4">
                  <PeopleAlsoBought />
                </div>
              </motion.div>
            ) : (
              /* ── Step 2: Address + Payment ── */
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {/* Address */}
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4" style={{ color: "var(--blue)" }} />
                    <h2 className="font-black text-base" style={{ color: "var(--ink)" }}>Delivery Address</h2>
                  </div>
                  <AddressPicker selected={selectedAddr} onSelect={setSelectedAddr} />
                </div>

                {/* Payment method */}
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-4 h-4" style={{ color: "var(--blue)" }} />
                    <h2 className="font-black text-base" style={{ color: "var(--ink)" }}>Payment Method</h2>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { id: "online", Icon: CreditCard, label: "Pay Online",       sub: "UPI, Cards via Stripe",         accent: "var(--blue)",   bg: "var(--blue-pale)",   bgActive: "var(--blue-light)" },
                      { id: "cod",    Icon: TruckIcon,  label: "Cash on Delivery", sub: "Pay when order arrives",        accent: "#d97706",        bg: "#fffbeb",             bgActive: "#fef3c7" },
                      { id: "wallet", Icon: Wallet,     label: "Pay with Wallet",  sub: walletBalance !== null ? `Balance: ₹${walletBalance.toFixed(0)}` : "Loading…", accent: "var(--purple)", bg: "var(--purple-pale)", bgActive: "#ede9fe" },
                    ].map(m => (
                      <div key={m.id} onClick={() => setPayMethod(m.id)}
                        className="p-4 rounded-2xl cursor-pointer border-2 transition-all flex items-center gap-3"
                        style={{
                          borderColor: payMethod === m.id ? m.accent : "var(--border)",
                          background:  payMethod === m.id ? m.bgActive : "#fff",
                        }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: payMethod === m.id ? m.bg : "var(--bg-2)" }}>
                          <m.Icon className="w-5 h-5" style={{ color: m.accent }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm" style={{ color: "var(--ink)" }}>{m.label}</p>
                          <p className="text-xs truncate" style={{ color: m.id === "wallet" && walletBalance !== null && walletBalance < finalTotal ? "var(--red)" : "var(--ink-4)" }}>
                            {m.sub}
                            {m.id === "wallet" && walletBalance !== null && walletBalance < finalTotal && " (insufficient)"}
                          </p>
                        </div>
                        {payMethod === m.id && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: m.accent }} />}
                      </div>
                    ))}
                  </div>

                  {/* Wallet top-up prompt */}
                  {payMethod === "wallet" && walletBalance !== null && walletBalance < finalTotal && (
                    <div className="mt-3 p-3 rounded-xl flex items-center justify-between gap-3"
                      style={{ background: "var(--red-pale)", border: "1px solid #fecaca" }}>
                      <p className="text-xs font-semibold" style={{ color: "var(--red)" }}>
                        Wallet balance insufficient. Need ₹{(finalTotal - walletBalance).toFixed(0)} more.
                      </p>
                      <Link to="/wallet" className="text-xs font-bold px-3 py-1.5 rounded-lg"
                        style={{ background: "var(--red)", color: "#fff", whiteSpace: "nowrap" }}>
                        Top Up
                      </Link>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="card p-5">
                  <h2 className="font-bold text-sm mb-2" style={{ color: "var(--ink)" }}>
                    Order Notes <span style={{ color: "var(--ink-4)", fontWeight: 400 }}>(Optional)</span>
                  </h2>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Any special instructions for delivery…"
                    className="input text-sm resize-none" />
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right summary sidebar ── */}
          <div className="lg:w-80 xl:w-96 mt-5 lg:mt-0 lg:sticky lg:top-24">
            <div className="card p-5">
              <h2 className="font-black text-base mb-4" style={{ color: "var(--blue)" }}>Order Summary</h2>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span style={{ color: "var(--ink-2)" }}>Subtotal ({cart.length} item{cart.length !== 1 ? "s" : ""})</span>
                  <span style={{ color: "var(--ink)" }}>₹{subtotal.toFixed(0)}</span>
                </div>
                {isCouponApplied && coupon && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--ink-2)" }}>Coupon ({coupon.code})</span>
                    <span style={{ color: "var(--green)" }}>−{coupon.discountPercentage}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ color: "var(--ink-2)" }}>Delivery</span>
                  <span style={{ color: delivery === 0 ? "var(--green)" : "var(--ink)" }}>
                    {delivery === 0 ? "FREE" : "₹49"}
                  </span>
                </div>
                {delivery > 0 && (
                  <p className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "#fff7ed", color: "#c2410c" }}>
                    Add ₹{(499 - subtotal).toFixed(0)} more for free delivery
                  </p>
                )}
                <div className="flex justify-between font-black text-base pt-2.5"
                  style={{ borderTop: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--ink)" }}>Total</span>
                  <span style={{ color: "var(--blue)" }}>₹{finalTotal.toFixed(0)}</span>
                </div>
              </div>

              {/* Coupon input */}
              {!isCouponApplied ? (
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--ink-4)" }} />
                    <input
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="input pl-8 text-xs py-2"
                    />
                  </div>
                  <button onClick={() => couponInput && applyCoupon(couponInput)} className="btn btn-soft btn-sm text-xs px-3">
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl mb-4"
                  style={{ background: "var(--green-pale)", border: "1.5px solid #bbf7d0" }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--green)" }} />
                    <span className="text-xs font-bold" style={{ color: "var(--green)" }}>
                      {coupon?.code} — {coupon?.discountPercentage}% off!
                    </span>
                  </div>
                  <button onClick={removeCoupon}>
                    <X className="w-3.5 h-3.5" style={{ color: "var(--green)" }} />
                  </button>
                </div>
              )}

              {/* Action button */}
              {step === 1 ? (
                <button
                  onClick={() => { if (!user) { toast.error("Please login"); return; } setStep(2); window.scrollTo(0, 0); }}
                  disabled={hasOOS}
                  className="btn btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  {hasOOS ? "Remove out-of-stock items first" : <>Proceed to Checkout <ArrowRight className="w-4 h-4" /></>}
                </button>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={placing || (payMethod === "wallet" && walletBalance !== null && !walletSufficient)}
                  className="btn w-full py-3.5 font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  style={{
                    background: placing ? "var(--ink-4)"
                      : payMethod === "cod"    ? "#d97706"
                      : payMethod === "wallet" ? "var(--purple)"
                      : "var(--blue)"
                  }}>
                  {placing
                    ? <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                          <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing…
                      </span>
                    : payMethod === "cod"    ? "🚚 Place COD Order"
                    : payMethod === "wallet" ? "👛 Pay with Wallet"
                    : "💳 Pay Online with Stripe"
                  }
                </button>
              )}

              {step === 2 && (
                <button onClick={() => setStep(1)}
                  className="w-full text-xs font-medium mt-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: "var(--ink-4)" }}>
                  ← Back to Cart
                </button>
              )}

              <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: "var(--ink-4)" }}>
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: "var(--blue)" }} />
                100% secure · SSL encrypted · Stripe-powered payments
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
