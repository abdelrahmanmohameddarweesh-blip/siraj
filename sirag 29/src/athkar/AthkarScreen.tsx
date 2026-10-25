import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { ATHKAR, Dhikr } from './athkarData';
import { ATHKAR_LOG_KEY, AthkarLog, Session, completeItem, emptySession, progress, sessionFor, streak, tap } from './athkarEngine';
import { usePrayer } from '../prayer/PrayerContext';
import { localDay } from '../habits/habitData';
import { logKind } from '../habits/habitLog';
import { addDays } from '../quran/hifz/hifzEngine';
import { C, F, ar } from '../ui/theme';

export default function AthkarScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { todayTimes } = usePrayer();
  const [session, setSession] = useState<Session>(route?.params?.session || sessionFor(new Date(), todayTimes));
  const [log, setLog] = useState<AthkarLog>({});
  const [justDone, setJustDone] = useState(false);
  const day = localDay();
  const logRef = useRef(log); logRef.current = log;
  const player = useAudioPlayer(null); const status = useAudioPlayerStatus(player);
  const [playing, setPlaying] = useState<number | null>(null);

  useEffect(() => { AsyncStorage.getItem(ATHKAR_LOG_KEY).then(r => { if (r) setLog(JSON.parse(r)); }).catch(() => {}); }, []);
  const persist = (next: AthkarLog) => { setLog(next); AsyncStorage.setItem(ATHKAR_LOG_KEY, JSON.stringify(next)).catch(() => {}); };
  const cur = log[day]?.[session] || emptySession();

  // time spent reading, counted only while this screen is open and the app is active
  useFocusEffect(useCallback(() => {
    let active = AppState.currentState === 'active';
    const sub = AppState.addEventListener('change', s => { active = s === 'active'; });
    const t = setInterval(() => {
      if (!active) return;
      const L = logRef.current, s = L[day]?.[session] || emptySession();
      if (s.done) return;
      persist({ ...L, [day]: { ...(L[day] || {}), [session]: { ...s, seconds: s.seconds + 5 } } });
    }, 5000);
    return () => { clearInterval(t); sub.remove(); player.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, day]));

  const update = (fn: (s: typeof cur) => typeof cur) => {
    const next = fn(cur);
    persist({ ...log, [day]: { ...(log[day] || {}), [session]: next } });
    if (next.done && !cur.done) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setJustDone(true);
      logKind([session === 'morning' ? 'adhkar_morning' : 'adhkar_evening'], 1);
    } else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
  const onTap = (d: Dhikr) => update(s => tap(s, d, ATHKAR, new Date().toISOString()));
  const onFinishItem = (d: Dhikr) => update(s => completeItem(s, d, ATHKAR, new Date().toISOString()));
  const play = (d: Dhikr) => {
    if (playing === d.id && status.playing) { player.pause(); return; }
    player.replace({ uri: d.audio }); player.play(); setPlaying(d.id);
  };

  const pr = progress(cur, ATHKAR);
  const st = streak(log, session, day, addDays);
  const title = session === 'morning' ? 'أذكار الصباح' : 'أذكار المساء';
  const minutes = Math.round((cur.seconds || 0) / 60);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={s.head}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}><Text style={s.back}>رجوع</Text></Pressable>
        <Text style={s.title}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={s.seg}>
        {(['morning', 'evening'] as Session[]).map(x => (
          <Pressable key={x} onPress={() => { setSession(x); setJustDone(false); }} style={[s.segItem, session === x && s.segOn]}>
            <Text style={[s.segText, session === x && s.segTextOn]}>{x === 'morning' ? 'الصباح 🌅' : 'المساء 🌇'}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.summary}>
        <View style={s.rowBetween}>
          <Text style={s.sumBig}>{ar(pr.items)} من {ar(pr.total)}</Text>
          <Text style={s.sumSmall}>{cur.done ? 'أكملتها اليوم ✓' : minutes ? `${ar(minutes)} دقيقة قراءة` : 'اضغط على الذكر لعدّه'}</Text>
        </View>
        <View style={s.track}><View style={[s.fill, { width: `${Math.round(pr.ratio * 100)}%` }]} /></View>
        {st > 1 ? <Text style={s.streak}>{ar(st)} أيام متتالية</Text> : null}
      </View>
      {justDone && (
        <View style={s.doneBanner}><Text style={s.doneTitle}>تقبّل الله منك</Text><Text style={s.doneSub}>أكملت {title}، وستجد أثرها في واحتك.</Text></View>
      )}
      <FlatList
        data={ATHKAR}
        keyExtractor={d => String(d.id)}
        contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 30, gap: 12 }}
        renderItem={({ item, index }) => {
          const n = cur.counts[item.id] || 0, full = n >= item.repeat;
          return (
            <Pressable onPress={() => onTap(item)} style={[s.card, full && s.cardDone]} accessibilityRole="button" accessibilityLabel={`الذكر ${index + 1}، ${n} من ${item.repeat}`}>
              <Text style={[s.text, full && { color: '#8a8475' }]}>{item.text}</Text>
              {session === 'evening' && item.text.includes('[') ? <Text style={s.note}>في المساء تُقال الصيغة التي بين المعقوفين.</Text> : null}
              <View style={s.cardFoot}>
                <Pressable onPress={() => play(item)} hitSlop={8} style={s.audio}><Text style={s.audioText}>{playing === item.id && status.playing ? '⏸ إيقاف' : '▶ استمع'}</Text></Pressable>
                {item.repeat >= 10 && !full ? <Pressable onPress={() => onFinishItem(item)} hitSlop={8}><Text style={s.finish}>قرأتها كاملة</Text></Pressable> : <View />}
                <View style={[s.counter, full && s.counterDone]}><Text style={[s.counterText, full && { color: '#fff' }]}>{full ? '✓' : `${ar(n)} / ${ar(item.repeat)}`}</Text></View>
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={<Text style={s.source}>النصوص من «حصن المسلم» (hisnmuslim.com)، الفصل ٢٧: أذكار الصباح والمساء.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  head: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  back: { fontFamily: F.s, fontSize: 14, color: C.gold },
  title: { fontFamily: F.b, fontSize: 20, color: C.ink },
  seg: { flexDirection: 'row-reverse', marginHorizontal: 14, backgroundColor: C.chip, borderRadius: 14, padding: 4 },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  segOn: { backgroundColor: C.card },
  segText: { fontFamily: F.s, fontSize: 14, color: C.muted },
  segTextOn: { color: C.ink },
  summary: { marginHorizontal: 14, marginTop: 12, backgroundColor: C.green, borderRadius: 18, padding: 14, gap: 8 },
  rowBetween: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  sumBig: { fontFamily: F.b, fontSize: 18, color: '#fff' },
  sumSmall: { fontFamily: F.m, fontSize: 12, color: '#d8e6dd' },
  track: { height: 7, backgroundColor: 'rgba(255,255,255,.2)', borderRadius: 7, overflow: 'hidden' },
  fill: { height: 7, backgroundColor: C.goldSoft },
  streak: { fontFamily: F.m, fontSize: 12, color: C.goldSoft, textAlign: 'right' },
  doneBanner: { marginHorizontal: 14, marginTop: 10, backgroundColor: '#fbf0d9', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#ecd29a' },
  doneTitle: { fontFamily: F.b, fontSize: 16, color: C.ink, textAlign: 'right' },
  doneSub: { fontFamily: F.r, fontSize: 13, color: C.ink2, textAlign: 'right' },
  card: { backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.line, gap: 10 },
  cardDone: { opacity: 0.7 },
  text: { fontFamily: F.q, fontSize: 21, lineHeight: 44, color: '#29231b', textAlign: 'right', writingDirection: 'rtl' },
  note: { fontFamily: F.m, fontSize: 12, color: C.gold, textAlign: 'right' },
  cardFoot: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  audio: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: C.chip },
  audioText: { fontFamily: F.s, fontSize: 12, color: C.ink },
  finish: { fontFamily: F.s, fontSize: 12, color: C.gold },
  counter: { minWidth: 76, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 2, borderColor: C.green, alignItems: 'center' },
  counterDone: { backgroundColor: C.green },
  counterText: { fontFamily: F.b, fontSize: 15, color: C.green },
  source: { fontFamily: F.r, fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 8 },
});
