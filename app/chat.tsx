import { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";

const API_URL = "https://dietbite-pro-backend-new.onrender.com/api/chat";

// ✅ Use the attached apple (place it here: assets/dietbitelogo.png)
const WATERMARK = require("../assets/dietbitelogo.png");

type Msg = { role: "user" | "assistant"; text: string };

function stripMarkdownStars(text: string) {
  // Removes **bold**, *italics*, and stray asterisks
  return text.replace(/\*\*/g, "").replace(/\*/g, "");
}

export default function ChatScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hi! Ask me anything about nutrition." },
  ]);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message immediately
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    // Scroll down after UI updates
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }

      const data = await res.json();
      const reply = stripMarkdownStars(String(data?.reply ?? "No reply received."));

      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "⚠️ I couldn’t reach the server. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      {/* ✅ Faded apple watermark */}
      <Image source={WATERMARK} style={styles.watermark} resizeMode="contain" />

      <Text style={styles.title}>DietBite Pro Chat</Text>

      <ScrollView
        ref={(r) => (scrollRef.current = r)}
        style={styles.chat}
        contentContainerStyle={{ paddingBottom: 18 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <Text
            key={i}
            style={[
              styles.message,
              msg.role === "user" ? styles.user : styles.assistant,
            ]}
          >
            {msg.role === "user" ? "You: " : "DietBite Pro: "}
            {msg.text}
          </Text>
        ))}

        {/* ✅ “Thinking…” indicator */}
        {loading && (
          <View style={styles.thinkingRow}>
            <ActivityIndicator />
            <Text style={styles.thinkingText}>DietBite Pro is thinking…</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask DietBite Pro..."
          placeholderTextColor="#9aa0a6"
          style={styles.input}
          selectionColor="#63ff5a"
          autoCorrect={false}
          autoCapitalize="sentences"
          keyboardAppearance="dark"
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />

        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!canSend}
          activeOpacity={0.85}
        >
          <Text style={styles.sendText}>{loading ? "..." : "Send"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 16,
  },

  // ✅ Faded watermark behind everything
  watermark: {
    position: "absolute",
    top: "20%",
    alignSelf: "center",
    width: 280,
    height: 280,
    opacity: 0.12, // fade level (try 0.08–0.15)
  },

  title: {
    color: "#63ff5a",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  chat: { flex: 1 },

  message: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 22,
  },
  user: { color: "#63ff5a" },
  assistant: { color: "#fff" },

  thinkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  thinkingText: {
    color: "#cfcfcf",
    fontSize: 14,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // ✅ ensures typed text is always visible
  input: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#ffffff", // typed text visible
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },

  sendButton: {
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#63ff5a",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendText: {
    color: "#0b1a10",
    fontWeight: "900",
  },
});
