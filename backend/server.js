/**
 * DietBite Pro Backend
 * Express + OpenAI
 * - Listens on 0.0.0.0 so phone can reach it on LAN
 * - Always returns JSON { reply: "..." } even on errors
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Allow requests from phone + web
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/", (req, res) => {
  res.send("✅ DietBite Pro backend is running");
});

// Create client only if key exists
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.post("/api/chat", async (req, res) => {
  try {
    const message = (req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({ reply: "Please type a question." });
    }

    // If no key, return a fast fallback response (prevents hanging)
    if (!client) {
      return res.status(200).json({
        reply:
          "✅ Backend is running, but no OPENAI_API_KEY is set. Add it to backend/.env and restart the server.",
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
    console.error("❌ OpenAI/Server error:", err?.status, err?.message);

    // Always return JSON so the app doesn't crash/hang
    if (err?.status === 429) {
      return res.status(200).json({
        reply:
          "⚠️ The AI service is out of quota right now (429). Add billing/credits in OpenAI, then try again.",
      });
    }

    return res.status(200).json({
      reply: "⚠️ Server error. Check backend console logs.",
    });
  }
});

// IMPORTANT: 0.0.0.0 lets your phone reach it on your Wi-Fi network
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on http://0.0.0.0:${PORT}`);
  console.log(`✅ Using model: ${process.env.OPENAI_MODEL || "gpt-4o-mini"}`);
});
