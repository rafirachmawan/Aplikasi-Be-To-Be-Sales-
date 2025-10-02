// apps/mobile/src/screens/VisitCreate.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  memo,
} from "react";
import {
  View,
  ScrollView,
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
  AppState,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import {
  HelperText,
  Text,
  TextInput,
  Button,
  Card,
  Divider,
  Menu,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderHero from "../components/HeaderHero";
import TopTabs from "../components/TopTabs";
import GradientButton from "../components/GradientButton";
import CustomerPicker from "../components/CustomerPicker";
import TemperatureChips from "../components/TemperatureChips";
import PhotoLocationButtons, {
  type Shot,
} from "../components/PhotoLocationButtons";
import CustomerMiniForm from "../screens/CustomerMiniForm";
import {
  addVisit,
  Temperature,
  listPlansByDate,
  listCustomers,
  type Customer,
  todayStr,
} from "../services/db";
// ⛔️ Tidak pakai Firebase Storage lagi untuk foto
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { storage } from "../firebase";
import type { NavTo } from "../types/nav";
import { theme } from "../theme";
import ScreenShell from "../components/ScreenShell";

/* ====== KONFIG CLOUDINARY (ISI SENDIRI) ====== */
const CLOUDINARY_CLOUD_NAME = "dbefoaekm"; // ganti dengan cloud name kamu
const CLOUDINARY_UPLOAD_PRESET = "Be_To_Be"; // ganti dengan nama preset kamu
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/* ===== Produk (ANALIS) sesuai permintaan ===== */
type ProductKey = "minyakGoreng" | "msg" | "bumbuDapur" | "garam";

const PRODUCT_LABEL: Record<ProductKey, string> = {
  minyakGoreng: "Minyak Goreng",
  msg: "MSG",
  bumbuDapur: "Bumbu Dapur",
  garam: "Garam",
};
const PRODUCT_KEYS: ProductKey[] = [
  "minyakGoreng",
  "msg",
  "bumbuDapur",
  "garam",
];

/* ⬇️ Ganti pilihan potensi sesuai request */
type PotensiChoice = "" | "sangat" | "ada" | "tidakMungkin";

type ProductState = {
  enabled: boolean;
  brandSaatIni: string;
  kemasanQty: string;
  potensiSwitch: PotensiChoice;
};

function defaultProductState(): Record<ProductKey, ProductState> {
  const blank: ProductState = {
    enabled: false,
    brandSaatIni: "",
    kemasanQty: "",
    potensiSwitch: "",
  };
  return {
    minyakGoreng: { ...blank },
    msg: { ...blank },
    bumbuDapur: { ...blank },
    garam: { ...blank },
  };
}

/* ====== Komponen produk per kategori ====== */
const ProductFlat = memo(function ProductFlat({
  label,
  state,
  onChange,
}: {
  label: string;
  state: ProductState;
  onChange: (next: ProductState) => void;
}) {
  const patch = (p: Partial<ProductState>) => onChange({ ...state, ...p });

  const [menuVisible, setMenuVisible] = useState(false);
  /* ⬇️ Label baru untuk pilihan */
  const potensiLabel =
    state.potensiSwitch === "sangat"
      ? "Sangat Potensi Switch"
      : state.potensiSwitch === "ada"
      ? "Ada Potensi Switch"
      : state.potensiSwitch === "tidakMungkin"
      ? "Tidak Mungkin Switch"
      : "Pilih...";

  return (
    <View style={styles.productFlat}>
      <Text style={styles.productFlatTitle}>{label}</Text>
      <View style={{ gap: 8 }}>
        <TextInput
          mode="outlined"
          label="Brand saat ini"
          value={state.brandSaatIni}
          onChangeText={(v) =>
            patch({ brandSaatIni: v, enabled: v.length > 0 || state.enabled })
          }
          autoCapitalize="none"
          style={{ backgroundColor: "#FFFFFF" }}
          outlineColor="#E9D5FF"
          activeOutlineColor="#7C3AED"
          textColor="#0F172A"
          theme={INPUT_THEME}
          blurOnSubmit={false}
        />

        <TextInput
          mode="outlined"
          label="Kemasan & Qty"
          value={state.kemasanQty}
          onChangeText={(v) =>
            patch({ kemasanQty: v, enabled: v.length > 0 || state.enabled })
          }
          style={{ backgroundColor: "#FFFFFF" }}
          outlineColor="#E9D5FF"
          activeOutlineColor="#7C3AED"
          textColor="#0F172A"
          theme={INPUT_THEME}
          blurOnSubmit={false}
          placeholder='Contoh: "1L x 10 karton/bln"'
        />

        {/* Dropdown Potensi Switch */}
        <View>
          <Text style={styles.inputLabel}>Potensi switch?</Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => {
                  Keyboard.dismiss();
                  setMenuVisible(true);
                }}
                style={styles.dropdownButton}
                textColor="#0F172A"
              >
                {potensiLabel}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                patch({ potensiSwitch: "sangat", enabled: true });
                setMenuVisible(false);
              }}
              title="Sangat Potensi Switch"
            />
            <Menu.Item
              onPress={() => {
                patch({ potensiSwitch: "ada", enabled: true });
                setMenuVisible(false);
              }}
              title="Ada Potensi Switch"
            />
            <Menu.Item
              onPress={() => {
                patch({ potensiSwitch: "tidakMungkin", enabled: true });
                setMenuVisible(false);
              }}
              title="Tidak Mungkin Switch"
            />
          </Menu>
        </View>
      </View>
    </View>
  );
});

type Entry = {
  products: Record<ProductKey, ProductState>;
  temperature: Temperature;
  note: string;
  shot: Shot | null;
};

const INPUT_THEME = {
  colors: {
    primary: "#7C3AED",
    outline: "#E9D5FF",
    onSurface: "#0F172A",
    onSurfaceVariant: "#475569",
    placeholder: "#7C3AED99",
  },
} as const;

type PlanItemProps = {
  id: string;
  name: string;
  isOpen: boolean;
  entry?: Entry;
  onToggle: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  onProductChange: (k: ProductKey, next: ProductState) => void;
  onTemperatureChange: (t: Temperature) => void;
  onNoteChange: (v: string) => void;
  onShotChange: (s: Shot | null) => void;
};

const PlanItem = memo(function PlanItem({
  id,
  name,
  isOpen,
  entry,
  onToggle,
  onLayout,
  onProductChange,
  onTemperatureChange,
  onNoteChange,
  onShotChange,
}: PlanItemProps) {
  return (
    <View onLayout={onLayout} style={{ marginBottom: 14 }}>
      <TouchableOpacity
        onPress={() => {
          Keyboard.dismiss();
          onToggle();
        }}
        style={[
          styles.planItem,
          { borderColor: isOpen ? "#7C3AED" : "#E9D5FF" },
        ]}
      >
        <Text style={styles.planTitle}>{name}</Text>
      </TouchableOpacity>

      {isOpen && entry ? (
        <View style={styles.detailBox}>
          <Text style={styles.sectionTitle}>Analis Produk — {name}</Text>
          <View style={styles.productGrid}>
            {PRODUCT_KEYS.map((k) => (
              <ProductFlat
                key={k}
                label={PRODUCT_LABEL[k]}
                state={entry.products[k]}
                onChange={(next) => onProductChange(k, next)}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Temperature</Text>
          <TemperatureChips
            value={entry.temperature}
            onChange={(t) => {
              Keyboard.dismiss();
              onTemperatureChange(t);
            }}
          />

          <Text style={styles.sectionTitle}>Hasil Kunjungan</Text>
          <TextInput
            mode="outlined"
            value={entry.note}
            onChangeText={onNoteChange}
            multiline
            numberOfLines={4}
            blurOnSubmit={false}
            placeholder="Catatan hasil, order, keberatan, dll."
            style={{ backgroundColor: "#FFFFFF" }}
            outlineColor="#E9D5FF"
            activeOutlineColor="#7C3AED"
            textColor="#4C1D95"
            placeholderTextColor="#7C3AED99"
            theme={INPUT_THEME}
          />

          <Text style={styles.sectionTitle}>Foto Real-life + Lokasi</Text>
          <PhotoLocationButtons
            value={entry.shot}
            onChange={(s) => {
              Keyboard.dismiss();
              onShotChange(s);
            }}
          />
        </View>
      ) : null}
    </View>
  );
});

/* ================= Session cache utk "Plan tambahan hari ini" =================
   Disimpan di level module (bukan state) biar tetap ada ketika user pindah screen
   lalu balik lagi, selama app belum di-reload.
   Key: `${userId}|${todayISO}` -> string[] nama customer ad-hoc hari ini
============================================================================= */
const ADHOC_PLANS_SESSION: Record<string, string[]> = {};

export default function VisitCreate({ go }: { go: NavTo }) {
  const userId = "USER-DEMO";
  const todayISO = useMemo(() => todayStr(0), []);

  const sessionKey = `${userId}|${todayISO}`;

  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<{ id?: string; customerName: string }[]>(
    []
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const rows = await listCustomers(userId, 500);
        setCustomers(rows);
      } catch {}
    })();
  }, []);
  const suggestions = useMemo(
    () =>
      customers
        .map((c) => c.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [customers]
  );

  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(
    null
  );

  const [pickerValue, setPickerValue] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  // ⬇️ simpan daftar plan ad-hoc (tambahan manual hari ini) di state,
  //     seed dari cache session agar tetap ada ketika balik dari History.
  const [adhocPlans, setAdhocPlans] = useState<string[]>(
    () => ADHOC_PLANS_SESSION[sessionKey] ?? []
  );
  useEffect(() => {
    ADHOC_PLANS_SESSION[sessionKey] = adhocPlans;
  }, [adhocPlans, sessionKey]);

  const scrollRef = useRef<ScrollView>(null);
  const itemYRef = useRef<Record<string, number>>({});
  const onPlanItemLayout = useCallback((id: string, e: LayoutChangeEvent) => {
    itemYRef.current[id] = e.nativeEvent.layout.y;
  }, []);
  const scrollToItem = useCallback((id: string) => {
    const y = itemYRef.current[id];
    if (y == null) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    });
  }, []);

  const norm = (s: string) => s.trim().toLowerCase();

  const reloadTodayPlans = useCallback(async () => {
    const rows = await listPlansByDate(todayISO, userId);
    const fromDB = rows.map((p) => ({
      id: p.id,
      customerName: p.customerName,
    }));

    // ⬇️ gabungkan dengan ad-hoc plans (tanpa duplikat)
    const merged = [
      ...fromDB,
      ...adhocPlans
        .filter((nm) => !fromDB.some((x) => norm(x.customerName) === norm(nm)))
        .map((nm) => ({ id: undefined, customerName: nm })),
    ];

    setPlans(merged);
    setEntries({});
    setExpanded({});
    setSelected(null);
    itemYRef.current = {};
  }, [todayISO, userId, adhocPlans]);

  useEffect(() => {
    reloadTodayPlans();
  }, [reloadTodayPlans]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") reloadTodayPlans();
    });
    return () => sub.remove();
  }, [reloadTodayPlans]);

  const asIdFromName = useCallback(
    (name: string) => {
      const found = customers.find(
        (c) => (c.name ?? "").trim().toLowerCase() === name.trim().toLowerCase()
      );
      return found
        ? found.code
        : name.trim().toLowerCase().replace(/\s+/g, "-");
    },
    [customers]
  );

  const ensureEntry = useCallback((id: string) => {
    setEntries((prev) =>
      prev[id]
        ? prev
        : {
            ...prev,
            [id]: {
              products: defaultProductState(),
              temperature: "hangat",
              note: "",
              shot: null,
            },
          }
    );
  }, []);

  // ⬇️ addPlan: tambahkan ke daftar ad-hoc juga (supaya tidak hilang setelah navigasi)
  const addPlan = useCallback(
    (name: string) => {
      const nm = name.trim();
      if (!nm) return;

      setAdhocPlans((prev) =>
        prev.some((x) => norm(x) === norm(nm)) ? prev : [...prev, nm]
      );

      setPlans((prev) => {
        const exists = prev.some((p) => norm(p.customerName) === norm(nm));
        if (exists) return prev;
        return [...prev, { customerName: nm, id: undefined }];
      });

      const id = asIdFromName(nm);
      ensureEntry(id);
    },
    [asIdFromName, ensureEntry]
  );

  /* ⬇️ Saat ambil/tambah customer, langsung buka UI plan-nya */
  const addPlanAndOpen = useCallback(
    (name: string) => {
      const nm = name.trim();
      if (!nm) return;
      const id = asIdFromName(nm);

      // Tambahkan ke daftar ad-hoc + daftar plan jika belum ada
      setAdhocPlans((prev) =>
        prev.some((x) => norm(x) === norm(nm)) ? prev : [...prev, nm]
      );
      setPlans((prev) => {
        const exists = prev.some((p) => norm(p.customerName) === norm(nm));
        if (exists) return prev;
        return [...prev, { customerName: nm, id: undefined }];
      });

      // Pastikan entry ada, buka panel, pilih, dan scroll
      ensureEntry(id);
      setExpanded((prev) => ({ ...prev, [id]: true }));
      setSelected({ id, name: nm });

      setTimeout(() => {
        scrollToItem(id);
      }, 120);
    },
    [asIdFromName, ensureEntry, scrollToItem]
  );

  const togglePlan = useCallback(
    (name: string) => {
      const id = asIdFromName(name);
      setExpanded((prev) => {
        const willOpen = !prev[id];
        const next = { ...prev, [id]: willOpen };
        if (willOpen) {
          ensureEntry(id);
          setSelected({ id, name });
          scrollToItem(id);
        } else {
          setSelected((s) => (s?.id === id ? null : s));
          scrollToItem(id);
        }
        return next;
      });
    },
    [asIdFromName, ensureEntry, scrollToItem]
  );

  const setEntryPatch = useCallback((id: string, patch: Partial<Entry>) => {
    setEntries((prev) =>
      prev[id] ? { ...prev, [id]: { ...prev[id], ...patch } } : prev
    );
  }, []);
  const changeProduct = useCallback(
    (id: string, k: ProductKey, next: ProductState) => {
      setEntries((prev) => {
        const cur = prev[id];
        if (!cur) return prev;
        return {
          ...prev,
          [id]: { ...cur, products: { ...cur.products, [k]: next } },
        };
      });
    },
    []
  );

  function withTimeout<T>(p: Promise<T>, ms = 12000): Promise<T> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("Timeout operasi")), ms);
      p.then(
        (v) => {
          clearTimeout(t);
          resolve(v);
        },
        (e) => {
          clearTimeout(t);
          reject(e);
        }
      );
    });
  }

  /* ===== Helper: nilai `file` untuk Cloudinary (URL atau data URL) ===== */
  async function toCloudinaryFileParam(uri: string): Promise<string> {
    if (uri.startsWith("data:")) return uri;
    if (uri.startsWith("http")) return uri;

    try {
      // @ts-ignore
      const FileSystem: any = require("expo-file-system");
      const base64 = (await withTimeout(
        FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        }),
        8000
      )) as string;
      return `data:image/jpeg;base64,${base64}`;
    } catch {}

    try {
      // @ts-ignore
      const RNFS: any = require("react-native-fs");
      const base64 = (await withTimeout(
        RNFS.readFile(uri, "base64"),
        8000
      )) as string;
      return `data:image/jpeg;base64,${base64}`;
    } catch {}

    throw new Error(
      "Tidak bisa membaca file lokal. Install expo-file-system atau react-native-fs."
    );
  }

  async function uploadPhotoIfAny(path: string, uri?: string | null) {
    if (!uri) return null;

    try {
      const publicId = path.replace(/\.[a-z]+$/i, "");
      const form = new FormData();

      const fileValue = await toCloudinaryFileParam(uri);
      form.append("file", fileValue);

      form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      form.append("public_id", publicId);
      form.append("folder", "");

      const res = await withTimeout(
        fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: form }),
        15000
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Cloudinary upload gagal (${res.status}): ${txt}`);
      }

      const json: any = await res.json();
      const secureUrl: string | undefined = json.secure_url || json.url;
      const publicIdResp: string | undefined = json.public_id;

      return {
        url: secureUrl ?? null,
        path: publicIdResp ?? publicId,
      };
    } catch (e) {
      console.warn(
        "Upload foto gagal, lanjutkan tanpa foto:",
        (e as any)?.message || e
      );
      return { url: null, path };
    }
  }

  async function submit() {
    if (!selected)
      return Alert.alert("Klik customer dulu (kartu putih) untuk memilih");
    const current = entries[selected.id];
    if (!current) return Alert.alert("Data customer belum siap");
    if (!current.shot?.uri || !current.shot.coords)
      return Alert.alert("Ambil foto & kirim lokasi dulu");
    if (saving) return;
    setSaving(true);

    try {
      const offered = PRODUCT_KEYS.reduce<
        Array<{
          key: ProductKey;
          name: string;
          details: {
            brandSaatIni?: string;
            kemasanQty?: string;
            potensiSwitch?: PotensiChoice;
          };
        }>
      >((acc, key) => {
        const st = current.products[key];
        const anyFilled =
          st.enabled || st.brandSaatIni || st.kemasanQty || st.potensiSwitch;
        if (anyFilled) {
          acc.push({
            key,
            name: PRODUCT_LABEL[key],
            details: {
              brandSaatIni: st.brandSaatIni || undefined,
              kemasanQty: st.kemasanQty || undefined,
              potensiSwitch: st.potensiSwitch || undefined,
            },
          });
        }
        return acc;
      }, []);

      const nowISO = new Date().toISOString();
      const path = `visits/${userId}/${Date.now()}.jpg`;
      const maps = `https://maps.google.com/?q=${current.shot.coords.lat},${current.shot.coords.lng}`;

      const uploaded = await uploadPhotoIfAny(path, current.shot.uri);

      await addVisit({
        userId,
        customerId: selected.id,
        customerName: selected.name,
        dateISO: nowISO,
        temperature: current.temperature,
        offered: offered.map((o) => ({ name: o.name })),
        offeredDetailed: offered.reduce<Record<string, any>>((acc, o) => {
          acc[o.key] = o.details;
          return acc;
        }, {}),
        resultNote:
          current.note ||
          (offered.length
            ? offered
                .map(
                  (o) =>
                    `${o.name}: brandSaatIni=${
                      o.details?.brandSaatIni || "-"
                    }, kemasanQty=${
                      o.details?.kemasanQty || "-"
                    }, potensiSwitch=${o.details?.potensiSwitch || "-"}`
                )
                .join(" | ")
            : undefined),
        geo: { lat: current.shot.coords.lat, lng: current.shot.coords.lng },
        locationLink: maps,
        photo: uploaded
          ? uploaded.url
            ? { storagePath: uploaded.path, downloadUrl: uploaded.url }
            : { storagePath: uploaded.path }
          : undefined,
      });

      // ⬇️ Reset hanya entry customer yang barusan selesai — plan tetap ada.
      setEntries((prev) => ({
        ...prev,
        [selected.id]: {
          products: defaultProductState(),
          temperature: "hangat",
          note: "",
          shot: null,
        },
      }));

      Alert.alert("Kunjungan tersimpan");
      go("history");
    } catch (err: any) {
      console.warn("submit error:", err?.message || err);
      Alert.alert("Gagal menyimpan", String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <HeaderHero>
          <TopTabs current="visit" go={go} />
        </HeaderHero>

        <ScreenShell refreshKey="visit">
          <View style={styles.bodyWhite}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{
                padding: 16,
                gap: 18,
                paddingBottom: 180,
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              removeClippedSubviews={false}
              showsVerticalScrollIndicator={false}
              onScrollBeginDrag={Keyboard.dismiss}
              onTouchStart={Keyboard.dismiss}
            >
              <Card style={styles.card}>
                <Card.Title
                  title="Kunjungan hari ini"
                  titleStyle={styles.cardTitle}
                  subtitle={todayISO}
                  subtitleStyle={styles.dateText}
                />
                <Divider />

                <Card.Content style={styles.sectionBlock}>
                  <GradientButton
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowNewCustomer((s) => !s);
                    }}
                  >
                    {showNewCustomer
                      ? "Batal Tambah Customer"
                      : "+ Tambah Customer Baru"}
                  </GradientButton>

                  {showNewCustomer ? (
                    <CustomerMiniForm
                      userId={userId}
                      onCancel={() => {
                        Keyboard.dismiss();
                        setShowNewCustomer(false);
                      }}
                      onCreated={(c) => {
                        addPlanAndOpen(c.name); // ⬅️ buka UI plan-nya langsung
                        setShowNewCustomer(false);
                        Keyboard.dismiss();
                      }}
                    />
                  ) : null}

                  <CustomerPicker
                    value={pickerValue}
                    onChange={(v) => {
                      setPickerValue((prev) => {
                        if (prev?.id === v?.id && prev?.name === v?.name)
                          return prev;
                        return v;
                      });
                      if (v?.name) addPlanAndOpen(v.name); // ⬅️ buka UI plan
                      Keyboard.dismiss();
                    }}
                    suggestions={suggestions}
                    onPickSuggestion={(name) => {
                      addPlanAndOpen(name); // ⬅️ buka UI plan
                      Keyboard.dismiss();
                    }}
                    placeholder="Ambil dari master customer"
                    userId={userId}
                  />
                </Card.Content>

                <Divider />

                <View style={styles.sectionHeader}>
                  <Text style={styles.planHeaderText}>Plan hari ini</Text>
                </View>

                {plans.length === 0 ? (
                  <Card.Content style={styles.sectionBlock}>
                    <Text style={styles.muted}>
                      Belum ada customer untuk hari ini.
                    </Text>
                  </Card.Content>
                ) : (
                  <Card.Content style={styles.planListBlock}>
                    {plans.map((p) => {
                      const id = asIdFromName(p.customerName);
                      return (
                        <PlanItem
                          key={p.id ?? p.customerName}
                          id={id}
                          name={p.customerName}
                          isOpen={!!expanded[id]}
                          entry={entries[id]}
                          onToggle={() => {
                            Keyboard.dismiss();
                            togglePlan(p.customerName);
                          }}
                          onLayout={(e) => onPlanItemLayout(id, e)}
                          onProductChange={(k, next) =>
                            changeProduct(id, k, next)
                          }
                          onTemperatureChange={(t) =>
                            setEntryPatch(id, { temperature: t })
                          }
                          onNoteChange={(v) => setEntryPatch(id, { note: v })}
                          onShotChange={(s) => setEntryPatch(id, { shot: s })}
                        />
                      );
                    })}
                  </Card.Content>
                )}

                <Card.Content style={[styles.sectionBlock, { paddingTop: 0 }]}>
                  <HelperText type="info" visible style={styles.helper}>
                    Ketuk area kosong mana pun untuk menyembunyikan keyboard.
                  </HelperText>
                </Card.Content>
              </Card>
            </ScrollView>
          </View>
        </ScreenShell>

        <SafeAreaView edges={["bottom"]} style={styles.sticky}>
          <GradientButton
            onPress={() => {
              Keyboard.dismiss();
              submit();
            }}
            disabled={saving || !selected || !entries[selected?.id ?? ""]}
          >
            {saving ? "Menyimpan..." : "Simpan Kunjungan"}
          </GradientButton>
          <Button
            onPress={() => {
              Keyboard.dismiss();
              go("history");
            }}
            mode="text"
            textColor="#7C3AED"
            style={{ marginTop: 8 }}
            disabled={saving}
          >
            Lihat Riwayat
          </Button>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

/* ===================== Styles ===================== */
const styles = StyleSheet.create({
  bodyWhite: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -8,
    paddingTop: 8,
  },
  card: { backgroundColor: "#FFFFFF" },
  cardTitle: { color: "#0F172A", fontWeight: "800" },
  muted: { color: "#64748B" },
  helper: { color: "#7C3AED99" },
  sectionBlock: { paddingTop: 10, paddingBottom: 14, gap: 10 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  planListBlock: { paddingVertical: 8, gap: 12, marginBottom: 6 },
  dateText: { color: "#0F172A", fontWeight: "800" },
  planHeaderText: { color: "#0F172A", fontWeight: "900", fontSize: 16 },
  planItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    marginBottom: 6,
  },
  planTitle: { color: "#0F172A", fontWeight: "800", fontSize: 15 },
  detailBox: {
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    marginBottom: 6,
    gap: 12,
  },
  sectionTitle: { color: "#0F172A", fontWeight: "800", marginBottom: 6 },
  productFlat: {
    borderWidth: 1,
    borderColor: "#F1E7FF",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  productFlatTitle: { color: "#0F172A", fontWeight: "800", marginBottom: 6 },
  productGrid: { gap: 10 },
  inputLabel: {
    fontSize: 12,
    color: "#334155",
    marginBottom: 6,
    fontWeight: "700",
  },
  dropdownButton: { borderColor: "#E9D5FF" },
  sticky: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === "android" ? 14 : 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E9D5FF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
});
