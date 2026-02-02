/**
 * server.js
 * Fixes: HTTP 404 Cannot POST /chat
 * Adds a working POST /chat endpoint
 */

const express = require("express");

const app = express();

/* -----------------------------
 * Basic middleware
 * ----------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -----------------------------
 * Simple request logger
 * ----------------------------- */
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

/* -----------------------------
 * Health / root endpoint
 * ----------------------------- */
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

/* -----------------------------
 * ✅ CHAT ENDPOINT (THIS FIXES IT)
 * This MUST exist because your app POSTs to /chat
 * ----------------------------- */
app.post("/chat", async (req, res) => {
  try {
    console.log("CHAT BODY:", req.body);

    const userMessage =
      req.body?.message ||
      req.body?.text ||
      req.body?.prompt;

    if (!userMessage) {
      return res.status(400).json({
        error: "Missing message in request body",
      });
    }

    // 🔹 TEMP RESPONSE (replace with your real chat logic)
    return res.json({
      reply: `You said: ${userMessage}`,
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.status(500).json({
      error: "Chat failed",
      message: err.message,
    });
  }
});

/* -----------------------------
 * 404 handler
 * ----------------------------- */
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl,
  });
});

/* -----------------------------
 * Start server
 * ----------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
