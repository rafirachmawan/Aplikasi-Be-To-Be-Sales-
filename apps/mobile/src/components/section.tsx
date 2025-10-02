import React, { ReactNode } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Text, Divider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  title: string;
  iconName?: string;
  right?: ReactNode;
  children: ReactNode;
};

export default function Section({ title, iconName, right, children }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          {iconName ? (
            <View style={styles.iconDot}>
              <MaterialCommunityIcons
                name={iconName as any}
                size={16}
                color="#7C3AED"
              />
            </View>
          ) : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {right ? <View style={styles.headRight}>{right}</View> : null}
      </View>
      <Divider style={styles.divider} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9D5FF", // ungu muda
    overflow: "hidden",
  },
  head: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  headLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F3E8FF", // ungu paling muda
    alignItems: "center",
    justifyContent: "center",
  },
  headRight: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F3E8FF", // ungu muda
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#4C1D95", // ungu gelap utk judul
    fontWeight: "800",
    fontSize: 16,
    lineHeight: Platform.OS === "android" ? 20 : 19,
    includeFontPadding: false as any,
    textAlignVertical: "center",
  },
  divider: { backgroundColor: "#F3E8FF", height: 1 },
  body: { padding: 16, gap: 14 },
});
