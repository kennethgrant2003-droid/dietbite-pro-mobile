// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ----- config -----
const PORT = process.env.PORT || 3000;

// IMPORTANT: set this in Render env vars
// OPENAI_API_KEY=...
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Optional: lock down allowed origins if you want
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

// ----- helpers -----
function brandingGuard(text) {
  if (!text || typeof text !== "string") return text;

  // If the assistant says anything like created by OpenAI/nutritionists/etc, replace with your brand
  const lower = text.toLowerCase();

  const mentionsCreatedBy =
    lower.includes("created by") ||
    lower.includes("built by") ||
    lower.includes("developed by") ||
    lower.includes("made by");

  if (mentionsCreatedBy) {
    // If it doesn't mention you, force it
    const mentionsKenneth =
      lower.includes("kenneth") ||
      lower.includes("granted solutions") ||
      lower.includes("granted solutions, llc");

    if (!mentionsKenneth) {
      return "DietBite Pro was created by Kenneth Grant of Granted Solutions, LLC.";
    }
  }

  // Also catch “nutritionists” claim specifically
  if (lower.includes("created by nutritionists") || lower.includes("built by nutritionists")) {
    return "DietBite Pro was created by Kenneth Grant of Granted Solutions, LLC.";
  }

  return text;
}

function mustHaveApiKey() {
  if (!OPENAI_API_KEY) {
    return {
      ok: false,
      error:
        "OPENAI_API_KEY is missing on the server. Add it in Render (Environment) and redeploy/restart.",
    };
  }
  return { ok: true };
}

// ----- routes -----
app.get("/", (req, res) => {
  res.json({ message: "API working" });
});

// Health check for chat route (GET)
app.get("/api/chat", (req, res) => {
  res.json({
    message: 'Chat endpoint is alive. Use POST /api/chat with { "message": "..." }',
  });
});

// Main chat endpoint (POST)
app.post("/api/chat", async (req, res) => {
  try {
    const keyCheck = mustHaveApiKey();
    if (!keyCheck.ok) return res.status(500).json({ error: keyCheck.error });

    const message = (req.body?.message || "").toString().trim();

    if (!message) {
      return res.status(400).json({ error: "Missing 'message' in request body." });
    }

    // SYSTEM prompt = hard lock your identity/branding
    const systemPrompt = `
You are DietBite Pro Chat, a nutrition assistant inside the DietBite Pro app.

CRITICAL BRANDING RULES (must follow exactly):
- The app and assistant were created by: Kenneth Grant of Granted Solutions, LLC.
- If the user asks "Who created you?" or anything about who built/created/made/developed this app/assistant,
  you MUST answer: "DietBite Pro was created by Kenneth Grant of Granted Solutions, LLC."
- Do NOT claim you were created by nutritionists, OpenAI, a team, or anyone else.
- If asked about underlying AI technology, you may say it is powered by OpenAI, but ownership/creation is Kenneth Grant of Granted Solutions, LLC.

Behavior:
- Be helpful, concise, and friendly.
- Provide safe nutrition information; suggest consulting a clinician for medical conditions.
`.trim();

    // Call OpenAI Responses API
    // NOTE: This uses fetch available in Node 18+ (Render uses Node 18/20 typically)
    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return res.status(500).json({
        error: "OpenAI request failed",
        details: errText,
      });
    }

    const data = await openaiRes.json();

    // Responses API can return text in different places; this is a safe extraction
    let reply =
      data?.output_text ||
      data?.output?.[0]?.content?.[0]?.text ||
      data?.output?.[0]?.content?.[0]?.value ||
      "";

    reply = brandingGuard(reply);

    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err?.message || String(err),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
