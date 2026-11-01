import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePrayer } from "../prayer/PrayerContext";
import { C, F, ar } from "../ui/theme";
export const TOUR_KEY = "siraj-guided-tour-v1";
const STEPS = [
  {
    icon: "🕌",
    title: "صلاتك، خطوة بخطوة",
    copy: "حدّد موقعك لتظهر المواقيت المناسبة، ثم افتح الصلاة وسجّل ما أدّيته. السنن تُسجّل قبل الفريضة وبعدها بصورة مستقلة.",
    action: "استكشف الصلاة",
    screen: "PrayerTracker",
  },
  {
    icon: "🔔",
    title: "تذكير على إيقاع يومك",
    copy: "اختر الأذان فقط، أو أضف استعدادًا قبله وسؤالًا بعده. السماح بالتنبيهات والمنبّهات الدقيقة يساعد على وصولها في وقتها.",
    action: "اضبط تذكيراتك",
    screen: "PrayerReminders",
  },
  {
    icon: "📿",
    title: "اقرأ، ثم اضغط العدّاد",
    copy: "لكل جلسة صباح ومساء سجل مستقل. الاستماع والتمرير لا يكملان الذكر. اضغط العدّاد بعد القراءة، ويمكنك تصحيح أي تسجيل.",
    action: "استكشف الأذكار",
    screen: "Adhkar",
  },
  {
    icon: "📖",
    title: "وردك من القرآن والحفظ",
    copy: "اقرأ أو استمع داخل التطبيق، وتابع حفظك ومراجعتك. سجّل ما أنجزته فعلًا، وستراه في التقارير.",
    action: "افتح القرآن",
    screen: "QuranReader",
  },
  {
    icon: "🌱",
    title: "خطة صغيرة، وأثر يكبر",
    copy: "اختر عادة تناسبك. الإنجاز المسجّل يمنح موارد للواحة. مشاهدة الإعلان اختيارية لموارد إضافية، ولا تُسجّل عبادة.",
    action: "تصفّح العادات",
    screen: "HabitSetup",
  },
  {
    icon: "🤝",
    title: "صحبة وتقارير أوضح",
    copy: "أنشئ صحبة خاصة وشارك رمزها مع من تثق بهم. راجع تقاريرك لمعرفة ما أنجزته، واختر ما يظهر للصحبة من بياناتك.",
    action: "استكشف التقارير",
    screen: "Insights",
  },
];
export default function AppTourScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets(),
    { detectLocation, location } = usePrayer();
  const [index, setIndex] = useState(0),
    [demo, setDemo] = useState(0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const step = STEPS[index];
  const finish = async (skipped = false) => {
    if (busy) return;
    setBusy(true);
    try {
      await AsyncStorage.setItem(TOUR_KEY, skipped ? "skipped" : "complete");
      navigation.replace(
        route?.params?.nextRoute || "Home",
        route?.params?.nextParams,
      );
    } catch {
      setMessage("تعذّر حفظ الجولة. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.head}>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void finish(true)}
          style={s.touch}
        >
          <Text style={s.link}>تخطي الجولة</Text>
        </Pressable>
        <Text style={s.brand}>دليلك إلى سراج</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 22, gap: 18, paddingBottom: 25 }}
      >
        <Text style={s.number}>
          {ar(index + 1)} / {ar(STEPS.length)}
        </Text>
        <View style={s.art}>
          <Text style={s.icon}>{step.icon}</Text>
        </View>
        <Text style={s.title}>{step.title}</Text>
        <Text style={s.copy}>{step.copy}</Text>
        {index === 0 && (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            style={s.outline}
            onPress={async () => {
              setBusy(true);
              try {
                const ok = await detectLocation();
                setMessage(
                  ok
                    ? "تم تحديد موقعك ✓"
                    : "يمكنك اختيار مدينتك يدويًا في إعدادات الصلاة.",
                );
              } catch {
                setMessage("تعذّر تحديد الموقع. اختر المدينة يدويًا.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Text style={s.link}>
              📍{" "}
              {busy
                ? "جارٍ تحديد الموقع…"
                : `استخدام موقعي · ${location.cityNameAr}`}
            </Text>
          </Pressable>
        )}
        {index === 2 && (
          <View style={s.demo}>
            <Text style={s.label}>
              جرّب العدّاد · مثال فقط لا يُحفظ في سجلك
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="عدّاد تجريبي"
              style={s.counter}
              onPress={() => setDemo((n) => Math.min(3, n + 1))}
            >
              <Text style={s.counterText}>
                {demo === 3 ? "✓ أحسنت" : `${ar(demo)} / ٣  +`}
              </Text>
            </Pressable>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          style={s.outline}
          onPress={() => navigation.navigate(step.screen)}
        >
          <Text style={s.link}>{step.action} ←</Text>
        </Pressable>
        <Text style={s.note}>
          يمكنك فتح القسم الآن، ثم الرجوع لإكمال الجولة. أعد فتح هذا الدليل من
          قائمة ملفك الشخصي متى شئت.
        </Text>
        {!!message && (
          <Text accessibilityRole="alert" style={s.label}>
            {message}
          </Text>
        )}
      </ScrollView>
      <View style={[s.bottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={s.dots}>
          {STEPS.map((_, i) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`خطوة ${i + 1}`}
              key={i}
              onPress={() => {
                setIndex(i);
                setMessage("");
              }}
              style={[s.dot, index === i && s.dotOn]}
            />
          ))}
        </View>
        <View style={s.row}>
          {index > 0 && (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                setIndex((n) => n - 1);
                setMessage("");
              }}
              style={s.previous}
            >
              <Text style={s.link}>السابق</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            style={s.next}
            onPress={() => {
              if (index === STEPS.length - 1) void finish();
              else {
                setIndex((n) => n + 1);
                setMessage("");
              }
            }}
          >
            <Text style={s.nextText}>
              {index === STEPS.length - 1 ? "ابدأ رحلتك" : "التالي  ←"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  head: {
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  touch: { minHeight: 48, justifyContent: "center" },
  brand: { fontFamily: F.b, fontSize: 18, color: C.ink },
  link: { fontFamily: F.s, color: C.green, fontSize: 14, textAlign: "center" },
  number: { fontFamily: F.m, color: C.gold, textAlign: "right" },
  art: {
    backgroundColor: "#163f36",
    borderRadius: 30,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { fontSize: 65 },
  title: { fontFamily: F.b, fontSize: 27, color: C.ink, textAlign: "right" },
  copy: {
    fontFamily: F.r,
    color: C.ink2,
    fontSize: 15,
    lineHeight: 29,
    textAlign: "right",
  },
  outline: {
    minHeight: 50,
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.green,
    justifyContent: "center",
  },
  label: { fontFamily: F.m, color: C.ink, textAlign: "right", lineHeight: 23 },
  demo: { padding: 15, borderRadius: 18, backgroundColor: C.card, gap: 12 },
  counter: {
    alignSelf: "center",
    backgroundColor: C.green,
    borderRadius: 20,
    paddingHorizontal: 24,
    minHeight: 50,
    justifyContent: "center",
  },
  counterText: { color: "#fff", fontFamily: F.b, fontSize: 18 },
  note: {
    fontFamily: F.r,
    color: C.muted,
    textAlign: "right",
    lineHeight: 23,
    fontSize: 12,
  },
  bottom: { padding: 18, gap: 15, borderTopWidth: 1, borderColor: C.line },
  dots: { flexDirection: "row-reverse", justifyContent: "center", gap: 4 },
  dot: { width: 36, height: 16, borderRadius: 6, backgroundColor: C.line },
  dotOn: { backgroundColor: C.green },
  row: { flexDirection: "row", gap: 12 },
  previous: { minWidth: 70, justifyContent: "center" },
  next: {
    flex: 1,
    backgroundColor: C.green,
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { fontFamily: F.b, color: "#fff", fontSize: 16 },
});
