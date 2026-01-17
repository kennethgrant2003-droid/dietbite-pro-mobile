import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { sendMessage } from "../lib/chatApi";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi! Ask me anything about nutrition.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const data = await sendMessage(userMessage.text);

      const replyText =
        typeof data?.reply === "string"
          ? data.reply
          : "Sorry, I couldn't generate a response.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: replyText },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "⚠️ Network error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.header}>DietBite Pro Chat</Text>

      <ScrollView
        style={styles.chat}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {messages.map((msg, index) => (
          <Text
            key={index}
            style={[
              styles.message,
              msg.role === "assistant"
                ? styles.assistant
                : styles.user,
            ]}
          >
            <Text style={styles.role}>
              {msg.role === "assistant" ? "DietBite Pro: " : "You: "}
            </Text>
            {msg.text}
          </Text>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask DietBite Pro..."
          placeholderTextColor="#777"
          style={styles.input}
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={loading}
        >
          <Text style={styles.sendText}>
            {loading ? "..." : "Send"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50,
  },
  header: {
    color: "#63ff5a",
    fontSize: 26,
    fontWeight: "900",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  chat: {
    flex: 1,
    paddingHorizontal: 16,
  },
  message: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
  },
  role: {
    fontWeight: "bold",
  },
  assistant: {
    color: "#ffffff",
  },
  user: {
    color: "#b0ffb0",
  },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#222",
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  sendButton: {
    marginLeft: 10,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#63ff5a",
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: {
    color: "#0b1a10",
    fontWeight: "900",
  },
});
