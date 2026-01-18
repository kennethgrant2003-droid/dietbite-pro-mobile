import express from "express";
import cors from "cors";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

const app = express();

// ---- config ----
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

// Trust Render/Proxy headers for correct client IPs (rate limiting, logs)
app.set("trust proxy", 1);

// Keep JSON small to prevent abuse
app.use(express.json({ limit: "200kb" }));

// CORS (safe default). If you later want to restrict origins, you can.
app.use(cors());

// Request ID + basic request logging
app.use((req, res, next) => {
  const rid = crypto.randomUUID();
  res.locals.rid = rid;
  res.setHeader("x-request-id", rid);

  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    // concise single-line log
    console.log(
      JSON.stringify({
        t: new Date().toISOString(),
        rid,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ms
      })
    );
  });

  next();
});

// Rate limit chat endpoint (tune to your needs)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,             // 30 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false
});

// Health endpoints
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/ready", (_req, res) => {
  // readiness = can we serve requests + key exists (optional)
  res.json({ ok: true, hasOpenAIKey: Boolean(OPENAI_API_KEY) });
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

// Very small input validation (keeps server safe)
function validateBody(body) {
  const message = String(body?.message || "").trim();
  const history = Array.isArray(body?.history) ? body.history : [];
  if (!message) return { ok: false, error: "Missing message" };
  if (message.length > 4000) return { ok: false, error: "Message too long" };

  // Keep history small and safe
  const cleanedHistory = history
    .slice(-10)
    .map((m) => ({
      role: m?.role === "assistant" ? "assistant" : "user",
      content: String(m?.content || "").slice(0, 1000)
    }));

  return { ok: true, message, history: cleanedHistory };
}

// Helper: OpenAI call with timeout + one retry (stability)
async function callOpenAIWithTimeout({ systemPrompt, history, message, timeoutMs }) {
  const attempt = async () => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await client.responses.create({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: message }
        ],
        // The OpenAI SDK supports AbortController via fetch under the hood
        // In many environments this works; if not, it will just ignore it.
        signal: controller.signal
      });

      return (resp?.output_text || "").trim();
    } finally {
      clearTimeout(t);
    }
  };

  try {
    return await attempt();
  } catch (e) {
    // retry once on transient failures/timeouts
    return await attempt();
  }
}

app.post("/chat", chatLimiter, async (req, res, next) => {
  try {
    const rid = res.locals.rid;

    const v = validateBody(req.body);
    if (!v.ok) {
      return res.status(400).json({ reply: v.error, rid });
    }

    const { message, history } = v;

    // Creator only if asked
    if (isCreatorQuestion(message)) {
      return res.json({
        reply: "I was created by Kenneth Grant of Granted Solutions, LLC.",
        rid
      });
    }

    // If key missing, fail clearly (prevents silent “generic” behavior)
    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        reply: "Server is missing OPENAI_API_KEY.",
        rid
      });
    }

    const systemPrompt =
      "You are DietBite, a practical nutrition assistant. " +
      "Always answer the user's diet question directly with specific, actionable guidance. " +
      "Provide concrete food examples, swaps, and simple meal ideas when relevant. " +
      "If details are missing, assume a typical adult and still answer, then ask at most 2 follow-up questions at the end. " +
      "Keep it concise: 6 to 12 bullets max. " +
      "If medical (kidney disease, diabetes, pregnancy, meds), add one short safety note to confirm with a clinician/dietitian.";

    const reply = await callOpenAIWithTimeout({
      systemPrompt,
      history,
      message,
      timeoutMs: 20000
    });

    if (!reply) {
      return res.status(502).json({
        reply: "Upstream AI returned an empty response. Please try again.",
        rid
      });
    }

    return res.json({ reply, rid });
  } catch (err) {
    return next(err);
  }
});

// Centralized error handler (prevents crashes + gives consistent reply)
app.use((err, _req, res, _next) => {
  const rid = res.locals?.rid || "unknown";
  console.error(
    JSON.stringify({
      t: new Date().toISOString(),
      rid,
      error: String(err?.message || err)
    })
  );
  res.status(500).json({ reply: "Server error. Please try again.", rid });
});

// Start server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT} (${NODE_ENV})`);
});

// Graceful shutdown (Render restarts/deploys)
function shutdown() {
  console.log("Shutting down...");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 8000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
