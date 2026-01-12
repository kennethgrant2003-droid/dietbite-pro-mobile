import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sendMessage } from "../../lib/chatApi";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const INPUT_HEIGHT = 78;

// Animated gradient wrapper
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export default function ChatScreen() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! Ask me anything about nutrition. What can I help with today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);

  // 🌌 Subtle gradient animation
  const gradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 18000,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 18000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const start = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  const end = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.7],
  });

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), role: "user", text },
    ]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    const reply = await sendMessage(text);

    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-ai`, role: "assistant", text: reply },
    ]);
    setLoading(false);
    scrollToBottom();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* 🌌 Animated gradient background */}
      <AnimatedGradient
        colors={["#020403", "#0a1712", "#020403"]}
        start={{ x: start, y: 0 }}
        end={{ x: end, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 🍏 DietBite logo watermark */}
      <Image
        source={require("../../assets/images/dietbitelogo.png")}
        style={styles.watermark}
        resizeMode="contain"
      />

      {/* Main content */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chat}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === "user" ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text style={styles.bubbleText}>{item.text}</Text>
            </View>
          )}
          keyboardShouldPersistTaps="handled"
        />

        {loading && <Text style={styles.thinking}>Thinking…</Text>}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask DietBite..."
            placeholderTextColor="rgba(233,255,242,0.4)"
            style={styles.input}
            multiline
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && { opacity: 0.85 },
              loading && { opacity: 0.6 },
            ]}
            onPress={handleSend}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Ask</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },

  // 🍏 Watermark styling (subtle, non-distracting)
  watermark: {
    position: "absolute",
    width: "72%",
    height: "72%",
    alignSelf: "center",
    top: "18%",
    opacity: 0.08, // 🔧 adjust 0.05–0.1 if desired
  },

  chat: {
    padding: 16,
    paddingBottom: INPUT_HEIGHT + 30,
  },

  bubble: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    maxWidth: "85%",
    borderWidth: 1,
  },

  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(0, 255, 170, 0.18)",
    borderColor: "rgba(0, 255, 170, 0.3)",
  },

  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(12, 18, 16, 0.78)",
    borderColor: "rgba(233,255,242,0.12)",
  },

  bubbleText: {
    color: "rgba(233,255,242,0.95)",
    fontSize: 16,
    lineHeight: 22,
  },

  thinking: {
    position: "absolute",
    bottom: INPUT_HEIGHT + 10,
    left: 16,
    right: 16,
    color: "rgba(233,255,242,0.6)",
  },

  inputBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(8, 14, 12, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "flex-end",
  },

  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "rgba(233,255,242,0.95)",
    backgroundColor: "rgba(10, 16, 14, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(233,255,242,0.12)",
  },

  button: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: "rgba(0, 255, 170, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#00150D",
  },
});
