import { useRouter } from "expo-router";
import React from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("../assets/welcome.png")}
      resizeMode="cover"
      style={styles.bg}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.bottomWrap}>
          <Pressable style={styles.primaryBtn} onPress={() => router.replace("/chat")}>
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </Pressable>

          <Pressable style={styles.legalBtnWrap} onPress={() => router.push("/legal")}>
            <Text style={styles.legalBtnText}>Legal Notice</Text>
          </Pressable>

          <Text style={styles.footer}>Built by Granted Solutions, LLC</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bottomWrap: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 16,
    alignItems: "center",
  },
  primaryBtn: {
    width: "100%",
    height: 58,
    borderRadius: 18,
    backgroundColor: "#78ff3d",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#000", fontSize: 22, fontWeight: "900" },

  legalBtnWrap: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  legalBtnText: {
    color: "#e8e8e8",
    fontSize: 14,
    textDecorationLine: "underline",
  },

  footer: { marginTop: 10, color: "#cfcfcf", fontSize: 12, textAlign: "center" },
});
