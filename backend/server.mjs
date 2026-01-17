import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/health", (_req, res) => res.json({ ok: true }));

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
    const message = String(req.body && req.body.message ? req.body.message : "").trim();

    if (!message) {
      return res.json({ reply: "Ask me a nutrition question (example: low sodium meals, diabetes foods, renal diet)." });
    }

    // Creator name only if asked
    if (isCreatorQuestion(message)) {
      return res.json({ reply: "I was created by Kenneth Grant of Granted Solutions, LLC." });
    }

    // Strong system prompt to avoid broad replies
    const systemPrompt =
      "You are DietBite, a practical nutrition assistant. " +
      "Always answer the user's question directly with specific, actionable guidance. " +
      "Do NOT respond with generic filler like 'that sounds like a nutrition question' or only ask for more details. " +
      "Give examples of foods, swaps, simple meal ideas, and a short checklist. " +
      "If details are missing, make reasonable assumptions and still answer, then ask at most 2 quick follow-up questions at the end. " +
      "Keep responses 6-12 bullets max, concise but useful. " +
      "If the topic involves a medical condition (diabetes, kidney disease, heart failure, pregnancy, eating disorders, meds), include one short safety note: 'For personalized targets, confirm with your clinician/dietitian.'";

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    const reply = (response && response.output_text ? String(response.output_text) : "").trim();
    return res.json({ reply: reply || "I could not generate a response. Please try again." });
  } catch (_err) {
    return res.status(500).json({ reply: "Server error. Please try again." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log("DietBite backend running on http://0.0.0.0:" + PORT);
});
