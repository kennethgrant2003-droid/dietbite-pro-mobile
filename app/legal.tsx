import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LegalScreen() {
  const router = useRouter();

  // âœ… If there's no history, go back to Welcome
  const goBackSafe = () => {
    try {
      router.back();
    } catch {
      router.replace("/");
    }
    // In some cases router.back() doesn't throw but still can't go back,
    // so we provide a deterministic fallback button behavior:
    setTimeout(() => router.replace("/"), 0);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Legal Notice</Text>

        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.text}>
            This app provides nutrition information for educational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional before making changes to your diet, supplements, or treatment plan.

AI Disclosure and Consent

DietBite Pro uses artificial intelligence (AI) technology provided by OpenAI to generate nutrition and wellness responses.

When you use the chat feature, information you enter, including chat messages and questions, may be transmitted to OpenAI for AI processing and to Render for backend hosting and infrastructure services necessary to operate the application.

Please do not enter sensitive personal information, medical records, financial information, passwords, government identification numbers, or other confidential information.

DietBite Pro provides educational nutrition and wellness information only and does not provide medical diagnosis, treatment, or professional medical advice.

By continuing to use the chat feature, you consent to the transmission and processing of your chat information as described above and in our Privacy Policy.
          </Text>

          {/* âœ… Added: Sources link for medical citations */}
          <Pressable
            style={styles.sourcesBtn}
            onPress={() => router.push("/sources")}
          >
            <Text style={styles.sourcesBtnText}>Sources & Medical References</Text>
          </Pressable>
        </ScrollView>

        <Pressable style={styles.backBtn} onPress={goBackSafe}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18 },
  title: { color: "#78ff3d", fontSize: 34, fontWeight: "900", marginBottom: 14 },
  body: { flex: 1 },
  text: { color: "#fff", fontSize: 20, lineHeight: 28 },

  // âœ… Added styles (non-breaking)
  sourcesBtn: {
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(120,255,61,0.15)",
    borderWidth: 1,
    borderColor: "rgba(120,255,61,0.45)",
  },
  sourcesBtnText: {
    color: "#78ff3d",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },

  backBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#78ff3d",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  backBtnText: { color: "#000", fontSize: 18, fontWeight: "900" },
});

