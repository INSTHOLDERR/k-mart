import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, Star, Search, Package, Plus, X, Upload,
  ImageIcon, ChevronDown, Loader, Eye, Pencil,
  AlertTriangle, Check, Camera
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useProductStore } from "../stores/useProductStore";
import axios from "../lib/axios";
import toast from "react-hot-toast";

/* ─────────────────────────────────────────────────────────────────────────────
   STOCK BADGE
───────────────────────────────────────────────────────────────────────────── */
function StockBadge({ quantity }) {
  const q = quantity ?? 0;
  if (q === 0) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(239,68,68,.15)", color: "#f87171", border: "1px solid rgba(239,68,68,.25)" }}>
      Out of stock
    </span>
  );
  if (q <= 5) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(234,179,8,.15)", color: "#facc15", border: "1px solid rgba(234,179,8,.25)" }}>
      Low: {q}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(34,197,94,.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,.2)" }}>
      {q} in stock
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONFIRM DELETE MODAL
───────────────────────────────────────────────────────────────────────────── */
function ConfirmDelete({ product, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel} />
      <motion.div
        className="relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: "#0e0e16", border: "1px solid rgba(255,255,255,.09)" }}
        initial={{ opacity: 0, scale: .95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: .95, y: 12 }}
        transition={{ duration: .2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(239,68,68,.15)" }}>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.9)" }}>Delete Product</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,.3)" }}>This cannot be undone</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl mb-4"
          style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }}>
          <img src={product.image} alt={product.name}
            className="w-10 h-10 rounded-lg object-cover shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "rgba(255,255,255,.8)" }}>{product.name}</p>
            <p className="text-xs capitalize" style={{ color: "rgba(255,255,255,.3)" }}>{product.category} · ₹{product.price}</p>
          </div>
        </div>

        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,.45)" }}>
          Users who have this product in their cart will be notified that it's no longer available.
        </p>

        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.5)" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.05)"}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: "#ef4444" }}
            onMouseEnter={e => e.currentTarget.style.background = "#dc2626"}
            onMouseLeave={e => e.currentTarget.style.background = "#ef4444"}>
            Delete Product
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   IMAGE GALLERY VIEWER
───────────────────────────────────────────────────────────────────────────── */
function ImageGallery({ images, mainImage, onClose }) {
  const all = images?.length ? images : mainImage ? [mainImage] : [];
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 backdrop-blur-sm p-4">
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
        style={{ background: "rgba(255,255,255,.1)", color: "#fff" }}>
        <X className="w-5 h-5" />
      </button>
      <div className="flex flex-col items-center gap-4 max-w-2xl w-full">
        <img src={all[cur]} alt="" className="rounded-2xl max-h-[70vh] object-contain w-full shadow-2xl" />
        {all.length > 1 && (
          <div className="flex gap-2">
            {all.map((img, i) => (
              <button key={i} onClick={() => setCur(i)}
                className="w-14 h-14 rounded-xl overflow-hidden border-2 transition-all"
                style={{ borderColor: i === cur ? "#f97316" : "rgba(255,255,255,.15)", opacity: i === cur ? 1 : 0.5 }}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ADD / EDIT PRODUCT MODAL
───────────────────────────────────────────────────────────────────────────── */
const ProductModal = ({ onClose, onSaved, editProduct = null }) => {
  const { createProduct, updateProduct, loading } = useProductStore();
  const [categories,  setCategories] = useState([]);
  const [images,      setImages]     = useState([]);
  const [primaryIdx,  setPrimary]    = useState(0);
  const [dragging,    setDragging]   = useState(false);
  const fileRef = useRef(null);
  const isEdit  = !!editProduct;

  const [form, setForm] = useState({
    name:          editProduct?.name          || "",
    description:   editProduct?.description   || "",
    price:         String(editProduct?.price  || ""),
    originalPrice: String(editProduct?.originalPrice || ""),
    category:      editProduct?.category      || "",
    unit:          editProduct?.unit          || "",
    quantity:      String(editProduct?.quantity ?? 0),
  });

  useEffect(() => {
    axios.get("/categories").then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const readFile = (file) => new Promise(res => {
    const r = new FileReader();
    r.onloadend = () => res({ preview: r.result, base64: r.result });
    r.readAsDataURL(file);
  });

  const handleFiles = async (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;
    const results = await Promise.all(valid.map(readFile));
    setImages(prev => [...prev, ...results].slice(0, 6));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())                         return toast.error("Product name is required");
    if (!form.price)                               return toast.error("Price is required");
    if (!form.category)                            return toast.error("Please select a category");
    if (!isEdit && images.length === 0)            return toast.error("At least one image is required");
    if (parseInt(form.quantity) < 0)               return toast.error("Quantity cannot be negative");

    const payload = {
      ...form,
      price:         parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      quantity:      parseInt(form.quantity) || 0,
    };
    if (images.length > 0) {
      payload.image  = images[primaryIdx]?.base64 || images[0]?.base64;
      payload.images = images.map(i => i.base64);
    }

    try {
      if (isEdit) {
        await updateProduct(editProduct._id, payload);
      } else {
        await createProduct(payload);
        toast.success("Product created!");
      }
      onSaved?.();
      onClose();
    } catch {}
  };

  const ic = `w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all
    bg-white/[0.05] border border-white/[0.09] text-white/80 placeholder:text-white/20
    focus:border-orange-500/50 focus:bg-white/[0.07]`;
  const lc = "block text-[10px] uppercase tracking-widest mb-1.5" + " " + "style-color-white-30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />

      <motion.div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: "#0e0e16", border: "1px solid rgba(255,255,255,.09)" }}
        initial={{ opacity: 0, scale: .96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: .96, y: 16 }}
        transition={{ duration: .2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.9)" }}>
              {isEdit ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,.3)" }}>
              {isEdit ? "Update product details and stock quantity" : "Fill in the details and upload images"}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.4)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.05)"; }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* ── Images (only required for new product) ── */}
          {!isEdit && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-widest font-semibold"
                  style={{ color: "rgba(255,255,255,.3)" }}>
                  Product Images <span style={{ color: "rgba(255,255,255,.2)", textTransform: "none", letterSpacing: 0 }}>(up to 6 · click to set primary)</span>
                </label>
                {images.length > 0 && (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="text-[11px] transition-colors"
                    style={{ color: "#f97316" }}>
                    + Add more
                  </button>
                )}
              </div>

              {images.length === 0 ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 transition-all"
                  style={{
                    borderColor: dragging ? "rgba(249,115,22,.6)" : "rgba(255,255,255,.1)",
                    background: dragging ? "rgba(249,115,22,.06)" : "rgba(255,255,255,.02)",
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                    <Upload className="w-5 h-5" style={{ color: "rgba(255,255,255,.25)" }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm" style={{ color: "rgba(255,255,255,.5)" }}>Drag & drop or click to browse</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,.2)" }}>PNG, JPG, WebP · max 6 images</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx}
                      className="relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all"
                      style={{
                        aspectRatio: "16/9",
                        borderColor: idx === primaryIdx ? "#f97316" : "rgba(255,255,255,.07)",
                      }}
                      onClick={() => setPrimary(idx)}
                    >
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      {idx === primaryIdx && (
                        <div className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: "#f97316", color: "#000" }}>PRIMARY</div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,.5)" }}>
                        <button type="button" onClick={e => { e.stopPropagation(); setPrimary(idx); }}
                          className="text-[10px] font-semibold px-2 py-1 rounded"
                          style={{ background: "rgba(249,115,22,.8)", color: "#000" }}>Set primary</button>
                        <button type="button" onClick={e => { e.stopPropagation(); setImages(p => p.filter((_, i) => i !== idx)); }}
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ background: "rgba(239,68,68,.8)" }}>
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {images.length < 6 && (
                    <div onClick={() => fileRef.current?.click()}
                      className="rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all"
                      style={{ aspectRatio: "16/9", borderColor: "rgba(255,255,255,.08)" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.2)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"}>
                      <div className="flex flex-col items-center gap-1"
                        style={{ color: "rgba(255,255,255,.2)" }}>
                        <Plus className="w-5 h-5" /><span className="text-[10px]">Add</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <input ref={fileRef} type="file" multiple accept="image/*" className="sr-only"
                onChange={e => handleFiles(e.target.files)} />
            </div>
          )}

          {/* ── Edit: show current image ── */}
          {isEdit && editProduct?.image && (
            <div>
              <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2"
                style={{ color: "rgba(255,255,255,.3)" }}>Current Image</label>
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }}>
                <img src={editProduct.image} alt={editProduct.name}
                  className="w-14 h-14 rounded-lg object-cover shrink-0" />
                <p className="text-xs" style={{ color: "rgba(255,255,255,.4)" }}>
                  Image stays the same unless you upload new images below
                </p>
              </div>

              {/* Option to upload replacement images */}
              <div className="mt-3">
                <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2"
                  style={{ color: "rgba(255,255,255,.3)" }}>Replace Images (optional)</label>
                {images.length === 0 ? (
                  <div onClick={() => fileRef.current?.click()}
                    className="cursor-pointer rounded-xl border-2 border-dashed py-5 flex items-center justify-center gap-3 transition-all"
                    style={{ borderColor: "rgba(255,255,255,.08)" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.2)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"}>
                    <Camera className="w-4 h-4" style={{ color: "rgba(255,255,255,.3)" }} />
                    <span className="text-sm" style={{ color: "rgba(255,255,255,.4)" }}>Upload new images</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer"
                        style={{ aspectRatio: "16/9", borderColor: idx === primaryIdx ? "#f97316" : "rgba(255,255,255,.07)" }}
                        onClick={() => setPrimary(idx)}>
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                        {idx === primaryIdx && (
                          <div className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: "#f97316", color: "#000" }}>PRIMARY</div>
                        )}
                        <button type="button" onClick={e => { e.stopPropagation(); setImages(p => p.filter((_, i) => i !== idx)); }}
                          className="absolute top-1 right-1 w-5 h-5 rounded flex items-center justify-center"
                          style={{ background: "rgba(239,68,68,.8)" }}>
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    ))}
                    {images.length < 6 && (
                      <div onClick={() => fileRef.current?.click()}
                        className="rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer"
                        style={{ aspectRatio: "16/9", borderColor: "rgba(255,255,255,.08)" }}>
                        <Plus className="w-4 h-4" style={{ color: "rgba(255,255,255,.2)" }} />
                      </div>
                    )}
                  </div>
                )}
                <input ref={fileRef} type="file" multiple accept="image/*" className="sr-only"
                  onChange={e => handleFiles(e.target.files)} />
              </div>
            </div>
          )}

          {/* ── Name ── */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(255,255,255,.3)" }}>Product Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Fresh Tomatoes" className={ic} />
          </div>

          {/* ── Description ── */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(255,255,255,.3)" }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="Brief product description…" className={`${ic} resize-none`} />
          </div>

          {/* ── Price / Original Price / Unit ── */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-1.5"
                style={{ color: "rgba(255,255,255,.3)" }}>Price (₹) *</label>
              <input type="number" step="0.01" min="0" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0.00" className={ic} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-1.5"
                style={{ color: "rgba(255,255,255,.3)" }}>Original Price (₹)</label>
              <input type="number" step="0.01" min="0" value={form.originalPrice}
                onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))}
                placeholder="For strike-through" className={ic} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-1.5"
                style={{ color: "rgba(255,255,255,.3)" }}>Unit</label>
              <input type="text" value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="kg, pcs, litre…" className={ic} />
            </div>
          </div>

          {/* ── Category / Stock Quantity ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-1.5"
                style={{ color: "rgba(255,255,255,.3)" }}>Category *</label>
              <div className="relative">
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className={`${ic} appearance-none pr-8 cursor-pointer`}>
                  <option value="">Select category…</option>
                  {categories.map(c => (
                    <option key={c._id} value={c.name} className="bg-[#0e0e16]">
                      {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: "rgba(255,255,255,.25)" }} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-1.5"
                style={{ color: "rgba(255,255,255,.3)" }}>
                Stock Quantity *
                {parseInt(form.quantity) === 0 && (
                  <span className="ml-2 text-red-400 normal-case tracking-normal">— Out of stock</span>
                )}
                {parseInt(form.quantity) > 0 && parseInt(form.quantity) <= 5 && (
                  <span className="ml-2 text-yellow-400 normal-case tracking-normal">— Low stock</span>
                )}
              </label>
              <input type="number" min="0" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="0" className={ic} />
              <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,.2)" }}>
                Set 0 = users cannot purchase
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,.25)" }}>
            {!isEdit
              ? `${images.length} image${images.length !== 1 ? "s" : ""} selected`
              : "Changes will be saved immediately"}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{ color: "rgba(255,255,255,.4)" }}
              onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.7)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.4)"}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{ background: "#f97316", color: "#000" }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = "#fb923c")}
              onMouseLeave={e => !loading && (e.currentTarget.style.background = "#f97316")}>
              {loading
                ? <><Loader className="w-4 h-4 animate-spin" /> Saving…</>
                : <><Check className="w-4 h-4" /> {isEdit ? "Save Changes" : "Create Product"}</>
              }
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PRODUCTS LIST
───────────────────────────────────────────────────────────────────────────── */
const ProductsList = () => {
  const { deleteProduct, toggleFeaturedProduct, products, fetchAllProducts } = useProductStore();
  const [search,       setSearch]      = useState("");
  const [filterCat,    setFilterCat]   = useState("all");
  const [filterStock,  setFilterStock] = useState("all");
  const [showModal,    setShowModal]   = useState(false);
  const [editProduct,  setEditProduct] = useState(null);
  const [viewing,      setViewing]     = useState(null);
  const [deleting,     setDeleting]    = useState(null);

  const cats = ["all", ...new Set(products?.map(p => p.category) || [])];

  const filtered = (products || []).filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase());
    const mc = filterCat === "all" || p.category === filterCat;
    const mq = filterStock === "all"
      || (filterStock === "in"  && (p.quantity ?? 0) > 0)
      || (filterStock === "out" && (p.quantity ?? 0) === 0)
      || (filterStock === "low" && (p.quantity ?? 0) > 0 && (p.quantity ?? 0) <= 5);
    return ms && mc && mq;
  });

  const oosCount = (products || []).filter(p => (p.quantity ?? 0) === 0).length;
  const lowCount = (products || []).filter(p => (p.quantity ?? 0) > 0 && (p.quantity ?? 0) <= 5).length;

  const inputSty = {
    background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
    color: "rgba(255,255,255,.7)", outline: "none",
  };
  const handleFocus = e => e.target.style.borderColor = "rgba(249,115,22,.5)";
  const handleBlur  = e => e.target.style.borderColor = "rgba(255,255,255,.07)";

  return (
    <div className="max-w-5xl space-y-5">

      {/* ── Stock alert banners ── */}
      {(oosCount > 0 || lowCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {oosCount > 0 && (
            <button
              onClick={() => setFilterStock("out")}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(239,68,68,.12)", color: "#f87171", border: "1px solid rgba(239,68,68,.2)" }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {oosCount} product{oosCount !== 1 ? "s" : ""} out of stock
            </button>
          )}
          {lowCount > 0 && (
            <button
              onClick={() => setFilterStock("low")}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(234,179,8,.12)", color: "#facc15", border: "1px solid rgba(234,179,8,.2)" }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {lowCount} product{lowCount !== 1 ? "s" : ""} low stock
            </button>
          )}
        </div>
      )}

      {/* ── Controls ── */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "rgba(255,255,255,.25)" }} />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder:text-white/20 transition-all"
            style={inputSty}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="appearance-none rounded-lg pl-4 pr-9 py-2.5 text-sm cursor-pointer transition-all"
            style={inputSty}>
            {cats.map(c => (
              <option key={c} value={c} className="bg-[#111118]">
                {c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: "rgba(255,255,255,.25)" }} />
        </div>

        {/* Stock filter */}
        <div className="relative">
          <select value={filterStock} onChange={e => setFilterStock(e.target.value)}
            className="appearance-none rounded-lg pl-4 pr-9 py-2.5 text-sm cursor-pointer transition-all"
            style={inputSty}>
            <option value="all"  className="bg-[#111118]">All Stock</option>
            <option value="in"   className="bg-[#111118]">In Stock</option>
            <option value="low"  className="bg-[#111118]">Low Stock</option>
            <option value="out"  className="bg-[#111118]">Out of Stock</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: "rgba(255,255,255,.25)" }} />
        </div>

        {/* Add product */}
        <button
          onClick={() => { setEditProduct(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0"
          style={{ background: "#f97316", color: "#000" }}
          onMouseEnter={e => e.currentTarget.style.background = "#fb923c"}
          onMouseLeave={e => e.currentTarget.style.background = "#f97316"}>
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Count */}
      <p className="text-xs" style={{ color: "rgba(255,255,255,.25)" }}>
        {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        {filterCat !== "all" && ` in ${filterCat}`}
      </p>

      {/* ── Table ── */}
      <div className="rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,.07)", background: "rgba(255,255,255,.02)" }}>

        {/* Table head */}
        <div className="grid items-center gap-3 px-5 py-3 text-[11px] uppercase tracking-widest"
          style={{
            gridTemplateColumns: "2.5fr 0.8fr 0.8fr 1fr 28px 28px 70px",
            borderBottom: "1px solid rgba(255,255,255,.05)",
            color: "rgba(255,255,255,.2)",
          }}>
          <span>Product</span>
          <span>Price</span>
          <span>Category</span>
          <span>Stock</span>
          <span>Img</span>
          <span>★</span>
          <span>Actions</span>
        </div>

        {/* Rows */}
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,.04)" }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16"
              style={{ color: "rgba(255,255,255,.15)" }}>
              <Package className="w-8 h-8" />
              <p className="text-sm">No products found</p>
              <button
                onClick={() => { setEditProduct(null); setShowModal(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                style={{ background: "rgba(249,115,22,.1)", color: "#f97316", border: "1px solid rgba(249,115,22,.2)" }}>
                <Plus className="w-3.5 h-3.5" /> Add first product
              </button>
            </div>
          ) : (
            filtered.map((p, i) => (
              <motion.div key={p._id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * .025 }}
                className="grid items-center gap-3 px-5 py-3.5 transition-colors"
                style={{
                  gridTemplateColumns: "2.5fr 0.8fr 0.8fr 1fr 28px 28px 70px",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.025)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* Product name + image */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative"
                    style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.06)" }}>
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    {(p.quantity ?? 0) === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(239,68,68,.6)" }}>
                        <span className="text-[7px] font-black text-white">OOS</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: "rgba(255,255,255,.8)" }}>{p.name}</p>
                    {p.description && (
                      <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,.25)" }}>{p.description}</p>
                    )}
                  </div>
                </div>

                {/* Price */}
                <span className="text-sm font-medium" style={{ color: "#fb923c" }}>
                  ₹{p.price.toFixed(0)}
                </span>

                {/* Category */}
                <span className="text-xs capitalize" style={{ color: "rgba(255,255,255,.35)" }}>
                  {p.category}
                </span>

                {/* Stock */}
                <StockBadge quantity={p.quantity ?? 0} />

                {/* Image count */}
                <button onClick={() => setViewing({ images: p.images, image: p.image })}
                  className="flex items-center gap-1 text-xs transition-opacity hover:opacity-100"
                  style={{ color: "rgba(255,255,255,.3)" }}
                  title="View images">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{p.images?.length || 1}</span>
                </button>

                {/* Featured star */}
                <button onClick={() => toggleFeaturedProduct(p._id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: p.isFeatured ? "rgba(249,115,22,.15)" : "rgba(255,255,255,.03)",
                    border: p.isFeatured ? "1px solid rgba(249,115,22,.3)" : "1px solid rgba(255,255,255,.06)",
                    color: p.isFeatured ? "#f97316" : "rgba(255,255,255,.2)",
                  }}
                  title={p.isFeatured ? "Remove from featured" : "Mark as featured"}>
                  <Star className={`w-3.5 h-3.5 ${p.isFeatured ? "fill-orange-400" : ""}`} />
                </button>

                {/* Edit + Delete — always visible */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setEditProduct(p); setShowModal(true); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: "rgba(59,130,246,.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,.2)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,.25)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(59,130,246,.12)"; }}
                    title="Edit product"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleting(p)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: "rgba(239,68,68,.12)", color: "#f87171", border: "1px solid rgba(239,68,68,.2)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,.25)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,.12)"; }}
                    title="Delete product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showModal && (
          <ProductModal
            onClose={() => { setShowModal(false); setEditProduct(null); }}
            onSaved={() => fetchAllProducts()}
            editProduct={editProduct}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleting && (
          <ConfirmDelete
            product={deleting}
            onCancel={() => setDeleting(null)}
            onConfirm={async () => { await deleteProduct(deleting._id); setDeleting(null); }}
          />
        )}
      </AnimatePresence>

      {viewing && (
        <ImageGallery
          images={viewing.images}
          mainImage={viewing.image}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
};

export default ProductsList;
