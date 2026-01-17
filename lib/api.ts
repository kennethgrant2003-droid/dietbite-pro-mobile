export async function sendMessage(message: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // ✅ 60s

  try {
    const res = await fetch(
      "https://dietbite-pro-backend-new.onrender.com/api/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      }
    );

    const text = await res.text();

    // Try to parse JSON even when server errors
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      throw new Error(
        data?.error
          ? `Server error: ${data.error}`
          : `HTTP ${res.status}: ${text}`
      );
    }

    return data;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("Server is waking up. Try again in a moment.");
    }
    throw new Error(err?.message || "Network request failed");
  } finally {
    clearTimeout(timeout);
  }
}
