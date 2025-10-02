import { View } from "react-native";
import { Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type TabKey = "visit" | "plan" | "history" | "home";
export default function NavPills({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
  const Item = ({
    keyName,
    label,
    icon,
  }: {
    keyName: TabKey;
    label: string;
    icon: string;
  }) => (
    <Chip
      selected={active === keyName}
      onPress={() => onChange(keyName)}
      icon={() => (
        <MaterialCommunityIcons name={icon as any} size={16} color="white" />
      )}
      selectedColor="white"
      style={{
        backgroundColor: active === keyName ? "#232C45" : "#0F1627",
        borderColor: "#334066",
        borderWidth: 1,
        marginRight: 10,
      }}
      textStyle={{ color: "white", fontWeight: "700" }}
    >
      {label}
    </Chip>
  );

  return (
    <View
      style={{ flexDirection: "row", paddingHorizontal: 16, paddingBottom: 12 }}
    >
      <Item keyName="visit" label="Input Kunjungan" icon="clipboard-text" />
      <Item keyName="plan" label="Plan Besok" icon="calendar-plus" />
      <Item keyName="history" label="Riwayat" icon="history" />
      <Item keyName="home" label="Dashboard" icon="view-dashboard" />
    </View>
  );
}
