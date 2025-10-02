import { useState } from "react";
import { View } from "react-native";
import { List, Divider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SectionCard({
  title,
  defaultOpen = false,
  children,
  leftIcon, // ikon kecil di kiri judul
  decorIcon, // ikon besar dekoratif kanan-atas
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  leftIcon?: string; // contoh: "store-outline"
  decorIcon?: string; // contoh: "account-group-outline"
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View
      style={{
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: "#141b2a",
        borderWidth: 1,
        borderColor: "#243048",
        position: "relative",
      }}
    >
      {/* dekor icon besar */}
      {decorIcon ? (
        <View style={{ position: "absolute", right: 8, top: 2 }}>
          <MaterialCommunityIcons
            name={decorIcon as any}
            size={96}
            color="white"
            style={{ opacity: 0.08 }}
          />
        </View>
      ) : null}

      <List.Accordion
        title={title}
        expanded={open}
        onPress={() => setOpen((v) => !v)}
        titleStyle={{ fontWeight: "800", color: "white" }}
        style={{ backgroundColor: "transparent", paddingRight: 8 }}
        left={
          leftIcon
            ? (props) => (
                <List.Icon {...props} color="#C4B5FD" icon={leftIcon} />
              )
            : undefined
        }
      >
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
          <Divider style={{ opacity: 0.18 }} />
          {children}
        </View>
      </List.Accordion>
    </View>
  );
}
