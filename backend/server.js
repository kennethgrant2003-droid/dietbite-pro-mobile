/**
 * DietBite Pro Backend
 * Express + OpenAI
 * Render-safe, mobile-safe
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

/**
 * ROOT HEALTH CHECK
 * https://your-backend.onrender.com/
 */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "DietBite Pro backend",
    time: new Date().toISOString(),
  });
});

/**
 * ✅ OPTION A — GET TEST ROUTE
 * Allows browser/phone testing
 * https://your-backend.onrender.com/api/chat
 */
app.get("/api/chat", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Backend is running. Use POST /api/chat with JSON { message: 'Hi' }",
  });
});

// Create OpenAI client only if key exists
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * MAIN CHAT ENDPOINT (POST ONLY)
 */
app.post("/api/chat", async (req, res) => {
  try {
    const message = (req.body?.message || "").trim();

    if (!message) {
      return res.status(200).json({
        reply: "⚠️ Please type a question.",
      });
    }

    // Fast fallback if key missing (prevents hangs)
    if (!client) {
      return res.status(200).json({
        reply:
          "⚠️ Backend is running, but OPENAI_API_KEY is not set on the server.",
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
    console.error("❌ Server error:", err?.status, err?.message);

    if (err?.status === 429) {
      return res.status(200).json({
        reply:
          "⚠️ The AI service is temporarily unavailable due to quota limits.",
      });
    }

    return res.status(200).json({
      reply: "⚠️ Server error. Please try again shortly.",
    });
  }
});

// IMPORTANT for Render + phones
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`✅ Model: ${process.env.OPENAI_MODEL || "gpt-4o-mini"}`);
});
