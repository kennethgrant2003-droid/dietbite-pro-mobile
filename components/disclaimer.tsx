// app/components/Disclaimer.tsx
import { StyleSheet, Text, View } from "react-native";

export default function Disclaimer({ style }: { style?: object }) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.text}>
        These recommendations are informational only and do not replace medical
        advice. Always consult a licensed healthcare professional.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0f1f22",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(45, 211, 111, 0.25)",
  },
  text: {
    color: "#d4f7e3",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
});
