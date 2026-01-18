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

// ✅ HARD health route (must return 200)
app.get("/", (req, res) => {
  res.status(200).json({ ok: true, route: "/", rid: req.rid });
});

// ✅ Version route (must return 200)
app.get("/version", (req, res) => {
  res.status(200).json({
    ok: true,
    file: "backend/server.mjs",
    node: process.version,
    envPort: process.env.PORT,
    time: new Date().toISOString(),
    rid: req.rid,
  });
});

// ✅ Debug route to see what path you're hitting (must return 200)
app.get("/debug", (req, res) => {
  res.status(200).json({
    ok: true,
    method: req.method,
    path: req.path,
    headersHost: req.headers.host,
    rid: req.rid,
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

    return res.status(200).json({
      reply:
        "A low-sodium diet limits sodium (salt) intake to help manage blood pressure and fluid balance.",
      rid,
    });
  } catch (err) {
    console.error(`[chat] ERROR rid=${rid}`, err);
    return res.status(500).json({ reply: "Server error. Please try again.", rid });
  }
});

// ✅ Fallback: log all unknown routes (this will show you exactly what is 404'ing)
app.use((req, res) => {
  console.log(`[404] rid=${req.rid} ${req.method} ${req.originalUrl}`);
  res.status(404).json({ ok: false, error: "Not Found", path: req.originalUrl, rid: req.rid });
});

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`✅ LISTENING on http://${HOST}:${PORT}`);
});
