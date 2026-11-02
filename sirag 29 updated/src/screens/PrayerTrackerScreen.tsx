import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePrayer } from "../prayer/PrayerContext";
import {
  PrayerCheckinSheet,
  describeCheckin,
} from "../components/prayer/PrayerCheckinSheet";
import { PRAYER_IDS, PRAYER_AR, PrayerId } from "../notifications/schedulePlan";
import { formatPrayerClock } from "../prayer/prayerTimesService";
import { C, F, ar } from "../ui/theme";

/** Daily recording has one purpose; timing and reminder preferences live in PrayerReminders. */
export default function PrayerTrackerScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const {
    todayTimes,
    rollingWeek,
    checkins,
    isFemale,
    isRestDayToday,
    toggleRestDay,
    location,
  } = usePrayer();
  const [prayer, setPrayer] = useState<PrayerId | null>(null);
  const [date, setDate] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);
  useEffect(() => {
    const id = route?.params?.checkin;
    if (PRAYER_IDS.includes(id)) {
      setPrayer(id);
      setDate(route.params.date);
      navigation.setParams({ checkin: undefined, date: undefined });
    }
  }, [route?.params?.checkin, navigation]);
  const completed = PRAYER_IDS.filter((p) =>
    ["on_time", "late", "qada"].includes(
      checkins[`${p}_${todayTimes.dateStr}`]?.status,
    ),
  ).length;
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={s.smallButton}
        >
          <Text style={s.link}>رجوع</Text>
        </Pressable>
        <Text accessibilityRole="header" style={s.title}>
          صلواتي اليوم
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 18,
          gap: 14,
          paddingBottom: insets.bottom + 30,
        }}
      >
        <View style={s.hero}>
          <Text style={s.heroLabel}>كل صلاة، خطوة من نور</Text>
          <Text style={s.heroTitle}>
            {isRestDayToday
              ? "يومك مستثنى من متابعة الصلاة"
              : `${ar(completed)} من ٥ صلوات مسجّلة`}
          </Text>
          <Text style={s.heroCopy}>
            سجّل ما صليته بالفعل. يمكنك تسجيل كل صلاة وسننها بصورة مستقلة.
          </Text>
        </View>
        <View style={s.settings}>
          <Text style={s.copy}>
            المواقيت حسب {location.cityNameAr || "موقعك"}. هذه الصفحة لتسجيل
            الصلاة؛ رفيق صلاتك لضبط الموقع والمواقيت والتنبيهات.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("PrayerReminders")}
            style={s.secondary}
          >
            <Text style={s.link}>ضبط المواقيت والتذكيرات ←</Text>
          </Pressable>
        </View>
        {PRAYER_IDS.map((p) => {
          const r = checkins[`${p}_${todayTimes.dateStr}`],
            done = r && ["on_time", "late", "qada"].includes(r.status);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`تسجيل صلاة ${PRAYER_AR[p]}`}
              key={p}
              disabled={isRestDayToday}
              onPress={() => {
                setDate(undefined);
                setPrayer(p);
              }}
              style={[s.card, done && s.done]}
            >
              <View style={s.row}>
                <Text style={s.time}>
                  {formatPrayerClock(todayTimes[p], "ar")}
                </Text>
                <Text style={s.prayer}>{PRAYER_AR[p]}</Text>
              </View>
              <Text style={s.copy}>
                {isRestDayToday
                  ? "مستثناة اليوم"
                  : done
                    ? `✓ ${describeCheckin(r)}`
                    : "لم تُسجّل بعد"}
              </Text>
              {!isRestDayToday && (
                <Text style={s.link}>
                  {done ? "مراجعة التسجيل ←" : "سجّل صلاتك ←"}
                </Text>
              )}
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("Sunnah")}
          style={s.secondary}
        >
          <Text style={s.link}>السنن الرواتب · سجّل قبل الصلاة وبعدها ←</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: weekOpen }}
          onPress={() => setWeekOpen((v) => !v)}
          style={s.secondary}
        >
          <Text style={s.link}>
            {weekOpen ? "إخفاء مواقيت الأسبوع" : "عرض مواقيت الأسبوع القادم"}
          </Text>
        </Pressable>
        {weekOpen &&
          rollingWeek.map((day) => (
            <View key={day.dateStr} style={s.card}>
              <Text style={s.prayer}>
                {new Date(day.dateStr + "T12:00:00").toLocaleDateString(
                  "ar-EG",
                  { weekday: "long", day: "numeric", month: "long" },
                )}
              </Text>
              {PRAYER_IDS.map((p) => (
                <View key={p} style={s.row}>
                  <Text style={s.time}>{formatPrayerClock(day[p], "ar")}</Text>
                  <Text style={s.copy}>{PRAYER_AR[p]}</Text>
                </View>
              ))}
            </View>
          ))}
        {isFemale && (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              try {
                await toggleRestDay();
                setError("");
              } catch {
                setError("تعذّر تحديث العذر اليوم. حاولي مرة أخرى.");
              } finally {
                setBusy(false);
              }
            }}
            style={s.rest}
          >
            <Text style={s.link}>
              {isRestDayToday
                ? "إلغاء العذر الشرعي اليوم"
                : "اليوم عذر شرعي · إيقاف متابعة الصلاة"}
            </Text>
          </Pressable>
        )}
        {!!error && <Text style={s.error}>{error}</Text>}
      </ScrollView>
      <PrayerCheckinSheet
        visible={!!prayer}
        prayer={prayer || "fajr"}
        date={date}
        onClose={() => setPrayer(null)}
      />
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallButton: { minHeight: 44, justifyContent: "center", padding: 8 },
  title: { fontFamily: F.b, fontSize: 24, color: C.ink },
  hero: { padding: 22, backgroundColor: C.green, borderRadius: 24, gap: 9 },
  heroLabel: { fontFamily: F.m, color: "#EAD9B4", textAlign: "right" },
  heroTitle: {
    fontFamily: F.b,
    color: "#FFF9EB",
    fontSize: 23,
    textAlign: "right",
    lineHeight: 36,
  },
  heroCopy: {
    fontFamily: F.r,
    color: "#E5EEE5",
    lineHeight: 25,
    textAlign: "right",
  },
  settings: { gap: 10 },
  copy: { fontFamily: F.r, color: C.ink2, lineHeight: 25, textAlign: "right" },
  card: {
    padding: 18,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 19,
    backgroundColor: C.card,
    gap: 8,
  },
  done: { borderColor: "#9EBA9F", backgroundColor: "#EFF4E9" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prayer: { fontFamily: F.b, color: C.ink, fontSize: 21 },
  time: { fontFamily: F.m, color: C.ink2, fontSize: 16 },
  link: { fontFamily: F.s, color: C.green, textAlign: "right", lineHeight: 24 },
  secondary: {
    padding: 15,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: C.chip,
  },
  rest: {
    padding: 18,
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: "#EEDFE2",
  },
  error: { color: C.bad, fontFamily: F.r, textAlign: "right" },
});
