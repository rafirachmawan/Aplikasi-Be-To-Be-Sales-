import React, { useMemo, useState } from "react";
import { Menu, TextInput, List } from "react-native-paper";

type Props = {
  value: string;
  onChange: (v: string) => void;
  maxMenuHeight?: number;
};

export default function TimeSlotPicker({
  value,
  onChange,
  maxMenuHeight = 220,
}: Props) {
  const [open, setOpen] = useState(false);

  const items = useMemo(() => {
    const arr: string[] = [];
    for (let h = 7; h <= 19; h++) {
      for (const m of [0, 30]) {
        const hh = `${h}`.padStart(2, "0");
        const mm = `${m}`.padStart(2, "0");
        arr.push(`${hh}:${mm}`);
      }
    }
    return arr;
  }, []);

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={
        <TextInput
          mode="outlined"
          label="Jam (pilih)"
          value={value}
          editable={false}
          onFocus={() => setOpen(true)}
          right={
            <TextInput.Icon
              icon={open ? "chevron-up" : "chevron-down"}
              onPress={() => setOpen((v) => !v)}
            />
          }
          style={{ backgroundColor: "#FFFFFF" }}
          outlineColor="#E9D5FF"
          activeOutlineColor="#7C3AED"
          textColor="#0F172A"
          placeholderTextColor="#64748B"
        />
      }
      style={{ width: "100%" }}
      contentStyle={{ maxHeight: maxMenuHeight, backgroundColor: "#FFFFFF" }}
    >
      {items.map((t) => (
        <List.Item
          key={t}
          title={t}
          onPress={() => {
            onChange(t);
            setOpen(false);
          }}
          right={(props) =>
            t === value ? <List.Icon {...props} icon="check" /> : null
          }
        />
      ))}
    </Menu>
  );
}
