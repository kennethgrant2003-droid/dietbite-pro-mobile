// lib/chatApi.ts
import { API_BASE_URL } from "../config/api";

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function sendMessage(message: string): Promise<string> {
  const text = message.trim();
  if (!text) return "Please type a question.";

  try {
    // Quick check: if this fails, it's Wi-Fi/IP/firewall (not OpenAI)
    const ping = await fetchWithTimeout(`${API_BASE_URL}/`, { method: "GET" }, 2500);
    if (!ping.ok) {
      return "⚠️ Backend reachable but health check failed. Check server logs.";
    }

    // Chat request (longer timeout so it doesn’t randomly fail)
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/api/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      },
      45000
    );

    const data = await res.json().catch(() => null);

    if (typeof data?.reply === "string" && data.reply.trim().length) {
      return data.reply.trim();
    }

    return data?.error || `⚠️ Empty or invalid response (HTTP ${res.status}).`;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return "⚠️ Request timed out. Backend or OpenAI may be slow.";
    }
    return "⚠️ Network error. Check Wi-Fi, IP address, and firewall.";
  }
}
