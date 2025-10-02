import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, ViewStyle } from "react-native";

export default function GradientButton({
  children,
  onPress,
  style,
  disabled,
}: {
  children: string;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, style]}
    >
      <LinearGradient
        colors={disabled ? ["#475569", "#475569"] : ["#8B5CF6", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "800" }}>{children}</Text>
      </LinearGradient>
    </Pressable>
  );
}
