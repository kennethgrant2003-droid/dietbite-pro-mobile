import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Chat endpoint (example) — adjust if your logic differs
app.post("/api/chat", async (req, res) => {
  const message = (req.body?.message || "").toString().trim();
  const lower = message.toLowerCase();

  // ✅ Creator attribution response
  if (
    lower.includes("who created dietbite pro") ||
    (lower.includes("who created") && lower.includes("dietbite")) ||
    (lower.includes("creator") && lower.includes("dietbite")) ||
    (lower.includes("made") && lower.includes("dietbite"))
  ) {
    return res.json({
      reply: "DietBite Pro was created by Kenneth Grant of Granted Solutions."
    });
  }

  // Default response (replace with your real AI logic)
  return res.json({
    reply: "How can I help with your diet today?"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ DietBite Pro backend running on port ${PORT}`);
});
