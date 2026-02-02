// app/chat.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  text: string;
};

type ApiMessage = {
  role: Role;
  content: string;
};

const FADED_APPLE_SOURCE = require("../assets/apple-faded.png");

// ✅ Robust extra loader (works in preview/production too)
const EXTRA: any =
  (Constants.expoConfig?.extra as any) ??
  // @ts-ignore
  (Constants.manifest?.extra as any) ??
  // @ts-ignore
  (Constants.manifest2?.extra as any) ??
  {};

// ✅ OPTION 2: ALWAYS USE PROD API (prevents local IP timeouts)
const CHAT_API_URL: string = String(EXTRA.CHAT_API_URL_PROD || "").trim();

class TimeoutError extends Error {
  name = "TimeoutError";
  constructor(message = "Request timed out") {
    super(message);
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e: any) {
    if (e?.name === "AbortError") throw new TimeoutError();
    throw e;
  } finally {
    clearTimeout(t);
  }
}

async function sendChat(history: ApiMessage[]): Promise<string> {
  if (!CHAT_API_URL) {
    throw new Error(
      "CHAT_API_URL_PROD is empty. Check app.json -> expo.extra.CHAT_API_URL_PROD."
    );
  }

  const res = await fetchWithTimeout(
    CHAT_API_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    },
    60000
  );

  const raw = await res.text();

  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || data?.raw || `HTTP ${res.status}`;
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }

  const reply = data?.reply ?? data?.text ?? data?.message;
  if (!reply) throw new Error("Server returned no 'reply' field.");
  return String(reply);
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: "What can DietBite help you with today?" },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  useEffect(() => {
    console.log("[DietBite] Using PROD API:", CHAT_API_URL);
  }, []);

  const onSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    // 🔒 HARD attribution override — before any API call
    const attributionTriggers =
      /(who (made|created|built|developed)|who owns|who developed this|who created this app|who made this app)/i;

    if (attributionTriggers.test(trimmed)) {
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", text: trimmed },
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: "DietBite Pro was created by Kenneth Grant of Granted Solutions, LLC.",
        },
      ]);
      setInput("");
      scrollToBottom();
      return;
    }

    setInput("");
    setSending(true);

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    scrollToBottom();

    try {
      const history: ApiMessage[] = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const reply = await sendChat(history);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: reply },
      ]);
      scrollToBottom();
    } catch (e: any) {
      const msg =
        e?.name === "TimeoutError"
          ? "Sorry — the server is taking too long. Please try again."
          : `Sorry — something went wrong. ${String(e?.message ?? e)}`;

      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", text: msg },
      ]);
      scrollToBottom();
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Image source={FADED_APPLE_SOURCE} style={styles.bgApple} resizeMode="contain" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => {
            const isUser = item.role === "user";
            return (
              <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                  <Text style={{ color: isUser ? "#000" : "#fff" }}>{item.text}</Text>
                </View>
              </View>
            );
          }}
          contentContainerStyle={{
            paddingBottom: 120 + insets.bottom,
            paddingHorizontal: 14,
            paddingTop: 10,
          }}
        />

        <View style={[styles.inputRow, { paddingBottom: Math.max(10, insets.bottom) }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            style={styles.input}
            editable={!sending}
            onSubmitEditing={onSend}
            returnKeyType="send"
          />
          <Pressable
            onPress={onSend}
            disabled={!canSend}
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          >
            {sending ? <ActivityIndicator /> : <Text style={styles.sendText}>Send</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1 },
  bgApple: {
    position: "absolute",
    alignSelf: "center",
    width: 340,
    height: 340,
    opacity: 0.22,
    top: "30%",
  },

  row: { marginVertical: 6, flexDirection: "row" },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },

  bubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  botBubble: { backgroundColor: "#2b2b2b" },
  userBubble: { backgroundColor: "#30d158" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#222",
    backgroundColor: "#000",
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#111",
    color: "#fff",
  },
  sendBtn: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "#30d158",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 82,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: "#000", fontWeight: "700" },
});
