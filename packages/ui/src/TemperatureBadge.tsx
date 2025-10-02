import { View, Text } from "react-native";
import type { Temperature } from "@sales/types";

export default function TemperatureBadge({ value }: { value: Temperature }) {
  const bg =
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
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: bg,
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
