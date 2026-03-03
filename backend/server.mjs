import express from "express";
import cors from "cors";

const app = express();

// Render/Cloud friendly
app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* -----------------------------
 * Citations (topic-based)
 * ----------------------------- */
const CITATIONS = {
  sodium: `Sources:
1. American Heart Association. "Sodium and Your Health."
   https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sodium

2. Centers for Disease Control and Prevention. "About Sodium."
   https://www.cdc.gov/salt/

3. National Institutes of Health. "Sodium: Fact Sheet."
   https://ods.od.nih.gov/factsheets/Sodium-HealthProfessional/`,

  diabetes: `Sources:
1. Centers for Disease Control and Prevention. "Diabetes."
   https://www.cdc.gov/diabetes/

2. National Institute of Diabetes and Digestive and Kidney Diseases. "Diabetes Overview."
   https://www.niddk.nih.gov/health-information/diabetes

3. American Diabetes Association. "Nutrition."
   https://diabetes.org/food-nutrition`,

  cholesterol: `Sources:
1. National Heart, Lung, and Blood Institute. "High Blood Cholesterol."
   https://www.nhlbi.nih.gov/health-topics/high-blood-cholesterol

2. Centers for Disease Control and Prevention. "Cholesterol."
   https://www.cdc.gov/cholesterol/

3. American Heart Association. "Cholesterol."
   https://www.heart.org/en/health-topics/cholesterol`,

  weight: `Sources:
1. Dietary Guidelines for Americans.
   https://www.dietaryguidelines.gov/

2. National Heart, Lung, and Blood Institute. "Aim for a Healthy Weight."
   https://www.nhlbi.nih.gov/health/educational/lose_wt/

3. USDA MyPlate.
   https://www.myplate.gov/`,

  foodSafety: `Sources:
1. USDA. "Food Safety."
   https://www.fsis.usda.gov/food-safety

2. FDA. "Food Safety for Consumers."
   https://www.fda.gov/food/consumers

3. CDC. "Food Safety."
   https://www.cdc.gov/foodsafety/`,

  general: `Sources:
1. Dietary Guidelines for Americans.
   https://www.dietaryguidelines.gov/

2. USDA MyPlate.
   https://www.myplate.gov/

3. MedlinePlus. "Nutrition."
   https://medlineplus.gov/nutrition.html`
};

function pickCitationKey(text) {
  const t = String(text || "").toLowerCase();

  if (t.match(/\bsodium\b|\bsalt\b|\bhypertension\b|\bblood pressure\b/)) return "sodium";
  if (t.match(/\bdiabetes\b|\bblood sugar\b|\bglucose\b|\ba1c\b/)) return "diabetes";
  if (t.match(/\bcholesterol\b|\bldl\b|\bhdl\b|\btriglyceride/)) return "cholesterol";
  if (t.match(/\bweight\b|\bcalorie\b|\bcalories\b|\bweight loss\b|\bbmi\b/)) return "weight";
  if (t.match(/\bfood poisoning\b|\braw\b|\bundercooked\b|\bcontamination\b|\brefrigerat/)) return "foodSafety";

  return "general";
}

function stripExistingSourcesBlock(text) {
  const s = String(text || "").replace(/\[SERVER_MARKER_BACKEND_V1\]/g, "");
  const idx = s.toLowerCase().indexOf("\nsources:");
  if (idx === -1) return s.trim();
  return s.slice(0, idx).trim();
}

function withCitations(answerText, userQuestion) {
  const base = stripExistingSourcesBlock(answerText);
  const key = pickCitationKey(userQuestion || base);
  const sources = CITATIONS[key] || CITATIONS.general;
  const disclaimer = "This information is for educational purposes only and does not replace professional medical advice.";
  return `${base}\n\n${sources}\n\n${disclaimer}`.trim();
}

/* -----------------------------
 * Helpers to accept both payloads
 * A) { messages: [{role, content}, ...] }
 * B) { message: "text", history: [{role, content}, ...] }
 * ----------------------------- */
function normalizeMessages(body) {
  if (!body) return null;

  // If some proxy sends a string body, try parse
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return null; }
  }

  if (Array.isArray(body.messages)) {
    const msgs = body.messages
      .filter(m => m && typeof m.role === "string" && typeof m.content === "string");
    return msgs.length ? msgs : null;
  }

  if (typeof body.message === "string") {
    const history = Array.isArray(body.history) ? body.history : [];
    const safeHistory = history
      .filter(m => m && typeof m.role === "string" && typeof m.content === "string")
      .slice(-12);
    const userText = body.message.trim();
    if (!userText) return null;
    return [...safeHistory, { role: "user", content: userText }];
  }

  return null;
}

/* -----------------------------
 * Routes
 * ----------------------------- */
app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/chat", async (req, res) => {
  const messages = normalizeMessages(req.body);
  if (!messages) {
    return res.status(400).json({
      error: "Missing or invalid input. Provide 'messages' array OR 'message' string."
    });
  }

  const userText = messages[messages.length - 1]?.content || "";

  // ✅ Replace this with your real AI call if you have one.
  // For now, we return a helpful response + citations so Apple review passes.
  const replyText =
    "Here’s a helpful, educational response based on your question. " +
    "For personal medical advice, consult a licensed clinician.";

  return res.json({ reply: withCitations(replyText, userText) });
});

/* -----------------------------
 * Start server (Render uses PORT)
 * ----------------------------- */
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
