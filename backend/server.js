/**
 * DietBite Pro Backend
 * Express + OpenAI
 * - Runs on Render or locally
 * - Always returns JSON
 * - Includes /health route for Render + app checks
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

// Render injects PORT automatically
const PORT = Number(process.env.PORT || 3000);

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

/**
 * ROOT ROUTE (browser-friendly)
 */
app.get("/", (req, res) => {
  res.send("✅ DietBite Pro backend is running");
});

/**
 * HEALTH CHECK (IMPORTANT for Render + debugging)
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "DietBite Pro Backend",
    status: "healthy",
  });
});

/**
 * OpenAI client (only if key exists)
 */
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * CHAT ENDPOINT
 */
app.post("/api/chat", async (req, res) => {
  try {
    const message = (req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({ reply: "Please type a question." });
    }

    // Fast fallback if key missing (prevents hanging)
    if (!client) {
      return res.status(200).json({
        reply:
          "⚠️ Backend is running but OPENAI_API_KEY is missing. Add it in Render Environment settings.",
      });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are DietBite Pro, a helpful nutrition assistant. Keep answers concise and include a brief medical disclaimer.",
        },
        { role: "user", content: message },
      ],
      temperature: 0.6,
    });

    const reply =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "No response generated.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("❌ Backend error:", err?.status, err?.message);

    if (err?.status === 429) {
      return res.status(200).json({
        reply:
          "⚠️ AI quota exceeded. Please check billing or try again later.",
      });
    }

    return res.status(200).json({
      reply: "⚠️ Server error. Please try again shortly.",
    });
  }
});

/**
 * START SERVER
 * IMPORTANT: 0.0.0.0 allows Render + phones to reach it
 */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on http://0.0.0.0:${PORT}`);
  console.log(`✅ Model: ${process.env.OPENAI_MODEL || "gpt-4o-mini"}`);
});
