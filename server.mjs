const CITATION_FOOTER = `


    // Real AI response using normalized messages
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.4
    });

    const aiText = completion?.choices?.[0]?.message?.content
      ? String(completion.choices[0].message.content).trim()
      : "";

    if (!aiText) {
      return res.status(500).json({ error: "Chat failed", message: "Empty AI response" });
    }

    return res.json({ reply: withCitations(aiText) });
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











