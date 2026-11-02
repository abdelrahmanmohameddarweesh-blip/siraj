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
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false),
    [saved, setSaved] = useState(false);
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
            setDirty(false);
            setSaved(false);
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
  const save = async () => {
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
        slotsForPrayer(prayer).reduce(
          (next, slot) =>
            setSunnah(next, date, slot.id, log[date]?.[slot.id] || 0),
          old,
        ),
      );
      setLog(next);
      await logKind(["sunnah"], sunnahTotal(next, date), "set", date);
      setDirty(false);
      setSaved(true);
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
                  onPress={() => {
                    setLog((old) => setSunnah(old, date, slot.id, n));
                    setDirty(true);
                    setSaved(false);
                    setError("");
                  }}
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`حفظ سنن ${PRAYER_AR[prayer]}`}
        disabled={busy || !ready || !dirty}
        onPress={() => void save()}
        style={[s.save, (!dirty || busy) && { opacity: 0.55 }]}
      >
        <Text style={s.saveText}>
          {busy ? "جارٍ الحفظ…" : `حفظ سنن ${PRAYER_AR[prayer]}`}
        </Text>
      </Pressable>
      {saved && (
        <Text accessibilityLiveRegion="polite" style={s.copy}>
          ✓ تم حفظ سنن {PRAYER_AR[prayer]}، ويمكنك تسجيل الباقي لاحقًا.
        </Text>
      )}
      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

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
          اختر الركعات ثم اضغط حفظ أسفل الصلاة. يمكنك حفظ سنن صلاة واحدة دون
          إكمال باقي اليوم. لا تُسجّل أي ركعات تلقائيًا. هذه متابعة الرواتب
          الاثنتي عشرة، ولا تشمل كل النوافل.
        </Text>
        {PRAYER_IDS.map((p) => (
          <SunnahOptions key={p} prayer={p} />
        ))}
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  save: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  saveText: { fontFamily: F.s, color: "#fff", textAlign: "center" },
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
