import React, { useState } from "react";
import { View } from "react-native";
import { Button, Chip, TextInput } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type ProductItem = { name: string; qty?: number };

type Props = {
  value: ProductItem[];
  onChange: (v: ProductItem[]) => void;
};

export default function ProductChips({ value, onChange }: Props) {
  const [draft, setDraft] = useState("");

  function addItem() {
    const raw = draft.trim();
    if (!raw) return;

    // bisa dipisah koma: "minyak, msg"
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const next = [...value];
    for (const p of parts) {
      if (!next.find((x) => x.name.toLowerCase() === p.toLowerCase())) {
        next.push({ name: p });
      }
    }
    onChange(next);
    setDraft("");
  }

  function removeItem(name: string) {
    onChange(value.filter((v) => v.name !== name));
  }

  return (
    <View style={{ gap: 10 }}>
      {/* Input putih + tombol tambah */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          mode="outlined"
          value={draft}
          onChangeText={setDraft}
          placeholder="Tambah produk (cth: minyak, MSG)"
          style={{ flex: 1, backgroundColor: "#FFFFFF" }} // BG putih
          outlineColor="#E9D5FF"
          activeOutlineColor="#7C3AED"
          textColor="#4C1D95"
          placeholderTextColor="#7C3AED99"
          left={<TextInput.Icon icon="tag-outline" color="#7C3AED" />}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <Button
          mode="contained"
          onPress={addItem}
          style={{ borderRadius: 999, backgroundColor: "#7C3AED" }}
          contentStyle={{ paddingHorizontal: 12 }}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
        </Button>
      </View>

      {/* List chips */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {value.map((p) => (
          <Chip
            key={p.name}
            onClose={() => removeItem(p.name)}
            style={{ backgroundColor: "#F3E8FF" }}
            textStyle={{ color: "#4C1D95", fontWeight: "600" }}
            closeIcon={({ size, color }) => (
              <MaterialCommunityIcons
                name="close"
                size={size}
                color="#7C3AED"
              />
            )}
          >
            {p.name}
          </Chip>
        ))}
      </View>
    </View>
  );
}
