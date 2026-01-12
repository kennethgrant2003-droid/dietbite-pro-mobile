import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export default function GlowBackground() {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (
      v: Animated.Value,
      duration: number,
      delay: number
    ) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      );

    const l1 = loop(a1, 4200, 0);
    const l2 = loop(a2, 5200, 600);
    const l3 = loop(a3, 6200, 1200);

    l1.start();
    l2.start();
    l3.start();

    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: a1,
            transform: [{ scale: a1.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.4],
            }) }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: a2,
            transform: [{ scale: a2.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.6],
            }) }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: a3,
            transform: [{ scale: a3.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.8],
            }) }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#6cf',
  },
});
