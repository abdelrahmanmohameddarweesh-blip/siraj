import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as Notifications from "expo-notifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePrayer } from "../prayer/PrayerContext";
import {
  PRAYER_AR,
  PRAYER_IDS,
  PrayerId,
  DEFAULT_FOLLOW_UP,
} from "./schedulePlan";
import { refreshAuxiliaryNotificationNames } from "./personalizationStore";
import { syncNotifications } from "./scheduler";
import {
  prayerPresetPatch,
  PrayerPreset,
  followUpPatch,
} from "./prayerPresets";
import { formatPrayerClock } from "../prayer/prayerTimesService";
import { PREDEFINED_CITIES } from "../prayer/cities";
import { C, F, ar } from "../ui/theme";
const METHODS = {
  Egyptian: "الهيئة المصرية",
  UmmAlQura: "أم القرى",
  MuslimWorldLeague: "رابطة العالم الإسلامي",
  NorthAmerica: "أمريكا الشمالية",
  Karachi: "كراتشي",
  Dubai: "دبي",
  Qatar: "قطر",
  Kuwait: "الكويت",
} as const;
export default function PrayerRemindersScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const {
    notificationConfig: config,
    updateNotifications,
    requestNotifications,
    location,
    method,
    madhab,
    todayTimes,
    changeMethod,
    changeMadhab,
    changeCity,
    detectLocation,
  } = usePrayer();
  const [busy, setBusy] = useState(false),
    [expanded, setExpanded] = useState<PrayerId | null>(null),
    [accuracy, setAccuracy] = useState(false),
    [cities, setCities] = useState(false),
    [message, setMessage] = useState(""),
    [failed, setFailed] = useState(false);
  const report = (text: string, error = false) => {
    setMessage(text);
    setFailed(error);
  };
  const run = async (action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch {
      report("تعذّر حفظ الإعدادات أو تحديث الجدول. حاول مرة أخرى.", true);
    } finally {
      setBusy(false);
    }
  };
  const update = (patch: Parameters<typeof updateNotifications>[0]) =>
    run(async () => {
      await updateNotifications({
        ...patch,
        reminderIntensity:
          patch.reminderIntensity ||
          ("personalizedNotifications" in patch || "badgesEnabled" in patch
            ? config.reminderIntensity
            : "custom"),
      });
      report("حُفظت الإعدادات. اضغط تحديث الجدول للتحقق من التنبيهات.");
    });
  const permission = () =>
    run(async () => {
      if (Platform.OS === "web") {
        report(
          "هذه معاينة ويب. فعّل التنبيهات من نسخة سراج المثبتة على الهاتف.",
          true,
        );
        return;
      }
      if (!(await requestNotifications())) {
        report(
          "إذن التنبيهات غير مفعّل. افتح إعدادات الهاتف واسمح لسراج بإرسال التنبيهات.",
          true,
        );
        return;
      }
      let exact = true;
      if (Platform.OS === "android") {
        const state = await Notifications.getExactAlarmPermissionsAsync();
        exact = state.granted;
        if (!exact && state.canAskAgain)
          exact = (await Notifications.requestExactAlarmPermissionsAsync())
            .granted;
      }
      await syncNotifications(true, true);
      await refreshAuxiliaryNotificationNames();
      const list = await Notifications.getAllScheduledNotificationsAsync();
      const count = list.filter((n) =>
        /^(pre:|athan:|pfu:)/.test(n.identifier),
      ).length;
      report(
        count
          ? `تم تحديث الجدول ✓ ${ar(count)} تنبيه صلاة قادم.${exact ? "" : " فعّل «المنبّهات والتذكيرات» لدقة أفضل؛ التوقيت الآن تقريبي."}`
          : "حُفظت الإعدادات، ولا توجد تنبيهات صلاة قادمة وفق اختياراتك. تحقق من تفعيل الصلوات أو العذر اليوم.",
      );
    });
  const chips = (
    values: number[],
    current: number,
    action: (n: number) => void,
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.chips}
    >
      {values.map((n) => (
        <Pressable
          key={n}
          disabled={busy}
          accessibilityRole="radio"
          accessibilityState={{ checked: n === current }}
          onPress={() => action(n)}
          style={[s.chip, n === current && s.chipOn]}
        >
          <Text style={[s.chipText, n === current && s.white]}>
            {n ? `${ar(n)} د` : "بدون"}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.head}>
        <Pressable
          accessibilityRole="button"
          style={s.touch}
          onPress={() =>
            route?.params?.nextRoute
              ? navigation.replace(route.params.nextRoute)
              : navigation.goBack()
          }
        >
          <Text style={s.link}>تم</Text>
        </Pressable>
        <Text style={s.title}>رفيق صلاتك</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 20 }}
      >
        <View style={s.hero}>
          <Text style={s.heroTitle}>تذكير يناسب يومك</Text>
          <Text style={s.heroCopy}>
            الأذان حسب موقعك، وسؤال المتابعة يتوقف عند تسجيل الصلاة.
          </Text>
          <Text style={s.heroCopy}>
            📍 {location.cityNameAr} · {METHODS[method]}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setAccuracy(!accuracy)}
          style={s.card}
        >
          <View style={s.row}>
            <Text style={s.label}>الموقع ودقة المواقيت</Text>
            <Text style={s.link}>{accuracy ? "إخفاء −" : "ضبط +"}</Text>
          </View>
          <Text style={s.note}>
            {location.isManual ? "مدينة مختارة يدويًا" : "موقع الجهاز"} ·{" "}
            {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
          </Text>
        </Pressable>
        {accuracy && (
          <View style={s.card}>
            <Pressable
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  const ok = await detectLocation();
                  report(
                    ok
                      ? "تم تحديث الموقع والمواقيت ✓"
                      : "لم نتمكن من تحديد الموقع. فعّل خدمة الموقع أو اختر مدينتك يدويًا.",
                    !ok,
                  );
                })
              }
              style={s.secondary}
            >
              <Text style={s.label}>📍 استخدام موقعي الحالي</Text>
            </Pressable>
            <Pressable onPress={() => setCities(!cities)} style={s.secondary}>
              <Text style={s.label}>اختيار مدينة يدويًا</Text>
            </Pressable>
            {cities && (
              <View style={s.wrap}>
                {PREDEFINED_CITIES.map((city) => (
                  <Pressable
                    disabled={busy}
                    key={city.id}
                    onPress={() =>
                      void run(async () => {
                        await changeCity(city);
                        setCities(false);
                        report("تم تغيير المدينة.");
                      })
                    }
                    style={s.chip}
                  >
                    <Text style={s.chipText}>{city.cityNameAr}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <Text style={s.label}>طريقة الحساب المعتمدة في بلدك</Text>
            <View style={s.wrap}>
              {Object.entries(METHODS).map(([id, label]) => (
                <Pressable
                  key={id}
                  disabled={busy}
                  onPress={() =>
                    void run(async () =>
                      changeMethod(id as keyof typeof METHODS),
                    )
                  }
                  style={[s.chip, method === id && s.chipOn]}
                >
                  <Text style={[s.chipText, method === id && s.white]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.label}>حساب وقت العصر</Text>
            <View style={s.wrap}>
              {(["shafii", "hanafi"] as const).map((id) => (
                <Pressable
                  key={id}
                  disabled={busy}
                  onPress={() => void run(async () => changeMadhab(id))}
                  style={[s.chip, madhab === id && s.chipOn]}
                >
                  <Text style={[s.chipText, madhab === id && s.white]}>
                    {id === "hanafi" ? "حنفي" : "الجمهور"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.note}>
              المواقيت محسوبة فلكيًا. طابق الطريقة مع الجهة المحلية، واضبط
              المنطقة الزمنية للهاتف تلقائيًا. يمكنك معايرة فرق دقائق المسجد لكل
              صلاة.
            </Text>
            {PRAYER_IDS.map((p) => {
              const n = config.adjustments?.[p] || 0;
              return (
                <View key={p} style={s.row}>
                  <Text style={s.label}>
                    {PRAYER_AR[p]} · {formatPrayerClock(todayTimes[p])}
                  </Text>
                  <View style={s.wrap}>
                    <Pressable
                      accessibilityLabel={`تقليل وقت ${PRAYER_AR[p]} دقيقة`}
                      disabled={busy || n <= -30}
                      style={s.adjust}
                      onPress={() =>
                        void update({
                          adjustments: { ...config.adjustments, [p]: n - 1 },
                        })
                      }
                    >
                      <Text>−</Text>
                    </Pressable>
                    <Text style={s.note}>
                      {n > 0 ? "+" : ""}
                      {n} د
                    </Text>
                    <Pressable
                      accessibilityLabel={`زيادة وقت ${PRAYER_AR[p]} دقيقة`}
                      disabled={busy || n >= 30}
                      style={s.adjust}
                      onPress={() =>
                        void update({
                          adjustments: { ...config.adjustments, [p]: n + 1 },
                        })
                      }
                    >
                      <Text>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={[s.card, s.row]}>
          <Text style={s.label}>تفعيل تذكيرات الصلاة</Text>
          <Switch
            disabled={busy}
            value={config.notificationsEnabled}
            onValueChange={(on) =>
              on
                ? void permission()
                : void update({ notificationsEnabled: false })
            }
          />
        </View>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.label}>اذكر اسمي في التنبيهات</Text>
            <Switch
              accessibilityLabel="ذكر اسمي في التنبيهات"
              disabled={busy}
              value={config.personalizedNotifications !== false}
              onValueChange={(personalizedNotifications) =>
                void update({ personalizedNotifications })
              }
            />
          </View>
          <Text style={s.note}>
            يُستخدم الاسم المحفوظ على جهازك فقط لتخصيص الرسالة. قد يظهر على شاشة
            القفل؛ أوقف هذا الخيار إذا رغبت بإخفائه.
          </Text>
        </View>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.label}>شارة الأعمال المنتظرة على أيقونة سراج</Text>
            <Switch
              accessibilityLabel="شارة أيقونة التطبيق"
              disabled={busy}
              value={config.badgesEnabled !== false}
              onValueChange={(badgesEnabled) => void update({ badgesEnabled })}
            />
          </View>
          <Text style={s.note}>
            للصلوات التي تنتظر التسجيل بعد مهلة التذكير، وللبذور الجاهزة
            للزراعة. على Android تعتمد النقطة على المشغّل وإشعار هادئ؛ لونها
            وشكلها من إعدادات الهاتف.
          </Text>
        </View>
        <Text style={s.label}>وتيرة خطة الصلاة</Text>
        <View style={s.wrap}>
          {(
            [
              ["gentle", "الأذان فقط"],
              ["steady", "الأذان والمتابعة"],
              ["strong", "قبل الأذان وبعده"],
            ] as [PrayerPreset, string][]
          ).map(([id, label]) => (
            <Pressable
              key={id}
              disabled={busy}
              onPress={() => void update(prayerPresetPatch(id))}
              style={[s.chip, config.reminderIntensity === id && s.chipOn]}
            >
              <Text
                style={[s.chipText, config.reminderIntensity === id && s.white]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        {PRAYER_IDS.map((p) => {
          const cfg = config[p],
            before = config.preAlertByPrayer?.[p] ?? config.preAlertMin ?? 0,
            after = config.checkinFollowUpEnabled
              ? (config.followUpMin?.[p] ?? DEFAULT_FOLLOW_UP[p])
              : 0,
            open = expanded === p;
          return (
            <View key={p} style={s.card}>
              <View style={s.row}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  onPress={() => setExpanded(open ? null : p)}
                  style={{ flex: 1, gap: 4 }}
                >
                  <Text style={s.prayer}>
                    {PRAYER_AR[p]}{" "}
                    <Text style={s.time}>
                      {formatPrayerClock(todayTimes[p])}
                    </Text>{" "}
                    {open ? "−" : "+"}
                  </Text>
                  <Text style={s.note}>
                    {cfg.enabled
                      ? `${before ? `قبل ${ar(before)} د · ` : ""}${cfg.athanEnabled === false ? "دون أذان" : "في الوقت"}${after ? ` · متابعة بعد ${ar(after)} د` : ""}`
                      : "التذكير متوقف"}
                  </Text>
                </Pressable>
                <Switch
                  disabled={busy}
                  value={cfg.enabled}
                  onValueChange={(enabled) =>
                    void update({ [p]: { ...cfg, enabled } })
                  }
                />
              </View>
              {open && cfg.enabled && (
                <>
                  <Text style={s.label}>قبل الأذان</Text>
                  {chips(
                    [0, 5, 10, 15, 20, 30, 60],
                    before,
                    (n) =>
                      void update({
                        preAlertByPrayer: {
                          ...config.preAlertByPrayer,
                          [p]: n,
                        },
                      }),
                  )}
                  <View style={s.row}>
                    <Text style={s.label}>عند دخول الوقت</Text>
                    <Switch
                      disabled={busy}
                      value={cfg.athanEnabled !== false}
                      onValueChange={(athanEnabled) =>
                        void update({ [p]: { ...cfg, athanEnabled } })
                      }
                    />
                  </View>
                  {cfg.athanEnabled !== false && (
                    <View style={s.row}>
                      <Text style={s.label}>صوت الأذان</Text>
                      <Switch
                        disabled={busy}
                        value={cfg.sound}
                        onValueChange={(sound) =>
                          void update({ [p]: { ...cfg, sound } })
                        }
                      />
                    </View>
                  )}
                  <Text style={s.label}>«هل صليت؟» بعد الأذان</Text>
                  {chips(
                    [0, 15, 20, 30, 35, 45, 60, 90],
                    after,
                    (n) =>
                      void update({
                        ...followUpPatch(config, p, n),
                      }),
                  )}
                </>
              )}
            </View>
          );
        })}
        <Text style={s.note}>
          يُجدَّد الجدول عند فتح التطبيق وتغيير الموقع أو الخطة. على iPhone عدد
          التنبيهات محدود، فافتح سراج يوميًا. إعدادات البطارية والصامت قد تؤثر
          على التنبيه والصوت؛ لا يمكن ضمان توقيت مطلق على كل الأجهزة.
        </Text>
      </ScrollView>
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {!!message && (
          <Text
            accessibilityRole="alert"
            style={[s.feedback, failed && { color: C.bad }]}
          >
            {message}
          </Text>
        )}
        {failed && (
          <Pressable onPress={() => void Linking.openSettings()}>
            <Text style={s.link}>فتح إعدادات الهاتف</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={permission}
          style={[s.button, busy && { opacity: 0.6 }]}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>
              {config.notificationsEnabled
                ? "حفظ وتحديث التذكيرات"
                : "تفعيل التنبيهات وتحديث الجدول"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  head: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  touch: { minHeight: 48, justifyContent: "center", paddingHorizontal: 8 },
  title: { fontFamily: F.b, color: C.ink, fontSize: 23 },
  link: { fontFamily: F.s, color: C.gold, textAlign: "right" },
  hero: { padding: 18, backgroundColor: C.green, borderRadius: 22, gap: 7 },
  heroTitle: {
    fontFamily: F.b,
    color: "#fff",
    fontSize: 23,
    textAlign: "right",
  },
  heroCopy: {
    fontFamily: F.r,
    color: "#e2ecde",
    fontSize: 12,
    lineHeight: 22,
    textAlign: "right",
  },
  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    gap: 10,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  label: {
    fontFamily: F.s,
    color: C.ink,
    fontSize: 13,
    textAlign: "right",
    flexShrink: 1,
  },
  prayer: { fontFamily: F.b, color: C.ink, fontSize: 18, textAlign: "right" },
  time: { fontFamily: F.m, color: C.gold, fontSize: 13 },
  note: {
    fontFamily: F.r,
    color: C.muted,
    fontSize: 11,
    lineHeight: 22,
    textAlign: "right",
  },
  chips: { gap: 7, paddingVertical: 2 },
  wrap: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 7,
    alignItems: "center",
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: C.chip,
  },
  chipOn: { backgroundColor: C.green },
  chipText: { fontFamily: F.m, color: C.ink, fontSize: 12 },
  white: { color: "#fff" },
  adjust: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  footer: {
    padding: 14,
    gap: 7,
    borderTopWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
  },
  feedback: {
    fontFamily: F.m,
    color: C.green,
    fontSize: 12,
    textAlign: "right",
    lineHeight: 21,
  },
  button: {
    minHeight: 52,
    padding: 12,
    borderRadius: 16,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontFamily: F.b, color: "#fff", fontSize: 15 },
});
