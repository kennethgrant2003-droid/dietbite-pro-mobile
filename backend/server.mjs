import express from "express";
import crypto from "crypto";
import cors from "cors";
import OpenAI from "openai";

const app = express();

// Render sits behind a proxy
app.set("trust proxy", 1);

// ✅ CORS (allows your Vite frontend to call the API)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Parse JSON
app.use(express.json({ limit: "1mb" }));

// Log requests + add request id
app.use((req, res, next) => {
  const start = Date.now();
  const rid = crypto.randomUUID();
  res.locals.rid = rid;

  res.on("finish", () => {
    console.log(
      `[${req.method}] ${req.originalUrl} status=${res.statusCode} ms=${Date.now() - start} rid=${rid}`
    );
  });

  next();
});

// ✅ Keep health super simple for Render
app.get("/", (req, res) => res.status(200).send("ok"));

// (Optional) Keep /health too (useful)
app.get("/health", (req, res) => res.status(200).send("ok"));

// OpenAI client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Supports both { message: "..." } and { messages: [...] }
function extractUserText(body) {
  if (typeof body?.message === "string") return body.message;

  if (Array.isArray(body?.messages)) {
    const lastUser = [...body.messages]
      .reverse()
      .find((m) => m && m.role === "user" && typeof m.content === "string");
    if (lastUser) return lastUser.content;
  }

  return null;
}

app.post("/chat", async (req, res) => {
  const rid = res.locals.rid;

  const userText = extractUserText(req.body);
  if (typeof userText !== "string" || !userText.trim()) {
    return res.status(400).json({
      reply: "Missing or invalid 'message' (must be a string).",
      rid
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      reply: "Server misconfigured: OPENAI_API_KEY is not set.",
      rid
    });
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "You are DietBite chat. Follow the user's instructions exactly. If the user asks to output only a specific word/phrase (e.g., 'Say only: OK'), output exactly that and nothing else."
        },
        { role: "user", content: userText }
      ],
      temperature: 0,
      max_output_tokens: 120
    });

    const reply = (response.output_text || "").trim();
    return res.status(200).json({ reply, rid });
  } catch (err) {
    console.error(`OpenAI error rid=${rid}`, err?.message || err);
    return res.status(500).json({
      reply: "AI error. Check server logs.",
      rid
    });
  }
});

// IMPORTANT for Render
const port = process.env.PORT || 10000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
