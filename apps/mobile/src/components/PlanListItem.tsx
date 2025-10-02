import { View, Text } from "react-native";
import { TouchableRipple } from "react-native-paper";
import { theme } from "../theme";

export default function PlanListItem({
  name,
  address,
  onPress,
}: {
  name: string;
  address?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableRipple
      onPress={onPress}
      borderless
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.outline,
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>
            {name}
          </Text>
        </View>
        {address ? <Text style={{ color: "#94A3B8" }}>{address}</Text> : null}
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#052e1f",
            borderColor: "#16a34a",
            borderWidth: 1,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "#22C55E", fontSize: 12 }}>✓ Planned</Text>
        </View>
      </View>
    </TouchableRipple>
  );
}
