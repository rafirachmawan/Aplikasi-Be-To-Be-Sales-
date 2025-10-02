import React from "react";
import { View, Platform } from "react-native";
import { List, TextInput, Switch, Text, Divider } from "react-native-paper";
import type { Offerings, ProductKey } from "../services/db";

type Props = {
  value: Offerings;
  onChange: (next: Offerings) => void;
};

const LABELS: Record<ProductKey, string> = {
  minyak: "Minyak Goreng",
  sabun: "Sabun Cuci Piring",
  msg: "MSG",
  garam: "Garam",
  bumbu: "Bumbu",
  margarine: "Margarine",
};

function NumInput({
  label,
  value,
  onChangeNumber,
}: {
  label: string;
  value?: number;
  onChangeNumber: (n?: number) => void;
}) {
  return (
    <TextInput
      mode="outlined"
      label={label}
      value={value !== undefined && value !== null ? String(value) : ""}
      onChangeText={(t) => {
        const n = t.replace(/[^\d]/g, "");
        onChangeNumber(n === "" ? undefined : Number(n));
      }}
      keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
      style={{ backgroundColor: "#FFFFFF" }}
      outlineColor="#E9D5FF"
      activeOutlineColor="#7C3AED"
      textColor="#4C1D95"
    />
  );
}

export default function ProductOfferingForm({ value, onChange }: Props) {
  function setField<K extends ProductKey, F extends keyof Offerings[K]>(
    key: K,
    field: F,
    v: Offerings[K][F]
  ) {
    onChange({ ...value, [key]: { ...(value[key] ?? {}), [field]: v } });
  }

  return (
    <View style={{ gap: 10 }}>
      {(Object.keys(LABELS) as ProductKey[]).map((key, idx) => {
        const row = value[key] || {};
        return (
          <View
            key={key}
            style={{
              borderWidth: 1,
              borderColor: "#F1EAFE",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <List.Accordion
              title={LABELS[key]}
              titleStyle={{ fontWeight: "800", color: "#4C1D95" }}
              left={(props) => (
                <List.Icon {...props} icon="cube-outline" color="#7C3AED" />
              )}
              style={{ backgroundColor: "#FAF8FF" }}
            >
              <View
                style={{ padding: 12, gap: 10, backgroundColor: "#FFFFFF" }}
              >
                <TextInput
                  mode="outlined"
                  label="Merek"
                  value={row.brand ?? ""}
                  onChangeText={(t) => setField(key, "brand", t)}
                  style={{ backgroundColor: "#FFFFFF" }}
                  outlineColor="#E9D5FF"
                  activeOutlineColor="#7C3AED"
                  textColor="#4C1D95"
                />

                <NumInput
                  label="Kapasitas / bulan"
                  value={row.capacityPerMonth}
                  onChangeNumber={(n) => setField(key, "capacityPerMonth", n)}
                />

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 8,
                  }}
                >
                  <Text style={{ color: "#4C1D95", fontWeight: "700" }}>
                    Potensi brand kita
                  </Text>
                  <Switch
                    value={!!row.ourBrandPotential}
                    onValueChange={(b) => setField(key, "ourBrandPotential", b)}
                    color="#7C3AED"
                  />
                </View>

                <NumInput
                  label="Potensi – Qty / bulan"
                  value={row.potentialQtyPerMonth}
                  onChangeNumber={(n) =>
                    setField(key, "potentialQtyPerMonth", n)
                  }
                />
              </View>
            </List.Accordion>
            {idx < Object.keys(LABELS).length - 1 ? (
              <Divider style={{ backgroundColor: "#F1EAFE" }} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
