import { router } from "expo-router";
import React from "react";
import { ImageBackground, Pressable, Text, View, StyleSheet } from "react-native";

export default function Welcome() {
  return (
    <ImageBackground
      source={require("../assets/images/welcome.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      {/* overlay so buttons/text are readable */}
      <View style={styles.overlay}>
        <View style={{ flex: 1 }} />

        <View style={styles.bottom}>
          <Text style={styles.tagline}>Nutrition Recommendations Made Simple</Text>

          <Pressable onPress={() => router.push("/legal")} style={styles.legalBtn}>
            <Text style={styles.legalText}>Legal notice</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/chat")} style={styles.startBtn}>
            <Text style={styles.startText}>Get Started</Text>
          </Pressable>

          <Text style={styles.footer}>Built by Granted Solutions, LLC</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: "100%", height: "100%" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)" },
  bottom: { padding: 18, gap: 14 },
  tagline: { color: "white", fontSize: 20, textAlign: "center", opacity: 0.95 },
  legalBtn: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3dff7a",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  legalText: { color: "#3dff7a", fontWeight: "800" },
  startBtn: {
    backgroundColor: "#3dff7a",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  startText: { fontSize: 28, fontWeight: "900", color: "#0b1a10" },
  footer: { color: "white", textAlign: "center", opacity: 0.45 },
});
