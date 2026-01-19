import express from "express";
import cors from "cors";
import crypto from "crypto";
import OpenAI from "openai";

const app = express();

/**
 * IMPORTANT for Render:
 * - Must listen on process.env.PORT
 * - Must bind to 0.0.0.0
 * - Must have a fast health route (GET /)
 */

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check (Render needs this to stop timing out)
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// Helper: normalize request into OpenAI chat messages
function normalizeMessages(body) {
  // NEW format: { messages: [{role, content}, ...] }
  if (Array.isArray(body?.messages)) {
    const cleaned = body.messages
      .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

    if (cleaned.length > 0) return cleaned;
  }

  // OLD format: { message: "..." }
  if (typeof body?.message === "string" && body.message.trim().length > 0) {
    return [{ role: "user", content: body.message.trim() }];
  }

  return null;
}

// Hard rules you want the assistant to follow
function isCreatorQuestion(text) {
  const t = (text || "").toLowerCase();
  return (
    t.includes("who created") ||
    t.includes("who made") ||
    t.includes("who built") ||
    t.includes("who developed") ||
    t.includes("who is the creator") ||
    t.includes("who created this app") ||
    t.includes("who built this app")
  );
}

app.post("/chat", async (req, res) => {
  const rid = crypto.randomUUID();

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        reply: "Server misconfigured (missing OPENAI_API_KEY).",
        rid,
      });
    }

    const messages = normalizeMessages(req.body);
    if (!messages) {
      // Match your old error style so your app can display it
      // If client sent messages incorrectly, we tell them clearly
      return res.status(400).json({
        reply:
          "Missing or invalid request body. Send either {\"message\":\"...\"} or {\"messages\":[{\"role\":\"user\",\"content\":\"...\"}]}",
        rid,
      });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";

    // If they ask who created the app, answer directly (no AI call needed)
    if (isCreatorQuestion(lastUser)) {
      return res.json({
        reply: "Kenneth Grant of Granted Solutions, LLC.",
        rid,
      });
    }

    const client = new OpenAI({ apiKey });

    // System message to keep your app behavior consistent
    const system = {
      role: "system",
      content:
        "You are DietBite Pro, a helpful nutrition assistant. Give clear, practical nutrition guidance. " +
        "If asked who created this app, say exactly: Kenneth Grant of Granted Solutions, LLC. " +
        "Do not mention internal policies. Keep responses concise but helpful.",
    };

    // Build final messages array for OpenAI
    const finalMessages = [system, ...messages];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: finalMessages,
      temperature: 0.7,
    });

    const reply =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "Sorry — I couldn't generate a response right now.";

    return res.json({ reply, rid });
  } catch (err) {
    console.error("Chat error:", err);

    return res.status(500).json({
      reply: "Server error. Please try again.",
      rid,
    });
  }
});

// MUST use process.env.PORT and bind 0.0.0.0 for Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
