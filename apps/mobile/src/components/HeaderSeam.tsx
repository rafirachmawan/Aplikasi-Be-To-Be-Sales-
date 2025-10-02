import React from "react";
import { View, StyleSheet } from "react-native";
import { theme } from "../theme";

/**
 * Seam (jembatan) supaya transisi header → konten mulus,
 * tapi layer-nya DI BAWAH lembar putih (zIndex rendah).
 */
export default function HeaderSeam() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.cap} />
    </View>
  );
}

const styles = StyleSheet.create({
  // tipis saja, cuma tempat nempel cap
  container: {
    height: 4,
    zIndex: 0, // ← seam ada di bawah
  },
  cap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -10, // overlap sedikit ke area putih
    height: 20,
    backgroundColor: theme.colors.background, // warna header
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,

    // seam tak perlu shadow biar putih di atas yang punya shadow
    shadowOpacity: 0,
    elevation: 0,
  },
});
