import { View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function CustomerListItem({
  name,
  address,
  onPress,
}: {
  name: string;
  address?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#0F1627",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#22304D",
        padding: 12,
        marginBottom: 10,
      }}
    >
      <Text style={{ color: "white", fontWeight: "800" }}>{name}</Text>
      {address ? (
        <Text style={{ color: "#9CA3AF", marginTop: 2 }}>{address}</Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 6,
        }}
      >
        <MaterialCommunityIcons
          name="check-decagram"
          size={16}
          color="#22C55E"
        />
        <Text style={{ color: "#86EFAC", fontSize: 12 }}>Planned</Text>
      </View>
    </Pressable>
  );
}
