require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ✅ Root check (browser-safe)
app.get("/", (req, res) => {
  res.send("✅ DietBite Pro backend is running");
});

// ✅ Health check (used by app if needed)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// OpenAI client
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ✅ Chat endpoint (POST ONLY)
app.post("/api/chat", async (req, res) => {
  try {
    const message = (req.body?.message || "").trim();

    if (!message) {
      return res.status(200).json({ reply: "Please enter a message." });
    }

    if (!client) {
      return res.status(200).json({
        reply:
          "Backend is running, but no OPENAI_API_KEY is set on the server.",
      });
    }

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are DietBite Pro, a helpful nutrition assistant. Always include a brief medical disclaimer.",
        },
        { role: "user", content: message },
      ],
      temperature: 0.6,
    });

    const reply =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "No response generated.";

    return res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    return res.json({
      reply: "⚠️ Server error. Please try again shortly.",
    });
  }
});

// ✅ IMPORTANT: Render requires 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
