// lib/chatApi.ts
import { API_BASE_URL } from "./apiBaseUrl";

async function parseJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function healthCheck() {
  const res = await fetch(`${API_BASE_URL}/`);
  const data = await parseJson(res);
  if (!res.ok) throw new Error("Backend not reachable");
  return data;
}

export async function sendChat(message: string) {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await parseJson(res);
  if (!res.ok) throw new Error("Chat failed");
  return data;
}
