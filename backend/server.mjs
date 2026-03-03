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

\n\n${CITATION_FOOTER}`.trim();
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

/* CITATIONS_JSON_MIDDLEWARE */
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
  // If model ever includes its own "Sources:" block, remove it so we don’t double up.
  const s = String(text || "");
  const idx = s.toLowerCase().indexOf("\nsources:");
  if (idx === -1) return s.replace(/\s+$/,"");
  return s.slice(0, idx).replace(/\s+$/,"");
}

function withCitations(text, userQuestion) {
  const base = stripExistingSourcesBlock(text).replace(/\[SERVER_MARKER_BACKEND_V1\]/g, "").trim();

  const key = pickCitationKey(userQuestion || base);
  const sources = CITATIONS[key] || CITATIONS.general;

  const disclaimer = "This information is for educational purposes only and does not replace professional medical advice.";
  return `${base}\n\n${sources}\n\n${disclaimer}`.trim();
}

app.use((req, res, next) => {
  if (req.path === "/chat") {
    const _json = res.json.bind(res);
    const _send = res.send.bind(res);

    res.json = (body) => {
      try {
        if (body && typeof body.reply === "string") body.reply = withCitations(body.reply) + "\n\n";
      } catch {}
      return _json(body);
    };

    res.send = (body) => {
      try {
        if (body && typeof body === "object" && typeof body.reply === "string") {
          body.reply = withCitations(body.reply) + "\n\n";
          return _send(body);
        }
        if (typeof body === "string" && body.trim().startsWith("{")) {
          const obj = JSON.parse(body);
          if (obj && typeof obj.reply === "string") {
            obj.reply = withCitations(obj.reply) + "\n\n";
            return _send(JSON.stringify(obj));
          }
        }
      } catch {}
      return _send(body);
    };
  }
  next();
});
/* /CITATIONS_JSON_MIDDLEWARE */

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
  // If model ever includes its own "Sources:" block, remove it so we don’t double up.
  const s = String(text || "");
  const idx = s.toLowerCase().indexOf("\nsources:");
  if (idx === -1) return s.replace(/\s+$/,"");
  return s.slice(0, idx).replace(/\s+$/,"");
}

function withCitations(text, userQuestion) {
  const base = stripExistingSourcesBlock(text).replace(/\[SERVER_MARKER_BACKEND_V1\]/g, "").trim();

  const key = pickCitationKey(userQuestion || base);
  const sources = CITATIONS[key] || CITATIONS.general;

  const disclaimer = "This information is for educational purposes only and does not replace professional medical advice.";
  return `${base}\n\n${sources}\n\n${disclaimer}`.trim();
}

app.use(cors());
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
  // If model ever includes its own "Sources:" block, remove it so we don’t double up.
  const s = String(text || "");
  const idx = s.toLowerCase().indexOf("\nsources:");
  if (idx === -1) return s.replace(/\s+$/,"");
  return s.slice(0, idx).replace(/\s+$/,"");
}

function withCitations(text, userQuestion) {
  const base = stripExistingSourcesBlock(text).replace(/\[SERVER_MARKER_BACKEND_V1\]/g, "").trim();

  const key = pickCitationKey(userQuestion || base);
  const sources = CITATIONS[key] || CITATIONS.general;

  const disclaimer = "This information is for educational purposes only and does not replace professional medical advice.";
  return `${base}\n\n${sources}\n\n${disclaimer}`.trim();
}

app.use(express.json({ limit: "1mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

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
  // If model ever includes its own "Sources:" block, remove it so we don’t double up.
  const s = String(text || "");
  const idx = s.toLowerCase().indexOf("\nsources:");
  if (idx === -1) return s.replace(/\s+$/,"");
  return s.slice(0, idx).replace(/\s+$/,"");
}

function withCitations(text, userQuestion) {
  const base = stripExistingSourcesBlock(text).replace(/\[SERVER_MARKER_BACKEND_V1\]/g, "").trim();

  const key = pickCitationKey(userQuestion || base);
  const sources = CITATIONS[key] || CITATIONS.general;

  const disclaimer = "This information is for educational purposes only and does not replace professional medical advice.";
  return `${base}\n\n${sources}\n\n${disclaimer}`.trim();
}

app.get("/", (req, res) => {
  res.status(200).send("DietBite backend running");
});

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
  // If model ever includes its own "Sources:" block, remove it so we don’t double up.
  const s = String(text || "");
  const idx = s.toLowerCase().indexOf("\nsources:");
  if (idx === -1) return s.replace(/\s+$/,"");
  return s.slice(0, idx).replace(/\s+$/,"");
}

function withCitations(text, userQuestion) {
  const base = stripExistingSourcesBlock(text).replace(/\[SERVER_MARKER_BACKEND_V1\]/g, "").trim();

  const key = pickCitationKey(userQuestion || base);
  const sources = CITATIONS[key] || CITATIONS.general;

  const disclaimer = "This information is for educational purposes only and does not replace professional medical advice.";
  return `${base}\n\n${sources}\n\n${disclaimer}`.trim();
}

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
  // If model ever includes its own "Sources:" block, remove it so we don’t double up.
  const s = String(text || "");
  const idx = s.toLowerCase().indexOf("\nsources:");
  if (idx === -1) return s.replace(/\s+$/,"");
  return s.slice(0, idx).replace(/\s+$/,"");
}

function withCitations(text, userQuestion) {
  const base = stripExistingSourcesBlock(text).replace(/\[SERVER_MARKER_BACKEND_V1\]/g, "").trim();

  const key = pickCitationKey(userQuestion || base);
  const sources = CITATIONS[key] || CITATIONS.general;

  const disclaimer = "This information is for educational purposes only and does not replace professional medical advice.";
  return `${base}\n\n${sources}\n\n${disclaimer}`.trim();
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Using model: ${MODEL}`);
});







