import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/** Header gradient + slot untuk TopTabs di bagian bawah */
export default function HeaderHero({
  children,
  greeting,
  dateLabel,
}: {
  children?: React.ReactNode;
  greeting?: string;
  dateLabel?: string;
}) {
  const d = new Date();
  const fallbackGreeting = (() => {
    const h = d.getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 19) return "Selamat sore";
    return "Selamat malam";
  })();
  const dateText =
    dateLabel ??
    d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <LinearGradient
      colors={["#0B1220", "#0E1530"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView edges={["top"]} style={styles.safe}>
        {/* bar atas */}
        <View style={styles.rowBetween}>
          <View style={styles.brandRow}>
            <View style={styles.dot} />
            <Text style={styles.brand}>Sales Visit</Text>
          </View>
          <View style={styles.actions}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={18}
              color="#fff"
            />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>SA</Text>
            </View>
          </View>
        </View>

        {/* greeting */}
        <Text style={styles.hello} numberOfLines={2}>
          {greeting ?? fallbackGreeting} 👋
        </Text>

        {/* tanggal */}
        <View style={styles.chip}>
          <MaterialCommunityIcons
            name="calendar-blank"
            size={16}
            color="#E5E7EB"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.chipText}>{dateText}</Text>
        </View>

        {/* slot TopTabs */}
        {children ? <View style={styles.tabsWrap}>{children}</View> : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#8B5CF6",
    marginRight: 8,
  },
  brand: { color: "#E5E7EB", fontWeight: "700", letterSpacing: 0.2 },

  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  hello: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 10,
    lineHeight: 32,
  },

  chip: {
    marginTop: 10,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  chipText: { color: "#E5E7EB", fontWeight: "700" },

  tabsWrap: { marginTop: 12, paddingBottom: 4 },
});
