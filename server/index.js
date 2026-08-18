import "dotenv/config";                        // must be first — loads .env before anything else
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import HandleError from "./utils/handleError.js";
import errorMiddleware from "./middleware/error.js";

// ── Route imports ─────────────────────────────────────────────────────────────
import userRoutes      from "./routes/userRoutes.js";
import productRoutes   from "./routes/productRoutes.js";
import orderRoutes     from "./routes/orderRoutes.js";
import couponRoutes    from "./routes/couponRoutes.js";
import contactRoutes   from "./routes/contactRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

// ─────────────────────────────────────────────────────────────────────────────
// ENV VALIDATION
// Fail fast if critical variables are missing.
// ─────────────────────────────────────────────────────────────────────────────
const required = ["MONGODB_URI", "JWT_SECRET_KEY", "JWT_EXPIRE", "COOKIE_EXPIRE"];
required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPRESS APP
// ─────────────────────────────────────────────────────────────────────────────
const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
// crossOriginResourcePolicy: false allows images served from Cloudinary to load
// in the browser without being blocked by CORP headers.
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin:      process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,   // required for httpOnly cookie auth
    methods:     ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsers ──────────────────────────────────────────────────────────────
// 10 MB limit to accommodate base64-encoded image uploads sent in JSON bodies.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Cookie parser ─────────────────────────────────────────────────────────────
app.use(cookieParser());

// ── HTTP request logger (development only) ────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── NoSQL injection sanitization ─────────────────────────────────────────────
// express-mongo-sanitize v2 is incompatible with Express 5 (req.query is a
// read-only getter in Express 5). We sanitize req.body manually instead,
// which is where injection attacks arrive in JSON API requests.
const sanitizeValue = (value) => {
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete value[key];
      } else {
        sanitizeValue(value[key]);
      }
    }
  }
  return value;
};

app.use((req, res, next) => {
  if (req.body) sanitizeValue(req.body);
  next();
});

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Applied only to auth endpoints to prevent brute-force and credential stuffing.
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,  // 15 minutes
  max:              20,               // max 20 attempts per window per IP
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});

// General API limiter — loose ceiling to catch runaway clients
const apiLimiter = rateLimit({
  windowMs:        60 * 1000,   // 1 minute
  max:             300,          // 300 requests per minute per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
});

app.use("/api/v1/register",        authLimiter);
app.use("/api/v1/login",           authLimiter);
app.use("/api/v1/password/forgot", authLimiter);
app.use("/api/",                   apiLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mega Himalaya API is running",
    environment: process.env.NODE_ENV,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTES  — all prefixed with /api/v1
// ─────────────────────────────────────────────────────────────────────────────
app.use("/api/v1", userRoutes);
app.use("/api/v1", productRoutes);
app.use("/api/v1", orderRoutes);
app.use("/api/v1", couponRoutes);
app.use("/api/v1", contactRoutes);
app.use("/api/v1", analyticsRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// 404 — catch-all for unmatched routes
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new HandleError(`Cannot ${req.method} ${req.originalUrl}`, 404));
});

// ─────────────────────────────────────────────────────────────────────────────
// CENTRALIZED ERROR HANDLER  — must be last
// ─────────────────────────────────────────────────────────────────────────────
app.use(errorMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));

    // Catch unhandled promise rejections (e.g. DB queries that weren't awaited)
    process.on("unhandledRejection", (err) => {
      console.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

  } catch (err) {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
