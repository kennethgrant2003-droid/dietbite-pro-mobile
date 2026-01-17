import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  StyleSheet
} from "react-native";

type From = "me" | "bot";
type Msg = { id: string; text: string; from: From };

const CHAT_API_URL = "http://10.0.0.160:3001/chat";

function isCreatorQuestion(s: string) {
  const q = s.toLowerCase().trim();
  return (
    q.includes("who created you") ||
    q.includes("who made you") ||
    q.includes("who built you") ||
    q.includes("who developed you") ||
    q.includes("creator")
  );
}

function cleanText(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function toHistory(messages: Msg[]) {
  // Convert last messages into backend "history"
  // Keep only the last 10 messages to avoid big payloads
  const last = messages.slice(-10);
  return last.map(m => ({
    role: m.from === "bot" ? "assistant" : "user",
    content: m.text
  }));
}

export default function ChatScreen() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { id: "1", text: "Hello. Ask me a nutrition question.", from: "bot" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const listRef = useRef<FlatList<Msg>>(null);
  const data = useMemo(() => messages, [messages]);

  useEffect(() => {
    if (messages.length <= 1) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  async function fetchAiReply(userText: string, currentMessages: Msg[]) {
    // Creator only if asked (handled client-side too)
    if (isCreatorQuestion(userText)) {
      return "I was created by Kenneth Grant of Granted Solutions, LLC.";
    }

    const res = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        history: toHistory(currentMessages)
      })
    });

    if (!res.ok) {
      return "Connection error. Please try again.";
    }

    const json = await res.json();
    if (json && typeof json.reply === "string" && json.reply.trim()) {
      return json.reply.trim();
    }

    return "No response received. Please try again.";
  }

  const send = async () => {
    const trimmed = cleanText(text);
    if (!trimmed) return;
    if (isTyping) return;

    const userMsg: Msg = { id: String(Date.now()), text: trimmed, from: "me" };

    // Capture the messages including this user message for history
    const nextMessages = messages.concat(userMsg);

    setMessages(nextMessages);
    setText("");
    setIsTyping(true);

    const typingId = "typing";
    setMessages(prev =>
      prev.concat({ id: typingId, text: "Typing...", from: "bot" })
    );

    try {
      const reply = await fetchAiReply(trimmed, nextMessages);

      setMessages(prev => prev.filter(m => m.id !== typingId));
      setMessages(prev =>
        prev.concat({ id: String(Date.now() + 1), text: reply, from: "bot" })
      );
    } catch (_e) {
      setMessages(prev => prev.filter(m => m.id !== typingId));
      setMessages(prev =>
        prev.concat({
          id: String(Date.now() + 2),
          text: "Connection error. Please try again.",
          from: "bot"
        })
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ImageBackground
        source={require("../../assets/chat-bg.png")}
        style={styles.bg}
        resizeMode="cover"
        imageStyle={styles.bgImage}
      >
        <View style={styles.overlay}>
          <FlatList
            ref={listRef}
            data={data}
            keyExtractor={m => m.id}
            renderItem={({ item }) => {
              const isMe = item.from === "me";
              return (
                <View style={[styles.bubble, isMe ? styles.meBubble : styles.botBubble]}>
                  <Text style={styles.bubbleText}>{item.text}</Text>
                </View>
              );
            }}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          />

          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor="#9aa0a6"
              style={styles.input}
              onSubmitEditing={send}
              returnKeyType="send"
            />

            <Pressable
              onPress={send}
              style={[styles.sendBtn, isTyping ? styles.sendBtnDisabled : null]}
              disabled={isTyping}
            >
              <Text style={styles.sendText}>Send</Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  bg: { flex: 1, backgroundColor: "#000" },
  bgImage: { opacity: 0.25 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)" },

  listContent: { paddingVertical: 12, paddingHorizontal: 12 },

  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    marginVertical: 6
  },
  meBubble: { alignSelf: "flex-end", backgroundColor: "#4CFF4C" },
  botBubble: { alignSelf: "flex-start", backgroundColor: "#F2F2F2" },
  bubbleText: { color: "#000", fontSize: 16 },

  inputRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.85)"
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    backgroundColor: "rgba(20,20,20,0.95)"
  },
  sendBtn: {
    marginLeft: 10,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#4CFF4C",
    alignItems: "center",
    justifyContent: "center"
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendText: { color: "#000", fontWeight: "700" }
});
