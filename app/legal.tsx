import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function LegalScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#000", padding: 20 }}>
      <Text
        style={{
          color: "#4CFF4C",
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 20,
        }}
      >
        Legal Notice
      </Text>

      <Text
        style={{
          color: "#fff",
          fontSize: 16,
          lineHeight: 24,
        }}
      >
        This app provides nutrition information for educational purposes only and
        does not constitute medical advice. Always consult a qualified healthcare
        professional before making changes to your diet, supplements, or
        treatment plan.
      </Text>

      <Pressable
        onPress={() => router.back()}
        style={{
          marginTop: "auto",
          backgroundColor: "#4CFF4C",
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>Back</Text>
      </Pressable>
    </View>
  );
}
