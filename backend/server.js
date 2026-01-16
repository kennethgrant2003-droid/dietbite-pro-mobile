const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* Middleware */
app.use(cors());
app.use(express.json());

/* Health check */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/* Test endpoint */
app.get("/api/test", (req, res) => {
  res.json({ message: "API working" });
});

/* Chat endpoint (POST ONLY) */
app.post("/api/chat", (req, res) => {
  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  // Simple echo response (safe + fast)
  return res.json({
    reply: `You said: ${message}`,
  });
});

/* Start server */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
