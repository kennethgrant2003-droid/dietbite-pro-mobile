import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const CITATIONS = {
  sodium:
    "Sources:\n\n" +
    "1. American Heart Association. Sodium and Your Health.\n" +
    "   https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sodium\n\n" +
    "2. Centers for Disease Control and Prevention. About Sodium.\n" +
    "   https://www.cdc.gov/salt/\n\n" +
    "3. National Institutes of Health. Sodium: Fact Sheet.\n" +
    "   https://ods.od.nih.gov/factsheets/Sodium-HealthProfessional/",

  fiber:
    "Sources:\n\n" +
    "1. Harvard T.H. Chan School of Public Health. Fiber.\n" +
    "   https://www.hsph.harvard.edu/nutritionsource/carbohydrates/fiber/\n\n" +
    "2. Mayo Clinic. Dietary fiber: Essential for a healthy diet.\n" +
    "   https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/fiber/art-20043983\n\n" +
    "3. USDA Dietary Guidelines for Americans.\n" +
    "   https://www.dietaryguidelines.gov/",

  diabetes:
    "Sources:\n\n" +
    "1. American Diabetes Association. Nutrition.\n" +
    "   https://diabetes.org/food-nutrition\n\n" +
    "2. Centers for Disease Control and Prevention. Diabetes.\n" +
    "   https://www.cdc.gov/diabetes/\n\n" +
    "3. National Institute of Diabetes and Digestive and Kidney Diseases. Diabetes Overview.\n" +
    "   https://www.niddk.nih.gov/health-information/diabetes",

  cholesterol:
    "Sources:\n\n" +
    "1. American Heart Association. Cholesterol.\n" +
    "   https://www.heart.org/en/health-topics/cholesterol\n\n" +
    "2. Centers for Disease Control and Prevention. Cholesterol.\n" +
    "   https://www.cdc.gov/cholesterol/\n\n" +
    "3. National Heart, Lung, and Blood Institute. High Blood Cholesterol.\n" +
    "   https://www.nhlbi.nih.gov/health-topics/high-blood-cholesterol",

  general:
    "Sources:\n\n" +
    "1. USDA Dietary Guidelines for Americans.\n" +
    "   https://www.dietaryguidelines.gov/\n\n" +
    "2. USDA MyPlate.\n" +
    "   https://www.myplate.gov/\n\n" +
    "3. MedlinePlus. Nutrition.\n" +
    "   https://medlineplus.gov/nutrition.html",
};

function pickTopic(question, answer) {
  const t = (String(question || "") + " " + String(answer || "")).toLowerCase();
  if (/(sodium|salt|hypertension|blood pressure)/.test(t)) return "sodium";
  if (/(fiber|constipation|gut|bowel|whole grain|chia|oats)/.test(t)) return "fiber";
  if (/(diabetes|blood sugar|glucose|a1c)/.test(t)) return "diabetes";
  if (/(cholesterol|ldl|hdl|triglycer)/.test(t)) return "cholesterol";
  return "general";
}

function cleanAnswer(text) {
  let s = String(text || "");
  s = s.replace(/\[SERVER_MARKER_BACKEND_V1\]/g, "");
  const idx = s.toLowerCase().indexOf("\nsources:");
  if (idx !== -1) s = s.slice(0, idx);
  return s.trim();
}

function withCitations(answer, question) {
  const base = cleanAnswer(answer);
  const topic = pickTopic(question, base);
  const disclaimer = "This information is for educational purposes only and does not replace professional medical advice.";

  return (base + "\n\n" + CITATIONS[topic] + "\n\n" + disclaimer).trim();
}
function normalizeMessages(body) {
  if (!body) return null;

  if (Array.isArray(body.messages)) {
    const msgs = body.messages.filter(
      (m) => m && typeof m.role === "string" && typeof m.content === "string"
    );
    return msgs.length ? msgs : null;
  }

  if (typeof body.message === "string") {
    const history = Array.isArray(body.history) ? body.history : [];
    const safeHistory = history
      .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
      .slice(-12);

    return safeHistory.concat([{ role: "user", content: body.message.trim() }]);
  }

  return null;
}

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "dietbite-backend" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "dietbite-backend" });
});

app.post("/chat", async (req, res) => {
  try {
    const messages = normalizeMessages(req.body);

    if (!messages) {
      return res.status(400).json({
        error: "Missing or invalid input. Provide 'messages' array OR 'message' string.",
      });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const question = lastUser?.content || "";

    let aiText = "";

    if (!process.env.OPENAI_API_KEY) {
      aiText =
        "Here is educational nutrition guidance based on your question. For personal medical advice, consult a licensed healthcare professional.";
    } else {
      const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You are DietBite Pro, an educational nutrition assistant. Do not diagnose, treat, or replace professional medical advice. Keep answers clear, practical, and safe.",
          },
          ...messages,
        ],
      });

      aiText = completion.choices?.[0]?.message?.content || "";
    }

    return res.json({ reply: withCitations(aiText, question) });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({
      error: "Chat failed",
      message: err.message,
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server listening on port " + PORT);
  console.log("Using model: " + MODEL);
});

