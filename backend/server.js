/**
 * DietBite Pro Backend (Render-ready)
 * Express + OpenAI
 * - Works on Render (uses process.env.PORT)
 * - GET / returns JSON status
 * - GET /api/chat returns browser-safe JSON (prevents "Method Not Allowed")
 * - POST /api/chat accepts { message } and returns { reply }
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ✅ Always-OK health check (browser-friendly)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "DietBite Pro backend",
    time: new Date().toISOString(),
  });
});

// ✅ Browser-friendly route so visiting /api/chat doesn't show Method Not Allowed
app.get("/api/chat", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Backend is running. Use POST /api/chat with JSON { message: 'Hi' }",
  });
});

// OpenAI client (optional if key missing)
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({ reply: "Please type a question." });
    }

    if (!client) {
      return res.status(200).json({
        reply:
          "✅ Backend is live, but OPENAI_API_KEY is missing on the server. Add it in Render → Environment.",
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
    console.error("❌ Error:", err?.status, err?.message);

    if (err?.status === 429) {
      return res.status(200).json({
        reply:
          "⚠️ The AI service is out of quota (429). Add billing/credits, then try again.",
      });
    }

    return res.status(200).json({
      reply: "⚠️ Server error. Check Render logs.",
    });
  }
});

// ✅ Render uses PORT. Bind to 0.0.0.0
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`✅ Model: ${process.env.OPENAI_MODEL || "gpt-4o-mini"}`);
});
