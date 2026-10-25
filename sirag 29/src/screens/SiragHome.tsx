import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { HabitPlan, LOG_KEY, PLANS_KEY, localDay } from '../habits/habitData';
import { useHomePrayerTimes } from '../prayer/useHomePrayerTimes';
import OasisHero, { OasisSummary } from '../oasis/OasisHero';
import { useFocusEffect } from '@react-navigation/native';
import { nudgeLabel, oasisWaiting } from '../oasis/oasisStatus';
import { effectiveTarget } from '../habits/library';
import { hasPermission, requestPermissionAndSync, syncNotificationsSoon } from '../notifications/scheduler';

const C = { ink: '#0f3a33', ink2: '#2b4a43', muted: '#7d7766', gold: '#c9973f', goldSoft: '#f1c76a', paper: '#f4ecdc', card: '#fffaf0', line: '#e6dac2', night: '#0f2a24' };
const F = { r: 'Plex', m: 'PlexMedium', s: 'PlexSemi', b: 'PlexBold' };
const PRAYERS: { key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; name: string }[] = [
  { key: 'fajr', name: 'الفجر' }, { key: 'dhuhr', name: 'الظهر' }, { key: 'asr', name: 'العصر' }, { key: 'maghrib', name: 'المغرب' }, { key: 'isha', name: 'العشاء' },
];
const METHODS = ['Egyptian', 'UmmAlQura', 'MuslimWorldLeague', 'NorthAmerica', 'Karachi', 'Dubai', 'Qatar', 'Kuwait'] as const;
const ar = (n: number) => n.toLocaleString('ar-EG');
const METHOD_AR: Record<string, string> = { Egyptian: 'الهيئة المصرية', UmmAlQura: 'أم القرى', MuslimWorldLeague: 'رابطة العالم الإسلامي', NorthAmerica: 'أمريكا الشمالية', Karachi: 'كراتشي', Dubai: 'دبي', Qatar: 'قطر', Kuwait: 'الكويت' };

function Icon({ name, size = 22, color = C.ink }: { name: 'book' | 'arch' | 'chart' | 'plus' | 'pin' | 'palm' | 'home' | 'target' | 'sun' | 'brain'; size?: number; color?: string }) {
  const p = { stroke: color, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'book' && <><Path {...p} d="M4 5.5c2.5-1 5-1 8 1 3-2 5.5-2 8-1V19c-2.5-1-5-1-8 1-3-2-5.5-2-8-1z" /><Path {...p} d="M12 6.5V20" /></>}
      {name === 'arch' && <><Path {...p} d="M5 21V11a7 7 0 0 1 14 0v10" /><Path {...p} d="M9 21v-6a3 3 0 0 1 6 0v6" /><Path {...p} d="M3 21h18" /></>}
      {name === 'chart' && <><Path {...p} d="M4 20h16" /><Rect {...p} x="6" y="11" width="3" height="7" rx="1" /><Rect {...p} x="11" y="7" width="3" height="11" rx="1" /><Rect {...p} x="16" y="13" width="3" height="5" rx="1" /></>}
      {name === 'plus' && <><Circle {...p} cx="12" cy="12" r="9" /><Path {...p} d="M12 8v8M8 12h8" /></>}
      {name === 'pin' && <><Path {...p} d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" /><Circle {...p} cx="12" cy="10" r="2.2" /></>}
      {name === 'palm' && <><Path {...p} d="M12 21V10" /><Path {...p} d="M12 10c-1-3-4-4-7-3 2 0 5 1 7 3zM12 10c1-3 4-4 7-3-2 0-5 1-7 3zM12 10c-2-2-2-5 0-7 2 2 2 5 0 7z" /><Path {...p} d="M5 21h14" /></>}
      {name === 'home' && <><Path {...p} d="M4 11l8-7 8 7" /><Path {...p} d="M6 10v10h12V10" /></>}
      {name === 'sun' && <><Circle {...p} cx="12" cy="12" r="4" /><Path {...p} d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /></>}
      {name === 'brain' && <><Path {...p} d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 0V7a3 3 0 0 0-3-3z" /><Path {...p} d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 0" /></>}
      {name === 'target' && <><Circle {...p} cx="12" cy="12" r="8.5" /><Circle {...p} cx="12" cy="12" r="4.5" /><Circle cx="12" cy="12" r="1.4" fill={color} /></>}
    </Svg>
  );
}

function untilText(ms: number) {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 1) return 'الآن';
  if (mins < 60) return `بعد ${ar(mins)} ${mins <= 10 && mins >= 3 ? 'دقائق' : 'دقيقة'}`;
  const h = Math.floor(mins / 60), m = mins % 60;
  const hs = h === 1 ? 'ساعة' : h === 2 ? 'ساعتين' : `${ar(h)} ساعات`;
  return m ? `بعد ${hs} و${ar(m)} د` : `بعد ${hs}`;
}

export default function SiragHome({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const prayer = useHomePrayerTimes();
  const day = localDay();
  const [plans, setPlans] = useState<HabitPlan[]>([]);
  const [logs, setLogs] = useState<Record<string, Record<string, number>>>({});
  const [amount, setAmount] = useState<Record<string, string>>({});
  const [cityPicker, setCityPicker] = useState(false);
  const [methodPicker, setMethodPicker] = useState(false);
  const [summary, setSummary] = useState<OasisSummary | null>(null);
  const [now, setNow] = useState(Date.now());
  const [nudge, setNudge] = useState<string | null>(null);
  const [notifOk, setNotifOk] = useState(true);
  useFocusEffect(useCallback(() => { hasPermission().then(setNotifOk); }, []));
  useFocusEffect(useCallback(() => { let alive = true; oasisWaiting().then(w => { if (alive) setNudge(nudgeLabel(w)); }).catch(() => {}); return () => { alive = false; }; }, []));

  const load = useCallback(async () => {
    try {
      const [p, l] = await Promise.all([AsyncStorage.getItem(PLANS_KEY), AsyncStorage.getItem(LOG_KEY)]);
      setPlans(p ? JSON.parse(p) : []); setLogs(l ? JSON.parse(l) : {});
    } catch { /* keep previous */ }
  }, []);
  useEffect(() => { const unsub = navigation.addListener('focus', load); load(); return unsub; }, [navigation, load]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  const log = async (id: string, increment: number) => {
    const updated = { ...logs, [day]: { ...(logs[day] || {}), [id]: Math.max(0, (logs[day]?.[id] || 0) + increment) } };
    setLogs(updated);
    try { await AsyncStorage.setItem(LOG_KEY, JSON.stringify(updated)); syncNotificationsSoon(); } catch { Alert.alert('خطأ', 'لم نتمكن من حفظ تقدمك'); }
  };

  const fmt = (d?: Date) => (d ? d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' }) : '--:--');
  const next = useMemo(() => prayer.times ? PRAYERS.find(p => prayer.times![p.key].getTime() > now) : undefined, [prayer.times, now]);
  const hour = new Date(now).getHours();
  const greeting = hour < 12 ? 'صباح الخير' : 'مساء الخير';
  const daily = plans.filter(p => p.frequency === 'daily');
  const doneCount = daily.filter(p => (logs[day]?.[p.id] || 0) >= effectiveTarget(p, day)).length;
  const adhkarSession = hour >= 4 && hour < 15 ? 'morning' : 'evening';
  const openOasis = () => navigation.navigate('Oasis');

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}>
        {/* living oasis hero */}
        <View style={[s.hero, { height: 420 + insets.top }]}>
          <OasisHero onOpen={openOasis} onSummary={setSummary} />
          <LinearGradient pointerEvents="none" colors={['rgba(7,22,28,.78)', 'rgba(7,22,28,.25)', 'rgba(7,22,28,0)']} style={[s.heroTop, { height: 170 + insets.top }]} />
          <LinearGradient pointerEvents="none" colors={['rgba(244,236,220,0)', 'rgba(244,236,220,.0)', C.paper]} locations={[0, 0.55, 1]} style={s.heroBottom} />
          <View pointerEvents="box-none" style={[s.heroHead, { paddingTop: insets.top + 14 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.salam}>السلام عليكم</Text>
              <Text style={s.greet}>{greeting}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="ادخل واحتك" onPress={openOasis} style={s.glassBtn}><Icon name="palm" color="#fff" /></Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={openOasis} style={s.oasisChip}>
            <View style={{ flex: 1 }}>
              <Text style={s.oasisName}>{summary?.name || 'واحتك'}</Text>
              {nudge ? <Text style={s.nudge}>{nudge}</Text> : null}
              <Text style={s.oasisMeta}>{summary ? `${ar(summary.grown)} من ${ar(summary.plots)} نبتة${summary.residents ? ` · ${ar(summary.residents)} من السكان` : ''}` : 'كل عمل طيب يترك أثرًا'}</Text>
            </View>
            <View style={s.enter}><Text style={s.enterText}>ادخل واحتك</Text>{nudge ? <View style={s.dot} /> : null}</View>
          </Pressable>
        </View>

        {/* next prayer */}
        <LinearGradient colors={['#123f37', '#0d2c27']} style={s.prayerCard}>
          <View style={s.rowBetween}>
            <View>
              <Text style={s.kicker}>الصلاة القادمة</Text>
              <Text style={s.nextName}>{next ? next.name : 'الفجر'}</Text>
            </View>
            <View style={{ alignItems: 'flex-start' }}>
              <Text style={s.nextTime}>{next ? fmt(prayer.times?.[next.key]) : fmt(prayer.times?.fajr)}</Text>
              <Text style={s.until}>{next && prayer.times ? untilText(prayer.times[next.key].getTime() - now) : 'غدًا'}</Text>
            </View>
          </View>
          <View style={s.prayerRow}>
            {PRAYERS.map(p => {
              const on = next?.key === p.key;
              return (
                <Pressable key={p.key} onPress={() => navigation.navigate('PrayerTracker')} style={[s.pItem, on && s.pItemOn]}>
                  <Text style={[s.pName, on && s.pOn]}>{p.name}</Text>
                  <Text style={[s.pTime, on && s.pOn]}>{fmt(prayer.times?.[p.key])}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={s.rowBetween}>
            <Pressable onPress={() => { setCityPicker(!cityPicker); setMethodPicker(false); }} style={s.inline}><Icon name="pin" size={15} color={C.goldSoft} /><Text style={s.link}>{prayer.location?.cityNameAr || 'اختر مدينتك'}</Text></Pressable>
            <Pressable onPress={async () => { const ok = await prayer.detect(); if (!ok) Alert.alert('الموقع', 'لم يتم السماح بالموقع. اختر مدينتك يدويًا.'); }} style={s.inline}><Icon name="target" size={15} color={C.goldSoft} /><Text style={s.link}>موقعي الحالي</Text></Pressable>
            <Pressable onPress={() => { setMethodPicker(!methodPicker); setCityPicker(false); }}><Text style={s.link}>{METHOD_AR[prayer.method] || prayer.method}</Text></Pressable>
          </View>
          {cityPicker && (
            <ScrollView style={s.picker} nestedScrollEnabled>
              {prayer.cities.map(c => (
                <Pressable key={c.id} onPress={async () => { await prayer.setCity(c.id); setCityPicker(false); }} style={s.pickRow}><Text style={s.pickText}>{c.cityNameAr} · {c.countryNameAr}</Text></Pressable>
              ))}
            </ScrollView>
          )}
          {methodPicker && (
            <View style={s.picker}>
              {METHODS.map(m => (
                <Pressable key={m} onPress={async () => { await prayer.changeMethod(m); setMethodPicker(false); }} style={s.pickRow}><Text style={s.pickText}>{METHOD_AR[m] || m}</Text></Pressable>
              ))}
            </View>
          )}
        </LinearGradient>
        <Text style={s.note}>الأوقات محسوبة وفق موقعك وطريقة الحساب المختارة. تحقق من مواقيت مسجدك المحلي عند الحاجة.</Text>

        {!notifOk && (
          <Pressable onPress={async () => setNotifOk(await requestPermissionAndSync())} style={s.notifCard}>
            <Text style={s.notifTitle}>فعّل الأذان والتذكيرات 🔔</Text>
            <Text style={s.notifSub}>الأذان في وقته، وسؤال بعد الجماعة: هل صليت؟ وتذكير بعاداتك في أوقاتها.</Text>
          </Pressable>
        )}

        {/* today's habits */}
        <View style={s.section}>
          <View style={s.rowBetween}>
            <Text style={s.h2}>عاداتي اليوم</Text>
            {daily.length > 0 && <Text style={s.count}>{ar(doneCount)} / {ar(daily.length)}</Text>}
          </View>
          {plans.length === 0 ? (
            <Pressable onPress={() => navigation.navigate('HabitSetup', { first: false })} style={s.empty}>
              <Icon name="plus" color={C.gold} />
              <Text style={s.emptyText}>ابدأ باختيار عادة إسلامية تناسبك</Text>
            </Pressable>
          ) : plans.map(p => {
            const value = logs[day]?.[p.id] || 0;
            const tgt = effectiveTarget(p, day);
            const pct = Math.min(100, Math.round((value / tgt) * 100));
            const done = value >= tgt;
            const open = p.kind === 'adhkar_morning' ? () => navigation.navigate('Adhkar', { session: 'morning' }) : p.kind === 'adhkar_evening' ? () => navigation.navigate('Adhkar', { session: 'evening' }) : (p.kind === 'hifz' || p.kind === 'hifz_review') ? () => navigation.navigate('Hifz') : null;
            return (
              <View key={p.id} style={s.habit}>
                <View style={s.rowBetween}>
                  <Text style={s.habitTitle}>{p.title}</Text>
                  <Text style={[s.habitVal, done && { color: '#12816d' }]}>{done ? 'تم ✓' : `${ar(value)} / ${ar(tgt)} ${p.unit}`}</Text>
                </View>
                <View style={s.track}><View style={[s.fill, { width: `${pct}%` }]} /></View>
                <View style={s.habitActions}>
                  {/قرآن|مصحف|تلاوة/.test(p.title) && (
                    <Pressable onPress={() => navigation.navigate('QuranReader')} style={s.ghost}><Text style={s.ghostText}>افتح المصحف</Text></Pressable>
                  )}
                  <View style={{ flex: 1 }} />
                  {open ? <Pressable onPress={open} style={s.logBtn}><Text style={s.logText}>{done ? 'افتح' : 'ابدأ'}</Text></Pressable> : <>
                  <Pressable onPress={() => log(p.id, -1)} style={s.stepBtn} accessibilityLabel="إنقاص"><Text style={s.stepText}>−</Text></Pressable>
                  <TextInput style={s.input} placeholder="عدد" placeholderTextColor="#a99f8a" keyboardType="number-pad" value={amount[p.id] || ''} onChangeText={v => setAmount({ ...amount, [p.id]: v })} />
                  <Pressable onPress={() => { const n = Number(amount[p.id] || 1); if (Number.isInteger(n) && n > 0 && n <= 10000) { log(p.id, n); setAmount({ ...amount, [p.id]: '' }); } else Alert.alert('العدد', 'أدخل عددًا صحيحًا'); }} style={s.logBtn}>
                    <Text style={s.logText}>سجّل</Text>
                  </Pressable></>}
                </View>
              </View>
            );
          })}
          {plans.length > 0 && (
            <Pressable onPress={() => navigation.navigate('HabitSetup', { first: false })} style={s.addRow}><Icon name="plus" size={18} color={C.gold} /><Text style={s.addText}>إضافة عادة</Text></Pressable>
          )}
        </View>

        {/* quick doors */}
        <View style={s.grid}>
          {([
            ['book', 'القرآن الكريم', 'اقرأ واستمع', 'QuranReader', undefined],
            ['sun', adhkarSession === 'morning' ? 'أذكار الصباح' : 'أذكار المساء', 'من حصن المسلم', 'Adhkar', { session: adhkarSession }],
            ['brain', 'حفظ القرآن', 'ورد واختبار ومراجعة', 'Hifz', undefined],
            ['arch', 'صلواتي', 'سجّل صلاتك', 'PrayerTracker', undefined],
            ['chart', 'إحصائياتي', 'أسبوعك بالأرقام', 'Insights', undefined],
            ['palm', 'واحتي', 'ازرع واسقِ', 'Oasis', undefined],
          ] as const).map(([icon, title, sub, to, params]) => (
            <Pressable key={to} onPress={() => navigation.navigate(to, params)} style={s.tile}>
              <View style={s.tileIcon}><Icon name={icon} color={C.ink} /></View>
              <Text style={s.tileTitle}>{title}</Text>
              <Text style={s.tileSub}>{sub}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* bottom navigation */}
      <View style={[s.tabs, { paddingBottom: insets.bottom + 8 }]}>
        {([
          ['home', 'الرئيسية', 'Home'],
          ['palm', 'الواحة', 'Oasis'],
          ['arch', 'صلواتي', 'PrayerTracker'],
          ['chart', 'الإحصائيات', 'Insights'],
        ] as const).map(([icon, label, to]) => {
          const on = to === 'Home';
          return (
            <Pressable key={to} onPress={() => !on && navigation.navigate(to)} style={s.tab} accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <Icon name={icon} color={on ? C.gold : C.ink2} />
              <Text style={[s.tabLabel, on && { color: C.gold }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  hero: { width: '100%', overflow: 'hidden', backgroundColor: '#d9b77e' },
  heroTop: { position: 'absolute', top: 0, left: 0, right: 0 },
  heroBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 },
  heroHead: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 20 },
  salam: { fontFamily: F.m, fontSize: 13, color: '#e6eadf', textAlign: 'right' },
  greet: { fontFamily: F.b, fontSize: 26, color: '#fff', textAlign: 'right' },
  glassBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(16,26,22,.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)', alignItems: 'center', justifyContent: 'center' },
  oasisChip: { position: 'absolute', left: 16, right: 16, bottom: 58, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(16,30,26,.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' },
  oasisName: { fontFamily: F.b, fontSize: 16, color: '#fff', textAlign: 'right' },
  oasisMeta: { fontFamily: F.r, fontSize: 12, color: '#e9e2cf', textAlign: 'right', marginTop: 1 },
  enter: { backgroundColor: C.goldSoft, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 },
  enterText: { fontFamily: F.b, fontSize: 14, color: C.night },
  nudge: { fontFamily: F.s, fontSize: 13, color: C.goldSoft, textAlign: 'right' },
  dot: { position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: 6, backgroundColor: '#e2553a', borderWidth: 2, borderColor: '#fff' },
  prayerCard: { marginHorizontal: 14, marginTop: -40, borderRadius: 24, padding: 18, gap: 14, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  rowBetween: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontFamily: F.m, fontSize: 12, color: '#b9c9bf', textAlign: 'right' },
  nextName: { fontFamily: F.b, fontSize: 30, color: '#fff', textAlign: 'right', lineHeight: 42 },
  nextTime: { fontFamily: F.s, fontSize: 22, color: C.goldSoft },
  until: { fontFamily: F.r, fontSize: 13, color: '#d8e2d9' },
  prayerRow: { flexDirection: 'row-reverse', gap: 6 },
  pItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.07)' },
  pItemOn: { backgroundColor: C.goldSoft },
  pName: { fontFamily: F.s, fontSize: 12, color: '#f1ece0' },
  pTime: { fontFamily: F.r, fontSize: 11, color: '#c7d3ca', marginTop: 2 },
  pOn: { color: C.night },
  inline: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  link: { fontFamily: F.m, fontSize: 12, color: C.goldSoft },
  picker: { maxHeight: 220, backgroundColor: 'rgba(255,255,255,.06)', borderRadius: 14 },
  pickRow: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,.12)' },
  pickText: { fontFamily: F.r, fontSize: 14, color: '#f1ece0', textAlign: 'right' },
  note: { fontFamily: F.r, fontSize: 11, color: C.muted, textAlign: 'right', marginHorizontal: 22, marginTop: 8 },
  section: { marginHorizontal: 14, marginTop: 22, backgroundColor: C.card, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: C.line },
  h2: { fontFamily: F.b, fontSize: 19, color: C.ink, textAlign: 'right' },
  count: { fontFamily: F.s, fontSize: 14, color: C.gold },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 22 },
  emptyText: { fontFamily: F.m, fontSize: 14, color: C.ink2 },
  habit: { paddingVertical: 14, borderBottomWidth: 1, borderColor: '#efe5d1', gap: 9 },
  habitTitle: { fontFamily: F.s, fontSize: 16, color: C.ink, textAlign: 'right', flex: 1 },
  habitVal: { fontFamily: F.m, fontSize: 12, color: C.muted },
  track: { height: 7, backgroundColor: '#ebe3d2', borderRadius: 7, overflow: 'hidden' },
  fill: { height: 7, backgroundColor: '#12816d', borderRadius: 7 },
  habitActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  ghost: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#efe6d3' },
  ghostText: { fontFamily: F.s, fontSize: 12, color: C.ink },
  stepBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#efe6d3', alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: F.b, fontSize: 18, color: C.ink },
  input: { width: 56, height: 38, borderWidth: 1, borderColor: '#ddd0b6', borderRadius: 12, textAlign: 'center', fontFamily: F.m, color: C.ink, backgroundColor: '#fff' },
  logBtn: { height: 38, paddingHorizontal: 16, borderRadius: 12, backgroundColor: C.ink, justifyContent: 'center' },
  logText: { fontFamily: F.b, fontSize: 14, color: '#fff' },
  addRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 14 },
  addText: { fontFamily: F.s, fontSize: 14, color: C.gold },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginHorizontal: 14, marginTop: 14 },
  tile: { width: '48.4%', backgroundColor: C.card, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: C.line, gap: 2 },
  tileIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#efe6d3', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginBottom: 6 },
  tileTitle: { fontFamily: F.b, fontSize: 15, color: C.ink, textAlign: 'right' },
  tileSub: { fontFamily: F.r, fontSize: 12, color: C.muted, textAlign: 'right' },
  notifCard: { marginHorizontal: 14, marginTop: 16, backgroundColor: '#fbf0d9', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#ecd29a', gap: 4 },
  notifTitle: { fontFamily: F.b, fontSize: 16, color: C.ink, textAlign: 'right' },
  notifSub: { fontFamily: F.r, fontSize: 13, color: C.ink2, textAlign: 'right', lineHeight: 21 },
  tabs: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row-reverse', justifyContent: 'space-around', backgroundColor: 'rgba(255,250,240,.97)', borderTopWidth: 1, borderColor: C.line, paddingTop: 9 },
  tab: { alignItems: 'center', gap: 2, minWidth: 64 },
  tabLabel: { fontFamily: F.s, fontSize: 11, color: C.ink2 },
});
