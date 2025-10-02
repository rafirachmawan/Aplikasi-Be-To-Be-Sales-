// apps/mobile/src/screens/History.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
} from "react-native";
import {
  Appbar,
  Button,
  Card,
  Divider,
  HelperText,
  List,
  Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderHero from "../components/HeaderHero";
import TopTabs from "../components/TopTabs";
import ScreenShell from "../components/ScreenShell";
import { theme } from "../theme";
import {
  type Temperature,
  listVisitsRecent,
  listVisitsRecentCloud,
} from "../services/db";
import type { NavTo } from "../types/nav";

// ⬇️ Storage fallback untuk getDownloadURL dari storagePath
import { storage } from "../firebase";
import { ref, getDownloadURL } from "firebase/storage";

/* ===== Cloudinary (fallback URL builder) ===== */
const CLOUDINARY_CLOUD_NAME = "dbefoaekm"; // ganti ke cloud name kamu jika beda
const cloudinaryUrlFromPublicId = (publicId: string) =>
  `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${encodeURIComponent(
    publicId.replace(/^\/+/, "")
  )}`;

/* ===== util tanggal ===== */
function toDateString(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}
function formatDateLabel(d: Date) {
  const hari = d.toLocaleDateString("id-ID", { weekday: "long" });
  const tgl = d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return `${hari}, ${tgl}`;
}

/* ===== tipe visit untuk render ===== */
type VisitItem = {
  id: string;
  customerName: string;
  dateISO: string;
  temperature?: Temperature;
  resultNote?: string;
  photoUrl?: string; // URL siap pakai (kalau ada)
  photoPath?: string; // path/public_id (fallback)
  locationLink?: string;
  offered?: { name: string; qty?: number }[];
  offeredDetailed?: Record<string, any>; // ← fleksibel: dukung skema lama & baru
};

const USER_ID = "USER-DEMO";

/* ===== Mapping nama produk agar key jadi label ramah ===== */
const PRODUCT_FRIENDLY: Record<string, string> = {
  minyakGoreng: "Minyak Goreng",
  msg: "MSG",
  bumbuDapur: "Bumbu Dapur",
  garam: "Garam",
};
const potensiSwitchLabel = (code?: string) => {
  if (!code) return undefined;
  switch (code) {
    case "sangat":
      return "Sangat Potensi Switch";
    case "ada":
      return "Ada Potensi Switch";
    case "tidakMungkin":
      return "Tidak Mungkin Switch";
    default:
      return code; // fallback bila ada nilai lain
  }
};

/* ================= Screen: History ================= */
export default function History({ go }: { go: NavTo }) {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [openDetail, setOpenDetail] = useState<Record<string, boolean>>({});

  // Cache URL foto hasil resolve dari storagePath/public_id
  const [photoUrlById, setPhotoUrlById] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      let cloud: VisitItem[] = [];
      try {
        const rows = await listVisitsRecentCloud(USER_ID, days);
        cloud = rows.map((r: any) => {
          const path = r.photo?.storagePath ?? r.photo?.path ?? undefined;
          let url = r.photo?.downloadUrl ?? r.photo?.url ?? undefined;
          // fallback: kalau pakai Cloudinary dan hanya punya public_id
          if (!url && path) url = cloudinaryUrlFromPublicId(path);
          return {
            id: r.id!,
            customerName: r.customerName ?? "-",
            dateISO: r.dateISO,
            temperature: r.temperature,
            resultNote: r.resultNote,
            photoUrl: url,
            photoPath: path,
            locationLink: r.locationLink,
            offered: Array.isArray(r.offered) ? r.offered : undefined,
            offeredDetailed: r.offeredDetailed ? r.offeredDetailed : undefined,
          };
        });
      } catch (e) {
        console.warn(
          "Gagal load Firestore subcollection:",
          (e as any)?.message || e
        );
      }

      let local: VisitItem[] = [];
      try {
        const rows = await listVisitsRecent(USER_ID, days);
        local = rows.map((r: any) => {
          const path = r.photo?.storagePath ?? r.photo?.path ?? undefined;
          let url = r.photo?.downloadUrl ?? r.photo?.url ?? undefined;
          if (!url && path) url = cloudinaryUrlFromPublicId(path);
          return {
            id: r.id ?? `${r.dateISO}|${r.customerName ?? "-"}`,
            customerName: r.customerName ?? "-",
            dateISO: r.dateISO,
            temperature: r.temperature,
            resultNote: r.resultNote,
            photoUrl: url,
            photoPath: path,
            locationLink: r.locationLink,
            offered: Array.isArray(r.offered) ? r.offered : undefined,
            offeredDetailed: r.offeredDetailed ? r.offeredDetailed : undefined,
          };
        });
      } catch (e) {
        console.warn("Gagal load local visits:", (e as any)?.message || e);
      }

      // Gabungkan — prioritaskan cloud; isi kekosongan dari local
      const byKey = new Map<string, VisitItem>();
      const makeKey = (v: VisitItem) =>
        v.id || `${v.dateISO}|${v.customerName}`;

      for (const v of cloud) byKey.set(makeKey(v), v);
      for (const v of local) {
        const k = makeKey(v);
        if (!byKey.has(k)) {
          byKey.set(k, v);
        } else {
          const cur = byKey.get(k)!;
          byKey.set(k, {
            ...cur,
            photoUrl: cur.photoUrl || v.photoUrl,
            photoPath: cur.photoPath || v.photoPath,
            resultNote: cur.resultNote || v.resultNote,
            temperature: cur.temperature || v.temperature,
            offered: cur.offered?.length ? cur.offered : v.offered,
            offeredDetailed:
              cur.offeredDetailed && Object.keys(cur.offeredDetailed).length > 0
                ? cur.offeredDetailed
                : v.offeredDetailed,
          });
        }
      }

      const merged = Array.from(byKey.values()).sort((a, b) =>
        b.dateISO.localeCompare(a.dateISO)
      );
      setVisits(merged);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Prefetch URL foto dari storagePath/public_id (supaya saat buka detail sudah siap)
  useEffect(() => {
    (async () => {
      const tasks: Array<Promise<void>> = [];
      for (const v of visits) {
        if (v.photoUrl || photoUrlById[v.id] || !v.photoPath) continue;

        // 1) Coba build Cloudinary URL dulu (tanpa network call)
        const guess = cloudinaryUrlFromPublicId(v.photoPath);
        if (guess) {
          setPhotoUrlById((prev) =>
            prev[v.id] ? prev : { ...prev, [v.id]: guess }
          );
          continue;
        }

        // 2) Fallback terakhir: Firebase Storage (jika benar2 pakai Storage)
        tasks.push(
          getDownloadURL(ref(storage, v.photoPath))
            .then((url) => {
              setPhotoUrlById((prev) =>
                prev[v.id] ? prev : { ...prev, [v.id]: url }
              );
            })
            .catch((e) => {
              console.warn(
                "Prefetch foto gagal:",
                (e as any)?.message || e,
                "path=" + v.photoPath
              );
            })
        );
      }
      if (tasks.length) {
        try {
          await Promise.all(tasks);
        } catch {}
      }
    })();
  }, [visits, photoUrlById]);

  // kelompokkan per tanggal (YYYY-MM-DD)
  const grouped = useMemo(() => {
    const map = new Map<string, VisitItem[]>();
    for (const v of visits) {
      const k = toDateString(v.dateISO);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(v);
    }
    const out = Array.from(map.entries()).sort(([a], [b]) =>
      b.localeCompare(a)
    );
    out.forEach(([_, arr]) =>
      arr.sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    );
    return out;
  }, [visits]);

  function toggle(dateKey: string) {
    setExpanded((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  }

  async function ensurePhotoUrl(v: VisitItem) {
    if (v.photoUrl || photoUrlById[v.id]) return;
    if (!v.photoPath) return;

    // 1) Cloudinary public_id → langsung set URL tanpa request
    const guess = cloudinaryUrlFromPublicId(v.photoPath);
    if (guess) {
      setPhotoUrlById((prev) => ({ ...prev, [v.id]: guess }));
      return;
    }

    // 2) Fallback terakhir: coba Firebase Storage
    try {
      const url = await getDownloadURL(ref(storage, v.photoPath));
      setPhotoUrlById((prev) => ({ ...prev, [v.id]: url }));
    } catch (e) {
      console.warn(
        "Gagal resolve foto dari storagePath:",
        (e as any)?.message || e
      );
    }
  }

  function toggleDetail(visitId: string) {
    setOpenDetail((prev) => {
      const next = { ...prev, [visitId]: !prev[visitId] };
      return next;
    });
    const v = visits.find((x) => x.id === visitId);
    if (v) ensurePhotoUrl(v);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: theme.colors.background }}
      >
        <HeaderHero />
        <TopTabs current="history" go={go} />
      </SafeAreaView>

      <ScreenShell refreshKey="history">
        <View style={styles.bodyWhite}>
          <ScrollView
            contentContainerStyle={{
              padding: 16,
              gap: 16,
              paddingTop: 12,
              paddingBottom: 120,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Card style={{ backgroundColor: "#FFFFFF" }}>
              <Card.Title
                title="Riwayat Kunjungan"
                subtitle={`Menampilkan ${days} hari terakhir`}
                left={(p) => <Appbar.Action {...p} icon="history" />}
                titleStyle={{ color: "#0F172A", fontWeight: "900" }}
              />
              <Card.Content style={{ gap: 10 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Button
                    mode={days === 7 ? "contained" : "outlined"}
                    onPress={() => setDays(7)}
                    style={{ borderRadius: 999, flex: 1 }}
                  >
                    7 Hari
                  </Button>
                  <Button
                    mode={days === 30 ? "contained" : "outlined"}
                    onPress={() => setDays(30)}
                    style={{ borderRadius: 999, flex: 1 }}
                  >
                    30 Hari
                  </Button>
                </View>
                <Button
                  mode="outlined"
                  icon="refresh"
                  onPress={reload}
                  loading={loading}
                  textColor="#7C3AED"
                  style={{ borderColor: "#E9D5FF", borderRadius: 12 }}
                >
                  Muat Ulang
                </Button>
              </Card.Content>

              <Divider style={{ marginTop: 10 }} />

              {grouped.length === 0 ? (
                <Card.Content style={{ padding: 16 }}>
                  <Text style={{ color: "#64748B" }}>
                    Belum ada kunjungan pada rentang waktu ini.
                  </Text>
                </Card.Content>
              ) : (
                <Card.Content style={{ paddingVertical: 8, gap: 12 }}>
                  {grouped.map(([date, items]) => {
                    const open = !!expanded[date];
                    return (
                      <View key={date} style={{ gap: 6 }}>
                        {/* Header tanggal */}
                        <TouchableOpacity
                          onPress={() => toggle(date)}
                          style={styles.dateRow}
                        >
                          <Text style={styles.dateTitle}>
                            {formatDateLabel(new Date(date))}
                          </Text>
                          <Text style={styles.dateCount}>
                            {items.length} kunjungan
                          </Text>
                        </TouchableOpacity>

                        {/* Detail list visit pada tanggal tsb */}
                        {open ? (
                          <View
                            style={{
                              borderWidth: 1,
                              borderColor: "#F1E7FF",
                              borderRadius: 12,
                              overflow: "hidden",
                            }}
                          >
                            {items.map((v, idx) => {
                              const jam = v.dateISO.slice(11, 16);
                              const descParts = [
                                `Jam: ${jam}`,
                                v.temperature ? `Temp: ${v.temperature}` : "",
                                v.resultNote ? `Note: ${v.resultNote}` : "",
                              ].filter(Boolean);

                              const isOpen = !!openDetail[v.id];
                              const effectivePhotoUrl =
                                v.photoUrl || photoUrlById[v.id];

                              return (
                                <View key={v.id}>
                                  <List.Item
                                    title={v.customerName}
                                    description={descParts.join(" • ")}
                                    onPress={() => toggleDetail(v.id)}
                                    left={(p) => (
                                      <List.Icon
                                        {...p}
                                        icon={
                                          isOpen
                                            ? "chevron-down"
                                            : "chevron-right"
                                        }
                                        color="#7C3AED"
                                      />
                                    )}
                                    right={(p) =>
                                      v.locationLink ? (
                                        <Appbar.Action
                                          {...p}
                                          icon="map-marker"
                                          onPress={() => {
                                            const url = v.locationLink!;
                                            if (
                                              Platform.OS === "web" &&
                                              typeof window !== "undefined"
                                            ) {
                                              // @ts-ignore
                                              window.open(url, "_blank");
                                            } else {
                                              Linking.openURL(url).catch(
                                                () => {}
                                              );
                                            }
                                          }}
                                        />
                                      ) : null
                                    }
                                    style={{
                                      paddingVertical: 2,
                                      backgroundColor: "#FFFFFF",
                                    }}
                                    titleStyle={{
                                      color: "#0F172A",
                                      fontWeight: "700",
                                    }}
                                    descriptionStyle={{ color: "#64748B" }}
                                  />

                                  {/* PANEL DETAIL */}
                                  {isOpen ? (
                                    <View style={styles.detailWrap}>
                                      {/* Foto */}
                                      {effectivePhotoUrl ? (
                                        <Image
                                          source={{ uri: effectivePhotoUrl }}
                                          style={styles.detailPhoto}
                                          resizeMode="cover"
                                        />
                                      ) : (
                                        <Text style={styles.detailMuted}>
                                          Tidak ada foto
                                        </Text>
                                      )}

                                      {/* Temperature + jam */}
                                      <Text style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>
                                          Waktu:
                                        </Text>{" "}
                                        {jam}
                                        {"   "}
                                        <Text style={styles.detailLabel}>
                                          Temperature:
                                        </Text>{" "}
                                        {v.temperature ?? "-"}
                                      </Text>

                                      {/* Note */}
                                      <Text style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>
                                          Catatan:
                                        </Text>{" "}
                                        {v.resultNote ?? "-"}
                                      </Text>

                                      {/* Produk / Order (ringkas) */}
                                      {Array.isArray(v.offered) &&
                                      v.offered.length > 0 ? (
                                        <View style={{ gap: 4 }}>
                                          <Text style={styles.detailLabel}>
                                            Produk dibahas:
                                          </Text>
                                          {v.offered.map((o, i) => (
                                            <Text
                                              key={i}
                                              style={styles.detailBullet}
                                            >
                                              • {o.name}
                                              {o.qty ? ` — qty: ${o.qty}` : ""}
                                            </Text>
                                          ))}
                                        </View>
                                      ) : null}

                                      {/* Produk detail — dukung skema lama & baru */}
                                      {v.offeredDetailed &&
                                      Object.keys(v.offeredDetailed).length >
                                        0 ? (
                                        <View style={{ gap: 6, marginTop: 6 }}>
                                          <Text style={styles.detailLabel}>
                                            Detail produk:
                                          </Text>
                                          {Object.entries(
                                            v.offeredDetailed
                                          ).map(([key, d]: any) => {
                                            const friendly =
                                              PRODUCT_FRIENDLY[key] || key;

                                            // Skema baru (VisitCreate): brandSaatIni, kemasanQty, potensiSwitch
                                            const brandBaru =
                                              d?.brandSaatIni ?? undefined;
                                            const kemasanQty =
                                              d?.kemasanQty ?? undefined;
                                            const potensi =
                                              potensiSwitchLabel(
                                                d?.potensiSwitch
                                              ) ?? undefined;

                                            // Skema lama (placeholder): brand, capacityPerMonth, potentialBrand, potentialQtyPerMonth
                                            const brandLama =
                                              d?.brand ?? undefined;
                                            const kapasLama =
                                              d?.capacityPerMonth ?? undefined;
                                            const potBrand =
                                              d?.potentialBrand ?? undefined;
                                            const potQty =
                                              d?.potentialQtyPerMonth ??
                                              undefined;

                                            const brand =
                                              brandBaru ?? brandLama ?? "-";
                                            const kemasan =
                                              kemasanQty ?? kapasLama ?? "-";

                                            return (
                                              <View
                                                key={key}
                                                style={styles.detailBox}
                                              >
                                                <Text
                                                  style={styles.detailBullet}
                                                >
                                                  • {friendly}
                                                </Text>

                                                <Text style={styles.detailTiny}>
                                                  Merek: {brand}
                                                </Text>

                                                <Text style={styles.detailTiny}>
                                                  Kemasan/Qty: {kemasan}
                                                </Text>

                                                {potensi ? (
                                                  <Text
                                                    style={styles.detailTiny}
                                                  >
                                                    Potensi Switch: {potensi}
                                                  </Text>
                                                ) : potBrand || potQty ? (
                                                  <Text
                                                    style={styles.detailTiny}
                                                  >
                                                    Potensi Brand:{" "}
                                                    {potBrand || "-"} | Potensi
                                                    Qty/bln: {potQty || "-"}
                                                  </Text>
                                                ) : null}
                                              </View>
                                            );
                                          })}
                                        </View>
                                      ) : null}

                                      {/* Tombol aksi */}
                                      <View style={styles.detailActions}>
                                        {v.locationLink ? (
                                          <Button
                                            mode="outlined"
                                            icon="map-marker"
                                            onPress={() => {
                                              const url = v.locationLink!;
                                              if (
                                                Platform.OS === "web" &&
                                                typeof window !== "undefined"
                                              ) {
                                                // @ts-ignore
                                                window.open(url, "_blank");
                                              } else {
                                                Linking.openURL(url).catch(
                                                  () => {}
                                                );
                                              }
                                            }}
                                            textColor="#7C3AED"
                                            style={styles.detailBtn}
                                          >
                                            Buka Peta
                                          </Button>
                                        ) : null}
                                        {effectivePhotoUrl ? (
                                          <Button
                                            mode="outlined"
                                            icon="image"
                                            onPress={() => {
                                              const url = effectivePhotoUrl!;
                                              if (
                                                Platform.OS === "web" &&
                                                typeof window !== "undefined"
                                              ) {
                                                // @ts-ignore
                                                window.open(url, "_blank");
                                              } else {
                                                Linking.openURL(url).catch(
                                                  () => {}
                                                );
                                              }
                                            }}
                                            textColor="#7C3AED"
                                            style={styles.detailBtn}
                                          >
                                            Buka Foto
                                          </Button>
                                        ) : null}
                                      </View>
                                    </View>
                                  ) : null}

                                  {idx < items.length - 1 ? (
                                    <Divider
                                      style={{ backgroundColor: "#F3E8FF" }}
                                    />
                                  ) : null}
                                </View>
                              );
                            })}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </Card.Content>
              )}

              <Card.Content>
                <HelperText type="info" visible style={{ color: "#7C3AED99" }}>
                  Riwayat menampilkan kunjungan yang{" "}
                  <Text style={{ fontWeight: "900" }}>
                    benar-benar disimpan
                  </Text>{" "}
                  dari menu Input Kunjungan. Ketuk nama customer untuk melihat
                  detail & foto.
                </HelperText>
              </Card.Content>
            </Card>
          </ScrollView>
        </View>
      </ScreenShell>

      {/* Sticky actions */}
      <SafeAreaView
        edges={["bottom"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: Platform.OS === "android" ? 12 : 0,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E9D5FF",
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 8,
        }}
      >
        <Button
          mode="outlined"
          icon="home"
          onPress={() => go("home")}
          style={{ borderRadius: 12 }}
          textColor="#7C3AED"
        >
          Kembali ke Beranda
        </Button>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bodyWhite: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dateRow: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1E7FF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateTitle: {
    color: "#0F172A",
    fontWeight: "900",
  },
  dateCount: {
    color: "#7C3AED",
    fontWeight: "800",
  },

  /* ==== detail panel ==== */
  detailWrap: {
    backgroundColor: "#FAF5FF",
    borderTopWidth: 1,
    borderColor: "#F3E8FF",
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
  },
  detailPhoto: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    marginBottom: 8,
  },
  detailRow: { color: "#334155", marginBottom: 6 },
  detailLabel: { fontWeight: "800", color: "#0F172A" },
  detailBullet: { color: "#334155" },
  detailTiny: { color: "#64748B", fontSize: 12, marginLeft: 12 },
  detailBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    borderRadius: 10,
    padding: 8,
  },
  detailActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  detailBtn: { borderRadius: 10, borderColor: "#E9D5FF" },
  detailMuted: { color: "#94A3B8", fontStyle: "italic", marginBottom: 6 },
});
