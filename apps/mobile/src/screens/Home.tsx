import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import {
  Card,
  Text,
  ProgressBar,
  Button,
  Divider,
  List,
  Chip,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import HeaderHero from "../components/HeaderHero";
import TopTabs from "../components/TopTabs";
import type { NavTo } from "../types/nav";
import { theme } from "../theme";
import { db } from "../firebase";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";
import { listPlansByDate, todayStr } from "../services/db";
import ScreenShell from "../components/ScreenShell";

type Temperature = "dingin" | "hangat" | "panas" | "menyala";
type Visit = {
  id: string;
  userId: string;
  customerName: string;
  temperature: Temperature;
  dateISO: string;
};

const SP = 16;
const RADIUS = 16;
const HEADER_H = 48;
const ICON_SIZE = 20;
const USER_ID = "USER-DEMO";

const startOfDayISO = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
const endOfDayISO = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  const pct = Math.abs(value);
  return (
    <View
      style={[
        styles.delta,
        {
          backgroundColor: up ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
        },
      ]}
    >
      <MaterialCommunityIcons
        name={up ? "trending-up" : "trending-down"}
        size={14}
        color={up ? "#16A34A" : "#EF4444"}
      />
      <Text style={[styles.deltaText, { color: up ? "#16A34A" : "#EF4444" }]}>
        {up ? "+" : "-"}
        {pct.toFixed(0)}%
      </Text>
    </View>
  );
}

function StatBox({
  width,
  title,
  icon,
  color,
  value,
  delta,
  subtitle,
}: {
  width: number;
  title: string;
  icon: string;
  color: string;
  value: string | number;
  delta?: number;
  subtitle?: string;
}) {
  return (
    <Card style={[styles.cardLight, { width }]}>
      <Card.Content style={{ gap: 8 }}>
        <View style={styles.statHead}>
          <View style={styles.statIconWrap}>
            <MaterialCommunityIcons
              name={icon as any}
              color={color}
              size={18}
            />
          </View>
          <Text style={styles.statTitle}>{title}</Text>
        </View>

        <View style={styles.rowCenter}>
          <Text style={styles.statValue}>{value}</Text>
          {typeof delta === "number" && <Delta value={delta} />}
        </View>
        {subtitle && <Text style={styles.statSub}>{subtitle}</Text>}
      </Card.Content>
    </Card>
  );
}

function SectionHeader({
  icon,
  title,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <MaterialCommunityIcons
          name={icon as any}
          size={ICON_SIZE}
          color="#7C3AED"
        />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          style={styles.actionPill}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.actionPillText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function Home({ go }: { go: NavTo }) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [plansToday, setPlansToday] = useState<
    { id?: string; customerName: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const { width: winW } = useWindowDimensions();
  const colW = Math.floor((winW - SP * 3) / 2);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const qRef = query(
        collection(db, "visits"),
        orderBy("dateISO", "desc"),
        limit(120)
      );
      const snap = await getDocs(qRef);
      const all: Visit[] = [];
      snap.forEach((d) => {
        const data = d.data() as Omit<Visit, "id">;
        all.push({ ...data, id: d.id });
      });
      setVisits(all.filter((v) => v.userId === USER_ID));

      const plans = await listPlansByDate(todayStr(0), USER_ID);
      setPlansToday(
        plans.map((p) => ({ id: p.id, customerName: p.customerName }))
      );

      setLoading(false);
    })();
  }, []);

  const {
    todayCount,
    yesterdayCount,
    deltaToday,
    todayByTemp,
    conversionToday,
    weekProgress,
    recent,
  } = useMemo(() => {
    const inRange = (v: Visit, from: string, to: string) =>
      v.dateISO >= from && v.dateISO <= to;

    const today = visits.filter((v) =>
      inRange(v, startOfDayISO(0), endOfDayISO(0))
    );
    const yesterday = visits.filter((v) =>
      inRange(v, startOfDayISO(-1), endOfDayISO(-1))
    );

    const byTemp = (arr: Visit[]) =>
      arr.reduce(
        (acc, v) => ((acc[v.temperature] = (acc[v.temperature] || 0) + 1), acc),
        {} as Record<Temperature, number>
      );

    const tBy = byTemp(today) as Record<Temperature, number>;
    const conv = today.length
      ? Math.round(((tBy["menyala"] || 0) / today.length) * 100)
      : 0;

    const delta =
      yesterday.length === 0
        ? today.length > 0
          ? 100
          : 0
        : ((today.length - yesterday.length) / yesterday.length) * 100;

    // progress minggu (target 20)
    const sinceMonday = (() => {
      const d = new Date();
      const day = d.getDay() || 7;
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (day - 1));
      return d;
    })();
    const thisWeek = visits.filter((v) => new Date(v.dateISO) >= sinceMonday);
    const target = 20;
    const progress = Math.min(1, thisWeek.length / target);

    return {
      todayCount: today.length,
      yesterdayCount: yesterday.length,
      deltaToday: delta,
      todayByTemp: {
        menyala: tBy["menyala"] || 0,
        panas: tBy["panas"] || 0,
        hangat: tBy["hangat"] || 0,
        dingin: tBy["dingin"] || 0,
      },
      conversionToday: conv,
      weekProgress: { value: thisWeek.length, target, pct: progress },
      recent: visits.slice(0, 6),
    };
  }, [visits]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header + TopTabs (punya kamu) */}
      <HeaderHero>
        <TopTabs current="home" go={go} />
      </HeaderHero>

      {/* Konten dianimasikan halus */}
      <ScreenShell refreshKey="home">
        <View style={styles.bodyWhite}>
          <ScrollView
            contentContainerStyle={{ padding: SP, gap: SP, paddingBottom: 24 }}
          >
            {/* GRID 2 kolom */}
            <View style={styles.gridWrap}>
              <StatBox
                width={colW}
                title="Kunjungan Hari Ini"
                icon="clipboard-text"
                color="#7C3AED"
                value={loading ? "…" : todayCount}
                delta={loading ? undefined : deltaToday}
                subtitle={`Kemarin: ${yesterdayCount}`}
              />
              <StatBox
                width={colW}
                title="Konversi Menyala"
                icon="lightning-bolt"
                color="#16A34A"
                value={loading ? "…" : `${conversionToday}%`}
                subtitle="dari total visit hari ini"
              />
              <StatBox
                width={colW}
                title="Panas"
                icon="fire"
                color="#F59E0B"
                value={loading ? "…" : todayByTemp.panas}
              />
              <StatBox
                width={colW}
                title="Hangat / Dingin"
                icon="thermometer"
                color="#0EA5E9"
                value={loading ? "…" : todayByTemp.hangat + todayByTemp.dingin}
              />
            </View>

            {/* Progress Mingguan */}
            <Card style={styles.cardLight}>
              <View style={styles.sectionHeaderTight}>
                <Text style={styles.sectionTitle}>Progress Mingguan</Text>
                <Chip
                  compact
                  style={{ backgroundColor: "#F3F0FF" }}
                  textStyle={{ color: "#7C3AED" }}
                >
                  {weekProgress.value}/{weekProgress.target}
                </Chip>
              </View>
              <Card.Content style={{ gap: 8, paddingTop: 0 }}>
                <ProgressBar
                  progress={weekProgress.pct}
                  color="#7C3AED"
                  style={styles.progress}
                />
                <Text style={styles.muted}>
                  Target {weekProgress.target} visit / minggu
                </Text>
              </Card.Content>
            </Card>

            {/* Quick Actions */}
            <Card style={styles.cardLight}>
              <Card.Content>
                <View style={styles.actionsRow}>
                  <Button
                    mode="contained"
                    icon="clipboard-plus"
                    onPress={() => go("visit")}
                    style={styles.actionBtn}
                  >
                    Input Kunjungan
                  </Button>
                  <Button
                    mode="outlined"
                    icon="calendar-plus"
                    onPress={() => go("plan")}
                    style={styles.actionBtn}
                  >
                    Plan Besok
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {/* Rencana Hari Ini */}
            <Card style={styles.cardLight}>
              <SectionHeader
                icon="calendar-today"
                title="Rencana Kunjungan Hari Ini"
                actionLabel="Kelola"
                onAction={() => go("plan")}
              />
              <Divider style={styles.divider} />
              {plansToday.length === 0 ? (
                <Card.Content>
                  <Text style={styles.muted}>
                    Belum ada rencana. Buat di halaman Plan Besok.
                  </Text>
                </Card.Content>
              ) : (
                <Card.Content style={{ paddingVertical: 6 }}>
                  {plansToday.slice(0, 4).map((p) => (
                    <List.Item
                      key={p.id ?? p.customerName}
                      title={p.customerName}
                      titleStyle={styles.listTitle}
                      left={(props) => (
                        <List.Icon
                          {...props}
                          icon="store-outline"
                          color="#7C3AED"
                        />
                      )}
                      right={(props) => (
                        <List.Icon
                          {...props}
                          icon="chevron-right"
                          color="#94A3B8"
                        />
                      )}
                      onPress={() => go("plan")}
                      style={{ paddingVertical: 0 }}
                    />
                  ))}
                </Card.Content>
              )}
            </Card>

            {/* Kunjungan Terbaru */}
            <Card style={styles.cardLight}>
              <SectionHeader
                icon="history"
                title="Kunjungan Terbaru"
                actionLabel="Lihat Semua"
                onAction={() => go("history")}
              />
              <Divider style={styles.divider} />
              {recent.length === 0 ? (
                <Card.Content>
                  <Text style={styles.muted}>
                    Belum ada kunjungan. Mulai dari tombol “Input Kunjungan”.
                  </Text>
                </Card.Content>
              ) : (
                <Card.Content style={{ paddingVertical: 6 }}>
                  {recent.map((v) => (
                    <List.Item
                      key={v.id}
                      title={v.customerName}
                      description={new Date(v.dateISO).toLocaleString("id-ID")}
                      titleStyle={styles.listTitle}
                      descriptionStyle={styles.listDesc}
                      left={() => (
                        <View style={styles.leftIconBox}>
                          <MaterialCommunityIcons
                            name={
                              v.temperature === "menyala"
                                ? "lightning-bolt"
                                : v.temperature === "panas"
                                ? "fire"
                                : "thermometer"
                            }
                            size={20}
                            color={
                              v.temperature === "menyala"
                                ? "#16A34A"
                                : v.temperature === "panas"
                                ? "#F59E0B"
                                : "#0EA5E9"
                            }
                          />
                        </View>
                      )}
                      right={(props) => (
                        <List.Icon
                          {...props}
                          icon="chevron-right"
                          color="#94A3B8"
                        />
                      )}
                      onPress={() => go("history")}
                      style={{ paddingVertical: 0 }}
                    />
                  ))}
                </Card.Content>
              )}
            </Card>
          </ScrollView>
        </View>
      </ScreenShell>
    </View>
  );
}

const styles = StyleSheet.create({
  bodyWhite: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -8,
    paddingTop: 8,
  },

  cardLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5EAF2",
    borderWidth: 1,
    borderRadius: RADIUS,
    overflow: "hidden",
  },

  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SP,
  },

  sectionHeader: {
    height: HEADER_H,
    paddingHorizontal: SP,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  sectionHeaderTight: {
    height: HEADER_H,
    paddingHorizontal: SP,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 6,
    backgroundColor: "#FFFFFF",
  },
  sectionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 16,
    lineHeight: Platform.OS === "android" ? 20 : 19,
    includeFontPadding: false as any,
    textAlignVertical: "center",
  },
  actionPill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#F3F0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  actionPillText: {
    color: "#7C3AED",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.2,
    lineHeight: Platform.OS === "android" ? 16 : 15,
    includeFontPadding: false as any,
    textAlignVertical: "center",
  },

  statHead: { flexDirection: "row", alignItems: "center" },
  statIconWrap: {
    height: 32,
    width: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F0FF",
    marginRight: 10,
  },
  statTitle: { color: "#475569", fontSize: 12 },
  statValue: {
    color: "#0F172A",
    fontWeight: "900",
    fontSize: 22,
    marginRight: 8,
  },
  statSub: { color: "#64748B", fontSize: 12 },
  rowCenter: { flexDirection: "row", alignItems: "center" },

  progress: { height: 8, borderRadius: 999, backgroundColor: "#EEE9FF" },

  listTitle: { color: "#0F172A", fontWeight: "700" },
  listDesc: { color: "#64748B" },
  leftIconBox: { justifyContent: "center", alignItems: "center", width: 40 },

  muted: { color: "#64748B" },
  divider: { opacity: 0.08 },

  actionsRow: { flexDirection: "row", gap: 8 },
  actionBtn: { borderRadius: 999, flex: 1 },

  delta: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  deltaText: {
    marginLeft: 4,
    fontWeight: "700",
    fontSize: 12,
    lineHeight: Platform.OS === "android" ? 14 : 13,
    includeFontPadding: false as any,
  },
});
