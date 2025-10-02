import { LinearGradient } from "expo-linear-gradient";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function HeaderGradient() {
  return (
    <LinearGradient
      colors={["#1F2A44", "#0B1220"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: 16, paddingHorizontal: 16, paddingBottom: 8 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            height: 22,
            width: 22,
            borderRadius: 6,
            backgroundColor: "#7C3AED",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons
            name="checkbox-blank-circle"
            size={10}
            color="white"
          />
        </View>
        <Text style={{ color: "white", fontWeight: "800", fontSize: 18 }}>
          Sales Visit Manager
        </Text>
      </View>
    </LinearGradient>
  );
}
