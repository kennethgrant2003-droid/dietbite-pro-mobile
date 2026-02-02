// lib/api.ts
import Constants from "expo-constants";

export type Role = "user" | "assistant";

export type ApiMessage = {
  role: Role;
  content: string;
};

export type ChatResponse = {
  reply?: string;
  text?: string;
  message?: string;
  error?: string;
  [k: string]: any;
};

export class TimeoutError extends Error {
  name = "TimeoutError";
  constructor(message = "Request timed out") {
    super(message);
  }
}

export function getApiBaseUrl(): string {
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL || "").trim();
  const fromExtra = String((Constants.expoConfig?.extra as any)?.apiUrl || "").trim();

  const url = fromEnv || fromExtra;
  return url.replace(/\/+$/, ""); // remove trailing slashes
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (e: any) {
    if (e?.name === "AbortError") throw new TimeoutError();
    throw e;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Sends chat history to backend.
 * Default endpoint: POST /chat  body: { messages: [{role, content}...] }
 *
 * If your backend uses a different path (like /api/chat), change CHAT_PATH below.
 */
const CHAT_PATH = "/chat";

export async function sendChat(
  history: ApiMessage[],
  timeoutMs = 60_000
): Promise<ChatResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      "API URL not configured. Set EXPO_PUBLIC_API_URL in .env to your Render URL."
    );
  }

  const url = `${baseUrl}${CHAT_PATH}`;

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    },
    timeoutMs
  );

  const raw = await res.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    // If backend returns plain text, treat it as reply
    data = { reply: raw };
  }

  if (!res.ok) {
    const msg =
      data?.error ||
      data?.message ||
      `Server error ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return data as ChatResponse;
}

/**
 * One retry on TimeoutError helps a lot on mobile networks.
 */
export async function sendChatWithRetry(
  history: ApiMessage[],
  timeoutMs = 60_000,
  retries = 1
): Promise<ChatResponse> {
  let attempt = 0;

  while (true) {
    try {
      return await sendChat(history, timeoutMs);
    } catch (e: any) {
      const isTimeout =
        e?.name === "TimeoutError" || /timeout/i.test(String(e?.message));
      if (isTimeout && attempt < retries) {
        attempt += 1;
        continue;
      }
      throw e;
    }
  }
}
