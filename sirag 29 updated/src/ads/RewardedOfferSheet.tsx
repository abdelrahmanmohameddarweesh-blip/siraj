import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { homePalettes } from "../design/homeTheme";
import { localDay } from "../habits/habitData";
import {
  AD_OFFERS,
  AdLedger,
  AdPlacement,
  eligibility,
  emptyAdLedger,
} from "./rewardPolicy";
import {
  beginAdSession,
  earnAdReward,
  endAdSession,
  loadAdRewards,
} from "./rewardStore";
import { adSupport, adPrivacyOptions, showRewardedAd } from "./provider";
export default function RewardedOfferSheet({
  placement,
  onClose,
  onGranted,
}: {
  placement: AdPlacement | null;
  onClose: () => void;
  onGranted: () => Promise<void>;
}) {
  const { theme } = useTheme(),
    p = homePalettes[theme];
  const [ledger, setLedger] = useState<AdLedger>(emptyAdLedger()),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  const active = useRef(true),
    watchLock = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    if (placement) {
      setError("");
      setDone(false);
      loadAdRewards()
        .then(setLedger)
        .catch(() => setError("تعذّر تحميل سجل المكافآت. حاول لاحقًا."));
    }
  }, [placement]);
  if (!placement) return null;
  const offer = AD_OFFERS[placement],
    support = adSupport(),
    can = eligibility(ledger, placement, localDay(), Date.now());
  async function watch() {
    if (watchLock.current || !placement) return;
    watchLock.current = true;
    setBusy(true);
    setError("");
    let session: Awaited<ReturnType<typeof beginAdSession>> | null = null;
    try {
      session = await beginAdSession(placement);
      const result = await showRewardedAd(() => earnAdReward(session!));
      if (result.earned) {
        await onGranted();
        if (active.current) {
          setDone(true);
          setLedger(await loadAdRewards());
        }
      } else if (active.current)
        setError("أُغلق الإعلان دون استحقاق مكافأة. يمكنك المحاولة لاحقًا.");
    } catch (e) {
      if (active.current)
        setError(
          (e as Error).message || "الإعلان غير متاح الآن. لم تُمنح مكافأة.",
        );
    } finally {
      watchLock.current = false;
      if (session) await endAdSession(session.id).catch(() => {});
      if (active.current) {
        setBusy(false);
        loadAdRewards()
          .then(setLedger)
          .catch(() => {});
      }
    }
  }
  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <View style={s.shade}>
        <ScrollView
          style={[
            s.card,
            { backgroundColor: p.surface, borderColor: p.border },
          ]}
          contentContainerStyle={{ padding: 24, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[s.kicker, { color: p.accent }]}>
            إعلان اختياري · مكافأة للواحة
          </Text>
          <Text style={[s.title, { color: p.text }]}>
            {done ? "أُضيفت هديتك 🌿" : offer.title}
          </Text>
          <Text style={[s.body, { color: p.secondary }]}>
            {done
              ? `حصلت على ${offer.reward}. يمكنك استخدامها في الزراعة الآن.`
              : offer.description}
          </Text>
          <View style={[s.reward, { backgroundColor: p.raised }]}>
            <Text style={[s.rewardText, { color: p.accent }]}>
              {offer.reward}
            </Text>
          </View>
          <Text style={[s.small, { color: p.muted }]}>
            لا يؤثّر الإعلان على إنجاز الصلاة أو القرآن أو العادات. يمكنك كسب
            البذور والماء من عاداتك دون إعلان.
          </Text>
          <Text style={[s.small, { color: p.secondary }]}>
            {support.message}
          </Text>
          {!done && (
            <Text style={[s.small, { color: p.muted }]}>
              {can.allowed
                ? `متبقي ${can.remaining} من ٣ مكافآت اليوم. مكافأة واحدة لكل نوع، وفاصل دقيقتين.`
                : can.reason}
            </Text>
          )}
          {!!error && (
            <Text
              accessibilityRole="alert"
              style={[s.body, { color: p.accent }]}
            >
              {error}
            </Text>
          )}
          {busy && (
            <ActivityIndicator
              color={p.accent}
              accessibilityLabel="جارٍ تجهيز الإعلان"
            />
          )}
          {!done && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="شاهد الإعلان واحصل على المكافأة"
              disabled={busy || !support.available || !can.allowed}
              onPress={() => void watch()}
              style={[
                s.button,
                {
                  backgroundColor: p.accent,
                  opacity: busy || !support.available || !can.allowed ? 0.5 : 1,
                },
              ]}
            >
              <Text style={[s.buttonText, { color: p.accentText }]}>
                {busy
                  ? "جارٍ تجهيز الإعلان…"
                  : "شاهد الإعلان واحصل على المكافأة"}
              </Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={onClose}
            style={[s.button, { backgroundColor: p.raised }]}
          >
            <Text style={[s.buttonText, { color: p.text }]}>
              {done ? "العودة للزراعة" : "المتابعة دون إعلان"}
            </Text>
          </Pressable>
          {support.available && (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() =>
                void adPrivacyOptions().catch((e) => setError(e.message))
              }
            >
              <Text style={[s.small, { color: p.accent }]}>
                خيارات خصوصية الإعلان
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  shade: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.65)",
    justifyContent: "center",
    padding: 22,
  },
  card: {
    borderWidth: 1,
    borderRadius: 28,
    maxHeight: "92%",
    flexGrow: 0,
    flexShrink: 1,
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
  },
  kicker: { fontFamily: "PlexMedium", fontSize: 11, textAlign: "right" },
  title: {
    fontFamily: "Ruqaa",
    fontSize: 31,
    lineHeight: 47,
    textAlign: "right",
  },
  body: {
    fontFamily: "Plex",
    fontSize: 14,
    lineHeight: 25,
    textAlign: "right",
  },
  small: {
    fontFamily: "Plex",
    fontSize: 11,
    lineHeight: 21,
    textAlign: "right",
  },
  reward: { borderRadius: 16, padding: 16 },
  rewardText: { fontFamily: "PlexBold", fontSize: 18, textAlign: "center" },
  button: {
    minHeight: 50,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontFamily: "PlexBold", fontSize: 13, textAlign: "center" },
});
