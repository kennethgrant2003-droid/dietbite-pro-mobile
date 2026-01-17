import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Disclaimer() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Disclaimer</Text>
      <Text style={styles.body}>
        This app does not provide medical advice. Always consult a qualified professional for
        health-related decisions.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    backgroundColor: "#ffffff", // ✅ spelled correctly
  },
  title: {
    fontWeight: "700",
    marginBottom: 6,
  },
  body: {
    lineHeight: 18,
  },
});
