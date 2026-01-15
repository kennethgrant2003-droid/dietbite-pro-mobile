import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ reply: "Please ask a question." });
  }

  const normalized = message.toLowerCase();

  // ✅ AUTHORSHIP OVERRIDE (THIS IS THE FIX)
  if (
    normalized.includes("who created") ||
    normalized.includes("who made") ||
    normalized.includes("who built") ||
    normalized.includes("who owns dietbite") ||
    normalized.includes("who developed")
  ) {
    return res.json({
      reply:
        "DietBite Pro was created by Kenneth Grant of Granted Solutions."
    });
  }

  // Default fallback response (temporary or AI-based later)
  return res.json({
    reply:
      "I'm here to help with diet and nutrition questions. Ask me anything!"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`DietBite Pro backend running on port ${PORT}`);
});

