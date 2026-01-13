/**
 * DietBite Pro Backend
 * Express + OpenAI
 * Render-ready, mobile-safe, production-stable
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

/**
 * ✅ ROOT CHECK (for browser / Render)
 */
app.get("/", (req, res) => {
  res.send("✅ DietBite Pro backend is running");
});

/**
 * ✅ HEALTH CHECK (USED BY MOBILE APP)
 */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

/**
 * OpenAI Client
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
      return res.status(200).json({
        reply: "⚠️ Please type a question.",
      });
    }

    // If OpenAI key missing, fail fast (no hang)
    if (!client) {
      return res.status(200).json({
        reply:
          "⚠️ Backend is running, but OPENAI_API_KEY is missing. Add it in Render Environment Variables.",
      });
    }

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are DietBite Pro, a helpful nutrition assistant. Keep answers concise and include a brief medical disclaimer.",
        },
        { role: "user", content: message },
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    const reply =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ No response generated.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("❌ Chat error:", err?.message || err);

    if (err?.status === 429) {
      return res.status(200).json({
        reply:
          "⚠️ The AI service is temporarily unavailable (rate limit). Please try again shortly.",
      });
    }

    return res.status(200).json({
      reply: "⚠️ Server error. Please try again.",
    });
  }
});

/**
 * START SERVER (RENDER COMPATIBLE)
 */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend live on port ${PORT}`);
});
