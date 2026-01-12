// app/welcome.tsx
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();
  const [showLegal, setShowLegal] = useState(false);

  const legalText = useMemo(
    () =>
      `DietBite Pro provides general nutrition recommendations for informational purposes only. It is not medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for personalized guidance.`,
    []
  );

  const onGetStarted = () => {
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={require("../assets/images/welcome-bg.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        {/* Bottom Controls ONLY (keeps the center clean) */}
        <View style={styles.bottomWrap}>
          {/* Small legal link (no big overlay card) */}
          <Pressable onPress={() => setShowLegal(true)} style={styles.legalLinkWrap}>
            <Text style={styles.legalLink}>Legal notice</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={onGetStarted}>
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>

          <Text style={styles.footer}>Built by Granted Solutions, LLC</Text>
        </View>

        {/* LEGAL MODAL */}
        <Modal
          visible={showLegal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLegal(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowLegal(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>Legal notice</Text>
              <Text style={styles.modalText}>{legalText}</Text>

              <Pressable style={styles.modalClose} onPress={() => setShowLegal(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },
  bg: {
    flex: 1,
  },

  bottomWrap: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === "android" ? 22 : 18,
    gap: 12,
  },

  legalLinkWrap: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(80,255,200,0.25)",
  },
  legalLink: {
    color: "#35f0a9",
    fontSize: 14,
    fontWeight: "700",
  },

  button: {
    backgroundColor: "#63ff5a",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#0b1a10",
    fontSize: 26,
    fontWeight: "900",
  },

  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: 2,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "rgba(10,12,14,0.95)",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(80,255,200,0.25)",
  },
  modalTitle: {
    color: "#35f0a9",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 10,
  },
  modalText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 22,
  },
  modalClose: {
    marginTop: 14,
    alignSelf: "flex-end",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(99,255,90,0.15)",
    borderWidth: 1,
    borderColor: "rgba(99,255,90,0.35)",
  },
  modalCloseText: {
    color: "#63ff5a",
    fontWeight: "800",
    fontSize: 14,
  },
});
