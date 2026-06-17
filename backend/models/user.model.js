import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema({
  label:    { type: String, default: "Home" },
  fullName: { type: String, required: true },
  phone:    { type: String, required: true },
  line1:    { type: String, required: true },
  line2:    { type: String, default: "" },
  city:     { type: String, required: true },
  state:    { type: String, required: true },
  pincode:  { type: String, required: true },
  isDefault:{ type: Boolean, default: false },
}, { _id: true });

const walletTransactionSchema = new mongoose.Schema({
  type:        { type: String, enum: ["credit", "debit"], required: true },
  amount:      { type: Number, required: true },
  description: { type: String, default: "" },
  orderId:     { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  refundFor:   { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  stripeSessionId: { type: String, default: "" },
}, { timestamps: true });

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: [true, "Name is required"] },
    email:      { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    password:   { type: String, minlength: [6, "Min 6 characters"], default: null },
    phone:      { type: String, default: "" },
    profilePic: { type: String, default: "" },
    role:       { type: String, enum: ["customer", "admin"], default: "customer" },
    // ── Auth provider ──────────────────────────────────────────
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId:     { type: String, default: null },
    // ── Cart / Addresses ───────────────────────────────────────
    cartItems:  [{ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, quantity: { type: Number, default: 1 } }],
    addresses:  { type: [addressSchema], default: [] },
    // ── Wallet ─────────────────────────────────────────────────
    walletBalance:      { type: Number, default: 0 },
    walletTransactions: { type: [walletTransactionSchema], default: [] },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) { next(err); }
});

userSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
