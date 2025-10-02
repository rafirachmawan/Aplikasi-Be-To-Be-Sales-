import { useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Platform,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import {
  Appbar,
  Button,
  Card,
  Divider,
  List,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderHero from "../components/HeaderHero";
import TopTabs from "../components/TopTabs";
import CustomerPicker from "../components/CustomerPicker";
import PurposePicker, { Purpose } from "../components/PurposePicker";
import {
  addPlan,
  todayStr,
  listCustomers,
  listPlansByDate,
  type Customer,
  type Plan,
} from "../services/db";
import type { NavTo } from "../types/nav";
import { theme } from "../theme";
import ScreenShell from "../components/ScreenShell";

/* ===== util tanggal & jam ===== */
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const da = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
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

/* ----- time picker ----- */
function buildTimeSlots(start = 7, end = 21, stepMinutes = 30): string[] {
  const out: string[] = [];
  for (let h = start; h < end; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      out.push(`${hh}:${mm}`);
    }
  }
  return out;
}

function TimeField({
  value,
  onChange,
  label = "Jam (HH:mm)",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const slots = useMemo(() => buildTimeSlots(), []);
  const shown = useMemo(
    () => (q.trim() ? slots.filter((s) => s.includes(q.trim())) : slots),
    [q, slots]
  );

  return (
    <>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        placeholder="Pilih jam"
        editable={false}
        right={
          <TextInput.Icon icon="clock-outline" onPress={() => setOpen(true)} />
        }
        onPressIn={() => setOpen(true)}
        style={{ backgroundColor: "#FFFFFF" }}
        outlineColor="#E9D5FF"
        activeOutlineColor="#7C3AED"
        textColor="#4C1D95"
        placeholderTextColor="#7C3AED99"
      />
      <Portal>
        <Modal
          visible={open}
          onDismiss={() => setOpen(false)}
          contentContainerStyle={{
            margin: 16,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              padding: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3E8FF",
            }}
          >
            <Text style={{ fontWeight: "900", color: "#0F172A", fontSize: 16 }}>
              Pilih Jam
            </Text>
            <TextInput
              mode="outlined"
              value={q}
              onChangeText={setQ}
              placeholder="Cari (mis. 09:30)"
              left={<TextInput.Icon icon="magnify" />}
              style={{ marginTop: 8, backgroundColor: "#FFFFFF" }}
              outlineColor="#E9D5FF"
              activeOutlineColor="#7C3AED"
            />
          </View>
          <FlatList
            data={shown}
            keyExtractor={(x) => x}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                }}
              >
                <List.Item
                  title={item}
                  left={(p) => (
                    <List.Icon {...p} icon="clock-outline" color="#7C3AED" />
                  )}
                  right={(p) =>
                    value === item ? (
                      <List.Icon {...p} icon="check-circle" color="#16A34A" />
                    ) : null
                  }
                  style={{ backgroundColor: "#FFFFFF" }}
                  titleStyle={{ color: "#0F172A", fontWeight: "700" }}
                />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <Divider style={{ backgroundColor: "#F3E8FF" }} />
            )}
            style={{ maxHeight: 420 }}
          />
          <View
            style={{
              padding: 12,
              gap: 8,
              borderTopWidth: 1,
              borderTopColor: "#F3E8FF",
            }}
          >
            <Button
              mode="outlined"
              icon="close"
              textColor="#7C3AED"
              onPress={() => setOpen(false)}
              style={{ borderColor: "#E9D5FF", borderRadius: 999 }}
            >
              Tutup
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

/* ----- date picker ----- */
function buildDateOptions(daysAhead = 60, daysBack = 7) {
  const today = new Date();
  const list: { value: string; label: string }[] = [];
  for (let i = -daysBack; i <= daysAhead; i++) {
    const d = addDays(today, i);
    list.push({ value: toISODate(d), label: formatDateLabel(d) });
  }
  return list;
}
function DateField({
  label = "Tanggal",
  value,
  onChange,
  daysAhead,
  daysBack,
  compact,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  daysAhead?: number;
  daysBack?: number;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const options = useMemo(
    () => buildDateOptions(daysAhead ?? 60, daysBack ?? 7),
    [daysAhead, daysBack]
  );
  const current = options.find((o) => o.value === value);
  const fontSize = compact ? 13 : 15;

  return (
    <>
      <TextInput
        mode="outlined"
        label={label}
        value={current ? current.label : value}
        placeholder="Pilih tanggal"
        editable={false}
        right={<TextInput.Icon icon="calendar" onPress={() => setOpen(true)} />}
        onPressIn={() => setOpen(true)}
        style={{ backgroundColor: "#FFFFFF" }}
        contentStyle={{ fontSize, paddingVertical: compact ? 4 : 8 }}
        outlineColor="#E9D5FF"
        activeOutlineColor="#7C3AED"
        textColor="#0F172A"
        placeholderTextColor="#7C3AED99"
        dense={compact}
      />
      <Portal>
        <Modal
          visible={open}
          onDismiss={() => setOpen(false)}
          contentContainerStyle={{
            margin: 16,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              padding: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3E8FF",
            }}
          >
            <Text style={{ fontWeight: "900", color: "#0F172A", fontSize: 16 }}>
              Pilih Tanggal
            </Text>
          </View>
          <FlatList
            data={options}
            keyExtractor={(x) => x.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                <List.Item
                  title={item.label}
                  left={(p) => (
                    <List.Icon {...p} icon="calendar" color="#7C3AED" />
                  )}
                  right={(p) =>
                    value === item.value ? (
                      <List.Icon {...p} icon="check-circle" color="#16A34A" />
                    ) : null
                  }
                  style={{ backgroundColor: "#FFFFFF" }}
                  titleStyle={{ color: "#0F172A", fontWeight: "700" }}
                />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <Divider style={{ backgroundColor: "#F3E8FF" }} />
            )}
            style={{ maxHeight: 420 }}
          />
          <View
            style={{
              padding: 12,
              gap: 8,
              borderTopWidth: 1,
              borderTopColor: "#F3E8FF",
            }}
          >
            <Button
              mode="outlined"
              icon="close"
              textColor="#7C3AED"
              onPress={() => setOpen(false)}
              style={{ borderColor: "#E9D5FF", borderRadius: 999 }}
            >
              Tutup
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

/* -------- Screen: Plan Besok -------- */
type DraftItem = {
  id: string;
  date: string;
  time: string;
  customer: { id: string; name: string };
  purpose: Purpose;
};

const USER_ID = "USER-DEMO";

export default function PlanTomorrow({ go }: { go: NavTo }) {
  const { width } = useWindowDimensions();
  const isSmall = width < 380;

  // input
  const [planDate, setPlanDate] = useState<string>(todayStr(1));
  const [time, setTime] = useState("");
  const [customer, setCustomer] = useState<{ id: string; name: string } | null>(
    null
  );
  const [purpose, setPurpose] = useState<Purpose>("deal");

  // drafts (tidak dipakai simpan; disisakan jika mau batch di masa depan)
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);

  // master customer
  const [customers, setCustomers] = useState<Customer[]>([]);
  useEffect(() => {
    (async () => {
      const rows = await listCustomers(USER_ID, 200);
      setCustomers(rows);
    })();
  }, []);
  const suggestions = useMemo(
    () => customers.map((c) => c.name).filter(Boolean),
    [customers]
  );

  function nameToId(name: string) {
    const nm = (name ?? "").trim();
    const match = customers.find(
      (c) => (c.name ?? "").trim().toLowerCase() === nm.toLowerCase()
    );
    return match
      ? { id: match.code, name: match.name }
      : { id: nm.toLowerCase().replace(/\s+/g, "-"), name: nm };
  }

  // ⬇️ SIMPAN LANGSUNG ke Firestore saat klik "Tambah ke Daftar"
  async function onAddDraft() {
    if (!planDate) return alert("Pilih tanggal rencana terlebih dahulu");
    if (!time) return alert("Pilih jam terlebih dahulu");
    if (!customer) return alert("Pilih outlet (customer) dulu");

    try {
      const payload: Plan = {
        userId: USER_ID,
        customerId: customer.id,
        customerName: customer.name,
        date: planDate,
        status: "planned",
        time,
        // @ts-ignore
        purpose,
      };
      await addPlan(payload); // ← simpan ke Firestore
      setListDate(planDate); // tampilkan di daftar tanggal tsb
      await loadDay(); // refresh daftar
      // reset ringan
      setTime("");
      setCustomer(null);
      setPurpose("deal");
      alert("Rencana ditambahkan.");
    } catch (e: any) {
      alert(e?.message || "Gagal menambahkan rencana");
    }
  }

  async function onSaveAll() {
    if (drafts.length === 0) return alert("Belum ada rencana di draft.");
    setSaving(true);
    try {
      for (const d of drafts) {
        const payload: Plan = {
          userId: USER_ID,
          customerId: d.customer.id,
          customerName: d.customer.name,
          date: d.date,
          status: "planned",
          time: d.time,
          // @ts-ignore
          purpose: d.purpose,
        };
        await addPlan(payload);
      }
      setDrafts([]);
      await loadDay();
      alert("Semua draft tersimpan.");
    } catch (e: any) {
      alert(e?.message || "Gagal menyimpan draft");
    } finally {
      setSaving(false);
    }
  }

  /* ====== Daftar rencana (SATU tanggal) ====== */
  const [listDate, setListDate] = useState<string>(todayStr(0));
  const [dayPlans, setDayPlans] = useState<Plan[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);

  async function loadDay() {
    setLoadingDay(true);
    try {
      const rows = await listPlansByDate(listDate, USER_ID);
      rows.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      setDayPlans(rows);
    } catch (e: any) {
      alert(e?.message || "Gagal memuat rencana");
    } finally {
      setLoadingDay(false);
    }
  }
  useEffect(() => {
    loadDay(); /* eslint-disable-next-line */
  }, [listDate]);

  // gabungan DB + draft untuk tanggal aktif (jika masih ada draft)
  const displayPlans: Plan[] = useMemo(() => {
    const asPlan = (d: DraftItem): Plan => ({
      userId: USER_ID,
      customerId: d.customer.id,
      customerName: d.customer.name,
      date: d.date,
      status: "planned",
      time: d.time,
    });
    const mix = [
      ...dayPlans,
      ...drafts.filter((d) => d.date === listDate).map(asPlan),
    ];
    mix.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    return mix;
  }, [dayPlans, drafts, listDate]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: theme.colors.background }}
      >
        <HeaderHero />
        <TopTabs current="plan" go={go} />
      </SafeAreaView>

      <ScreenShell refreshKey="plan">
        <View
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
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
            {/* INPUT rencana */}
            <Card style={{ backgroundColor: "#FFFFFF" }}>
              <Card.Title
                title="Rencana Plan"
                subtitle="Pilih tanggal rencana, jam, outlet & tujuan"
                left={(p) => <Appbar.Action {...p} icon="calendar-clock" />}
                titleStyle={{
                  color: "#0F172A",
                  fontWeight: "900",
                  letterSpacing: 0.2,
                }}
              />
              <Card.Content style={{ gap: 12 }}>
                <DateField
                  label="Tanggal Rencana"
                  value={planDate}
                  onChange={setPlanDate}
                />
                <TimeField value={time} onChange={setTime} />
                <CustomerPicker
                  value={customer}
                  onChange={(v) => setCustomer(v)}
                  suggestions={suggestions}
                  onPickSuggestion={(name) => setCustomer(nameToId(name))}
                />
                <Text style={{ color: "#7C3AED99", marginTop: -8 }}>
                  Ambil dari Master Customer (dropdown + search).
                </Text>
                <PurposePicker value={purpose} onChange={setPurpose} />

                <Button
                  mode="contained"
                  icon="plus"
                  onPress={onAddDraft}
                  style={{ borderRadius: 12, marginTop: 4 }}
                >
                  Tambah ke Daftar
                </Button>
              </Card.Content>
            </Card>

            <View style={{ height: 14 }} />

            {/* DAFTAR rencana (satu tanggal) */}
            <Card style={{ backgroundColor: "#FFFFFF" }}>
              <Card.Title
                title="Daftar Rencana (Tanggal)"
                left={(p) => <Appbar.Action {...p} icon="calendar" />}
                titleStyle={{ color: "#0F172A", fontWeight: "800" }}
              />

              <Card.Content style={{ gap: 10 }}>
                <View
                  style={{ flexDirection: isSmall ? "column" : "row", gap: 10 }}
                >
                  <View style={{ flex: 1 }}>
                    <DateField
                      label="Tanggal"
                      value={listDate}
                      onChange={setListDate}
                      daysBack={30}
                      daysAhead={90}
                      compact
                    />
                  </View>
                  <Button
                    mode="outlined"
                    icon="refresh"
                    onPress={loadDay}
                    loading={loadingDay}
                    textColor="#7C3AED"
                    style={{
                      borderColor: "#E9D5FF",
                      borderRadius: 12,
                      alignSelf: "flex-end",
                    }}
                  >
                    Tampilkan
                  </Button>
                </View>
              </Card.Content>

              <Divider style={{ marginTop: 10 }} />

              {displayPlans.length === 0 ? (
                <Card.Content style={{ paddingTop: 12, paddingBottom: 8 }}>
                  <Text style={{ color: "#64748B" }}>
                    Tidak ada rencana pada {formatDateLabel(new Date(listDate))}
                    .
                  </Text>
                </Card.Content>
              ) : (
                <Card.Content style={{ paddingVertical: 10 }}>
                  <List.Subheader
                    style={{
                      color: "#0F172A",
                      fontWeight: "800",
                      paddingLeft: 0,
                    }}
                  >
                    {formatDateLabel(new Date(listDate))}
                  </List.Subheader>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#F1E7FF",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    {displayPlans.map((p, idx) => (
                      <View key={`${p.customerId}-${p.time}-${idx}`}>
                        <List.Item
                          title={`${p.time ?? "--:--"} • ${p.customerName}`}
                          description={`Status: ${p.status ?? "-"}`}
                          left={(props) => (
                            <List.Icon
                              {...props}
                              icon="calendar"
                              color="#7C3AED"
                            />
                          )}
                          style={{
                            paddingVertical: 2,
                            backgroundColor: "#FFFFFF",
                          }}
                          titleStyle={{ color: "#0F172A", fontWeight: "700" }}
                          descriptionStyle={{ color: "#64748B" }}
                        />
                        {idx !== displayPlans.length - 1 ? (
                          <Divider style={{ backgroundColor: "#F3E8FF" }} />
                        ) : null}
                      </View>
                    ))}
                  </View>
                </Card.Content>
              )}
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
          mode="contained"
          icon="content-save"
          onPress={onSaveAll}
          loading={saving}
          disabled={drafts.length === 0}
          style={{ borderRadius: 14 }}
        >
          Simpan Semua Rencana
        </Button>
      </SafeAreaView>
    </View>
  );
}
