import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Image, StyleSheet, Modal } from "react-native";
import { Button, Text } from "react-native-paper";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";

export type Shot = {
  uri: string; // sekarang kirim "data:image/jpeg;base64,...."
  coords: { lat: number; lng: number; acc?: number };
};

export default function PhotoLocationButtons({
  value,
  onChange,
}: {
  value: Shot | null;
  onChange: (v: Shot | null) => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [camVisible, setCamVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(value?.uri ?? null);
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
    acc?: number;
  } | null>(value?.coords ?? null);

  // Emit ke parent hanya jika berubah
  const lastEmitted = useRef<Shot | null>(value ?? null);
  useEffect(() => {
    const next: Shot | null =
      photoUri && coords ? { uri: photoUri, coords } : null;
    const prev = lastEmitted.current;

    const same =
      (prev === null && next === null) ||
      (prev !== null &&
        next !== null &&
        prev.uri === next.uri &&
        prev.coords.lat === next.coords.lat &&
        prev.coords.lng === next.coords.lng &&
        prev.coords.acc === next.coords.acc);

    if (same) return;
    lastEmitted.current = next;
    onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUri, coords]);

  async function openCamera() {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) {
        alert("Izin kamera diperlukan.");
        return;
      }
    }
    setCamVisible(true);
  }

  async function takeShot() {
    try {
      // Ambil foto + BASE64 supaya tidak perlu baca file lokal
      const img = await cameraRef.current?.takePictureAsync({
        quality: 0.8,
        base64: true, // <<— penting: minta base64 dari kamera
        skipProcessing: true,
      });

      if (img?.base64) {
        // Gunakan data URL (diterima Cloudinary/History kamu tanpa modul tambahan)
        const dataUrl = `data:image/jpeg;base64,${img.base64}`;
        setPhotoUri(dataUrl);
      } else if (img?.uri) {
        // fallback: kalau base64 tidak tersedia di device tertentu
        setPhotoUri(img.uri);
      } else {
        alert("Gagal mengambil foto.");
      }
    } catch (e) {
      console.warn(e);
      alert("Gagal mengambil foto.");
    } finally {
      setCamVisible(false);
    }
  }

  async function sendLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Izin lokasi diperlukan.");
      return;
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setCoords({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      acc: pos.coords.accuracy ?? undefined,
    });
  }

  const locationText = useMemo(() => {
    if (!coords) return "Belum dikirim";
    const acc = coords.acc ? ` (±${Math.round(coords.acc)}m)` : "";
    return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}${acc}`;
  }, [coords]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Button
          mode="contained"
          onPress={openCamera}
          buttonColor="#7C3AED"
          textColor="#FFFFFF"
          style={styles.btn}
        >
          Ambil Foto
        </Button>

        <Button
          mode="outlined"
          onPress={sendLocation}
          textColor="#7C3AED"
          style={[styles.btn, { borderColor: "#7C3AED" }]}
        >
          Kirim Lokasi
        </Button>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Foto</Text>
          <Text
            style={[
              styles.statusValue,
              { color: photoUri ? "#16A34A" : "#6B7280" },
            ]}
          >
            {photoUri ? "Sudah diambil" : "Belum ada"}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Lokasi</Text>
          <Text
            style={[
              styles.statusValue,
              { color: coords ? "#16A34A" : "#6B7280" },
              { maxWidth: "65%", textAlign: "right" },
            ]}
            numberOfLines={1}
          >
            {locationText}
          </Text>
        </View>

        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : null}
      </View>

      <Modal
        visible={camVisible}
        animationType="slide"
        onRequestClose={() => setCamVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="back"
            enableTorch={false}
          />
          <View style={styles.camControls}>
            <Button
              mode="text"
              onPress={() => setCamVisible(false)}
              textColor="#FFFFFF"
            >
              Batal
            </Button>
            <Button
              mode="contained"
              onPress={takeShot}
              buttonColor="#7C3AED"
              textColor="#FFFFFF"
            >
              Jepret
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: "row", gap: 10 },
  btn: { borderRadius: 999, paddingHorizontal: 10, flex: 1 },
  statusCard: {
    borderWidth: 1,
    borderColor: "#E9D5FF",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  statusRow: { flexDirection: "row", justifyContent: "space-between" },
  statusLabel: { color: "#374151", fontWeight: "600" },
  statusValue: { color: "#6B7280", fontWeight: "600" },
  thumb: {
    marginTop: 8,
    width: "100%",
    height: 140,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  camControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    gap: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});
