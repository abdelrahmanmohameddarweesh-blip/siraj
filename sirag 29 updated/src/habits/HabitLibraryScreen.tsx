import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIES, HabitDef, LIBRARY, MOMENTS, PlanPreset, Answers, anchorLabel, planFromPreset, recommend } from './library';
import { HabitPlan, HabitReminder, ReminderAnchor } from './habitData';
import { readPlans, savePlan } from './habitLog';
import { usePrayer } from '../prayer/PrayerContext';
import { requestPermissionAndSync } from '../notifications/scheduler';
import { C, F, ar } from '../ui/theme';

const CONFIG_KEY = 'batl-prayer-notification-config-v1';
type Step = 'browse' | 'ask' | 'plans';
const LEVELS: { id: Answers['level']; label: string }[] = [{ id: 'start', label: 'لم أبدأ بعد' }, { id: 'some', label: 'أفعلها أحيانًا' }, { id: 'regular', label: 'أفعلها غالبًا' }];
const TIMES: { id: Answers['time']; label: string }[] = [{ id: 'short', label: '٥ دقائق' }, { id: 'mid', label: '١٥ دقيقة' }, { id: 'long', label: '٣٠ دقيقة أو أكثر' }];
const CLOCKS = ['06:00', '08:00', '10:00', '12:00', '17:00', '19:00', '21:00', '22:00'];

export default function HabitLibraryScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { updateNotifications } = usePrayer();
  const first = !!route?.params?.first;
  const [step, setStep] = useState<Step>('browse');
  const [search, setSearch] = useState('');
  const [mine, setMine] = useState<HabitPlan[]>([]);
  const [def, setDef] = useState<HabitDef | null>(null);
  const [ans, setAns] = useState<Answers>({ level: 'start', time: 'short', moment: null });
  const [chosen, setChosen] = useState<PlanPreset | null>(null);
  const [custom, setCustom] = useState(false);
  const [target, setTarget] = useState(1);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [gradual, setGradual] = useState(true);
  const [reminder, setReminder] = useState<HabitReminder | null>(null);
  const [followUp, setFollowUp] = useState(true);
  const [customName, setCustomName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { readPlans().then(setMine); }, []);
  const rec = useMemo(() => (def ? recommend(def, ans) : null), [def, ans]);
  const filtered = LIBRARY.filter(h => (h.title + h.category + h.blurb).includes(search.trim()));

  const open = (h: HabitDef) => {
    setDef(h); setCustom(false); setChosen(null);
    if (h.kind === 'prayers') { setStep('plans'); setChosen(h.presets[1]); applyPreset(h.presets[1]); } else setStep('ask');
  };
  const applyPreset = (p: PlanPreset) => {
    setTarget(p.ramp ? p.ramp.max : p.target); setFrequency(p.frequency); setGradual(!!p.ramp);
    setReminder(p.reminders[0] || null); setFollowUp(!!p.followUpMin);
  };
  const toPlans = () => { if (!def || !rec) return; setChosen(rec.preset); applyPreset(rec.preset); setStep('plans'); };

  const save = async () => {
    if (!def || !chosen) return;
    setSaving(true);
    try {
      if (def.kind === 'prayers') {
        await updateNotifications({ notificationsEnabled: true, checkinFollowUpEnabled: chosen.id !== 'gentle', preAlertMin: chosen.id === 'strong' ? 10 : 0, preAlertByPrayer: {}, followUpMin: {} });
      }
      const preset: PlanPreset = custom ? {
        ...chosen, target, frequency, ramp: gradual && chosen.ramp ? { ...chosen.ramp, max: target } : undefined,
        reminders: reminder ? [reminder, ...chosen.reminders.slice(1)] : [], followUpMin: followUp ? (chosen.followUpMin || 120) : undefined,
      } : chosen;
      const plan = planFromPreset(def, preset, { gradual: custom ? gradual && !!chosen.ramp : !!preset.ramp });
      await savePlan(plan);
      await AsyncStorage.setItem('sirag-onboarding-complete-v1', 'yes');
      if (plan.reminders?.length || def.kind === 'prayers') await requestPermissionAndSync();
      if (def.kind === 'prayers') navigation.replace('PrayerReminders', { nextRoute: first ? 'Oasis' : 'Home' });
      else first ? navigation.replace('Oasis') : navigation.goBack();
    } catch { Alert.alert('تعذّر الحفظ', 'حاول مرة أخرى'); }
    finally { setSaving(false); }
  };
  const saveCustomHabit = async () => {
    const name = customName.trim();
    if (name.length < 3 || name.length > 60) { Alert.alert('اسم العادة', 'اكتب اسمًا واضحًا من ٣ إلى ٦٠ حرفًا'); return; }
    await savePlan({ id: `custom_${Date.now()}`, title: name, category: 'عاداتي', unit: 'مرة', target: 1, frequency: 'daily', gradual: false, createdAt: new Date().toISOString(), kind: 'count', reminders: [] });
    await AsyncStorage.setItem('sirag-onboarding-complete-v1', 'yes');
    first ? navigation.replace('Oasis') : navigation.goBack();
  };

  const back = () => { if (step === 'plans' && def?.kind !== 'prayers') setStep('ask'); else if (step !== 'browse') setStep('browse'); else navigation.goBack(); };
  const Chip = ({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={[s.chip, on && s.chipOn]}><Text style={[s.chipText, on && s.chipTextOn]}>{label}</Text></Pressable>
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={s.head}>
        {step !== 'browse' || !first ? <Pressable onPress={back} hitSlop={10}><Text style={s.back}>رجوع</Text></Pressable> : <View style={{ width: 40 }} />}
        <Text style={s.title}>{step === 'browse' ? 'مكتبة العادات' : def?.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'browse' && (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 30 }} keyboardShouldPersistTaps="handled">
          {first && <Text style={s.lead}>ما العادة التي تريد بناءها؟ اختر واحدة الآن، ويمكنك إضافة غيرها لاحقًا.</Text>}
          <TextInput style={s.search} value={search} onChangeText={setSearch} placeholder="ابحث عن عادة…" placeholderTextColor="#a99f8a" textAlign="right" />
          {CATEGORIES.map(cat => {
            const list = filtered.filter(h => h.category === cat); if (!list.length) return null;
            return (
              <View key={cat} style={{ marginTop: 14 }}>
                <Text style={s.cat}>{cat}</Text>
                {list.map(h => { const added = mine.some(p => p.id === h.id); return (
                  <Pressable key={h.id} onPress={() => open(h)} style={s.habit}>
                    <Text style={s.icon}>{h.icon}</Text>
                    <View style={{ flex: 1 }}><Text style={s.habitTitle}>{h.title}{added ? '  ✓' : ''}</Text><Text style={s.habitSub}>{h.blurb}</Text></View>
                  </Pressable>
                ); })}
              </View>
            );
          })}
          <View style={[s.card, { marginTop: 18 }]}>
            <Text style={s.cardTitle}>عادة خاصة بك</Text>
            <TextInput style={s.search} value={customName} onChangeText={setCustomName} placeholder="مثال: قراءة سيرة نبوية" placeholderTextColor="#a99f8a" textAlign="right" />
            <Pressable onPress={saveCustomHabit} style={s.secondary}><Text style={s.secondaryText}>أضف العادة</Text></Pressable>
          </View>
          {first && <Pressable onPress={async () => { await AsyncStorage.setItem('sirag-onboarding-complete-v1', 'yes'); navigation.replace('Oasis'); }}><Text style={s.skip}>تخطَّ الآن، سأختار لاحقًا</Text></Pressable>}
        </ScrollView>
      )}

      {step === 'ask' && def && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: insets.bottom + 30 }}>
          <Text style={s.lead}>ثلاثة أسئلة قصيرة لنقترح عليك الخطة الأنسب.</Text>
          <Text style={s.q}>أين أنت الآن مع {def.title}؟</Text>
          <View style={s.chips}>{LEVELS.map(l => <Chip key={l.id} on={ans.level === l.id} label={l.label} onPress={() => setAns({ ...ans, level: l.id })} />)}</View>
          <Text style={s.q}>كم من الوقت يمكنك تخصيصه لها يوميًا؟</Text>
          <View style={s.chips}>{TIMES.map(t => <Chip key={t.id} on={ans.time === t.id} label={t.label} onPress={() => setAns({ ...ans, time: t.id })} />)}</View>
          {!def.fixedMoment && <>
            <Text style={s.q}>متى يناسبك التذكير؟</Text>
            <View style={s.chips}>
              <Chip on={!ans.moment} label="كما تقترحون" onPress={() => setAns({ ...ans, moment: null })} />
              {MOMENTS.map(m => <Chip key={m.id} on={ans.moment === m.id} label={m.label} onPress={() => setAns({ ...ans, moment: m.id })} />)}
            </View>
          </>}
          <Pressable onPress={toPlans} style={[s.primary, { marginTop: 18 }]}><Text style={s.primaryText}>اقترح عليّ خطة</Text></Pressable>
        </ScrollView>
      )}

      {step === 'plans' && def && (
        <ScrollView contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: insets.bottom + 30 }}>
          {def.presets.map(p => {
            const isRec = def.kind === 'prayers' ? p.id === 'steady' : rec?.preset.id === p.id;
            const shown = isRec && rec && def.kind !== 'prayers' ? rec.preset : p;
            const on = !custom && chosen?.id === p.id;
            return (
              <Pressable key={p.id} onPress={() => { setCustom(false); setChosen(shown); applyPreset(shown); }} style={[s.plan, on && s.planOn]}>
                <View style={s.rowBetween}>
                  <Text style={s.planName}>{p.name}</Text>
                  {isRec ? <Text style={s.badge}>الأنسب لك</Text> : null}
                </View>
                <Text style={s.planSum}>{shown.summary}</Text>
                {isRec && def.kind !== 'prayers' && rec ? <Text style={s.reason}>{rec.reason}</Text> : null}
                {isRec && def.kind === 'prayers' ? <Text style={s.reason}>الأذان في وقته وسؤال واحد بعد الجماعة يساعدان على المحافظة دون إزعاج.</Text> : null}
                {def.kind !== 'prayers' && <Text style={s.meta}>الهدف: {ar(shown.ramp ? shown.ramp.start : shown.target)}{shown.ramp ? ` ← ${ar(shown.ramp.max)}` : ''} {def.unit} {shown.frequency === 'weekly' ? 'أسبوعيًا' : 'يوميًا'}</Text>}
                {shown.reminders.length > 0 && <Text style={s.meta}>التذكير: {shown.reminders.map(anchorLabel).join('، ')}{shown.followUpMin ? '، ومتابعة إن لم تكملها' : ''}</Text>}
              </Pressable>
            );
          })}
          {def.kind !== 'prayers' && (
            <Pressable onPress={() => { setCustom(true); if (!chosen && rec) setChosen(rec.preset); }} style={[s.plan, custom && s.planOn]}>
              <Text style={s.planName}>خطة مخصصة</Text>
              <Text style={s.planSum}>ابدأ من الخطة المقترحة وعدّل ما تريد.</Text>
              {custom && (
                <View style={{ gap: 10, marginTop: 8 }}>
                  <View style={s.rowBetween}>
                    <Text style={s.q}>الهدف ({def.unit})</Text>
                    <View style={s.stepper}>
                      <Pressable onPress={() => setTarget(t => Math.max(1, t - (t > 20 ? 5 : 1)))} style={s.stepBtn}><Text style={s.stepText}>−</Text></Pressable>
                      <Text style={s.stepVal}>{ar(target)}</Text>
                      <Pressable onPress={() => setTarget(t => Math.min(1000, t + (t >= 20 ? 5 : 1)))} style={s.stepBtn}><Text style={s.stepText}>+</Text></Pressable>
                    </View>
                  </View>
                  <View style={s.chips}><Chip on={frequency === 'daily'} label="يوميًا" onPress={() => setFrequency('daily')} /><Chip on={frequency === 'weekly'} label="أسبوعيًا" onPress={() => setFrequency('weekly')} /></View>
                  {chosen?.ramp ? <View style={s.rowBetween}><Text style={s.q}>زيادة تدريجية حتى الهدف</Text><Switch value={gradual} onValueChange={setGradual} /></View> : null}
                  <Text style={s.q}>وقت التذكير</Text>
                  <View style={s.chips}>
                    <Chip on={!reminder} label="بدون تذكير" onPress={() => setReminder(null)} />
                    {MOMENTS.map(m => <Chip key={m.id} on={reminder?.anchor === m.id} label={m.label} onPress={() => setReminder({ anchor: m.id as ReminderAnchor, offsetMin: 15 })} />)}
                  </View>
                  <View style={s.chips}>{CLOCKS.map(c => <Chip key={c} on={reminder?.anchor === 'clock' && reminder.clock === c} label={c} onPress={() => setReminder({ anchor: 'clock', offsetMin: 0, clock: c })} />)}</View>
                  {reminder ? <View style={s.rowBetween}><Text style={s.q}>ذكّرني مرة أخرى إن لم أكملها</Text><Switch value={followUp} onValueChange={setFollowUp} /></View> : null}
                </View>
              )}
            </Pressable>
          )}
          <Pressable disabled={saving || !chosen} onPress={save} style={[s.primary, { marginTop: 6 }, (saving || !chosen) && { opacity: .5 }]}>
            <Text style={s.primaryText}>{def.kind === 'prayers' ? 'فعّل تنبيهات الصلاة' : 'ابدأ هذه الخطة'}</Text>
          </Pressable>
          <Text style={s.note}>يمكنك تغيير الخطة في أي وقت من مكتبة العادات.</Text>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  head: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  back: { fontFamily: F.s, fontSize: 14, color: C.gold },
  title: { fontFamily: F.b, fontSize: 20, color: C.ink },
  lead: { fontFamily: F.r, fontSize: 14, color: C.ink2, textAlign: 'right', lineHeight: 24, marginBottom: 6 },
  search: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 12, fontFamily: F.r, fontSize: 15, color: C.ink },
  cat: { fontFamily: F.b, fontSize: 15, color: C.gold, textAlign: 'right', marginBottom: 6 },
  habit: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.line, marginBottom: 8 },
  icon: { fontSize: 26, width: 36, textAlign: 'center' },
  habitTitle: { fontFamily: F.s, fontSize: 16, color: C.ink, textAlign: 'right' },
  habitSub: { fontFamily: F.r, fontSize: 12, color: C.muted, textAlign: 'right', marginTop: 2 },
  card: { backgroundColor: C.card, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.line, gap: 10 },
  cardTitle: { fontFamily: F.b, fontSize: 16, color: C.ink, textAlign: 'right' },
  skip: { fontFamily: F.m, fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 16 },
  q: { fontFamily: F.s, fontSize: 15, color: C.ink, textAlign: 'right', marginTop: 8 },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: C.chip },
  chipOn: { backgroundColor: C.green },
  chipText: { fontFamily: F.s, fontSize: 13, color: C.ink },
  chipTextOn: { color: '#fff' },
  plan: { backgroundColor: C.card, borderRadius: 18, padding: 14, borderWidth: 2, borderColor: C.line, gap: 4 },
  planOn: { borderColor: C.green, backgroundColor: '#f4f8f3' },
  rowBetween: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  planName: { fontFamily: F.b, fontSize: 17, color: C.ink, textAlign: 'right' },
  badge: { fontFamily: F.s, fontSize: 11, color: '#fff', backgroundColor: C.gold, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, overflow: 'hidden' },
  planSum: { fontFamily: F.r, fontSize: 14, color: C.ink2, textAlign: 'right', lineHeight: 22 },
  reason: { fontFamily: F.m, fontSize: 12, color: C.green, textAlign: 'right', lineHeight: 20 },
  meta: { fontFamily: F.r, fontSize: 12, color: C.muted, textAlign: 'right' },
  stepper: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  stepBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: F.b, fontSize: 18, color: C.ink },
  stepVal: { fontFamily: F.b, fontSize: 18, color: C.ink, minWidth: 40, textAlign: 'center' },
  primary: { backgroundColor: C.green, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryText: { fontFamily: F.b, fontSize: 16, color: '#fff' },
  secondary: { borderWidth: 1, borderColor: C.green, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { fontFamily: F.b, fontSize: 15, color: C.green },
  note: { fontFamily: F.r, fontSize: 12, color: C.muted, textAlign: 'center' },
});
