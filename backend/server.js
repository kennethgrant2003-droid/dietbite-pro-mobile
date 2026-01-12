/**
 * DietBite Pro Backend
 * Express + OpenAI
 * Production-ready for Render
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = Number(process.env.PORT || 3000);

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* -------------------- HEALTH CHECK -------------------- */
/**
 * REQUIRED:
 * - Must return JSON
 * - Frontend depends on this
 * - Render uses this for service health
 */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "dietbite-pro-backend",
    time: new Date().toISOString(),
  });
});

/* -------------------- OPENAI CLIENT -------------------- */
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/* -------------------- CHAT ENDPOINT -------------------- */
app.post("/api/chat", async (req, res) => {
  try {
    const message = (req.body?.message || "").trim();

    if (!message) {
      return res.status(200).json({
        reply: "Please type a question to get started.",
      });
    }

    // No API key fallback (prevents app hang)
    if (!client) {
      return res.status(200).json({
        reply:
          "⚠️ The AI service is not configured yet. Please contact support.",
      });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are DietBite Pro, a friendly nutrition assistant. Keep answers concise and include a brief medical disclaimer.",
        },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "I wasn’t able to generate a response.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("❌ Backend error:", err?.status, err?.message);

    // Rate limit handling (never break the app)
    if (err?.status === 429) {
      return res.status(200).json({
        reply:
          "⚠️ The AI service is temporarily unavailable. Please try again later.",
      });
    }

    // Always return JSON
    return res.status(200).json({
      reply:
        "⚠️ Something went wrong on the server. Please try again shortly.",
    });
  }
});

/* -------------------- START SERVER -------------------- */
/**
 * IMPORTANT:
 * - Must listen on 0.0.0.0 for Render
 */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(
    `✅ Model: ${process.env.OPENAI_MODEL || "gpt-4o-mini"}`
  );
});
