import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, ImageIcon, Upload, Pencil,
  X, Check, Tag, AlertTriangle, Camera
} from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

/* ─────────────────────────────────────────────────────────────────────────────
   CONFIRM DELETE MODAL
───────────────────────────────────────────────────────────────────────────── */
function ConfirmDelete({ category, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel} />
      <motion.div
        className="relative z-10 w-full max-w-sm rounded-2xl shadow-2xl p-6"
        style={{ background: "#0e0e16", border: "1px solid rgba(255,255,255,.1)" }}
        initial={{ opacity: 0, scale: .95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: .95, y: 12 }}
        transition={{ duration: .2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(239,68,68,.15)" }}>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.9)" }}>Delete Category</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,.3)" }}>This cannot be undone</p>
          </div>
        </div>
        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,.5)" }}>
          Delete <span className="font-semibold capitalize" style={{ color: "rgba(255,255,255,.8)" }}>"{category.name}"</span>?
          Products in this category won't be deleted but will be unlinked.
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
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY FORM MODAL  (Add / Edit)
───────────────────────────────────────────────────────────────────────────── */
function CategoryModal({ editCategory = null, onClose, onSaved }) {
  const fileRef   = useRef(null);
  const isEdit    = !!editCategory;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name:  editCategory?.name  || "",
    image: editCategory?.image || "",   // will be URL (existing) or base64 (new upload)
  });
  const [preview, setPreview] = useState(editCategory?.image || "");

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setForm(f => ({ ...f, image: reader.result }));  // base64
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      // reuse handleImage logic via a synthetic event
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setForm(f => ({ ...f, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Category name is required"); return; }
    setSubmitting(true);
    try {
      if (isEdit) {
        const r = await axios.put(`/categories/${editCategory._id}`, form);
        toast.success("Category updated!");
        onSaved(r.data, "edit");
      } else {
        const r = await axios.post("/categories", form);
        toast.success("Category created!");
        onSaved(r.data, "create");
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-all
    bg-white/[0.05] border border-white/[0.09] text-white/80 placeholder:text-white/25
    focus:border-orange-500/60 focus:bg-white/[0.07]`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />

      <motion.div
        className="relative z-10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
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
              {isEdit ? "Edit Category" : "New Category"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,.3)" }}>
              {isEdit ? "Update name or image" : "Add a name and upload an image"}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.4)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.1)"; e.currentTarget.style.color = "rgba(255,255,255,.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.05)"; e.currentTarget.style.color = "rgba(255,255,255,.4)"; }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="p-6 space-y-5">

          {/* Category Name */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "rgba(255,255,255,.3)" }}>
              Category Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Vegetables, Fruits, Dairy…"
              className={inputCls}
              required
              autoFocus
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "rgba(255,255,255,.3)" }}>
              Category Image
            </label>

            {preview ? (
              /* Preview + change/remove */
              <div className="relative rounded-xl overflow-hidden"
                style={{ border: "1.5px solid rgba(249,115,22,.5)", background: "rgba(249,115,22,.05)" }}>
                <img src={preview} alt="preview"
                  className="w-full h-48 object-cover" />
                {/* Action bar over image */}
                <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-4 py-2.5"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,.8), transparent)" }}>
                  <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,.8)" }}>
                    Image selected
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: "rgba(249,115,22,.8)", color: "#000" }}>
                      <Camera className="w-3 h-3" /> Change
                    </button>
                    <button type="button"
                      onClick={() => { setPreview(""); setForm(f => ({ ...f, image: "" })); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: "rgba(239,68,68,.7)", color: "#fff" }}>
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Drop zone */
              <div
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(249,115,22,.6)"; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; }}
                onDrop={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; handleDrop(e); }}
                onClick={() => fileRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 transition-all"
                style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.02)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.2)"; e.currentTarget.style.background = "rgba(255,255,255,.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.background = "rgba(255,255,255,.02)"; }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
                  <Upload className="w-6 h-6" style={{ color: "rgba(255,255,255,.3)" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,.5)" }}>
                    Drag & drop image here
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,.2)" }}>
                    or <span style={{ color: "rgba(249,115,22,.8)" }}>click to browse</span> · PNG, JPG, WebP · max 5 MB
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleImage}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{ background: "#f97316", color: "#000" }}
              onMouseEnter={e => !submitting && (e.currentTarget.style.background = "#fb923c")}
              onMouseLeave={e => !submitting && (e.currentTarget.style.background = "#f97316")}>
              {submitting
                ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                : <Check className="w-4 h-4" />
              }
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Category"}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.5)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.05)"}>
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN CATEGORIES TAB
───────────────────────────────────────────────────────────────────────────── */
export default function CategoriesTab() {
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editCat,     setEditCat]     = useState(null);   // null = new, obj = edit
  const [deletingCat, setDeletingCat] = useState(null);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const r = await axios.get("/categories");
      setCategories(r.data.categories || []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = (savedCat, mode) => {
    if (mode === "create") {
      setCategories(prev => [savedCat, ...prev]);
    } else {
      setCategories(prev => prev.map(c => c._id === savedCat._id ? savedCat : c));
    }
  };

  const openNew  = () => { setEditCat(null);  setShowModal(true); };
  const openEdit = (cat) => { setEditCat(cat); setShowModal(true); };

  const confirmDelete = async () => {
    if (!deletingCat) return;
    try {
      await axios.delete(`/categories/${deletingCat._id}`);
      setCategories(prev => prev.filter(c => c._id !== deletingCat._id));
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeletingCat(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 rounded-full border-2 border-t-orange-500 animate-spin"
        style={{ borderColor: "rgba(249,115,22,.3)", borderTopColor: "#f97316" }} />
    </div>
  );

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.8)" }}>Categories</h2>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,.25)" }}>
            {categories.length} total
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: "#f97316", color: "#000" }}
          onMouseEnter={e => e.currentTarget.style.background = "#fb923c"}
          onMouseLeave={e => e.currentTarget.style.background = "#f97316"}
        >
          <Plus className="w-4 h-4" /> New Category
        </button>
      </div>

      {/* ── Empty state ── */}
      {categories.length === 0 ? (
        <div className="rounded-xl py-20 flex flex-col items-center gap-4"
          style={{ border: "1px solid rgba(255,255,255,.07)", background: "rgba(255,255,255,.02)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,.05)" }}>
            <Tag className="w-7 h-7" style={{ color: "rgba(255,255,255,.2)" }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,.4)" }}>No categories yet</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,.2)" }}>Create your first category to start adding products</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "rgba(249,115,22,.15)", color: "#f97316", border: "1px solid rgba(249,115,22,.25)" }}>
            <Plus className="w-3.5 h-3.5" /> Create first category
          </button>
        </div>
      ) : (
        /* ── Category grid ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * .05 }}
              className="rounded-xl overflow-hidden group"
              style={{
                border: "1px solid rgba(255,255,255,.07)",
                background: "rgba(255,255,255,.02)",
                transition: "border-color .2s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"}
            >
              {/* Image area */}
              <div className="relative overflow-hidden" style={{ aspectRatio: "4/3", background: "rgba(255,255,255,.04)" }}>
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Tag className="w-8 h-8" style={{ color: "rgba(255,255,255,.1)" }} />
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,.15)" }}>No image</p>
                  </div>
                )}

                {/* Edit / Delete buttons — always visible at bottom of image */}
                <div className="absolute bottom-0 inset-x-0 flex items-center gap-1.5 px-2.5 py-2"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,.75) 0%, transparent 100%)" }}>
                  <button
                    onClick={() => openEdit(cat)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "rgba(249,115,22,.85)", color: "#000" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(249,115,22,1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(249,115,22,.85)"}
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => setDeletingCat(cat)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "rgba(239,68,68,.8)", color: "#fff" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,.8)"}
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold capitalize" style={{ color: "rgba(255,255,255,.8)" }}>
                  {cat.name}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,.25)" }}>
                  {new Date(cat.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {showModal && (
          <CategoryModal
            editCategory={editCat}
            onClose={() => { setShowModal(false); setEditCat(null); }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingCat && (
          <ConfirmDelete
            category={deletingCat}
            onConfirm={confirmDelete}
            onCancel={() => setDeletingCat(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
