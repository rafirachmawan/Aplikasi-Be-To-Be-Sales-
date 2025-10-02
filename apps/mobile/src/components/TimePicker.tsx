import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Menu, List, Divider, TextInput } from "react-native-paper";

type Props = {
  value: string; // format "HH:mm" atau "" kalau belum dipilih
  onChange: (v: string) => void;
  label?: string;
  startHour?: number; // default 7 (07:00)
  endHour?: number; // default 20 (20:00)
  stepMinutes?: number; // default 30 (tiap 30 menit)
};

export default function TimePicker({
  value,
  onChange,
  label = "Jam (HH:mm)",
  startHour = 7,
  endHour = 20,
  stepMinutes = 30,
}: Props) {
  const [open, setOpen] = useState(false);

  const items = useMemo(() => {
    const out: string[] = [];
    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += stepMinutes) {
        const hh = `${h}`.padStart(2, "0");
        const mm = `${m}`.padStart(2, "0");
        out.push(`${hh}:${mm}`);
      }
    }
    return out;
  }, [startHour, endHour, stepMinutes]);

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={
        <TextInput
          mode="outlined"
          label={label}
          value={value || ""}
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
          placeholder="Pilih jam"
        />
      }
      style={{ width: "100%" }}
      contentStyle={{ backgroundColor: "#FFFFFF" }}
    >
      {items.map((t, i) => (
        <View key={t}>
          <List.Item
            title={t}
            onPress={() => {
              onChange(t);
              setOpen(false);
            }}
            left={(props) => (
              <List.Icon {...props} icon="clock-outline" color="#7C3AED" />
            )}
            right={(props) =>
              value === t ? (
                <List.Icon {...props} icon="check-bold" color="#7C3AED" />
              ) : null
            }
            titleStyle={{ color: "#0F172A", fontWeight: "700" }}
          />
          {i < items.length - 1 ? (
            <Divider style={{ backgroundColor: "#F3E8FF" }} />
          ) : null}
        </View>
      ))}
    </Menu>
  );
}
