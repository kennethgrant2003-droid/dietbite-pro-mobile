// lib/chatApi.ts
import { API_BASE_URL } from "../config/api";

export async function sendMessage(message: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    if (!data?.reply) {
      return "⚠️ No response received from server.";
    }

    return data.reply;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return "⚠️ Request timed out. Please try again.";
    }
    return "⚠️ Network error. Please check your connection.";
  } finally {
    clearTimeout(timeoutId);
  }
}
