import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    description: { type: String, required: true },
    price:       { type: Number, min: 0, required: true },
    originalPrice: { type: Number, default: null },
    image:       { type: String, required: [true, "Image is required"] },
    images:      { type: [String], default: [] },
    category:    { type: String, required: true },
    unit:        { type: String, default: "" },
    isFeatured:  { type: Boolean, default: false },
    // ── STOCK MANAGEMENT ──────────────────────────────────────
    quantity:    { type: Number, default: 0, min: 0 },   // stock quantity
    isInStock:   { type: Boolean, default: true },        // auto-managed
    lowStockThreshold: { type: Number, default: 5 },      // warn when ≤ this
  },
  { timestamps: true }
);

// Auto-update isInStock whenever quantity changes
productSchema.pre("save", function (next) {
  this.isInStock = this.quantity > 0;
  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
