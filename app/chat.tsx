import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { sendChat } from "../lib/chatApi";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Request timed out")), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Msg>>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "What can DietBite help you with today?",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }

  async function onSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", text };

    // Optimistic UI update
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    scrollToBottom();

    try {
      // ✅ Build chat history for the API (what your backend expects)
      const historyForApi = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.text,
      }));

      // ✅ Prevent infinite "thinking"
      const res = await withTimeout(sendChat(historyForApi), 15000);

      const replyText = res?.reply?.trim() || "No response received.";

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: replyText },
      ]);
    } catch (e: any) {
      const msg =
        e?.message === "Request timed out"
          ? "Sorry — the server is taking too long. Please try again."
          : "Connection error. Please try again.";

      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", text: msg },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  function renderItem({ item }: { item: Msg }) {
    const isUser = item.role === "user";

    return (
      <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.bubbleText, isUser ? styles.userText : styles.botText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  }

  const composerBaseHeight = 64;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Background */}
      <View style={styles.bg}>
        <Image
          source={require("../assets/apple-faded.png")}
          style={styles.apple}
          resizeMode="contain"
        />
        <View style={styles.dim} />
      </View>

      {/* Keyboard fix */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            {
              paddingTop: 14,
              paddingBottom: composerBaseHeight + insets.bottom + 18,
            },
          ]}
          onContentSizeChange={scrollToBottom}
        />

        {/* Composer */}
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.inputWrap}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor="#7a7a7a"
              style={styles.input}
              editable={!loading}
              returnKeyType="send"
              onSubmitEditing={onSend}
            />
          </View>

          <Pressable
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={onSend}
            disabled={!canSend}
          >
            {loading ? <ActivityIndicator /> : <Text style={styles.sendText}>Send</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1 },

  bg: { ...StyleSheet.absoluteFillObject },
  apple: {
    position: "absolute",
    width: "92%",
    height: "92%",
    alignSelf: "center",
    top: "10%",
    opacity: 0.40, // ✅ brighter apple
  },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.52)" },

  list: { paddingHorizontal: 14 },

  row: { flexDirection: "row", marginVertical: 6 },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },

  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: "rgba(255,255,255,0.90)",
    borderTopLeftRadius: 6,
  },
  userBubble: {
    backgroundColor: "#78ff3d",
    borderTopRightRadius: 6,
  },

  bubbleText: { fontSize: 16, lineHeight: 22 },
  botText: { color: "#111" },
  userText: { color: "#000" },

  composer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.90)",
    alignItems: "center",
    gap: 10,
  },

  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
    backgroundColor: "rgba(10,10,10,0.6)",
  },
  input: { fontSize: 16, color: "#fff" },

  sendBtn: {
    width: 84,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#78ff3d",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: "#000", fontSize: 16, fontWeight: "800" },
});
