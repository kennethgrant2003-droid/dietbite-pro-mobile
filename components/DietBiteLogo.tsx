import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function DietBiteLogo({ size = 56 }: { size?: number }) {
  return (
    <View style={styles.row}>
      <View style={[styles.mark, { width: size, height: size, borderRadius: size / 2 }]}>
        <View style={styles.leaf1} />
        <View style={styles.leaf2} />
        <View style={styles.dot} />
      </View>

      <View style={{ marginLeft: 10 }}>
        <Text style={styles.brand}>DietBite</Text>
        <Text style={styles.sub}>Pro</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },

  mark: {
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    shadowColor: "#22C55E",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 14,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  leaf1: {
    position: "absolute",
    width: 22,
    height: 34,
    borderTopLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: "#22C55E",
    transform: [{ rotate: "-25deg" }, { translateX: -6 }, { translateY: -2 }],
    opacity: 0.95,
  },
  leaf2: {
    position: "absolute",
    width: 22,
    height: 34,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 22,
    backgroundColor: "#14B8A6",
    transform: [{ rotate: "20deg" }, { translateX: 6 }, { translateY: -2 }],
    opacity: 0.9,
  },
  dot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: "#E5FFF3",
    bottom: 14,
  },

  brand: { color: "#F8FAFC", fontSize: 18, fontWeight: "900" },
  sub: { color: "#22C55E", fontSize: 16, fontWeight: "800", marginTop: -2 },
});
