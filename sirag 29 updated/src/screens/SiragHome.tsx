import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppState,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Circle } from "react-native-svg";
import { AppearancePreference, useTheme } from "../contexts/ThemeContext";
import { homePalettes, HomePalette } from "../design/homeTheme";
import { BottomDock, IconName, SirajIcon } from "../design/SirajUI";
import { F, ar } from "../ui/theme";
import { HabitPlan, LOG_KEY, localDay } from "../habits/habitData";
import { effectiveTarget } from "../habits/library";
import { loadProfile } from "../profile/profileStore";
import { reconcileHabitProgress } from "../tracking/reconcileHabits";
import { loadReportSources } from "../reports/reportStore";
import { ReportSources } from "../reports/reportModel";
import { useHomePrayerTimes } from "../prayer/useHomePrayerTimes";
import { usePrayer } from "../prayer/PrayerContext";
import {
  calculatePrayerTimes,
  getCurrentPrayerWindow,
} from "../prayer/prayerTimesService";
import { PRAYER_AR, PRAYER_IDS } from "../notifications/schedulePlan";
import { syncNotificationsSoon } from "../notifications/scheduler";
import { updateJSON } from "../storage/jsonStore";
import type { CalculationMethodName } from "../prayer/types";

const METHODS: [CalculationMethodName, string][] = [
  ["Egyptian", "الهيئة المصرية"],
  ["UmmAlQura", "أم القرى"],
  ["MuslimWorldLeague", "رابطة العالم الإسلامي"],
  ["NorthAmerica", "أمريكا الشمالية"],
  ["Karachi", "كراتشي"],
  ["Dubai", "دبي"],
  ["Qatar", "قطر"],
  ["Kuwait", "الكويت"],
];
// Artwork is decorative; every label, counter and control below is rendered by the app.
const SCENES = {
  dark: require("../../assets/design/home-night.png"),
  light: require("../../assets/design/home-dawn.png"),
};
function habitDestination(
  p: HabitPlan,
): { screen: string; params?: object } | null {
  if (p.kind === "prayers" || p.id === "prayer" || p.id === "fajr")
    return { screen: "PrayerTracker" };
  if (p.kind === "quran_read" || p.id === "quran" || p.id === "quran_listen")
    return { screen: "QuranReader" };
  if (p.kind === "adhkar_morning" || p.id === "morning_adhkar")
    return { screen: "Adhkar", params: { session: "morning" } };
  if (p.kind === "adhkar_evening" || p.id === "evening_adhkar")
    return { screen: "Adhkar", params: { session: "evening" } };
  if (
    p.kind === "hifz" ||
    p.kind === "hifz_review" ||
    p.id === "quran_memorize" ||
    p.id === "quran_review"
  )
    return { screen: "Hifz" };
  return null;
}
export default function SiragHome({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme, appearance, setAppearance } = useTheme();
  const palette = homePalettes[theme];
  const s = useMemo(() => styles(palette), [palette]);
  const night = theme === "dark";
  const prayer = useHomePrayerTimes();
  const { checkins } = usePrayer();
  const [now, setNow] = useState(Date.now());
  const day = localDay(new Date(now));
  const [sources, setSources] = useState<ReportSources | null>(null);
  const [name, setName] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"appearance" | "city" | "habit" | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<HabitPlan | null>(null);
  const [amount, setAmount] = useState("1");
  const [entryMode, setEntryMode] = useState<"add" | "set">("add");
  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      await reconcileHabitProgress();
      const [data, profile] = await Promise.all([
        loadReportSources([day]),
        loadProfile(),
      ]);
      setSources(data);
      setName(profile?.name || "");
      setError("");
    } catch {
      setError("تعذّر تحديث السجل. اسحب لأسفل لإعادة المحاولة.");
    } finally {
      setRefreshing(false);
    }
  }, [day]);
  useFocusEffect(
    useCallback(() => {
      void load();
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          setNow(Date.now());
          void load();
        }
      });
      return () => sub.remove();
    }, [load]),
  );
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  const plans = sources?.plans || [];
  const daily = plans.filter(
    (p) =>
      p.frequency === "daily" || new Date(day + "T12:00:00").getDay() === 5,
  );
  const logs = sources?.logs[day] || {};
  const done = daily.filter(
    (p) => (logs[p.id] || 0) >= effectiveTarget(p, day),
  ).length;
  const window = getCurrentPrayerWindow(prayer.times, new Date(now));
  const yesterdayIsha = useMemo(() => {
    const d = new Date(day + "T12:00:00");
    d.setDate(d.getDate() - 1);
    return calculatePrayerTimes(
      prayer.location,
      d,
      prayer.method,
      prayer.madhab,
    ).isha.getTime();
  }, [day, prayer.location, prayer.method, prayer.madhab]);
  const previousTime =
    PRAYER_IDS.map((p) => prayer.times[p].getTime())
      .filter((t) => t <= now)
      .pop() ?? yesterdayIsha;
  const elapsedFraction = Math.max(
    0,
    Math.min(
      1,
      (now - previousTime) / (window.nextPrayerTime.getTime() - previousTime),
    ),
  );
  const ringLength = 2 * Math.PI * 34;
  const minutes = Math.max(
    0,
    Math.ceil((window.nextPrayerTime.getTime() - now) / 60000),
  );
  const clock =
    ar(Math.floor(minutes / 60)) + ":" + ar(minutes % 60).padStart(2, "٠");
  const session = new Date(now) >= prayer.times.asr ? "evening" : "morning";
  const dhikrDone = !!sources?.athkar[day]?.[session]?.done;
  const pages = new Set(sources?.readDays[day] || []).size;
  const fmt = (d: Date) =>
    d.toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" });
  const open = (screen: string, params?: object) =>
    navigation.navigate(screen, params);
  async function changeAppearance(value: AppearancePreference) {
    if (busy) return;
    setBusy(true);
    try {
      await setAppearance(value);
    } catch {
      Alert.alert("تعذّر الحفظ", "حاول اختيار المظهر مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }
  async function saveHabit() {
    if (!selectedPlan || busy) return;
    const increment = Number(
      amount
        .trim()
        .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
        .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0)),
    );
    if (
      !amount.trim() ||
      !Number.isInteger(increment) ||
      increment < (entryMode === "add" ? 1 : 0) ||
      increment > 10000
    ) {
      Alert.alert("العدد", "أدخل عددًا صحيحًا صالحًا حتى ١٠٠٠٠.");
      return;
    }
    setBusy(true);
    try {
      await updateJSON<Record<string, Record<string, number>>>(
        LOG_KEY,
        {},
        (previous) => ({
          ...previous,
          [day]: {
            ...(previous[day] || {}),
            [selectedPlan.id]:
              entryMode === "set"
                ? increment
                : (previous[day]?.[selectedPlan.id] || 0) + increment,
          },
        }),
      );
      syncNotificationsSoon();
      setModal(null);
      await load();
    } catch {
      Alert.alert("تعذّر الحفظ", "لم نتمكن من حفظ التقدم. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }
  function openHabit(p: HabitPlan) {
    const route = habitDestination(p);
    if (route) open(route.screen, route.params);
    else {
      setSelectedPlan(p);
      setEntryMode("add");
      setAmount("1");
      setModal("habit");
    }
  }
  const date = new Date(now).toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <View style={s.root}>
      <StatusBar barStyle={night ? "light-content" : "dark-content"} />
      <ScrollView
        key={theme}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={load}
            tintColor={palette.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 112 + insets.bottom }}
      >
        <ImageBackground
          source={SCENES[theme]}
          style={[s.hero, { paddingTop: insets.top + 12 }]}
          imageStyle={{ opacity: night ? 0.94 : 1 }}
          resizeMode="cover"
        >
          <LinearGradient
            pointerEvents="none"
            colors={[
              night ? "rgba(3,20,23,.2)" : "rgba(255,249,232,.35)",
              palette.heroFade,
              palette.background,
            ]}
            locations={[0, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.topbar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تنبيهات الصلاة"
              onPress={() => open("PrayerReminders")}
              style={s.iconButton}
            >
              <SirajIcon name="bell" color={palette.accent} />
            </Pressable>
            <Text accessibilityRole="header" style={s.brand}>
              سراج
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="المظهر والملف الشخصي"
              onPress={() => setModal("appearance")}
              style={s.iconButton}
            >
              <SirajIcon name="user" color={palette.text} />
            </Pressable>
          </View>
          <Text style={s.greeting} numberOfLines={1} ellipsizeMode="tail">
            {name ? `مرحبًا ${name}` : "أهلًا بك في سراج"}
          </Text>
          <Text style={s.blessing}>ليكن في يومك نورٌ وأثر</Text>
          <Text style={s.date}>{date}</Text>
        </ImageBackground>
        <View style={s.body}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="الصلاة القادمة، افتح متتبع الصلاة"
            onPress={() => open("PrayerTracker")}
            style={({ pressed }) => [
              s.prayerCard,
              pressed && { opacity: 0.88 },
            ]}
          >
            <LinearGradient
              colors={night ? ["#16443D", "#0C2D2C"] : ["#FFFCF5", "#ECE6D6"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.countdown}>
              <Svg width={78} height={78} viewBox="0 0 78 78">
                <Circle
                  cx={39}
                  cy={39}
                  r={34}
                  fill="none"
                  stroke={palette.track}
                  strokeWidth={3}
                />
                <Circle
                  cx={39}
                  cy={39}
                  r={34}
                  fill="none"
                  stroke={palette.accent}
                  strokeWidth={3}
                  strokeDasharray={`${ringLength} ${ringLength}`}
                  strokeDashoffset={ringLength * (1 - elapsedFraction)}
                  rotation={-90}
                  origin="39,39"
                />
              </Svg>
              <View style={s.countdownText}>
                <Text style={s.countdownValue}>{clock}</Text>
                <Text style={s.countdownCaption}>متبقي</Text>
              </View>
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={s.eyebrow}>الصلاة القادمة</Text>
              <Text style={s.prayerName}>{PRAYER_AR[window.nextPrayer]}</Text>
              <Text style={s.prayerTime}>{fmt(window.nextPrayerTime)}</Text>
            </View>
            <View style={s.mosque}>
              <SirajIcon name="mosque" size={57} color={palette.accent} />
            </View>
          </Pressable>
          <View style={s.prayerStrip}>
            {PRAYER_IDS.map((p, index) => {
              const next = p === window.nextPrayer;
              const recorded = ["on_time", "late", "qada"].includes(
                checkins[`${p}_${day}`]?.status || "",
              );
              return (
                <Pressable
                  key={p}
                  accessibilityRole="button"
                  accessibilityLabel={`صلاة ${PRAYER_AR[p]}`}
                  onPress={() => open("PrayerTracker")}
                  style={[
                    s.prayerItem,
                    next && { backgroundColor: palette.soft },
                  ]}
                >
                  <SirajIcon
                    name={recorded ? "check" : index === 4 ? "moon" : "sun"}
                    size={21}
                    color={next ? palette.accent : palette.secondary}
                  />
                  <Text
                    style={[s.prayerLabel, next && { color: palette.text }]}
                  >
                    {PRAYER_AR[p]}
                  </Text>
                  <Text style={s.prayerSmall}>{fmt(prayer.times[p])}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="تغيير المدينة وطريقة حساب الصلاة"
            onPress={() => {
              setSearch("");
              setModal("city");
            }}
            style={s.location}
          >
            <SirajIcon name="pin" size={13} color={palette.muted} />
            <Text style={s.locationText}>
              {prayer.location.cityNameAr} ·{" "}
              {METHODS.find(([id]) => id === prayer.method)?.[1]}
            </Text>
            <Text style={s.locationText}>⌄</Text>
          </Pressable>
          {!!error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}
          <View style={s.shortcuts}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="القرآن الكريم، اقرأ واستمع"
              onPress={() => open("QuranReader")}
              style={({ pressed }) => [
                s.shortcut,
                pressed && { opacity: 0.82 },
              ]}
            >
              <ImageBackground
                source={require("../../assets/design/quran-card.png")}
                style={[
                  StyleSheet.absoluteFill,
                  { width: "100%", height: "100%" },
                ]}
                imageStyle={{ opacity: night ? 0.72 : 1 }}
              />
              <LinearGradient
                colors={["transparent", night ? "#0D2B2AF2" : "#FFFCF5F2"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ height: 79 }} />
              <View style={s.shortcutBottom}>
                <View>
                  <Text style={s.shortcutTitle}>القرآن الكريم</Text>
                  <Text style={s.shortcutMeta}>
                    {pages
                      ? `${ar(pages)} صفحات قرأتها اليوم`
                      : "تلاوة تطمئنّ بها روحك"}
                  </Text>
                </View>
                <SirajIcon name="arrow" size={18} color={palette.accent} />
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                session === "morning" ? "أذكار الصباح" : "أذكار المساء"
              }
              onPress={() => open("Adhkar", { session })}
              style={({ pressed }) => [
                s.shortcut,
                pressed && { opacity: 0.82 },
              ]}
            >
              <ImageBackground
                source={require("../../assets/design/athkar-card.png")}
                style={[
                  StyleSheet.absoluteFill,
                  { width: "100%", height: "100%" },
                ]}
                imageStyle={{ opacity: night ? 0.72 : 1 }}
              />
              <LinearGradient
                colors={["transparent", night ? "#0D2B2AF2" : "#FFFCF5F2"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ height: 79 }} />
              <View style={s.shortcutBottom}>
                <View>
                  <Text style={s.shortcutTitle}>الأذكار</Text>
                  <Text style={s.shortcutMeta}>
                    {dhikrDone
                      ? "أتممت أذكارك اليوم ✓"
                      : session === "morning"
                        ? "ابدأ صباحك بذكره"
                        : "سكينةٌ لختام يومك"}
                  </Text>
                </View>
                <SirajIcon name="arrow" size={18} color={palette.accent} />
              </View>
            </Pressable>
          </View>
          <View style={s.habits}>
            <View style={s.sectionRow}>
              <View>
                <Text style={s.sectionTitle}>عاداتي اليومية</Text>
                <Text style={s.sectionCaption}>خطوات صغيرة، وأثرٌ يكبر</Text>
              </View>
              <Text style={s.completed}>
                {ar(done)} / {ar(daily.length)} مكتملة
              </Text>
            </View>
            <View style={s.progress}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${daily.length ? (100 * done) / daily.length : 0}%`,
                  },
                ]}
              />
            </View>
            {daily.length === 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => open("HabitSetup", { first: false })}
                style={s.empty}
              >
                <SirajIcon name="plus" size={26} color={palette.accent} />
                <Text style={s.emptyTitle}>رحلتك تبدأ بعادة</Text>
                <Text style={s.sectionCaption}>
                  اختر عادة تناسب يومك، وسنتابعها معك.
                </Text>
                <Text style={s.textLink}>اختر أول عادة ←</Text>
              </Pressable>
            ) : (
              daily.map((p) => {
                const target = effectiveTarget(p, day);
                const value = logs[p.id] || 0;
                const complete = value >= target;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={p.title}
                    key={p.id}
                    onPress={() => openHabit(p)}
                    style={s.habitRow}
                  >
                    <View
                      style={[
                        s.check,
                        complete && {
                          backgroundColor: palette.positive,
                          borderColor: palette.positive,
                        },
                      ]}
                    >
                      {complete && (
                        <SirajIcon
                          name="check"
                          size={14}
                          color={night ? "#143A2C" : "#fff"}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.habitName}>{p.title}</Text>
                      <Text style={s.habitDetail}>
                        {ar(Math.round(value * 100) / 100)} من {ar(target)}{" "}
                        {p.unit}
                      </Text>
                    </View>
                    <SirajIcon
                      name={
                        p.category === "الصلاة"
                          ? "mosque"
                          : p.category === "القرآن"
                            ? "book"
                            : "spark"
                      }
                      size={20}
                      color={palette.accent}
                    />
                  </Pressable>
                );
              })
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => open("HabitSetup", { first: false })}
              style={s.addHabit}
            >
              <SirajIcon name="plus" size={15} color={palette.accent} />
              <Text style={s.textLink}>إضافة عادة</Text>
            </Pressable>
          </View>
          <View style={s.tools}>
            {(
              [
                ["mosque", "صلواتي", "PrayerTracker"],
                ["book", "الحفظ والمراجعة", "Hifz"],
                ["chart", "إحصائياتي", "Insights"],
              ] as [IconName, string, string][]
            ).map(([icon, label, screen]) => (
              <Pressable
                key={screen}
                accessibilityRole="button"
                onPress={() => open(screen)}
                style={s.tool}
              >
                <View style={s.toolIcon}>
                  <SirajIcon name={icon} color={palette.accent} />
                </View>
                <Text style={s.toolText}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="صحبة · رحلتك أجمل مع صحبة"
            onPress={() => open("Sohba")}
            style={{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 24, padding: 24, gap: 12, marginTop: 20 }}
          >
            <Text style={{ fontFamily: "PlexMedium", color: palette.accent, textAlign: "right", fontSize: 12 }}>صحبة · عادات تجمعنا</Text>
            <Text style={{ fontFamily: "Ruqaa", color: palette.text, textAlign: "right", fontSize: 30 }}>رحلتك أجمل مع صحبة</Text>
            <Text style={{ fontFamily: "Plex", color: palette.secondary, textAlign: "right", lineHeight: 24 }}>اختر عادتك ومدتك وخصوصيتك. ابدأ صحبة مع أهلك وأصدقائك أو انضم برمز دعوتهم، دون بريد إلكتروني.</Text>
            <Text style={{ fontFamily: "PlexBold", color: palette.accent, textAlign: "right" }}>ابدأ صحبتك أو انضم لرفاقك ←</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ادخل واحتك"
            onPress={() => open("Oasis")}
            style={s.oasisCard}
          >
            <ImageBackground
              source={SCENES[theme]}
              resizeMode="cover"
              style={[
                StyleSheet.absoluteFill,
                { width: "100%", height: "100%" },
              ]}
            />
            <LinearGradient
              colors={
                night
                  ? ["rgba(5,26,27,.15)", "rgba(5,26,27,.94)"]
                  : ["rgba(255,249,230,.1)", "rgba(248,244,234,.95)"]
              }
              style={StyleSheet.absoluteFill}
            />
            <View style={s.oasisCopy}>
              <Text style={s.sectionTitle}>واحتك تنمو بخيرك</Text>
              <Text style={s.sectionCaption}>كل عمل طيب يترك أثرًا</Text>
            </View>
            <View style={s.oasisAction}>
              <SirajIcon name="arrow" color={palette.accent} />
            </View>
          </Pressable>
          <Text style={s.footer}>سراج · نورٌ ينمو معك</Text>
        </View>
      </ScrollView>
      <BottomDock
        navigation={navigation}
        active="Home"
        bottom={insets.bottom}
      />
      <Modal
        visible={modal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!busy) setModal(null);
        }}
      >
        <KeyboardAvoidingView
          style={s.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="إغلاق النافذة"
            style={StyleSheet.absoluteFill}
            onPress={() => !busy && setModal(null)}
          />
          <View style={[s.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={s.sheetHandle} />
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>
                {modal === "appearance"
                  ? "على ذوقك"
                  : modal === "city"
                    ? "مواقيت مدينتك"
                    : "سجّل تقدمك"}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setModal(null)}
                disabled={busy}
              >
                <Text style={s.textLink}>إغلاق</Text>
              </Pressable>
            </View>
            {modal === "appearance" && (
              <>
                <Text style={s.sheetLabel}>المظهر</Text>
                <View style={s.themeOptions}>
                  {(
                    [
                      ["dark", "moon", "ليلي"],
                      ["light", "sun", "نهاري"],
                      ["system", "spark", "حسب الجهاز"],
                    ] as [AppearancePreference, IconName, string][]
                  ).map(([value, icon, label]) => (
                    <Pressable
                      accessibilityRole="radio"
                      aria-checked={appearance === value}
                      accessibilityLabel={label}
                      accessibilityState={{
                        checked: appearance === value,
                        disabled: busy,
                      }}
                      disabled={busy}
                      onPress={() => void changeAppearance(value)}
                      key={value}
                      style={[
                        s.themeOption,
                        appearance === value && {
                          borderColor: palette.accent,
                          backgroundColor: palette.soft,
                        },
                      ]}
                    >
                      <SirajIcon name={icon} color={palette.accent} />
                      <Text style={s.toolText}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  accessibilityRole="button"
                  style={s.sheetButton}
                  onPress={() => {
                    setModal(null);
                    open("ProfileSetup", { edit: true });
                  }}
                >
                  <SirajIcon name="user" color={palette.accent} />
                  <Text style={s.habitName}>تعديل الاسم والملف الشخصي</Text>
                  <SirajIcon name="arrow" color={palette.accent} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={s.sheetButton}
                  onPress={() => {
                    setModal(null);
                    open("PrayerReminders");
                  }}
                >
                  <SirajIcon name="bell" color={palette.accent} />
                  <Text style={s.habitName}>تنبيهات الصلاة</Text>
                  <SirajIcon name="arrow" color={palette.accent} />
                </Pressable>
              </>
            )}
            {modal === "city" && (
              <>
                <TextInput
                  accessibilityLabel="ابحث عن مدينة"
                  value={search}
                  onChangeText={setSearch}
                  placeholder="ابحث عن مدينة…"
                  placeholderTextColor={palette.muted}
                  style={s.input}
                  textAlign="right"
                />
                <ScrollView
                  style={{ maxHeight: 220 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {prayer.cities
                    .filter((c) =>
                      (c.cityNameAr + c.cityNameEn + c.countryNameAr)
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((c) => (
                      <Pressable
                        accessibilityRole="button"
                        disabled={busy}
                        key={c.id}
                        style={s.sheetButton}
                        onPress={async () => {
                          setBusy(true);
                          try {
                            await prayer.setCity(c.id);
                            setModal(null);
                          } catch {
                            Alert.alert("تعذّر الحفظ", "حاول مرة أخرى.");
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        <Text style={s.habitName}>
                          {c.cityNameAr} · {c.countryNameAr}
                        </Text>
                      </Pressable>
                    ))}
                </ScrollView>
                <Text style={s.sheetLabel}>طريقة الحساب</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {METHODS.map(([id, label]) => (
                    <Pressable
                      disabled={busy}
                      key={id}
                      style={[
                        s.methodChip,
                        prayer.method === id && { borderColor: palette.accent },
                      ]}
                      onPress={async () => {
                        setBusy(true);
                        try {
                          await prayer.changeMethod(id);
                        } catch {
                          Alert.alert("تعذّر الحفظ", "حاول مرة أخرى.");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      <Text style={s.toolText}>{label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Pressable
                  disabled={busy}
                  style={s.primaryButton}
                  onPress={async () => {
                    setBusy(true);
                    try {
                      const ok = await prayer.detect();
                      if (ok) setModal(null);
                      else
                        Alert.alert(
                          "الموقع",
                          "اسمح بالموقع من إعدادات الجهاز، أو اختر مدينتك من القائمة.",
                        );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Text style={s.primaryText}>استخدم موقعي الحالي</Text>
                </Pressable>
              </>
            )}
            {modal === "habit" && selectedPlan && (
              <>
                <Text style={s.sheetLabel}>
                  {selectedPlan.title} · سجل اليوم
                </Text>
                <View style={s.themeOptions}>
                  {(["add", "set"] as const).map((mode) => (
                    <Pressable
                      key={mode}
                      accessibilityRole="radio"
                      aria-checked={entryMode === mode}
                      accessibilityState={{ checked: entryMode === mode }}
                      onPress={() => {
                        setEntryMode(mode);
                        setAmount(
                          mode === "set"
                            ? String(logs[selectedPlan.id] || 0)
                            : "1",
                        );
                      }}
                      style={[
                        s.methodChip,
                        { flex: 1 },
                        entryMode === mode && { borderColor: palette.accent },
                      ]}
                    >
                      <Text style={s.toolText}>
                        {mode === "add" ? "إضافة عدد" : "تصحيح الإجمالي"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  accessibilityLabel="العدد المراد تسجيله"
                  style={s.input}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  textAlign="right"
                />
                <Pressable
                  disabled={busy}
                  accessibilityRole="button"
                  style={s.primaryButton}
                  onPress={() => void saveHabit()}
                >
                  <Text style={s.primaryText}>
                    {busy ? "جارٍ الحفظ…" : "حفظ التقدم"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
function styles(p: HomePalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: p.background },
    hero: { height: 290, width: "100%", maxWidth: 680, alignSelf: "center" },
    topbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      height: 68,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.glass,
      alignItems: "center",
      justifyContent: "center",
    },
    brand: {
      fontFamily: "Ruqaa",
      fontSize: 49,
      lineHeight: 70,
      color: p.accent,
      paddingHorizontal: 8,
    },
    greeting: {
      fontFamily: F.b,
      color: p.text,
      fontSize: 23,
      textAlign: "center",
      marginTop: 12,
    },
    blessing: {
      fontFamily: F.r,
      fontSize: 12,
      color: p.secondary,
      textAlign: "center",
      marginTop: 3,
    },
    date: {
      fontFamily: F.r,
      color: p.secondary,
      fontSize: 10,
      textAlign: "center",
      marginTop: 7,
    },
    body: {
      width: "100%",
      maxWidth: 680,
      alignSelf: "center",
      paddingHorizontal: 18,
      gap: 12,
      marginTop: -53,
    },
    prayerCard: {
      minHeight: 122,
      flexDirection: "row",
      alignItems: "center",
      gap: 15,
      borderRadius: 23,
      padding: 19,
      borderWidth: 1,
      borderColor: p.border,
      overflow: "hidden",
    },
    countdown: { width: 78, height: 78 },
    countdownText: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    countdownValue: { fontFamily: F.s, fontSize: 19, color: p.text },
    countdownCaption: { fontFamily: F.r, fontSize: 10, color: p.secondary },
    eyebrow: { fontFamily: F.m, fontSize: 11, color: p.secondary },
    prayerName: {
      fontFamily: F.b,
      fontSize: 29,
      lineHeight: 42,
      color: p.text,
    },
    prayerTime: { fontFamily: F.r, fontSize: 14, color: p.text },
    mosque: { width: 53, opacity: 0.6, alignItems: "center" },
    prayerStrip: {
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 20,
      padding: 5,
      flexDirection: "row-reverse",
    },
    prayerItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 15,
      gap: 5,
    },
    prayerLabel: { fontFamily: F.m, fontSize: 11, color: p.secondary },
    prayerSmall: { fontFamily: F.r, fontSize: 10, color: p.secondary },
    location: {
      flexDirection: "row-reverse",
      justifyContent: "center",
      alignItems: "center",
      gap: 5,
      paddingVertical: 2,
    },
    locationText: { fontFamily: F.r, fontSize: 10, color: p.muted },
    shortcuts: { flexDirection: "row-reverse", gap: 12 },
    shortcut: {
      flex: 1,
      minHeight: 132,
      borderRadius: 19,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: p.border,
    },
    shortcutBottom: {
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingBottom: 12,
      gap: 4,
    },
    shortcutTitle: {
      fontFamily: F.b,
      fontSize: 16,
      color: p.text,
      textAlign: "right",
    },
    shortcutMeta: {
      fontFamily: F.r,
      fontSize: 10,
      color: p.secondary,
      textAlign: "right",
      marginTop: 3,
    },
    habits: {
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 22,
      padding: 16,
      gap: 12,
    },
    sectionRow: {
      flexDirection: "row-reverse",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      fontFamily: F.b,
      fontSize: 19,
      color: p.text,
      textAlign: "right",
    },
    sectionCaption: {
      fontFamily: F.r,
      fontSize: 11,
      color: p.secondary,
      textAlign: "right",
      lineHeight: 21,
    },
    completed: { fontFamily: F.r, fontSize: 11, color: p.secondary },
    progress: {
      height: 5,
      borderRadius: 5,
      backgroundColor: p.track,
      overflow: "hidden",
    },
    progressFill: {
      height: 5,
      backgroundColor: p.positive,
      borderRadius: 5,
      alignSelf: "flex-end",
    },
    habitRow: {
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 12,
      paddingVertical: 11,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    check: {
      width: 21,
      height: 21,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    habitName: {
      fontFamily: F.m,
      fontSize: 13,
      color: p.text,
      textAlign: "right",
    },
    habitDetail: {
      fontFamily: F.r,
      fontSize: 10,
      color: p.secondary,
      textAlign: "right",
      marginTop: 3,
    },
    addHabit: {
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 5,
    },
    textLink: { fontFamily: F.s, color: p.accent, fontSize: 12 },
    empty: { alignItems: "center", paddingVertical: 18, gap: 10 },
    emptyTitle: { fontFamily: F.s, fontSize: 16, color: p.text },
    tools: { flexDirection: "row-reverse", gap: 9, paddingVertical: 5 },
    tool: { flex: 1, alignItems: "center", gap: 10, paddingVertical: 12 },
    toolIcon: {
      backgroundColor: p.soft,
      width: 47,
      height: 47,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    toolText: {
      fontFamily: F.m,
      fontSize: 11,
      color: p.text,
      textAlign: "center",
    },
    oasisCard: {
      height: 155,
      borderRadius: 22,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: p.border,
      justifyContent: "flex-end",
      padding: 18,
      flexDirection: "row-reverse",
      alignItems: "flex-end",
    },
    oasisCopy: { flex: 1 },
    oasisAction: {
      width: 38,
      height: 38,
      borderRadius: 20,
      backgroundColor: p.glass,
      alignItems: "center",
      justifyContent: "center",
    },
    footer: {
      fontFamily: "Ruqaa",
      fontSize: 20,
      color: p.muted,
      textAlign: "center",
      paddingVertical: 12,
    },
    error: {
      fontFamily: F.r,
      fontSize: 12,
      color: "#D98973",
      textAlign: "right",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,12,13,.65)",
      justifyContent: "flex-end",
    },
    sheet: {
      width: "100%",
      maxWidth: 680,
      alignSelf: "center",
      backgroundColor: p.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      gap: 18,
      borderWidth: 1,
      borderColor: p.border,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 3,
      backgroundColor: p.muted,
      alignSelf: "center",
      marginBottom: 2,
    },
    sheetLabel: {
      fontFamily: F.m,
      fontSize: 13,
      color: p.secondary,
      textAlign: "right",
    },
    themeOptions: { flexDirection: "row-reverse", gap: 10 },
    themeOption: {
      flex: 1,
      paddingVertical: 18,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: p.border,
      alignItems: "center",
      gap: 9,
    },
    sheetButton: {
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderColor: p.border,
    },
    input: {
      backgroundColor: p.raised,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 14,
      padding: 14,
      fontFamily: F.r,
      fontSize: 16,
      color: p.text,
    },
    methodChip: {
      padding: 12,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: p.border,
    },
    primaryButton: {
      padding: 16,
      borderRadius: 15,
      backgroundColor: p.accent,
      alignItems: "center",
    },
    primaryText: { fontFamily: F.b, fontSize: 15, color: p.accentText },
  });
}
