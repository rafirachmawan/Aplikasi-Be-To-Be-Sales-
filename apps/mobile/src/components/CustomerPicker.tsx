import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Keyboard,
  GestureResponderEvent,
  ScrollView,
  Text, // ⬅️ tambah Text dari react-native
} from "react-native";
import { List, Divider, TextInput } from "react-native-paper";
import { subscribeCustomersLite } from "../services/db";

type CustomerLite = { id: string; name: string } | null;

type Props = {
  value: CustomerLite;
  onChange: (v: CustomerLite) => void;
  suggestions?: string[];
  onPickSuggestion?: (name: string) => void;
  placeholder?: string;
  userId?: string;
};

export default function CustomerPicker({
  value,
  onChange,
  suggestions = [],
  onPickSuggestion,
  placeholder = "Pilih / cari customer",
  userId = "USER-DEMO",
}: Props) {
  const [q, setQ] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);

  // cegah dropdown ketutup saat tap item (blur sekali diabaikan)
  const ignoreNextBlurRef = useRef(false);

  const [fsNames, setFsNames] = useState<string[]>([]);
  useEffect(() => {
    const unsub = subscribeCustomersLite(
      userId,
      (rows: { id: string; name: string }[]) => {
        const seen = new Set<string>();
        const names: string[] = [];
        for (const r of rows) {
          const n = (r.name || "").trim();
          const k = n.toLowerCase();
          if (n && !seen.has(k)) {
            seen.add(k);
            names.push(n);
          }
        }
        setFsNames((prev) => {
          if (
            prev.length === names.length &&
            prev.every((v, i) => v === names[i])
          )
            return prev;
          return names;
        });
      }
    );
    return unsub;
  }, [userId]);

  useEffect(() => {
    const next = value?.name ?? "";
    setQ((prev) => (prev === next ? prev : next));
  }, [value?.name]);

  const allSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    const push = (n?: string) => {
      const s = (n || "").trim();
      if (!s) return;
      const k = s.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(s);
      }
    };
    fsNames.forEach(push);
    suggestions.forEach(push);
    return out;
  }, [fsNames, suggestions]);

  const filtered = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().trim();
    const nq = norm(q);
    if (!nq) return allSuggestions.slice(0, 50); // batasi 50
    return allSuggestions.filter((s) => norm(s).includes(nq)).slice(0, 50);
  }, [q, allSuggestions]);

  const emit = useCallback(
    (v: CustomerLite) => {
      const same =
        (v === null && value === null) ||
        (v !== null &&
          value !== null &&
          v.id === value.id &&
          v.name.trim() === (value.name || "").trim());
      if (!same) onChange(v);
    },
    [onChange, value]
  );

  const pickName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (onPickSuggestion) onPickSuggestion(trimmed);
      else
        emit({ id: trimmed.toLowerCase().replace(/\s+/g, "-"), name: trimmed });
      setQ(trimmed);
      setOpen(false);
      Keyboard.dismiss();
    },
    [emit, onPickSuggestion]
  );

  const useTypedValue = useCallback(() => {
    const trimmed = q.trim();
    if (!trimmed) return;
    emit({ id: trimmed.toLowerCase().replace(/\s+/g, "-"), name: trimmed });
    setOpen(false);
    Keyboard.dismiss();
  }, [emit, q]);

  const markIgnoreBlur = useCallback((e?: GestureResponderEvent) => {
    ignoreNextBlurRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    if (ignoreNextBlurRef.current) {
      ignoreNextBlurRef.current = false;
      return;
    }
    setOpen(false); // auto-close saat tidak fokus/klik di luar
  }, []);

  const showUseTyped =
    q.trim().length > 0 && !filtered.some((n) => n.trim() === q.trim());

  return (
    <View style={styles.wrap}>
      <TextInput
        mode="outlined"
        value={q}
        onChangeText={(t) => {
          setQ(t);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          if (!open) setOpen(true);
        }}
        onBlur={handleBlur}
        placeholder={placeholder}
        style={styles.input}
        outlineColor="#E9D5FF"
        activeOutlineColor="#7C3AED"
        textColor="#0F172A"
        placeholderTextColor="#64748B"
        left={<TextInput.Icon icon="account-search" />}
        right={
          q ? (
            <TextInput.Icon
              icon="close"
              onPress={() => {
                setQ("");
                if (value !== null) emit(null);
                setOpen(true);
              }}
            />
          ) : (
            <TextInput.Icon icon="account" />
          )
        }
      />

      {open && (
        <View
          style={styles.dropdown}
          onStartShouldSetResponder={() => true}
          onResponderGrant={markIgnoreBlur}
        >
          {/* ====== HEADER DENGAN TOMBOL SILANG (×) ====== */}
          <View style={styles.dropHeader}>
            <Text style={styles.dropTitle}>Master Customer</Text>
            <Pressable
              onPressIn={markIgnoreBlur}
              onPress={() => setOpen(false)}
              hitSlop={10}
              style={styles.closeBtn}
            >
              <Text style={styles.closeTxt}>×</Text>
            </Pressable>
          </View>
          <Divider style={styles.divider} />
          {/* ============================================= */}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={{ maxHeight: 240 }}
          >
            {filtered.length === 0 ? (
              <Pressable onPressIn={markIgnoreBlur} onPress={useTypedValue}>
                <List.Item
                  title={`Gunakan: “${q.trim()}”`}
                  left={(p) => <List.Icon {...p} icon="plus" color="#7C3AED" />}
                  titleStyle={styles.itemTitle}
                  style={styles.itemRow}
                />
              </Pressable>
            ) : (
              <>
                {filtered.map((name, i) => (
                  <View key={`${name}-${i}`}>
                    <Pressable
                      onPressIn={markIgnoreBlur}
                      onPress={() => pickName(name)}
                    >
                      <List.Item
                        title={name}
                        left={(p) => (
                          <List.Icon
                            {...p}
                            icon="store-outline"
                            color="#7C3AED"
                          />
                        )}
                        right={(p) =>
                          value?.name?.trim() === name.trim() ? (
                            <List.Icon
                              {...p}
                              icon="check-bold"
                              color="#7C3AED"
                            />
                          ) : null
                        }
                        titleStyle={styles.itemTitle}
                        style={styles.itemRow}
                      />
                    </Pressable>
                    {i < filtered.length - 1 ? (
                      <Divider style={styles.divider} />
                    ) : null}
                  </View>
                ))}
                {showUseTyped ? (
                  <>
                    <Divider style={styles.divider} />
                    <Pressable
                      onPressIn={markIgnoreBlur}
                      onPress={useTypedValue}
                    >
                      <List.Item
                        title={`Gunakan: “${q.trim()}”`}
                        left={(p) => (
                          <List.Icon {...p} icon="plus" color="#7C3AED" />
                        )}
                        titleStyle={styles.itemTitle}
                        style={styles.itemRow}
                      />
                    </Pressable>
                  </>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", position: "relative" },
  input: { backgroundColor: "#FFFFFF" },
  dropdown: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderColor: "#E9D5FF",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: 240,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  dropHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAF5FF",
  },
  dropTitle: { color: "#0F172A", fontWeight: "800" },
  closeBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  closeTxt: {
    fontSize: 18,
    lineHeight: 18,
    color: "#7C3AED",
    fontWeight: "900",
  },

  itemRow: { height: 44, paddingVertical: 0 },
  itemTitle: { color: "#0F172A", fontWeight: "700", fontSize: 14 },
  divider: { backgroundColor: "#F3E8FF" },
});
