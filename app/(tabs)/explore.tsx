import GlowBackground from "@/components/GlowBackground";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExploreScreen() {
  return (
    <GlowBackground>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>
          This is the Explore tab. Content coming soon.
        </Text>
      </SafeAreaView>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#9ee6b8",
    textAlign: "center",
  },
});
