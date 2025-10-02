// components/ScreenShell.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Easing, ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Jarak slide masuk dari bawah (px) */
  slideFrom?: number;
  /** Durasi animasi (ms) */
  duration?: number;
  /** Ubah nilai ini untuk memicu animasi ulang saat screen refocus */
  refreshKey?: any;
};

export default function ScreenShell({
  children,
  style,
  slideFrom = 16,
  duration = 220,
  refreshKey,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideFrom)).current;

  function run() {
    opacity.setValue(0);
    translateY.setValue(slideFrom);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  return (
    <Animated.View
      style={[
        { opacity, transform: [{ translateY }], flex: 1 },
        // @ts-ignore
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
