import { View, Text } from "react-native";
import type { Temperature } from "../services/db";

export default function TemperatureBadge({ value }: { value: Temperature }) {
  const color =
    value === "menyala"
      ? "#10B981"
      : value === "panas"
      ? "#F97316"
      : value === "hangat"
      ? "#EAB308"
      : "#9CA3AF";
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: color,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: "white",
          fontWeight: "700",
          textTransform: "capitalize",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
