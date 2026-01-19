// backend/server.js
import express from "express";
import crypto from "crypto";

const app = express();

/**
 * 1) Parse JSON bodies (REQUIRED for your POST /chat)
 */
app.use(express.json({ limit: "1mb" }));

/**
 * 2) Assign a request id to every request so you can trace errors in Render logs
 */
app.use((req, res, next) => {
  req.rid = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.rid);
  next();
});

/**
 * 3) Health check endpoint (useful on Render)
 */
app.get("/", (req, res) => {
  res.sta
