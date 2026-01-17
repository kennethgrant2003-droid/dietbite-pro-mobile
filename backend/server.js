// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ---- CORS (safe default for mobile + web)
app.use(cors());
app.use(express.json());

// ---- VERSION STAMP (changes every deploy so we can verify)
const DEPLOY_ID = process.env.RENDER_GIT_COMMIT || "local";

// ---- Health checks
app.get("/", (req, res) => res.send(`DietBite backend running ✅ (${DEPLOY_ID})`));
app.get("/api/test", (req, res) => res.json({ ok: true, deploy: DEPLOY_ID }));

// ---- OpenAI Chat Route
app.post("/api/chat", async (req, res) => {
  try {
    const message = (req.body?.message || "").toString().trim();
    if (!message) return res.status(400).json({ error: "Missing message" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // IMPORTANT: If you see this in the app, OpenAI key is not set on Render.
      return res.status(500).json({
        error: "OPENAI_API_KEY not set on server",
        deploy: DEPLOY_ID,
      });
    }

    // Lazy-import so the server still boots even if openai isn't installed yet
    const OpenAI = require("openai");
    const client = new OpenAI({ apiKey });

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are DietBite Pro, a helpful nutrition assistant. Be concise and practical.",
        },
        { role: "user", content: message },
      ],
      temperature: 0.6,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() || "No reply returned.";

    return res.json({ reply, deploy: DEPLOY_ID, model });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
