import { useEffect, useRef, useState } from "react";
import { View, Image, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import GradientButton from "./GradientButton";

export type Shot = {
  uri: string;
  coords?: { lat: number; lng: number; accuracy?: number };
};

export default function CameraCapture({
  value,
  onChange,
}: {
  value: Shot | null;
  onChange: (v: Shot | null) => void;
}) {
  const [perm, requestPerm] = useCameraPermissions();
  const ref = useRef<any>(null);

  useEffect(() => {
    (async () => {
      if (!perm?.granted) await requestPerm();
    })();
  }, [perm]);

  const take = async () => {
    if (!ref.current) return;
    const p = await ref.current.takePictureAsync({ quality: 0.7 });
    const loc = await Location.getCurrentPositionAsync({});
    onChange({
      uri: p.uri,
      coords: {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? undefined,
      },
    });
  };

  if (value) {
    return (
      <View style={{ gap: 8 }}>
        <Image
          source={{ uri: value.uri }}
          style={{ height: 260, borderRadius: 14 }}
        />
        {value.coords ? (
          <Text style={{ color: "#CBD5E1" }}>
            Lokasi: {value.coords.lat.toFixed(5)}, {value.coords.lng.toFixed(5)}
          </Text>
        ) : null}
        <GradientButton onPress={() => onChange(null)}>
          Ambil Ulang
        </GradientButton>
      </View>
    );
  }

  return (
    <View style={{ height: 320, borderRadius: 14, overflow: "hidden" }}>
      <CameraView ref={ref} style={{ flex: 1 }} facing="back" />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 12,
          alignItems: "center",
        }}
      >
        <GradientButton onPress={take}>Ambil Foto</GradientButton>
      </View>
    </View>
  );
}
