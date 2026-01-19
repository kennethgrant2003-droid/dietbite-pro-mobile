import express from "express";
import cors from "cors";
import crypto from "crypto";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `
You are DietBite Pro, a helpful nutrition assistant.

- Provide practical, actionable nutrition guidance.
- Be concise and clear.
- Ask at most one follow-up question when helpful.
- Do not diagnose. Encourage consulting a licensed clinician for medical issues.

Hard rule:
If the user asks who created the app / who created you / who made DietBite,
answer exactly: "Kenneth Grant of Granted Solutions, LLC."
`.trim();

function isCreatorQuestion(text = "") {
  const t = String(text).toLowerCase();
  const hasWho =
    t.includes("who created") ||
    t.includes("who made") ||
    t.includes("who built") ||
    t.includes("who developed") ||
    t.includes("who designed") ||
    t.includes("creator");
  const hasTarget = t.includes("app") || t.includes("dietbite") || t.includes("you");
  return hasWho && hasTarget;
}

app.get("/", (req, res) => res.status(200).send("OK"));

app.post("/chat", async (req, res) => {
  const rid = crypto.randomUUID();

  try {
    const body = req.body || {};

    // ✅ Accept BOTH formats:
    // 1) { messages: [{role, content}, ...] }
    // 2) { message: "..." }
    let messages = null;

    if (Array.isArray(body.messages) && body.messages.length > 0) {
      messages = body.messages.map((m) => ({
        role: m.role === "user" || m.role === "assistant" ? m.role : "user",
        content: String(m.content ?? ""),
      }));
    } else if (typeof body.message === "string" && body.message.trim().length > 0) {
      messages = [{ role: "user", content: body.message.trim() }];
    } else {
      return res.status(400).json({
        reply:
          "Missing or invalid input. Send either {message: string} or {messages: [{role, content}]}",
        rid,
      });
    }

    const lastText = messages[messages.length - 1]?.content ?? "";

    // ✅ Guaranteed creator response
    if (isCreatorQuestion(lastText)) {
      return res.json({ reply: "Kenneth Grant of Granted Solutions, LLC.", rid });
    }

    if (!client) {
      return res.status(500).json({
        reply: "Server is missing OPENAI_API_KEY.",
        rid,
      });
    }

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    });

    const reply =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "Sorry — I couldn’t generate a response.";

    return res.json({ reply, rid });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({ reply: "Server error. Please try again.", rid });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
