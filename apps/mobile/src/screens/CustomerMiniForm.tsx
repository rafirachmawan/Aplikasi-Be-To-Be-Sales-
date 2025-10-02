import React, { useState } from "react";
import { View, Alert } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { getCustomerByCode, addCustomerMinimal } from "../services/db";

export default function CustomerMiniForm({
  userId,
  onCreated,
  onCancel,
}: {
  userId: string;
  onCreated: (c: { id: string; name: string }) => void;
  onCancel?: () => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const c = code.trim().toUpperCase().replace(/\s+/g, "-");
    const n = name.trim();
    if (!c) return Alert.alert("Kode customer wajib diisi");
    if (!n) return Alert.alert("Nama customer wajib diisi");

    setSaving(true);
    try {
      const exist = await getCustomerByCode(c);
      if (exist) {
        Alert.alert("Kode sudah dipakai", "Gunakan kode lain");
        setSaving(false);
        return;
      }
      await addCustomerMinimal({ userId, code: c, name: n });
      Alert.alert("Berhasil", "Customer baru tersimpan");
      onCreated({ id: c, name: n }); // id = code primary
    } catch (e: any) {
      Alert.alert("Gagal", e?.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View
      style={{
        gap: 10,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E9D5FF",
        backgroundColor: "#FFFFFF",
      }}
    >
      <Text style={{ color: "#4C1D95", fontWeight: "800" }}>
        Tambah Customer (Singkat)
      </Text>

      <TextInput
        mode="outlined"
        label="Kode Customer (unik)"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        placeholder="Contoh: CUST-001"
        style={{ backgroundColor: "#FFFFFF" }}
        outlineColor="#E9D5FF"
        activeOutlineColor="#7C3AED"
        textColor="#4C1D95"
        placeholderTextColor="#7C3AED99"
      />

      <TextInput
        mode="outlined"
        label="Nama Customer"
        value={name}
        onChangeText={setName}
        style={{ backgroundColor: "#FFFFFF" }}
        outlineColor="#E9D5FF"
        activeOutlineColor="#7C3AED"
        textColor="#4C1D95"
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={{ flex: 1, borderRadius: 999, borderColor: "#E9D5FF" }}
          textColor="#7C3AED"
          icon="close"
        >
          Batal
        </Button>
        <Button
          mode="contained"
          onPress={save}
          loading={saving}
          style={{ flex: 1, borderRadius: 999 }}
          icon="content-save"
        >
          Simpan
        </Button>
      </View>

      <Text style={{ color: "#64748B", fontSize: 12 }}>
        Detail lain (No HP, alamat, jenis usaha, dll.) bisa dilengkapi nanti di
        halaman Master Customer.
      </Text>
    </View>
  );
}
