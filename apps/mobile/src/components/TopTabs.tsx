import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
  Easing,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { NavTo } from "../types/nav";

type TabKey = "home" | "visit" | "plan" | "history" | "customers";

type Props = {
  current: TabKey;
  go: NavTo;
};

const C = {
  activeA: "#8B5CF6",
  activeB: "#6D28D9",
  glass: "rgba(255,255,255,0.14)",
  glassBorder: "rgba(255,255,255,0.18)",
  text: "#E5E7EB",
  white: "#FFFFFF",
};

type PillMeta = { x: number; w: number };

function AnimatedPill({
  icon,
  label,
  active,
  onPress,
  onLayout,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(active ? 1 : 0)).current;

  // transisi aktif/non-aktif (fade halus)
  useEffect(() => {
    Animated.timing(fade, {
      toValue: active ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [active, fade]);

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={{ height: 36 }}
      onLayout={onLayout}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {/* Layer dasar (glass) */}
        <View
          style={[
            styles.pill,
            { backgroundColor: C.glass, borderColor: C.glassBorder },
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            color={C.text}
            size={16}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.pillText, { color: C.text }]} numberOfLines={1}>
            {label}
          </Text>
        </View>

        {/* Layer aktif (gradient) di atasnya, di-fade */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: fade, borderRadius: 18, overflow: "hidden" },
          ]}
        >
          <LinearGradient
            colors={[C.activeA, C.activeB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.pill, { borderColor: "transparent" }]}
          >
            <MaterialCommunityIcons
              name={icon as any}
              color={C.white}
              size={16}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[styles.pillText, { color: C.white }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default function TopTabs({ current, go }: Props) {
  const tabs: { key: TabKey; icon: string; label: string }[] = useMemo(
    () => [
      { key: "home", icon: "view-dashboard-outline", label: "Dashboard" },
      {
        key: "visit",
        icon: "clipboard-text-outline",
        label: "Input Kunjungan",
      },
      { key: "plan", icon: "calendar-plus-outline", label: "Plan Besok" },
      { key: "history", icon: "history", label: "Riwayat" },
      {
        key: "customers",
        icon: "account-multiple-plus-outline",
        label: "Master Customer",
      },
    ],
    []
  );

  const scrollRef = useRef<ScrollView>(null);
  const posRef = useRef<Record<string, PillMeta>>({});
  const [scrollX, setScrollX] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setScrollX(e.nativeEvent.contentOffset.x);

  // auto-scroll supaya tab aktif selalu terlihat (dan agak center)
  useEffect(() => {
    const meta = posRef.current[current];
    if (!meta || !scrollRef.current) return;

    // geser sehingga pill aktif berada ~ 24px dari kiri
    const targetX = Math.max(0, meta.x - 24);
    scrollRef.current.scrollTo({ x: targetX, animated: true });
  }, [current]);

  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {tabs.map((t) => (
          <AnimatedPill
            key={t.key}
            icon={t.icon}
            label={t.label}
            active={current === t.key}
            onPress={() => go(t.key)}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              posRef.current[t.key] = { x, w: width };
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 4, paddingRight: 4, gap: 8 },
  pill: {
    minWidth: 152,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.15 },
});
