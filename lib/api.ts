export const API_BASE_URL = "https://dietbite-pro-mobile-1.onrender.com";

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      const msg = json?.error || json?.reply || `Request failed: ${res.status}`;
      throw new Error(msg);
    }

    return json as T;
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("Request timed out");
    throw new Error("Connection error");
  } finally {
    clearTimeout(t);
  }
}
