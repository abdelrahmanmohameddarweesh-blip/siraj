import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, StatusBar, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from './WebViewCompat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { OASIS_HTML } from './oasisHtml';
import { PrayerCheckinSheet } from '../components/prayer/PrayerCheckinSheet';
import { syncNotificationsSoon } from '../notifications/scheduler';
import { usePrayer } from '../prayer/PrayerContext';
import { HabitPlan, LOG_KEY, PLANS_KEY, localDay } from '../habits/habitData';
import { Ledger, OasisHabit, PrayerId, ackGrants, computeGrants, normalizeLedger, todaysHabits } from './oasisRewards';

export const OASIS_STATE_KEY = 'sirag-oasis-state-v1';
export const OASIS_LEDGER_KEY = 'sirag-oasis-ledger-v1';
const CHECKIN_RECORDS_KEY = 'batl-prayer-checkin-records-v1';
const NUDGE_ID = 'sirag-oasis-nudge';

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try { const raw = await AsyncStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}

/** One gentle reminder two days after the last visit, only if the user already allowed notifications. */
async function scheduleNudge(state: any) {
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    await Notifications.cancelScheduledNotificationAsync(NUDGE_ID).catch(() => {});
    const res: string[] = state?.oases?.[state?.locIdx ?? 0]?.res || [];
    const body = res.includes('ducks') ? 'البط ينتظرك عند العين 🦆'
      : res.includes('butterflies') ? 'الفراشات ما زالت تحوم حول أزهارك 🦋'
      : 'واحتك تنتظر أثرك اليوم 🌱';
    await Notifications.scheduleNotificationAsync({
      identifier: NUDGE_ID,
      content: { title: 'سراج', body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 * 24 * 60 * 60, repeats: false },
    });
  } catch { /* reminders are optional */ }
}

export default function OasisScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isRestDayToday } = usePrayer();
  const [sheetPrayer, setSheetPrayer] = useState<PrayerId | null>(null);
  const web = useRef<WebView<{}>>(null);
  const ready = useRef(false);
  const ledgerRef = useRef<Ledger | null>(null);
  const stateRef = useRef<any>(null);
  const [init, setInit] = useState<string | null>(null);

  /** Reads today's habits from the app's real records and awards anything new. */
  const refresh = useCallback(async () => {
    const day = localDay();
    const [plans, logs, checkins, ledgerRaw] = await Promise.all([
      readJSON<HabitPlan[]>(PLANS_KEY, []),
      readJSON<Record<string, Record<string, number>>>(LOG_KEY, {}),
      readJSON<Record<string, { status?: string }>>(CHECKIN_RECORDS_KEY, {}),
      ledgerRef.current ? Promise.resolve(ledgerRef.current) : readJSON<unknown>(OASIS_LEDGER_KEY, null),
    ]);
    const habits = todaysHabits({ day, plans, logs, checkins, restDay: isRestDayToday });
    const { ledger, grants } = computeGrants(normalizeLedger(ledgerRaw), day, habits);
    ledgerRef.current = ledger;
    if (grants.length) await AsyncStorage.setItem(OASIS_LEDGER_KEY, JSON.stringify(ledger)).catch(() => {});
    return { habits, ledger, grants };
  }, [isRestDayToday]);

  const send = useCallback((payload: object) => {
    if (!ready.current) return;
    web.current?.injectJavaScript(`window.SiragOasis&&window.SiragOasis.update(${JSON.stringify(payload)});true;`);
  }, []);

  const pushUpdate = useCallback(async () => {
    const { habits, ledger } = await refresh();
    send({ habits, grants: ledger.pending });
  }, [refresh, send]);

  // first load: state + habits + pending grants are handed to the page before it starts
  useEffect(() => {
    let alive = true;
    (async () => {
      const state = await readJSON<any>(OASIS_STATE_KEY, null);
      stateRef.current = state;
      const { habits, ledger } = await refresh();
      if (!alive) return;
      const payload = { state, habits, grants: ledger.pending, dev: __DEV__, insets: { top: insets.top, bottom: insets.bottom } };
      setInit(`window.__SIRAG_INIT=${JSON.stringify(payload)};true;`);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // returning from another screen (prayer tracker, habit setup) or from the background
  useFocusEffect(useCallback(() => { if (ready.current) pushUpdate(); return () => { scheduleNudge(stateRef.current); }; }, [pushUpdate]));
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => { if (s === 'active') pushUpdate(); else scheduleNudge(stateRef.current); });
    return () => sub.remove();
  }, [pushUpdate]);
  useEffect(() => {
    if (!ready.current) return;
    web.current?.injectJavaScript(`window.SiragOasis&&window.SiragOasis.setInsets(${JSON.stringify({ top: insets.top, bottom: insets.bottom })});true;`);
  }, [insets.top, insets.bottom]);

  const completePrayer = (h: OasisHabit) => setSheetPrayer(h.id.split(':')[1] as PrayerId);

  const completePlan = (h: OasisHabit) => {
    // habits that the app can track itself open their screen instead of a manual tick
    if (h.planKind === 'adhkar_morning' || h.planKind === 'adhkar_evening') { navigation.navigate('Adhkar', { session: h.planKind === 'adhkar_morning' ? 'morning' : 'evening' }); return; }
    if (h.planKind === 'hifz' || h.planKind === 'hifz_review') { navigation.navigate('Hifz'); return; }
    if (h.planKind === 'quran_read') { navigation.navigate('QuranReader'); return; }
    const mark = async () => {
      const day = localDay();
      const logs = await readJSON<Record<string, Record<string, number>>>(LOG_KEY, {});
      const today = { ...(logs[day] || {}) };
      today[h.planId!] = Math.max(today[h.planId!] || 0, h.target || 1);
      try { await AsyncStorage.setItem(LOG_KEY, JSON.stringify({ ...logs, [day]: today })); } catch { Alert.alert('تعذر الحفظ', 'حاول مرة أخرى'); return; }
      syncNotificationsSoon();
      pushUpdate();
    };
    const buttons: any[] = [{ text: 'أكملتها', onPress: mark }];
    if (/قرآن|القرآن/.test(h.name)) buttons.push({ text: 'افتح المصحف', onPress: () => navigation.navigate('QuranReader') });
    buttons.push({ text: 'إلغاء', style: 'cancel' });
    Alert.alert(h.name, `هل أكملت هدف اليوم (${h.sub})؟`, buttons);
  };

  const onMessage = useCallback(async (e: WebViewMessageEvent) => {
    let msg: any;
    try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    switch (msg.type) {
      case 'ready':
        ready.current = true;
        pushUpdate();
        break;
      case 'save': {
        stateRef.current = msg.state;
        AsyncStorage.setItem(OASIS_STATE_KEY, JSON.stringify(msg.state)).catch(() => {});
        const applied: string[] = Array.isArray(msg.state?.applied) ? msg.state.applied : [];
        if (ledgerRef.current) {
          const next = ackGrants(ledgerRef.current, applied);
          if (next !== ledgerRef.current) { ledgerRef.current = next; AsyncStorage.setItem(OASIS_LEDGER_KEY, JSON.stringify(next)).catch(() => {}); }
        }
        break;
      }
      case 'complete': {
        const { habits } = await refresh();
        const h = habits.find(x => x.id === msg.id);
        if (!h || h.done) { pushUpdate(); break; }
        if (h.kind === 'prayer') completePrayer(h); else completePlan(h);
        break;
      }
      case 'haptic':
        if (msg.kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        else Haptics.impactAsync(msg.kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        break;
      case 'navigate':
        if (msg.to === 'HabitSetup') navigation.navigate('HabitSetup', { first: false });
        else if (msg.to === 'Home' || msg.to === 'PrayerTracker' || msg.to === 'QuranReader') navigation.navigate(msg.to);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushUpdate, refresh]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {init ? (
        <WebView<{}>
          ref={web}
          style={styles.web}
          originWhitelist={['*']}
          source={{ html: OASIS_HTML, baseUrl: 'https://oasis.sirag.app/' }}
          injectedJavaScriptBeforeContentLoaded={init}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          setSupportMultipleWindows={false}
          textZoom={100}
          onContentProcessDidTerminate={() => { ready.current = false; web.current?.reload(); }}
        />
      ) : (
        <View style={styles.loading}><ActivityIndicator color="#f1c76a" /></View>
      )}
      {sheetPrayer && <PrayerCheckinSheet visible prayer={sheetPrayer} onClose={() => setSheetPrayer(null)} onSaved={pushUpdate} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f2a24' },
  web: { flex: 1, backgroundColor: '#cfe3e6' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
