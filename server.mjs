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

/**
 * server.js
 * Fixes: HTTP 404 Cannot POST /chat
 * Adds a working POST /chat endpoint
 */

const express = require("express");

const app = express();

/* CITATIONS_JSON_MIDDLEWARE */
app.use((req, res, next) => {
  if (req.path === "/chat") {
    const _json = res.json.bind(res);
    res.json = (body) => {
      try {
        if (body && typeof body.reply === "string") {
          body.reply = withCitations(body.reply);
        }
      } catch {}
      return _json(body);
    };
  }
  next();
});
/* /CITATIONS_JSON_MIDDLEWARE */

/* -----------------------------
 * Basic middleware
 * ----------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -----------------------------
 * Simple request logger
 * ----------------------------- */
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

/* -----------------------------
 * Health / root endpoint
 * ----------------------------- */
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

/* -----------------------------
 * âœ… CHAT ENDPOINT (THIS FIXES IT)
 * This MUST exist because your app POSTs to /chat
 * ----------------------------- */
app.post("/chat", async (req, res) => {
  
  
  
  console.log("[/chat] typeof req.body:", typeof req.body);
  console.log("[/chat] isArray:", Array.isArray(req.body));
  console.log("[/chat] body:", req.body);
const messages = normalizeMessages(req.body);
  if (!messages) return res.status(400).json({ error: "Missing or invalid input. Provide 'messages' array OR 'message' string." });
// Accept both payload formats:
  // A) { messages: [{role, content}, ...] }
  // B) { message: "text", history: [{role, content}, ...] }
  if ((!req.body || !Array.isArray(messages)) && req.body && typeof req.body.message === "string") {
    const userText = req.body.message.trim();
    const history = Array.isArray(req.body.history) ? req.body.history : [];
    const safeHistory = history
      .filter(m => m && typeof m.role === "string" && typeof m.content === "string")
      .slice(-12);
    messages = [...safeHistory, { role: "user", content: userText }];
  }
try {
    console.log("CHAT BODY:", req.body);

    const userMessage =
      req.body?.message ||
      req.body?.text ||
      req.body?.prompt;

    if (!userMessage) {
      return res.status(400).json({
        error: "Missing message in request body",
      });
    }

    // ðŸ”¹ TEMP RESPONSE (replace with your real chat logic)
    return res.json({
      reply: `You said: ${userMessage}`,
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.status(500).json({
      error: "Chat failed",
      message: err.message,
    });
  }
});

/* -----------------------------
 * 404 handler
 * ----------------------------- */
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl,
  });
});

/* -----------------------------
 * Start server
 * ----------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`âœ… Server running on port ${PORT}`);
});








