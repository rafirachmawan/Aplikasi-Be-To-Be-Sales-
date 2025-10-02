// components/TemperatureChips.tsx
import React from "react";
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  GestureResponderEvent,
} from "react-native";
import type { Temperature } from "../services/db";

type Mode = "withSejuk" | "classic";

type TempKey = "dingin" | "sejuk" | "hangat" | "panas" | "menyala";

type Item = {
  key: TempKey;
  title: string;
  desc: string;
  emoji: string;
  base: string; // border normal
  strong: string; // border saat aktif
};

const ITEMS_WITH_SEJUK: Item[] = [
  {
    key: "dingin",
    title: "DINGIN",
    desc: "Jauh dari transaksi",
    emoji: "❄️",
    base: "#BFDBFE",
    strong: "#3B82F6",
  },
  {
    key: "sejuk",
    title: "SEJUK",
    desc: "Ada pendekatan",
    emoji: "🌤️",
    base: "#FDE68A",
    strong: "#F59E0B",
  },
  {
    key: "hangat",
    title: "HANGAT",
    desc: "Tertarik, kemungkinan order",
    emoji: "🔥",
    base: "#FCD34D",
    strong: "#D97706",
  },
  {
    key: "panas",
    title: "PANAS",
    desc: "Tinggal disenggol",
    emoji: "🌶️",
    base: "#FCA5A5",
    strong: "#EF4444",
  },
];

const ITEMS_CLASSIC: Item[] = [
  {
    key: "dingin",
    title: "DINGIN",
    desc: "Jauh dari transaksi",
    emoji: "❄️",
    base: "#BFDBFE",
    strong: "#3B82F6",
  },
  {
    key: "hangat",
    title: "HANGAT",
    desc: "Tertarik, kemungkinan order",
    emoji: "🔥",
    base: "#FCD34D",
    strong: "#D97706",
  },
  {
    key: "panas",
    title: "PANAS",
    desc: "Tinggal disenggol",
    emoji: "🌶️",
    base: "#FCA5A5",
    strong: "#EF4444",
  },
  {
    key: "menyala",
    title: "MENYALA",
    desc: "Customer tetap / sangat siap",
    emoji: "🚀",
    base: "#DDD6FE",
    strong: "#7C3AED",
  },
];

export default function TemperatureChips({
  value,
  onChange,
  style,
  disabled,
  mode = "withSejuk",
}: {
  value: Temperature; // jika mode=withSejuk dan union belum ada "sejuk", lihat catatan di atas
  onChange: (v: Temperature) => void; // panggil balik ke parent
  style?: ViewStyle;
  disabled?: boolean;
  mode?: Mode;
}) {
  const items = mode === "classic" ? ITEMS_CLASSIC : ITEMS_WITH_SEJUK;

  const handlePress = (k: TempKey) => (e: GestureResponderEvent) => {
    if (disabled) return;
    // Jika skema Temperature belum punya "sejuk", Anda bisa:
    // 1) Pakai mode="classic", atau
    // 2) Tambahkan "sejuk" ke union Temperature di services/db
    onChange(k as unknown as Temperature);
  };

  // aktifkan kartu jika cocok. Untuk kompat, jika value "menyala" tapi mode withSejuk,
  // kita treat sebagai "panas" agar tetap ada highlight yang mendekati.
  const isActive = (k: TempKey) => {
    if (
      mode === "withSejuk" &&
      value === ("menyala" as Temperature) &&
      k === "panas"
    ) {
      return true;
    }
    return (value as unknown as TempKey) === k;
  };

  return (
    <View style={[styles.grid, style]}>
      {items.map((it) => {
        const active = isActive(it.key);
        return (
          <Pressable
            key={it.key}
            onPress={handlePress(it.key)}
            style={({ pressed }) => [
              styles.card,
              {
                borderColor: active ? it.strong : it.base,
                borderWidth: active ? 2 : 1,
                shadowOpacity: active ? 0.12 : 0.06,
                opacity: disabled ? 0.5 : pressed ? 0.95 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            accessibilityLabel={`Temperature ${it.title}`}
          >
            <View style={styles.headerRow}>
              <Text style={styles.emoji}>{it.emoji}</Text>
              <Text style={styles.title}>{it.title}</Text>
            </View>
            <Text style={styles.desc}>{it.desc}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ===================== styles ===================== */
const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    shadowOpacity: 0.06,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  emoji: {
    fontSize: 18,
  },
  title: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3,
    color: "#0F172A",
  },
  desc: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
  },
});
