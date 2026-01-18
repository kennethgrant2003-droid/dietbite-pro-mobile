import express from "express";
import crypto from "crypto";
import cors from "cors";

console.log("✅ LOADED backend/server.mjs");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  req.rid = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.rid);
  next();
});

app.get("/", (req, res) => res.json({ ok: true }));

app.get("/version", (req, res) => {
  res.json({
    ok: true,
    file: "backend/server.mjs",
    node: process.version,
    time: new Date().toISOString(),
  });
});

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

    return res.json({
      reply:
        "A low-sodium diet limits sodium (salt) intake to help manage blood pressure and fluid balance.",
      rid,
    });
  } catch (err) {
    console.error(`[chat] ERROR rid=${rid}`, err);
    return res.status(500).json({ reply: "Server error. Please try again.", rid });
  }
});

// IMPORTANT: bind to all interfaces so Windows is happy
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`✅ LISTENING on http://${HOST}:${PORT}`);
});
