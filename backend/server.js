// server.js — CricketNepal / Pitch Nepal Backend
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const esewaRoutes = require("./routes/esewaRoutes");
const stripeRoutes = require("./routes/stripeRoutes");

connectDB();
const app = express();

// ── 1. CORS — MUST be first, before everything else ───────────────────────────
// If CORS comes after rate limiter or helmet, OPTIONS preflight requests
// get blocked before they can receive CORS headers → browser shows CORS error
app.use(
  cors({
    origin: (origin, callback) => {
      if (process.env.NODE_ENV === "development" || !origin) return callback(null, true);
      const configuredUrls = (process.env.FRONTEND_URL || "")
        .split(",")
        .map((u) => u.trim().replace(/\/$/, ""))
        .filter(Boolean);

      const allowed = [
        ...configuredUrls,
        "http://localhost:5173",
        "http://localhost:3000",
      ];

      if (
        allowed.includes(origin.replace(/\/$/, "")) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  }),
);

// Handle preflight for all routes explicitly
app.options("*", cors());

// ── 2. Security headers ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));

// ── 3. Rate limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // increased for dev — lower in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  skip: (req) => process.env.NODE_ENV === "development", // skip in dev entirely
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many attempts, please try again later.",
  },
  skip: (req) => process.env.NODE_ENV === "development",
});

app.use("/api", limiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// ── Stripe webhook — must be before body parsers (needs raw body)
app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  require("./controllers/stripeController").stripeWebhook,
);

// ── 4. Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// ── 5. Health check ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🏏 Pitch Nepal API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── 6. API Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/esewa", esewaRoutes);
app.use("/api/stripe", stripeRoutes);

// ── 7. Serve frontend in production ──────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
  });
}

// ── 8. Error handlers ────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── 9. Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Pitch Nepal API — ${process.env.NODE_ENV} mode`);
  console.log(`   http://localhost:${PORT}\n`);
});

process.on("unhandledRejection", (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
process.on("uncaughtException", (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = app;
