import express from "express";
import cors from "cors";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

const app = express();

/* ================= CONFIG ================= */
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/* ============== MIDDLEWARE ================ */

// Trust Render proxy (important for rate limit + IP)
app.set("trust proxy", 1);

// JSON body limit
app.use(express.json({ limit: "200kb" }));

// CORS
app.use(cors());

// Request ID + logging
app.use((req, res, next) => {
  const rid = crypto.randomUUID();
  res.locals.rid = rid;
  res.setHeader("x-request-id", rid);

  const start = Date.now();
  res.on("finish", () => {
    console.log(
      JSON.stringify({
        time: new Date().toISOString(),
        rid,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ms: Date.now() - start
      })
    );
  });

  next();
});

// Rate limit chat (protects OpenAI + costs)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

/* ============== HEALTH ROUTES ============== */

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/ready", (_req, res) => {
  res.json({
    ok: true,
    hasOpenAIKey: Boolean(OPENAI_API_KEY)
  });
});

// 🔒 Deployment proof endpoint
app.get("/version", (_req, res) => {
  res.json({ ok: true, version: "prod-stability-1" });
});

/* ============== HELPERS =================== */

function isCreatorQuestion(text) {
  const t = String(text || "").toLowerCase();
  return (
    t.includes("who created you") ||
    t.includes("who made you") ||
    t.includes("who built you") ||
    t.includes("who developed you") ||
    t.includes("creator")
  );
}

function validateBody(body) {
  const message = String(body?.message || "").trim();
  if (!message) return { ok: false, error: "Missing message" };
  if (message.length > 4000) return { ok: false, error: "Message too long" };

  const history = Array.isArray(body?.history)
    ? body.history.slice(-10).map(m => ({
        role: m?.role === "assistant" ? "assistant" : "user",
        content: String(m?.content || "").slice(0, 1000)
      }))
    : [];

  return { ok: true, message, history };
}

async function callOpenAI({ systemPrompt, history, message }) {
  const attempt = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const resp = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: message }
        ],
        signal: controller.signal
      });

      return (resp?.output_text || "").trim();
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    return await attempt();
  } catch {
    return await attempt(); // retry once
  }
}

/* ================= CHAT =================== */

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

    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        reply: "Server missing OPENAI_API_KEY.",
        rid
      });
    }

    const systemPrompt =
      "You are DietBite, a professional nutrition assistant. " +
      "Answer diet questions with specific, actionable guidance. " +
      "Include food examples, swaps, and simple meal ideas. " +
      "If info is missing, assume a typical adult and ask up to 2 follow-ups. " +
      "Use concise bullet points (6–12). " +
      "Add one short medical safety note when appropriate.";

    const reply = await callOpenAI({
      systemPrompt,
      history,
      message
    });

    if (!reply) {
      return res.status(502).json({
        reply: "AI returned no response. Please retry.",
        rid
      });
    }

    res.json({ reply, rid });
  } catch (err) {
    next(err);
  }
});

/* ============== ERROR HANDLER ============== */

app.use((err, _req, res, _next) => {
  const rid = res.locals?.rid || "unknown";
  console.error(
    JSON.stringify({
      time: new Date().toISOString(),
      rid,
      error: String(err?.message || err)
    })
  );
  res.status(500).json({ reply: "Server error. Please try again.", rid });
});

/* ============== START SERVER =============== */

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT} (${NODE_ENV})`);
});

/* ============== SHUTDOWN =================== */

function shutdown() {
  console.log("Shutting down...");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 8000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
