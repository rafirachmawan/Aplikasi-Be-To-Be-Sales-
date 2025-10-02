import React, { useMemo, useState } from "react";
import { View, LayoutChangeEvent } from "react-native";
import { Menu, TextInput, List, Divider } from "react-native-paper";

export type Purpose = "deal" | "demo" | "followup";

const LABEL: Record<Purpose, string> = {
  deal: "Deal",
  demo: "Demo Produk",
  followup: "Follow Up",
};

type Props = {
  value: Purpose;
  onChange: (v: Purpose) => void;
  label?: string;
};

export default function PurposePicker({
  value,
  onChange,
  label = "Tujuan",
}: Props) {
  const [visible, setVisible] = useState(false);
  const [anchorW, setAnchorW] = useState(0);
  const items = useMemo<Purpose[]>(() => ["deal", "demo", "followup"], []);

  function pick(v: Purpose) {
    onChange(v);
    setVisible(false);
  }

  function onAnchorLayout(e: LayoutChangeEvent) {
    setAnchorW(e.nativeEvent.layout.width);
  }

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      // biar muncul di bawah input & ada jarak kecil
      style={{ marginTop: 4 }}
      // samakan lebar menu dgn input, kasih rounded & shadow halus
      contentStyle={{
        width: Math.max(anchorW, 220),
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingVertical: 4,
        elevation: 6,
      }}
      anchor={
        <View onLayout={onAnchorLayout}>
          <TextInput
            mode="outlined"
            label={label}
            value={LABEL[value]}
            editable={false}
            onFocus={() => setVisible(true)}
            right={
              <TextInput.Icon
                icon={visible ? "chevron-up" : "chevron-down"}
                onPress={() => setVisible((x) => !x)}
              />
            }
            style={{ backgroundColor: "#FFFFFF" }}
            outlineColor="#E9D5FF"
            activeOutlineColor="#7C3AED"
            textColor="#0F172A"
            placeholderTextColor="#64748B"
          />
        </View>
      }
    >
      {items.map((p, i) => (
        <View key={p}>
          <List.Item
            title={LABEL[p]}
            onPress={() => pick(p)}
            left={(props) => (
              <List.Icon
                {...props}
                icon={
                  p === "deal"
                    ? "handshake"
                    : p === "demo"
                    ? "presentation-play"
                    : "phone-in-talk"
                }
                color="#7C3AED"
              />
            )}
            // render check hanya saat terpilih (hindari 'undefined' sebagai icon)
            right={(props) =>
              p === value ? (
                <List.Icon {...props} icon="check-bold" color="#7C3AED" />
              ) : null
            }
            titleStyle={{ color: "#0F172A", fontWeight: "700", fontSize: 14 }}
            style={{ height: 44, paddingVertical: 0 }}
          />
          {i < items.length - 1 ? (
            <Divider style={{ backgroundColor: "#F3E8FF" }} />
          ) : null}
        </View>
      ))}
    </Menu>
  );
}
