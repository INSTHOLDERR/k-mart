import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import dns from "dns";

import authRoutes         from "./routes/auth.route.js";
import productRoutes      from "./routes/product.route.js";
import cartRoutes         from "./routes/cart.route.js";
import couponRoutes       from "./routes/coupon.route.js";
import paymentRoutes      from "./routes/payment.route.js";
import analyticsRoutes    from "./routes/analytics.route.js";
import userRoutes         from "./routes/user.route.js";
import categoryRoutes     from "./routes/category.route.js";
import notificationRoutes from "./routes/notification.route.js";
import otpRoutes           from "./routes/otp.route.js";

import { connectDB } from "./lib/db.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// CORS 
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  res.removeHeader("X-Content-Security-Policy");
  res.removeHeader("X-WebKit-CSP");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

app.use("/api/auth",          authRoutes);
app.use("/api/products",      productRoutes);
app.use("/api/cart",          cartRoutes);
app.use("/api/coupons",       couponRoutes);
app.use("/api/payments",      paymentRoutes);
app.use("/api/analytics",     analyticsRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/categories",    categoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/otp",           otpRoutes);

if (process.env.NODE_ENV === "production") {
  const frontendDist = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendDist));
  app.get("*", (req, res) => {
    const indexFile = path.join(frontendDist, "index.html");
    res.sendFile(indexFile, (err) => {
      if (err) {
        res.status(404).json({ message: "Frontend not built. Run: npm run build" });
      }
    });
  });
} else {
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.status(404).json({ message: "In development, frontend is served by Vite on port 5173" });
  });
}

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  connectDB();
});
