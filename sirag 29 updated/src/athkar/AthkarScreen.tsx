import AthkarBanner from "../ads/AthkarBanner";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  AppState,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { ATHKAR, Dhikr } from "./athkarData";
import {
  ATHKAR_LOG_KEY,
  AthkarLog,
  Session,
  SessionLog,
  normalizeSession,
  resetItem,
  completeItem,
  emptySession,
  progress,
  sessionFor,
  streak,
  tap,
} from "./athkarEngine";
import { usePrayer } from "../prayer/PrayerContext";
import { updateJSON } from "../storage/jsonStore";
import { localDay } from "../habits/habitData";
import { logKind } from "../habits/habitLog";
import { addDays } from "../quran/hifz/hifzEngine";
import { C, F, ar } from "../ui/theme";

export default function AthkarScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { todayTimes } = usePrayer();
  const [session, setSession] = useState<Session>(
    route?.params?.session || sessionFor(new Date(), todayTimes),
  );
  useEffect(() => {
    if (
      route?.params?.session === "morning" ||
      route?.params?.session === "evening"
    ) {
      setSession(route.params.session);
      setJustDone(false);
    }
  }, [route?.params?.session]);
  const [log, setLog] = useState<AthkarLog>({});
  const [justDone, setJustDone] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [day, setDay] = useState(localDay());
  const saving = useRef(false);
  useEffect(() => {
    const timer = setInterval(() => setDay(localDay()), 10000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setDay(localDay());
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  const logRef = useRef(log);
  logRef.current = log;
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [playing, setPlaying] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ATHKAR_LOG_KEY)
      .then((r) => {
        if (r) {
          const value = JSON.parse(r);
          logRef.current = value;
          setLog(value);
        }
        setLoaded(true);
      })
      .catch(() =>
        setSaveError("تعذّر تحميل الأذكار. أعد فتح الشاشة قبل التسجيل."),
      );
  }, []);
  const cur = normalizeSession(log[day]?.[session], ATHKAR);
  const persistUpdate = async (
    date: string,
    which: Session,
    fn: (value: SessionLog) => SessionLog,
  ) => {
    const next = await updateJSON<AthkarLog>(ATHKAR_LOG_KEY, {}, (old) => ({
      ...old,
      [date]: {
        ...old[date],
        [which]: fn(normalizeSession(old[date]?.[which], ATHKAR)),
      },
    }));
    logRef.current = next;
    setLog(next);
    return next[date]![which]!;
  };
  // time spent reading, counted only while this screen is open and the app is active
  useFocusEffect(
    useCallback(() => {
      let active = AppState.currentState === "active";
      const sub = AppState.addEventListener("change", (s) => {
        active = s === "active";
      });
      const t = setInterval(() => {
        if (!active || !loaded) return;
        const L = logRef.current,
          s = L[day]?.[session] || emptySession();
        if (s.done) return;
        if (localDay() !== day) return;
        void persistUpdate(day, session, (current) => ({
          ...current,
          seconds: current.seconds + 5,
        })).catch(() => setSaveError("تعذّر حفظ وقت القراءة."));
      }, 5000);
      return () => {
        clearInterval(t);
        sub.remove();
        player.pause();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, day, loaded]),
  );

  const update = async (fn: (value: SessionLog) => SessionLog) => {
    if (!loaded || saving.current) return;
    saving.current = true;
    setSaveError("");
    const date = localDay(),
      which = session;
    try {
      const before = normalizeSession(logRef.current[date]?.[which], ATHKAR);
      const next = await persistUpdate(date, which, fn);
      await logKind(
        [
          which === "morning" ? "adhkar_morning" : "adhkar_evening",
          which === "morning" ? "morning_adhkar" : "evening_adhkar",
        ],
        next.done ? 1 : 0,
        "set",
        date,
      );
      if (next.done && !before.done) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
        setJustDone(true);
      } else {
        setJustDone(false);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
          () => {},
        );
      }
    } catch {
      setSaveError("تعذّر حفظ التحديث. أعد المحاولة؛ لم نؤكد اكتمال القراءة.");
    } finally {
      saving.current = false;
    }
  };
  const confirm = (title: string, body: string, action: () => void) => {
    if (Platform.OS === "web") {
      if (globalThis.confirm(body)) action();
    } else
      Alert.alert(title, body, [
        { text: "إلغاء", style: "cancel" },
        { text: "تأكيد", onPress: action },
      ]);
  };
  const onTap = (d: Dhikr) =>
    void update((value) => tap(value, d, ATHKAR, new Date().toISOString()));
  const onFinishItem = (d: Dhikr) =>
    confirm(
      "تأكيد القراءة",
      "هل قرأت هذا الذكر بكل التكرارات المطلوبة؟",
      () =>
        void update((value) =>
          completeItem(value, d, ATHKAR, new Date().toISOString()),
        ),
    );
  const play = (d: Dhikr) => {
    if (playing === d.id && status.playing) {
      player.pause();
      return;
    }
    player.replace({ uri: d.audio });
    player.play();
    setPlaying(d.id);
  };

  const pr = progress(cur, ATHKAR);
  const st = streak(log, session, day, addDays, ATHKAR);
  const title = session === "morning" ? "أذكار الصباح" : "أذكار المساء";
  const minutes = Math.round((cur.seconds || 0) / 60);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={s.head}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={s.back}>رجوع</Text>
        </Pressable>
        <Text style={s.title}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>
      {!!saveError && (
        <Text
          accessibilityRole="alert"
          style={{
            color: C.bad,
            padding: 12,
            textAlign: "right",
            fontFamily: F.r,
          }}
        >
          {saveError}
        </Text>
      )}
      <View style={s.seg}>
        {(["morning", "evening"] as Session[]).map((x) => (
          <Pressable
            key={x}
            onPress={() => {
              setSession(x);
              setJustDone(false);
            }}
            style={[s.segItem, session === x && s.segOn]}
          >
            <Text style={[s.segText, session === x && s.segTextOn]}>
              {x === "morning" ? "الصباح 🌅" : "المساء 🌇"}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={s.summary}>
        <View style={s.rowBetween}>
          <Text style={s.sumBig}>
            {ar(pr.items)} من {ar(pr.total)}
          </Text>
          <Text style={s.sumSmall}>
            {cur.done
              ? "أكملتها اليوم ✓"
              : minutes
                ? `${ar(minutes)} دقيقة قراءة`
                : "اضغط زر العدّ بعد القراءة"}
          </Text>
        </View>
        <View style={s.track}>
          <View style={[s.fill, { width: `${Math.round(pr.ratio * 100)}%` }]} />
        </View>
        {st > 1 ? <Text style={s.streak}>{ar(st)} أيام متتالية</Text> : null}
      </View>
      {justDone && (
        <View style={s.doneBanner}>
          <Text style={s.doneTitle}>تقبّل الله منك</Text>
          <Text style={s.doneSub}>أكملت {title}، وستجد أثرها في واحتك.</Text>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          confirm(
            "بدء الجلسة من الصفر",
            "سيُصفّر عداد جلسة اليوم المحددة فقط. هل تريد المتابعة؟",
            () => void update(() => emptySession()),
          )
        }
      >
        <Text style={[s.source, { padding: 10 }]}>إعادة ضبط {title} اليوم</Text>
      </Pressable>
      <FlatList
        data={ATHKAR}
        keyExtractor={(d) => String(d.id)}
        contentContainerStyle={{
          padding: 14,
          paddingBottom: insets.bottom + 30,
          gap: 12,
        }}
        renderItem={({ item, index }) => {
          const n = cur.counts[item.id] || 0,
            full = n >= item.repeat;
          return (
            <View>
              <View style={[s.card, full && s.cardDone]}>
                <Text style={[s.text, full && { color: "#8a8475" }]}>
                  {item.text}
                </Text>
                {session === "evening" && item.text.includes("[") ? (
                  <Text style={s.note}>
                    في المساء تُقال الصيغة التي بين المعقوفين.
                  </Text>
                ) : null}
                <View style={s.cardFoot}>
                  <Pressable
                    onPress={() => play(item)}
                    hitSlop={8}
                    style={s.audio}
                  >
                    <Text style={s.audioText}>
                      {playing === item.id && status.playing
                        ? "⏸ إيقاف"
                        : "▶ استمع"}
                    </Text>
                  </Pressable>
                  {item.repeat >= 10 && !full ? (
                    <Pressable onPress={() => onFinishItem(item)} hitSlop={8}>
                      <Text style={s.finish}>قرأتها كاملة</Text>
                    </Pressable>
                  ) : (
                    <View />
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`عدّ الذكر ${index + 1}، ${n} من ${item.repeat}`}
                    disabled={!loaded || full}
                    onPress={() => onTap(item)}
                    style={[s.counter, full && s.counterDone]}
                  >
                    <Text style={[s.counterText, full && { color: "#fff" }]}>
                      {full ? "✓" : `${ar(n)} / ${ar(item.repeat)}  +`}
                    </Text>
                  </Pressable>
                </View>
                {n > 0 && (
                  <Pressable
                    onPress={() =>
                      confirm(
                        "تصحيح العداد",
                        "إعادة عدّ هذا الذكر من الصفر؟",
                        () =>
                          void update((value) =>
                            resetItem(value, item, ATHKAR),
                          ),
                      )
                    }
                  >
                    <Text style={s.source}>إعادة عدّ هذا الذكر</Text>
                  </Pressable>
                )}
              </View>
              {(index === 3 || index === 9) && (
                <AthkarBanner placement={index === 3 ? 1 : 2} />
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <Text style={s.source}>
            النصوص من «حصن المسلم» (hisnmuslim.com)، الفصل ٢٧: أذكار الصباح
            والمساء.
          </Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  head: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: { fontFamily: F.s, fontSize: 14, color: C.gold },
  title: { fontFamily: F.b, fontSize: 20, color: C.ink },
  seg: {
    flexDirection: "row-reverse",
    marginHorizontal: 14,
    backgroundColor: C.chip,
    borderRadius: 14,
    padding: 4,
  },
  segItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: "center",
  },
  segOn: { backgroundColor: C.card },
  segText: { fontFamily: F.s, fontSize: 14, color: C.muted },
  segTextOn: { color: C.ink },
  summary: {
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: C.green,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  rowBetween: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sumBig: { fontFamily: F.b, fontSize: 18, color: "#fff" },
  sumSmall: { fontFamily: F.m, fontSize: 12, color: "#d8e6dd" },
  track: {
    height: 7,
    backgroundColor: "rgba(255,255,255,.2)",
    borderRadius: 7,
    overflow: "hidden",
  },
  fill: { height: 7, backgroundColor: C.goldSoft },
  streak: {
    fontFamily: F.m,
    fontSize: 12,
    color: C.goldSoft,
    textAlign: "right",
  },
  doneBanner: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: "#fbf0d9",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ecd29a",
  },
  doneTitle: {
    fontFamily: F.b,
    fontSize: 16,
    color: C.ink,
    textAlign: "right",
  },
  doneSub: { fontFamily: F.r, fontSize: 13, color: C.ink2, textAlign: "right" },
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    gap: 10,
  },
  cardDone: { opacity: 0.7 },
  text: {
    fontFamily: F.q,
    fontSize: 21,
    lineHeight: 44,
    color: "#29231b",
    textAlign: "right",
    writingDirection: "rtl",
  },
  note: { fontFamily: F.m, fontSize: 12, color: C.gold, textAlign: "right" },
  cardFoot: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  audio: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: C.chip,
  },
  audioText: { fontFamily: F.s, fontSize: 12, color: C.ink },
  finish: { fontFamily: F.s, fontSize: 12, color: C.gold },
  counter: {
    minWidth: 76,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: C.green,
    alignItems: "center",
  },
  counterDone: { backgroundColor: C.green },
  counterText: { fontFamily: F.b, fontSize: 15, color: C.green },
  source: {
    fontFamily: F.r,
    fontSize: 11,
    color: C.muted,
    textAlign: "center",
    marginTop: 8,
  },
});
