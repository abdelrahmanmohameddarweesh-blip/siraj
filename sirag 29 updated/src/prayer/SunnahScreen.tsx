import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { readJSON, updateJSON } from "../storage/jsonStore";
import { localDay } from "../habits/habitData";
import { logKind } from "../habits/habitLog";
import { PRAYER_AR, PRAYER_IDS, PrayerId } from "../notifications/schedulePlan";
import {
  SUNNAH_KEY,
  SunnahLog,
  setSunnah,
  slotsForPrayer,
  sunnahTotal,
} from "./sunnahModel";
import { usePrayer } from "./PrayerContext";
import { C, F, ar } from "../ui/theme";
export function SunnahOptions({
  prayer,
  date = localDay(),
}: {
  prayer: PrayerId;
  date?: string;
}) {
  const [log, setLog] = useState<SunnahLog>({}),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const { isRestDayToday, todayTimes } = usePrayer();
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setReady(false);
      readJSON<SunnahLog>(SUNNAH_KEY, {})
        .then((v) => {
          if (active) {
            setLog(v);
            setReady(true);
          }
        })
        .catch(() => {
          if (active) setError("تعذّر تحميل سجل السنن. أعد فتح الشاشة.");
        });
      return () => {
        active = false;
      };
    }, [date]),
  );
  const save = async (slot: SUNNAH_SLOTS_TYPE, count: number) => {
    if (busy || !ready) return;
    if (
      date === localDay() &&
      (isRestDayToday || new Date() < todayTimes[prayer])
    ) {
      setError(
        isRestDayToday
          ? "اليوم مستثنى من متابعة الصلاة."
          : "لم يدخل وقت الصلاة بعد.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const next = await updateJSON<SunnahLog>(SUNNAH_KEY, {}, (old) =>
        setSunnah(old, date, slot, count),
      );
      setLog(next);
      await logKind(["sunnah"], sunnahTotal(next, date), "set", date);
    } catch {
      setError("تعذّر حفظ السنّة. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };
  const slots = slotsForPrayer(prayer);
  if (!slots.length) return null;
  return (
    <View style={s.card}>
      <Text style={s.title}>سنن {PRAYER_AR[prayer]} · ماذا صليت؟</Text>
      {slots.map((slot) => (
        <View key={slot.id} style={s.row}>
          <Text style={s.label}>{slot.label}</Text>
          <View style={s.options}>
            {Array.from({ length: slot.max / 2 + 1 }, (_, i) => i * 2).map(
              (n) => (
                <Pressable
                  key={n}
                  disabled={busy || !ready}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: (log[date]?.[slot.id] || 0) === n,
                  }}
                  onPress={() => void save(slot.id, n)}
                  style={[
                    s.chip,
                    (log[date]?.[slot.id] || 0) === n && s.selected,
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      (log[date]?.[slot.id] || 0) === n && { color: "#fff" },
                    ]}
                  >
                    {n ? `${ar(n)} ركعة` : "لم أسجّل"}
                  </Text>
                </Pressable>
              ),
            )}
          </View>
        </View>
      ))}
      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}
type SUNNAH_SLOTS_TYPE = import("./sunnahModel").SunnahSlot;
export default function SunnahScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.head}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={s.label}>رجوع</Text>
        </Pressable>
        <Text style={s.title}>السنن الرواتب</Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 12,
          paddingBottom: insets.bottom + 30,
        }}
      >
        <Text style={s.copy}>
          سجّل كل سنّة قبل الفريضة أو بعدها بصورة مستقلة. لا تُسجّل أي ركعات
          تلقائيًا. هذه متابعة الرواتب الاثنتي عشرة، ولا تشمل كل النوافل.
        </Text>
        {PRAYER_IDS.map((p) => (
          <SunnahOptions key={p} prayer={p} />
        ))}
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  head: { padding: 18, flexDirection: "row", justifyContent: "space-between" },
  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    gap: 10,
  },
  title: { fontFamily: F.b, fontSize: 17, color: C.ink, textAlign: "right" },
  label: { fontFamily: F.s, color: C.ink, textAlign: "right" },
  copy: { fontFamily: F.r, color: C.ink2, lineHeight: 25, textAlign: "right" },
  row: { gap: 7 },
  options: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 44,
    padding: 10,
    borderRadius: 12,
    backgroundColor: C.chip,
    justifyContent: "center",
  },
  selected: { backgroundColor: C.green },
  chipText: { fontFamily: F.m, color: C.ink, fontSize: 12 },
  error: { fontFamily: F.r, color: C.bad, textAlign: "right" },
});
