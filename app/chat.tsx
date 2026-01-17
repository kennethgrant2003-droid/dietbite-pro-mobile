import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ActivityIndicator,
} from "react-native";

const API_URL = "https://dietbite-pro-backend-new.onrender.com/api/chat";
const BACKGROUND = require("../assets/dietbitelogo.png");

type Msg = { role: "user" | "assistant"; text: string };

const stripStars = (t: string) => t.replace(/\*\*/g, "").replace(/\*/g, "");

export default function ChatScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hi! Ask me anything about nutrition." },
  ]);
  const [thinking, setThinking] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!input.trim() || thinking) return;

    const userText = input.trim();
    setInput("");
    setThinking(true);

    setMessages((prev) => [...prev, { role: "user", text: userText }]);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: stripStars(data.reply) },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Unable to reach server." },
      ]);
    } finally {
      setThinking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <ImageBackground source={BACKGROUND} style={styles.bg} resizeMode="cover">
      {/* Dark overlay to fade apple */}
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.con
