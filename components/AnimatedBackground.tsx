import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function AnimatedBackground() {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, duration: number, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      );

    const la = loop(a, 9000);
    const lb = loop(b, 12000, 300);
    const lc = loop(c, 15000, 700);

    la.start();
    lb.start();
    lc.start();

    return () => {
      la.stop();
      lb.stop();
      lc.stop();
    };
  }, [a, b, c]);

  const blobStyle = (v: Animated.Value, x: number, y: number, s1: number, s2: number) => {
    const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [x, x + 22] });
    const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [y, y - 18] });
    const scale = v.interpolate({ inputRange: [0, 1], outputRange: [s1, s2] });

    return {
      transform: [{ translateX }, { translateY }, { scale }],
    };
  };

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.base} />

      <Animated.View style={[styles.blob, styles.blobGreen, blobStyle(a, -40, 40, 1.0, 1.12)]} />
      <Animated.View style={[styles.blob, styles.blobTeal, blobStyle(b, 220, 160, 0.95, 1.08)]} />
      <Animated.View style={[styles.blob, styles.blobGreen2, blobStyle(c, 40, 520, 0.9, 1.06)]} />

      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#020617", // deep slate
    overflow: "hidden",
  },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#020617",
  },
  blob: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 340,
    opacity: 0.24,
  },
  blobGreen: { backgroundColor: "#22C55E" },
  blobGreen2: { backgroundColor: "#16A34A" },
  blobTeal: { backgroundColor: "#14B8A6" },

  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.65)",
  },
});
