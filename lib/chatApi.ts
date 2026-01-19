export type ChatMsg = { role: "user" | "assistant"; content: string };

export type ChatResponse = {
  reply: string;
  rid?: string;
};

const API_BASE_URL = "https://dietbite-pro-mobile-1.onrender.com";

export async function sendChat(messages: ChatMsg[]): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.reply || "Request failed");
  }

  return data as ChatResponse;
}
