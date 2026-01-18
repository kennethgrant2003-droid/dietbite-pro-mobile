import express from "express";
import crypto from "crypto";
import cors from "cors";

console.log("✅ LOADED backend/server.mjs");

const app = express();

/* -------------------- Middleware -------------------- */

// CORS (allow mobile + web during dev)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// JSON parsing
app.use(express.json({ limit: "1mb" }));

// Request ID for tracing
app.use((req, res, next) => {
  req.rid = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.rid);
  next();
});

/* -------------------- Health & Meta -------------------- */

// Root (Render also probes this sometimes)
app.get("/", (req, res) => {
  res.status(200).json({ ok: true, route: "/", rid: req.rid });
});

// REQUIRED for Render health checks
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, status: "healthy", rid: req.rid });
});

// Confirm deployed file/version
app.get("/version", (req, res) => {
  res.status(200).json({
    ok: true,
    file: "backend/server.mjs",
    node: process.version,
    port: process.env.PORT,
    time: new Date().toISOString(),
    rid: req.rid,
  });
});

// Debug helper
app.get("/debug", (req, res) => {
  res.status(200).json({
    ok: true,
    method: req.method,
    path: req.originalUrl,
    headersHost: req.headers.host,
    rid: req.rid,
  });
});

/* -------------------- Chat API -------------------- */

app.post("/chat", (req, res) => {
  const rid = req.rid;

  try {
    const { message } = req.body ?? {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        reply: "Missing or invalid 'message' (must be a string).",
        rid,
      });
    }

    return res.status(200).json({
      reply:
        "A low-sodium diet limits sodium (salt) intake to help manage blood pressure and fluid balance. " +
        "It emphasizes fresh foods, reading labels, and avoiding heavily processed foods.",
      rid,
    });
  } catch (err) {
    console.error(`[chat] ERROR rid=${rid}`, err);
    return res.status(500).json({
      reply: "Server error. Please try again.",
      rid,
    });
  }
});

/* -------------------- 404 Handler -------------------- */

app.use((req, res) => {
  console.log(`[404] rid=${req.rid} ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    ok: false,
    error: "Not Found",
    path: req.originalUrl,
    rid: req.rid,
  });
});

/* -------------------- Start Server -------------------- */

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`✅ LISTENING on http://${HOST}:${PORT}`);
});
