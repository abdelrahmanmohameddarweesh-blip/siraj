import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { ensureChannels } from "./scheduler";
import {
  SOUND_OPTIONS,
  selectedSound,
  soundChannel,
  soundFile,
  type SoundRole,
  type SoundPreferences,
} from "./soundPolicy";
import { soundAsset } from "./soundAssets";
import { C, F } from "../ui/theme";
const LABELS = {
  adhan: "الأذان عند دخول الوقت",
  wudu: "الوضوء والاستعداد قبل الصلاة",
  reminder: "متابعة الصلاة · هل صليت؟",
};
export default function NotificationSoundSettings({
  value,
  busy,
  onChange,
}: {
  value?: SoundPreferences;
  busy: boolean;
  onChange: (sounds: SoundPreferences) => Promise<void>;
}) {
  const player = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const [playing, setPlaying] = useState<SoundRole | null>(null),
    [message, setMessage] = useState(""),
    [testing, setTesting] = useState(false);
  const mounted = useRef(true);
  const previewVersion = useRef(0);
  const stop = () => {
    previewVersion.current++;
    player.current?.remove();
    player.current = null;
    setPlaying(null);
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      previewVersion.current++;
      player.current?.remove();
    };
  }, []);
  useFocusEffect(
    useCallback(
      () => () => {
        previewVersion.current++;
        player.current?.remove();
        player.current = null;
        setPlaying(null);
      },
      [],
    ),
  );
  const preview = async (role: SoundRole) => {
    if (playing === role) {
      stop();
      return;
    }
    stop();
    setMessage("");
    const version = previewVersion.current;
    const source = soundAsset(selectedSound(value, role));
    if (!source) {
      setMessage(
        "لا توجد معاينة داخلية لصوت الجهاز أو الصامت. استخدم تجربة التنبيه على نسخة الهاتف المبنية.",
      );
      return;
    }
    try {
      await setAudioModeAsync({
        playsInSilentMode: false,
        interruptionMode: "doNotMix",
      });
      if (!mounted.current || version !== previewVersion.current) return;
      const audio = createAudioPlayer(source);
      player.current = audio;
      setPlaying(role);
      audio.addListener("playbackStatusUpdate", (status) => {
        if (
          status.didJustFinish &&
          mounted.current &&
          player.current === audio
        ) {
          player.current = null;
          setPlaying(null);
          audio.remove();
        }
      });
      audio.play();
    } catch {
      if (!mounted.current || version !== previewVersion.current) return;
      stop();
      setMessage("تعذّر تشغيل المعاينة. تأكد من مستوى صوت الوسائط.");
    }
  };
  const test = async (role: SoundRole) => {
    if (testing) return;
    stop();
    setMessage("");
    if (
      Platform.OS === "web" ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      Constants.appOwnership === "expo"
    ) {
      setMessage(
        "تجربة صوت الإشعار تحتاج نسخة سراج المبنية على الهاتف؛ يمكنك الاستماع للمعاينة داخل Expo Go.",
      );
      return;
    }
    setTesting(true);
    try {
      await ensureChannels();
      let permission = await Notifications.getPermissionsAsync();
      if (!permission.granted)
        permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) throw new Error("permission");
      const choice = selectedSound(value, role),
        sound = choice === "silent" ? null : choice;
      await Notifications.scheduleNotificationAsync({
        identifier: `sound-test:${role}`,
        content: {
          title: "تجربة صوت سراج",
          body: LABELS[role],
          sound: soundFile(sound) || false,
          data: { type: "notification_sound_preview", role },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(Date.now() + 5000),
          channelId: soundChannel(role, sound),
        },
      });
      setMessage(
        "سيصلك تنبيه تجريبي بعد ٥ ثوانٍ. يمكنك قفل الشاشة لاختبار صوته.",
      );
    } catch {
      setMessage(
        "تعذّرت تجربة التنبيه. تأكد من السماح بالتنبيهات والصوت في إعدادات الهاتف.",
      );
    } finally {
      if (mounted.current) setTesting(false);
    }
  };
  return (
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.title}>
        أصوات التنبيهات
      </Text>
      <Text style={s.note}>
        اختر صوتًا مختلفًا للأذان والوضوء ومتابعة الصلاة. يطبّق اختيارك على
        الصلوات الخمس، مع بقاء مفتاح الصوت الخاص بكل صلاة.
      </Text>
      {(Object.keys(LABELS) as SoundRole[]).map((role) => {
        const id = selectedSound(value, role);
        return (
          <View key={role} style={s.section}>
            <Text style={s.label}>{LABELS[role]}</Text>
            <View style={s.options}>
              {SOUND_OPTIONS[role].map((option) => (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  aria-checked={id === option.id}
                  accessibilityLabel={`${LABELS[role]}: ${option.label}`}
                  accessibilityState={{ checked: id === option.id }}
                  disabled={busy || testing}
                  onPress={() => {
                    stop();
                    void onChange({ ...value, [role]: option.id });
                  }}
                  style={[s.option, id === option.id && s.selected]}
                >
                  <Text
                    style={[s.optionText, id === option.id && s.selectedText]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={s.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`استمع إلى صوت ${LABELS[role]}`}
                disabled={busy || testing}
                onPress={() => void preview(role)}
                style={s.action}
              >
                <Text style={s.link}>
                  {playing === role ? "إيقاف المعاينة" : "استمع للصوت"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`تجربة إشعار ${LABELS[role]}`}
                disabled={busy || testing}
                onPress={() => void test(role)}
                style={s.action}
              >
                <Text style={s.link}>تجربة إشعار بعد ٥ ثوانٍ</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
      <Text style={s.note}>
        لتشغيل تذكير الوضوء أو المتابعة، اختر موعده أسفل بطاقة كل صلاة. تغيير
        الصوت وحده لا يفعّل التذكير.
      </Text>
      <Text style={s.note}>
        صوت الأذان في إشعار الخلفية مقطع قصير، والأذان الكامل يعمل عندما يكون
        التطبيق مفتوحًا. الصامت وعدم الإزعاج وإعدادات صوت الهاتف قد تمنع الصوت.
      </Text>
      {!!message && (
        <Text accessibilityLiveRegion="polite" style={s.message}>
          {message}
        </Text>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
  },
  title: { fontFamily: F.b, fontSize: 19, color: C.ink, textAlign: "right" },
  note: {
    fontFamily: F.r,
    fontSize: 12,
    lineHeight: 23,
    color: C.muted,
    textAlign: "right",
  },
  label: { fontFamily: F.s, fontSize: 14, color: C.ink, textAlign: "right" },
  section: { gap: 10, paddingTop: 14, borderTopWidth: 1, borderColor: C.line },
  options: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  option: {
    minHeight: 44,
    padding: 12,
    borderRadius: 12,
    backgroundColor: C.chip,
    justifyContent: "center",
  },
  selected: { backgroundColor: C.green },
  optionText: { fontFamily: F.m, color: C.ink, fontSize: 12 },
  selectedText: { color: "#fff" },
  actions: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  action: { minHeight: 44, padding: 9, justifyContent: "center" },
  link: { fontFamily: F.s, fontSize: 12, color: C.green, textAlign: "right" },
  message: {
    fontFamily: F.m,
    color: C.ink,
    lineHeight: 25,
    textAlign: "right",
  },
});
