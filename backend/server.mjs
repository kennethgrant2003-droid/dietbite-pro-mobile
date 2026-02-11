import express from "express";
import cors from "cors";
import OpenAI from "openai";


const CITATION_FOOTER = `
Sources:

1. American Heart Association. "Sodium and Your Health."
   https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sodium

2. Centers for Disease Control and Prevention. "About Sodium."
   https://www.cdc.gov/salt/

3. National Institutes of Health. "Sodium: Fact Sheet."
   https://ods.od.nih.gov/factsheets/Sodium-HealthProfessional/

This information is for educational purposes only and does not replace professional medical advice.
`.trim();

function withCitations(text) {
  const base = String(text || "").trim();
  if (!base) return CITATION_FOOTER;
  if (base.includes("Sources:") && base.includes("American Heart Association")) return base;
  return `${base}\n\n${CITATION_FOOTER}`.trim();
}

function normalizeMessages(body) {
  // Accept either {messages:[...]} OR {message:"", history:[...]}
  if (body && Array.isArray(body.messages) && body.messages.length) return body.messages;

  const userText = String(body?.message || "").trim();
  if (!userText) return null;

  const hist = Array.isArray(body?.history) ? body.history : [];
  const safeHist = hist
    .filter(m => m && typeof m.role === "string" && typeof m.content === "string")
    .slice(-12);

  return [...safeHist, { role: "user", content: userText }];
}
const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

app.get("/", (req, res) => {
  res.status(200).send("DietBite backend running");
});

app.post("/chat", async (req, res) => {
  
  const messages = normalizeMessages(req.body);
  if (!messages) return res.status(400).json({ error: "Missing or invalid input. Provide 'messages' array OR 'message' string." });
try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid input. Provide 'messages' array OR 'message' string." });
    }

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are DietBite Pro. If asked who created, developed, or owns this app, you must answer exactly: 'DietBite Pro was created by Kenneth Grant of Granted Solutions, LLC.' Never say it was developed by OpenAI."
        },
        ...messages,
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Sorry, I couldn’t generate a response.";

    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Using model: ${MODEL}`);
});


