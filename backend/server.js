import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

function isCreatorQuestion(text) {
  const t = String(text || "").trim().toLowerCase();
  return (
    t.includes("who created you") ||
    t.includes("who made you") ||
    t.includes("who built you") ||
    t.includes("who developed you") ||
    t.includes("creator")
  );
}

app.post("/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!message) {
      return res.json({ reply: "Please ask a nutrition question." });
    }

    // Creator answer ONLY if asked
    if (isCreatorQuestion(message)) {
      return res.json({
        reply: "I was created by Kenneth Grant of Granted Solutions, LLC."
      });
    }

    // Build a short conversation context (avoid repetition)
    const chatHistory = history
      .slice(-10)
      .map(m => {
        const role = m.role === "assistant" ? "assistant" : "user";
        const content = String(m.content || "").slice(0, 1000);
        return { role, content };
      });

    const systemPrompt =
      "You are DietBite, a practical nutrition assistant. " +
      "Always answer the user's diet question directly with specific, actionable guidance. " +
      "Do not respond with generic filler like 'tell me more' unless you have already provided a useful answer. " +
      "Give concrete food examples, swaps, and 1 day meal ideas when relevant. " +
      "If details are missing, assume a typical adult and still answer, then ask at most 2 follow-up questions at the end. " +
      "Keep it concise: 6 to 12 bullets max. " +
      "If medical (kidney disease, diabetes, pregnancy, meds), add one short safety note: confirm with clinician/dietitian for personal targets.";

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: message }
      ]
    });

    const reply = (response?.output_text || "").trim();
    return res.json({
      reply: reply || "I could not generate a response. Please try again."
    });
  } catch (err) {
    return res.status(500).json({
      reply: "Server error. Please try again."
    });
  }
});

app.listen(3001, "0.0.0.0", () => {
  console.log("Backend running on http://0.0.0.0:3001");
});
