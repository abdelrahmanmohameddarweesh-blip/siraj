import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  BackHandler,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import SirajWordmark from "../brand/SirajWordmark";
import StoryArtwork from "./StoryArtwork";
import { loadProfile } from "../profile/profileStore";
import { STORIES_KEY, STORY_DURATION } from "./state";
import { F, ar } from "../ui/theme";
export const TOUR_KEY = STORIES_KEY;
const STORIES = [
  {
    tag: "صلاتك، بسكينة",
    title: "ليكن في يومك\nنورٌ يتجدّد",
    copy: "مواقيت حسب موقعك، وتذكير يناسب يومك. سجّل صلاتك وسننها، خطوة بخطوة.",
    colors: ["#F8E6D2", "#FBF8F0"] as const,
  },
  {
    tag: "وردٌ يرافقك",
    title: "قليلٌ يدوم،\nوأثرٌ يكبر",
    copy: "قرآن تقرؤه أو تستمع إليه، وأذكار تطمئنّ بها، وحفظ تراجعه على مهل.",
    colors: ["#E6EDE3", "#FBF8F0"] as const,
  },
  {
    tag: "خيرٌ ينمو معك",
    title: "ازرع أثر يومك،\nوشاركه مع صحبتك",
    copy: "حوّل عاداتك المسجّلة إلى واحة تنمو، وابدأ صحبة تشجّعك وتحفظ خصوصيتك.",
    colors: ["#F0E5CF", "#FBF8F0"] as const,
  },
];
export default function AppTourScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets(),
    { height } = useWindowDimensions(),
    focused = useIsFocused();
  const [index, setIndex] = useState(0),
    [paused, setPaused] = useState(false),
    [holding, setHolding] = useState(false),
    [foreground, setForeground] = useState(AppState.currentState === "active"),
    [reduce, setReduce] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const progress = useRef(new Animated.Value(0)).current,
    fraction = useRef(0),
    finishing = useRef(false);
  const story = STORIES[index],
    compact = height < 700;
  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      fraction.current = value;
    });
    return () => progress.removeListener(id);
  }, [progress]);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduce)
      .catch(() => setReduce(true));
    void AccessibilityInfo.isScreenReaderEnabled()
      .then((v) => {
        if (v) setPaused(true);
      })
      .catch(() => {});
    const motion = AccessibilityInfo.addEventListener(
        "reduceMotionChanged",
        setReduce,
      ),
      app = AppState.addEventListener("change", (s) =>
        setForeground(s === "active"),
      );
    return () => {
      motion.remove();
      app.remove();
    };
  }, []);
  useEffect(() => {
    progress.stopAnimation();
    fraction.current = 0;
    progress.setValue(0);
  }, [index, progress]);
  useEffect(() => {
    if (!focused || !foreground || paused || holding || reduce || busy) return;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION * (1 - fraction.current),
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished && index < STORIES.length - 1) setIndex((i) => i + 1);
    });
    return () => animation.stop();
  }, [index, focused, foreground, paused, holding, reduce, busy, progress]);
  useFocusEffect(
    React.useCallback(() => {
      const back = BackHandler.addEventListener("hardwareBackPress", () => {
        if (index > 0) {
          setIndex((i) => i - 1);
          return true;
        }
        return false;
      });
      return () => back.remove();
    }, [index]),
  );
  const finish = async (skipped = false) => {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    setError("");
    try {
      await AsyncStorage.setItem(STORIES_KEY, skipped ? "skipped" : "complete");
      await AsyncStorage.setItem("sirag-onboarding-complete-v1", "yes");
      if (route?.params?.replay && navigation.canGoBack()) {
        navigation.goBack();
        return;
      }
      const profile = await loadProfile();
      navigation.reset({
        index: 0,
        routes: [
          profile
            ? { name: "Home" }
            : { name: "ProfileSetup", params: { nextRoute: "Home" } },
        ],
      });
    } catch {
      finishing.current = false;
      setBusy(false);
      setError("تعذّر حفظ البداية. حاول مرة أخرى.");
    }
  };
  const next = () => {
    if (index === STORIES.length - 1) void finish();
    else setIndex((i) => i + 1);
  };
  return (
    <LinearGradient colors={story.colors} style={s.root}>
      <StatusBar barStyle="dark-content" />
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={s.bars}>
          {STORIES.map((_, i) => (
            <View style={s.bar} key={i}>
              <Animated.View
                style={[
                  s.barFill,
                  {
                    width:
                      i < index
                        ? "100%"
                        : i === index
                          ? progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0%", "100%"],
                            })
                          : "0%",
                  },
                ]}
              />
            </View>
          ))}
        </View>
        <View style={s.headRow}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            accessibilityLabel="تخطي قصص البداية"
            onPress={() => void finish(true)}
            style={s.headButton}
          >
            <Text style={s.headText}>تخطي</Text>
          </Pressable>
          <SirajWordmark width={66} height={42} color="#1D4437" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={paused ? "استئناف القصص" : "إيقاف القصص مؤقتًا"}
            accessibilityState={{ selected: paused }}
            onPress={() => setPaused((v) => !v)}
            style={s.headButton}
          >
            <Svg
              width={18}
              height={18}
              viewBox="0 0 20 20"
              accessibilityElementsHidden
            >
              <Path
                fill="#1D4437"
                d={
                  paused
                    ? "M6 3 L17 10 L6 17 Z"
                    : "M5 3 H8 V17 H5 Z M12 3 H15 V17 H12 Z"
                }
              />
            </Svg>
          </Pressable>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={[
          s.page,
          {
            minHeight: Math.max(420, height - insets.top - insets.bottom - 156),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            s.art,
            {
              height: compact
                ? height < 620
                  ? height * 0.28
                  : height * 0.34
                : Math.min(390, height * 0.44),
            },
          ]}
        >
          <StoryArtwork index={index} />
          <View style={s.tapZones}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="القصة التالية"
              onPressIn={() => setHolding(true)}
              onPressOut={() => setHolding(false)}
              onPress={() =>
                index < STORIES.length - 1 ? setIndex((i) => i + 1) : null
              }
              style={{ flex: 2 }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="القصة السابقة"
              onPressIn={() => setHolding(true)}
              onPressOut={() => setHolding(false)}
              onPress={() => setIndex((i) => Math.max(0, i - 1))}
              style={{ flex: 1 }}
            />
          </View>
        </View>
        <Text style={s.kicker}>{story.tag}</Text>
        <Text
          accessibilityRole="header"
          style={[s.title, compact && { fontSize: 29, lineHeight: 45 }]}
        >
          {story.title}
        </Text>
        <Text style={s.copy}>{story.copy}</Text>
        {!!error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
      </ScrollView>
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={s.actions}>
          {index > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="رجوع إلى القصة السابقة"
              onPress={() => setIndex((i) => i - 1)}
              style={s.back}
            >
              <Text style={s.headText}>رجوع</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={next}
            style={[s.next, busy && { opacity: 0.6 }]}
          >
            <Text style={s.nextText}>
              {busy
                ? "لحظة…"
                : index === STORIES.length - 1
                  ? "لنبدأ الرحلة  ←"
                  : "التالي  ←"}
            </Text>
          </Pressable>
        </View>
        <Text style={s.hint}>
          {ar(index + 1)} / {ar(STORIES.length)} ·{" "}
          {reduce
            ? "تابع بالضغط على التالي"
            : "اضغط مطولًا على المشهد لإيقاف القصة"}
        </Text>
      </View>
    </LinearGradient>
  );
}
const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 22, gap: 12 },
  bars: { flexDirection: "row-reverse", gap: 6 },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#DBD9CD",
    overflow: "hidden",
  },
  barFill: { height: 3, backgroundColor: "#204B3C", alignSelf: "flex-end" },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headButton: {
    minWidth: 48,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headText: { fontFamily: F.m, color: "#405D4C", fontSize: 13 },
  pause: { fontSize: 18, color: "#204B3C" },
  page: { paddingHorizontal: 24, alignItems: "center", paddingBottom: 12 },
  art: { width: "100%", maxWidth: 410, marginBottom: 18 },
  tapZones: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
  },
  kicker: {
    fontFamily: F.s,
    fontSize: 12,
    color: "#947443",
    textAlign: "center",
    marginBottom: 10,
  },
  title: {
    fontFamily: F.b,
    fontSize: 34,
    lineHeight: 50,
    color: "#173E33",
    textAlign: "center",
    marginBottom: 12,
  },
  copy: {
    fontFamily: F.r,
    fontSize: 14,
    lineHeight: 27,
    color: "#60715E",
    textAlign: "center",
    maxWidth: 355,
  },
  footer: { paddingHorizontal: 28, paddingTop: 10, gap: 12 },
  actions: { flexDirection: "row-reverse", gap: 12, alignItems: "center" },
  next: {
    flex: 1,
    backgroundColor: "#1E493B",
    minHeight: 56,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#385439",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  nextText: { fontFamily: F.s, color: "#FFF7E6", fontSize: 16 },
  back: { minHeight: 48, paddingHorizontal: 14, justifyContent: "center" },
  hint: {
    fontFamily: F.r,
    fontSize: 10,
    color: "#7B8474",
    textAlign: "center",
  },
  error: {
    fontFamily: F.r,
    fontSize: 12,
    color: "#A7483B",
    textAlign: "center",
    marginTop: 10,
  },
});
