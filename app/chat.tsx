import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

const API_URL = "https://dietbite-pro-backend-new.onrender.com/api/chat";

export default function ChatScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([
    { role: "assistant", text: "Hi! Ask me anything about nutrition." },
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply ?? "No reply." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Network error. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DietBite Pro Chat</Text>

      <ScrollView style={styles.chat}>
        {messages.map((m, i) => (
          <Text
            key={i}
            style={[
              styles.message,
              m.role === "user" ? styles.user : styles.assistant,
            ]}
          >
            {m.role === "user" ? "You: " : "DietBite Pro: "}
            {m.text}
          </Text>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask DietBite Pro..."
          placeholderTextColor="#666"
          style={styles.input}
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={styles.sendButton}
          disabled={loading}
        >
          <Text style={styles.sendText}>{loading ? "..." : "Send"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 16,
  },
  title: {
    color: "#63ff5a",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  chat: {
    flex: 1,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    marginBottom: 8,
  },
  user: {
    color: "#63ff5a",
  },
  assistant: {
    color: "#fff",
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
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
