// apps/mobile/src/screens/CustomerMaster.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Text, TextInput, Button, List, Divider } from "react-native-paper";
import HeaderHero from "../components/HeaderHero";
import TopTabs from "../components/TopTabs";
import Section from "../components/section";
import type { NavTo } from "../types/nav";
import { theme } from "../theme";
import { addCustomer, BusinessType, Customer } from "../services/db";
import ScreenShell from "../components/ScreenShell";

// Firestore ops khusus untuk update/hapus
import { db } from "../firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  where,
  query,
  onSnapshot,
  limit as qLimit,
} from "firebase/firestore";

/* ================== Small helpers ================== */
function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  ) as T;
}

/* Dropdown jenis usaha (simple list) */
function BusinessTypeSelect({
  value,
  onChange,
}: {
  value: BusinessType | "";
  onChange: (v: BusinessType) => void;
}) {
  const options: BusinessType[] = [
    "retail",
    "umkm",
    "restorant",
    "supermarket",
  ];
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.outline,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {options.map((opt, idx) => (
        <View key={opt}>
          <List.Item
            title={opt.toUpperCase()}
            onPress={() => onChange(opt)}
            left={(props) => (
              <List.Icon
                {...props}
                icon={value === opt ? "radiobox-marked" : "radiobox-blank"}
                color={theme.colors.primary}
              />
            )}
            right={(props) => (
              <List.Icon {...props} icon="chevron-right" color="#94A3B8" />
            )}
            style={{
              backgroundColor: value === opt ? "#F3E8FF" : "#FFFFFF",
            }}
            titleStyle={{ color: "#4C1D95", fontWeight: "700" }}
          />
          {idx < options.length - 1 ? (
            <Divider style={{ backgroundColor: "#F3E8FF" }} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

export default function CustomerMaster({ go }: { go: NavTo }) {
  const userId = "USER-DEMO";

  // form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [ownerNIK, setOwnerNIK] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [addressLink, setAddressLink] = useState("");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Customer[]>([]);
  const [editing, setEditing] = useState<boolean>(false); // true kalau sedang edit data yang ada

  // ====== Realtime daftar customers (tanpa index) ======
  useEffect(() => {
    const qs = query(
      collection(db, "customers"),
      where("userId", "==", userId),
      qLimit(200)
    );

    const unsub = onSnapshot(
      qs,
      (snap) => {
        const list: Customer[] = [];
        snap.forEach((d) => list.push(d.data() as Customer));
        list.sort(
          (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
        );
        setRows(list);
      },
      (err) => {
        console.log("listen customers error:", err);
      }
    );

    return unsub;
  }, []);

  function clearForm() {
    setCode("");
    setName("");
    setPhone("");
    setAddress("");
    setBusinessType("");
    setCity("");
    setDistrict("");
    setOwnerNIK("");
    setOwnerName("");
    setOwnerAddress("");
    setAddressLink("");
    setEditing(false);
  }

  function fillFormFrom(c: Customer) {
    setCode(c.code || "");
    setName(c.name || "");
    setPhone(c.phone || "");
    setAddress(c.address || "");
    setBusinessType((c.businessType as any) || "");
    setCity(c.city || "");
    setDistrict(c.district || "");
    setOwnerNIK(c.ownerNIK || "");
    setOwnerName(c.ownerName || "");
    setOwnerAddress(c.ownerAddress || "");
    setAddressLink(c.addressLink || "");
    setEditing(true);
  }

  async function save() {
    if (!code.trim()) return Alert.alert("Kode customer wajib diisi");
    if (!name.trim()) return Alert.alert("Nama customer wajib diisi");
    if (!phone.trim()) return Alert.alert("No HP wajib diisi");
    if (!address.trim()) return Alert.alert("Alamat customer wajib diisi");
    if (!businessType) return Alert.alert("Jenis usaha wajib dipilih");
    if (!city.trim()) return Alert.alert("Kota/Kab wajib diisi");
    if (!district.trim()) return Alert.alert("Kecamatan wajib diisi");
    if (addressLink && !/^https?:\/\/.+/i.test(addressLink.trim())) {
      return Alert.alert("Alamat link tidak valid. Gunakan http(s)://");
    }

    const payload: Customer = cleanUndefined({
      code: code.trim(),
      userId,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      businessType: businessType as BusinessType,
      city: city.trim(),
      district: district.trim(),
      ownerNIK: ownerNIK,
      ownerName: ownerName,
      ownerAddress: ownerAddress,
      addressLink: addressLink,
    });

    try {
      setLoading(true);

      if (editing) {
        // UPDATE (merge)
        const refDoc = doc(db, "customers", code.trim());
        await setDoc(
          refDoc,
          {
            ...payload,
            updatedAt: new Date(), // boleh pakai serverTimestamp juga
          },
          { merge: true }
        );
        Alert.alert("Data customer diperbarui");
      } else {
        // CREATE (cek duplikat di services)
        await addCustomer(payload);
        Alert.alert("Master customer tersimpan");
      }

      setEditing(true); // tetap di mode edit setelah simpan
    } catch (e: any) {
      Alert.alert("Gagal", e?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!editing) return;
    Alert.alert(
      "Hapus Customer",
      `Yakin menghapus "${code} — ${name}"? Tindakan ini tidak bisa dibatalkan.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, "customers", code.trim()));
              Alert.alert("Data customer dihapus");
              clearForm();
            } catch (e: any) {
              Alert.alert("Gagal hapus", e?.message || "Terjadi kesalahan");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  const titleAction = editing ? "Perbarui" : "Simpan";

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <HeaderHero>
        <TopTabs current="customers" go={go} />
      </HeaderHero>

      <ScreenShell refreshKey="customers">
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Section
              title={editing ? "Edit Customer" : "Master Customer"}
              iconName="account-multiple-plus-outline"
            >
              {/* KODE */}
              <TextInput
                mode="outlined"
                label="Kode Customer * (unik)"
                value={code}
                onChangeText={(t) => {
                  setCode(t.toUpperCase());
                }}
                placeholder="Contoh: C001"
                style={{ backgroundColor: "#FFFFFF" }}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor="#4C1D95"
                placeholderTextColor="#7C3AED99"
                autoCapitalize="characters"
                disabled={editing} // kode tidak bisa diganti saat edit
              />
              {/* NAMA */}
              <TextInput
                mode="outlined"
                label="Nama Customer *"
                value={name}
                onChangeText={setName}
                style={{ backgroundColor: "#FFFFFF" }}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor="#4C1D95"
              />
              {/* HP */}
              <TextInput
                mode="outlined"
                label="No HP *"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={{ backgroundColor: "#FFFFFF" }}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor="#4C1D95"
              />
              {/* ALAMAT */}
              <TextInput
                mode="outlined"
                label="Alamat Customer *"
                value={address}
                onChangeText={setAddress}
                multiline
                style={{ backgroundColor: "#FFFFFF" }}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor="#4C1D95"
              />

              {/* JENIS USAHA */}
              <Text style={{ color: "#4C1D95", fontWeight: "800" }}>
                Jenis Usaha *
              </Text>
              <BusinessTypeSelect
                value={businessType as any}
                onChange={setBusinessType as any}
              />

              {/* KOTA / KEC */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    mode="outlined"
                    label="Kota / Kab *"
                    value={city}
                    onChangeText={setCity}
                    style={{ backgroundColor: "#FFFFFF" }}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                    textColor="#4C1D95"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    mode="outlined"
                    label="Kecamatan *"
                    value={district}
                    onChangeText={setDistrict}
                    style={{ backgroundColor: "#FFFFFF" }}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                    textColor="#4C1D95"
                  />
                </View>
              </View>

              {/* OWNER (opsional) */}
              <Text style={{ color: "#4C1D95", fontWeight: "800" }}>
                Data Owner (opsional)
              </Text>
              <TextInput
                mode="outlined"
                label="NIK Owner"
                value={ownerNIK}
                onChangeText={setOwnerNIK}
                keyboardType="number-pad"
                style={{ backgroundColor: "#FFFFFF" }}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor="#4C1D95"
              />
              <TextInput
                mode="outlined"
                label="Nama Owner"
                value={ownerName}
                onChangeText={setOwnerName}
                style={{ backgroundColor: "#FFFFFF" }}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor="#4C1D95"
              />
              <TextInput
                mode="outlined"
                label="Alamat NIK Owner"
                value={ownerAddress}
                onChangeText={setOwnerAddress}
                multiline
                style={{ backgroundColor: "#FFFFFF" }}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor="#4C1D95"
              />
              <TextInput
                mode="outlined"
                label="Alamat (link peta) – opsional"
                value={addressLink}
                onChangeText={setAddressLink}
                placeholder="https://maps.google.com/?q=-6.2,106.8"
                keyboardType="url"
                style={{ backgroundColor: "#FFFFFF" }}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor="#4C1D95"
                placeholderTextColor="#7C3AED99"
              />

              {/* Actions */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button
                  mode="outlined"
                  onPress={clearForm}
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    borderColor: theme.colors.outline,
                  }}
                  textColor={theme.colors.primary}
                  icon="refresh"
                >
                  Reset
                </Button>

                <Button
                  mode="contained"
                  onPress={save}
                  loading={loading}
                  disabled={loading}
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    backgroundColor: theme.colors.primary,
                  }}
                  labelStyle={{ color: "white", fontWeight: "bold" }}
                  icon={editing ? "content-save-edit" : "content-save"}
                >
                  {titleAction}
                </Button>
              </View>

              {editing ? (
                <Button
                  mode="outlined"
                  onPress={confirmDelete}
                  textColor="#DC2626"
                  icon="delete-outline"
                  style={{
                    marginTop: 8,
                    borderRadius: 999,
                    borderColor: "#FCA5A5",
                  }}
                >
                  Hapus Customer
                </Button>
              ) : null}
            </Section>

            {/* List ringkas */}
            <Section
              title="Daftar Customer Terbaru"
              iconName="account-multiple-outline"
            >
              {rows.length === 0 ? (
                <Text style={{ color: "#64748B" }}>Belum ada data.</Text>
              ) : (
                <View style={{ gap: 6 }}>
                  {rows.map((c) => (
                    <List.Item
                      key={c.code}
                      onPress={() => fillFormFrom(c)}
                      title={`${c.code} — ${c.name}`}
                      description={`${String(
                        c.businessType ?? "-"
                      ).toUpperCase()} • ${c.city ?? "-"} / ${
                        c.district ?? "-"
                      }`}
                      left={(props) => (
                        <List.Icon
                          {...props}
                          icon="account-outline"
                          color={theme.colors.primary}
                        />
                      )}
                      right={(props) => (
                        <List.Icon {...props} icon="pencil" color="#94A3B8" />
                      )}
                      style={{ paddingVertical: 0, backgroundColor: "#FFFFFF" }}
                      titleStyle={{ color: "#0F172A", fontWeight: "700" }}
                      descriptionStyle={{ color: "#64748B" }}
                    />
                  ))}
                </View>
              )}
            </Section>
          </ScrollView>
        </View>
      </ScreenShell>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -8,
    paddingTop: 8,
  },
});
