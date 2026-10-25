import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { surahsList } from '../../data/surahs';
import { localDay } from '../../habits/habitData';
import { effectiveTarget } from '../../habits/library';
import { logKind, readPlans } from '../../habits/habitLog';
import { getSurahText, ayahAudio } from '../surahText';
import {
  Answer, AyahText, HifzState, Order, PASS_SCORE, Question, buildNewTest, buildReview, completeToday, dueKeys, keyOf, newState,
  parseKey, reviewAnswer, score, startToday, todaysKeys, addDays,
} from './hifzEngine';
import { C, F, ar } from '../../ui/theme';

const KEY = 'sirag-hifz-v1';
const lengths = surahsList.map(s => s.totalAyahs);
const surahName = (n: number) => surahsList[n - 1]?.name || '';
type Mode = 'loading' | 'setup' | 'pickSurah' | 'home' | 'quiz' | 'result';

export default function HifzScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const day = localDay();
  const [mode, setMode] = useState<Mode>('loading');
  const [st, setSt] = useState<HifzState | null>(null);
  const [perDay, setPerDay] = useState(3);
  const [texts, setTexts] = useState<Record<string, AyahText>>({});
  const [pool, setPool] = useState<AyahText[]>([]);
  const [error, setError] = useState('');
  const [hidden, setHidden] = useState(false);
  const [quiz, setQuiz] = useState<{ kind: 'new' | 'review'; qs: Question[]; i: number; answers: Answer[]; picked: number | null; revealed: boolean } | null>(null);
  const [result, setResult] = useState<{ kind: 'new' | 'review'; score: number; passed: boolean; learned: number; count: number } | null>(null);
  const player = useAudioPlayer(null); const status = useAudioPlayerStatus(player);
  const [playing, setPlaying] = useState<string | null>(null);
  const repeatLeft = useRef(0);

  const save = (next: HifzState) => { setSt(next); AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {}); };

  useEffect(() => { (async () => {
    const plan = (await readPlans()).find(p => p.kind === 'hifz' || p.id === 'quran_memorize');
    const pd = plan ? effectiveTarget(plan, day) : 3; setPerDay(pd);
    try { const raw = await AsyncStorage.getItem(KEY); if (raw) { setSt(JSON.parse(raw)); setMode('home'); return; } } catch { /* setup */ }
    setMode('setup');
  })(); }, []);

  const keys = useMemo(() => (st ? todaysKeys(st, day, perDay, lengths) : []), [st, day, perDay]);
  const due = useMemo(() => (st ? dueKeys(st, day) : []), [st, day]);

  // load the verse texts needed today (new + due) and a pool for distractors
  const loadTexts = useCallback(async (need: string[]) => {
    const surahs = [...new Set(need.map(k => parseKey(k).s))];
    const extra = surahs.flatMap(s => [s - 1, s + 1]).filter(s => s >= 1 && s <= 114 && !surahs.includes(s));
    try {
      const main = await Promise.all(surahs.map(getSurahText));
      const all = main.flat(); const map: Record<string, AyahText> = {};
      all.forEach(a => { map[keyOf(a)] = a; });
      let poolAll = all;
      if (all.length < 12) { const more = await Promise.all(extra.slice(0, 2).map(n => getSurahText(n).catch(() => []))); poolAll = all.concat(more.flat()); }
      setTexts(t => ({ ...t, ...map })); setPool(poolAll); setError('');
    } catch { setError('تعذّر تحميل الآيات. اتصل بالإنترنت مرة واحدة، وبعدها تعمل دون اتصال.'); }
  }, []);
  useEffect(() => { if (st && mode === 'home') loadTexts([...keys, ...due]); }, [st, mode, keys.join(','), due.join(',')]);

  useEffect(() => { if (status.didJustFinish && playing) { if (repeatLeft.current > 1) { repeatLeft.current--; player.seekTo(0); player.play(); } else setPlaying(null); } }, [status.didJustFinish]);
  const play = (k: string, times = 1) => {
    if (playing === k && status.playing) { player.pause(); setPlaying(null); return; }
    const r = parseKey(k); repeatLeft.current = times; player.replace({ uri: ayahAudio(r.s, r.a) }); player.play(); setPlaying(k);
  };

  const begin = (start: { s: number; a: number }, order: Order) => { const s0 = newState({ start, order, perDay }); save(s0); setMode('home'); };

  const startQuiz = (kind: 'new' | 'review') => {
    if (!st) return;
    const list = (kind === 'new' ? keys : due.slice(0, 20)).map(k => texts[k]).filter(Boolean);
    if (!list.length) return;
    if (kind === 'new') save(startToday(st, day, keys));
    const qs = kind === 'new' ? buildNewTest(list, pool, Date.now() % 100000) : buildReview(list, pool, Date.now() % 100000);
    setQuiz({ kind, qs, i: 0, answers: [], picked: null, revealed: false }); setMode('quiz');
  };
  const answer = (credit: number, picked?: number) => {
    if (!quiz) return;
    const q = quiz.qs[quiz.i];
    Haptics.impactAsync(credit >= 1 ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setQuiz({ ...quiz, answers: [...quiz.answers, { key: q.key, credit }], picked: picked ?? -1 });
  };
  const next = async () => {
    if (!quiz || !st) return;
    if (quiz.i + 1 < quiz.qs.length) { setQuiz({ ...quiz, i: quiz.i + 1, picked: null, revealed: false }); return; }
    const sc = score(quiz.answers);
    if (quiz.kind === 'new') {
      const r = completeToday(st, day, sc, lengths); save(r.state);
      if (r.learned) await logKind(['hifz', 'quran_memorize'], r.learned);
      setResult({ kind: 'new', score: sc, passed: r.passed, learned: r.learned, count: quiz.qs.length });
      if (r.passed) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      let s1 = st; const byKey: Record<string, number[]> = {};
      quiz.answers.forEach(a => { (byKey[a.key] = byKey[a.key] || []).push(a.credit); });
      Object.entries(byKey).forEach(([k, cs]) => { s1 = reviewAnswer(s1, k, cs.every(c => c >= 0.75), day); });
      save(s1);
      await logKind(['hifz_review', 'quran_review'], Object.keys(byKey).length, 'add');
      setResult({ kind: 'review', score: sc, passed: sc >= PASS_SCORE, learned: 0, count: Object.keys(byKey).length });
    }
    setQuiz(null); setMode('result');
  };

  const total = st ? Object.keys(st.items).length : 0;
  const tomorrow = st ? dueKeys(st, addDays(day, 1)).length - due.length : 0;
  const header = (title: string, onBack = () => navigation.goBack()) => (
    <View style={s.head}><Pressable onPress={onBack} hitSlop={10}><Text style={s.back}>رجوع</Text></Pressable><Text style={s.title}>{title}</Text><View style={{ width: 40 }} /></View>
  );

  if (mode === 'loading') return <View style={[s.root, s.center]}><ActivityIndicator color={C.gold} /></View>;

  if (mode === 'setup' || mode === 'pickSurah') return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      {header(mode === 'setup' ? 'من أين تبدأ الحفظ؟' : 'اختر سورة', mode === 'pickSurah' ? () => setMode('setup') : undefined)}
      {mode === 'setup' ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          <Text style={s.lead}>كل يوم تحفظ آيات قليلة، ثم اختبار قصير عليها، وما حفظته يعود إليك للمراجعة حتى يثبت.</Text>
          <Text style={s.label}>عدد الآيات يوميًا</Text>
          <View style={s.chips}>{[1, 2, 3, 5].map(n => <Pressable key={n} onPress={() => setPerDay(n)} style={[s.chip, perDay === n && s.chipOn]}><Text style={[s.chipText, perDay === n && s.chipTextOn]}>{ar(n)}</Text></Pressable>)}</View>
          <Text style={s.label}>نقطة البداية</Text>
          {[
            { t: 'جزء عمّ، من سورة الناس صعودًا', sub: 'الأقصر فالأطول: الناس، الفلق، الإخلاص…', go: () => begin({ s: 114, a: 1 }, 'juzAmma') },
            { t: 'من سورة الملك', sub: 'ثم القلم، ثم الحاقة…', go: () => begin({ s: 67, a: 1 }, 'forward') },
            { t: 'من بداية المصحف', sub: 'الفاتحة ثم البقرة', go: () => begin({ s: 1, a: 1 }, 'forward') },
            { t: 'سورة أختارها', sub: 'ثم ما بعدها في المصحف', go: () => setMode('pickSurah') },
          ].map(o => <Pressable key={o.t} onPress={o.go} style={s.option}><Text style={s.optTitle}>{o.t}</Text><Text style={s.optSub}>{o.sub}</Text></Pressable>)}
        </ScrollView>
      ) : (
        <FlatList data={surahsList} keyExtractor={x => String(x.number)} contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => <Pressable onPress={() => begin({ s: item.number, a: 1 }, 'forward')} style={s.option}><Text style={s.optTitle}>{ar(item.number)}. سورة {item.name}</Text><Text style={s.optSub}>{ar(item.totalAyahs)} آية</Text></Pressable>} />
      )}
    </View>
  );

  if (mode === 'quiz' && quiz) {
    const q = quiz.qs[quiz.i]; const answered = quiz.picked !== null; const r = parseKey(q.key);
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        {header(quiz.kind === 'new' ? 'اختبار حفظ اليوم' : 'مراجعة الحفظ', () => { setQuiz(null); setMode('home'); })}
        <View style={s.qTrack}><View style={[s.qFill, { width: `${Math.round((quiz.i / quiz.qs.length) * 100)}%` }]} /></View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Text style={s.qMeta}>سورة {surahName(r.s)}، الآية {ar(r.a)} · سؤال {ar(quiz.i + 1)} من {ar(quiz.qs.length)}</Text>
          {q.kind === 'missing' && <>
            <Text style={s.qTitle}>اختر الكلمة الناقصة</Text>
            <Text style={s.ayah}>{q.before} <Text style={s.blank}>{answered ? q.options[q.answer] : ' ـــــ '}</Text> {q.after}</Text>
          </>}
          {q.kind === 'continue' && <>
            <Text style={s.qTitle}>أكمل الآية</Text>
            <Text style={s.ayah}>{q.prompt} …</Text>
          </>}
          {(q.kind === 'missing' || q.kind === 'continue') && q.options.map((o, i) => {
            const right = answered && i === q.answer, wrong = answered && i === quiz.picked && i !== q.answer;
            return <Pressable key={i} accessibilityRole="button" accessibilityLabel={`الخيار ${i + 1}`} disabled={answered} onPress={() => answer(i === q.answer ? 1 : 0, i)} style={[s.answer, right && s.right, wrong && s.wrong]}><Text style={[s.answerText, (right || wrong) && { color: '#fff' }]}>{o}</Text></Pressable>;
          })}
          {q.kind === 'recite' && <>
            <Text style={s.qTitle}>اقرأ الآية من حفظك، ثم اكشفها</Text>
            {!quiz.revealed ? <>
              <Text style={s.hint}>تبدأ بـ: «{q.hint} …»</Text>
              <Pressable onPress={() => setQuiz({ ...quiz, revealed: true })} style={s.primary}><Text style={s.primaryText}>اكشف الآية</Text></Pressable>
            </> : <>
              <Text style={s.ayah}>{q.text}</Text>
              {!answered && <>
                <Text style={s.label}>كيف كانت قراءتك؟</Text>
                <Pressable onPress={() => answer(1, 0)} style={s.answer}><Text style={s.answerText}>قرأتها كاملة صحيحة</Text></Pressable>
                <Pressable onPress={() => answer(0.5, 1)} style={s.answer}><Text style={s.answerText}>أخطأت في كلمة أو كلمتين</Text></Pressable>
                <Pressable onPress={() => answer(0, 2)} style={s.answer}><Text style={s.answerText}>لم أستطع قراءتها</Text></Pressable>
              </>}
            </>}
          </>}
          {answered && <Pressable onPress={next} style={s.primary}><Text style={s.primaryText}>{quiz.i + 1 < quiz.qs.length ? 'التالي' : 'النتيجة'}</Text></Pressable>}
        </ScrollView>
      </View>
    );
  }

  if (mode === 'result' && result) return (
    <View style={[s.root, s.center, { padding: 24 }]}>
      <Text style={s.bigScore}>{ar(Math.round(result.score * 100))}٪</Text>
      {result.kind === 'new' ? (
        result.passed ? <>
          <Text style={s.resTitle}>أحسنت، بارك الله في حفظك</Text>
          <Text style={s.resSub}>{result.learned ? `أُضيفت ${ar(result.learned)} آيات إلى محفوظك، وستعود إليك للمراجعة غدًا.` : 'حفظ اليوم مسجّل من قبل.'}</Text>
        </> : <>
          <Text style={s.resTitle}>تحتاج قليلًا من التكرار</Text>
          <Text style={s.resSub}>استمع للآيات وكررها، ثم أعد الاختبار. تحتاج {ar(Math.round(PASS_SCORE * 100))}٪ لتُضاف إلى محفوظك.</Text>
        </>
      ) : <>
        <Text style={s.resTitle}>راجعت {ar(result.count)} آيات</Text>
        <Text style={s.resSub}>ما أتقنته يبتعد موعد مراجعته، وما تعثرت فيه يعود إليك غدًا.</Text>
      </>}
      <Pressable onPress={() => { setResult(null); setMode('home'); }} style={[s.primary, { alignSelf: 'stretch', marginTop: 24 }]}><Text style={s.primaryText}>تم</Text></Pressable>
    </View>
  );

  // home
  const passed = st?.today?.day === day && st.today.passed;
  const first = keys[0] ? parseKey(keys[0]) : null, last = keys.length ? parseKey(keys[keys.length - 1]) : null;
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      {header('حفظ القرآن')}
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: insets.bottom + 30 }}>
        <View style={s.stats}>
          <View style={s.stat}><Text style={s.statN}>{ar(total)}</Text><Text style={s.statL}>آية محفوظة</Text></View>
          <View style={s.stat}><Text style={s.statN}>{ar(due.length)}</Text><Text style={s.statL}>للمراجعة اليوم</Text></View>
          <View style={s.stat}><Text style={s.statN}>{ar(Math.max(0, tomorrow))}</Text><Text style={s.statL}>غدًا</Text></View>
        </View>
        <View style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.cardTitle}>ورد اليوم</Text>
            <Pressable onPress={() => setHidden(h => !h)}><Text style={s.link}>{hidden ? 'أظهر النص' : 'أخفِ النص للتسميع'}</Text></Pressable>
          </View>
          {first && last ? <Text style={s.cardSub}>سورة {surahName(first.s)}، {keys.length === 1 ? `الآية ${ar(first.a)}` : `الآيات ${ar(first.a)}–${ar(last.a)}${last.s !== first.s ? ` (حتى سورة ${surahName(last.s)})` : ''}`}{passed ? ' · أنهيت حفظ اليوم ✓' : ''}</Text> : <Text style={s.cardSub}>أتممت الخطة كلها، ما شاء الله.</Text>}
          {error ? <Text style={s.error}>{error}</Text> : null}
          {keys.map(k => { const t = texts[k]; const r = parseKey(k); return (
            <View key={k} style={s.ayahBox}>
              {t ? <Text style={[s.ayah, hidden && s.hiddenText]}>{hidden ? t.text.split(/\s+/).map(() => '•••').join(' ') : t.text} <Text style={s.mark}>﴿{ar(r.a)}﴾</Text></Text> : <ActivityIndicator color={C.gold} />}
              <View style={s.ayahActs}>
                <Pressable onPress={() => play(k, 1)} style={s.small}><Text style={s.smallText}>{playing === k && status.playing ? '⏸ إيقاف' : '▶ استمع'}</Text></Pressable>
                <Pressable onPress={() => play(k, 3)} style={s.small}><Text style={s.smallText}>🔁 كرر ٣ مرات</Text></Pressable>
              </View>
            </View>
          ); })}
          {keys.length > 0 && !passed && <Pressable disabled={!keys.every(k => texts[k])} onPress={() => startQuiz('new')} style={[s.primary, !keys.every(k => texts[k]) && { opacity: .5 }]}><Text style={s.primaryText}>حفظتها، ابدأ الاختبار</Text></Pressable>}
        </View>
        <View style={s.card}>
          <Text style={s.cardTitle}>المراجعة</Text>
          <Text style={s.cardSub}>{due.length ? `${ar(due.length)} آيات حان موعد مراجعتها.` : total ? 'لا مراجعة اليوم. ما حفظته يعود إليك في موعده.' : 'تبدأ المراجعة بعد أول يوم حفظ.'}</Text>
          {due.length > 0 && <Pressable disabled={!due.slice(0, 20).every(k => texts[k])} onPress={() => startQuiz('review')} style={s.secondary}><Text style={s.secondaryText}>ابدأ المراجعة</Text></Pressable>}
        </View>
        <Text style={s.note}>لا يستطيع التطبيق سماع تلاوتك بعد، لذلك يجمع الاختبار بين أسئلة اختيار وتسميع ذاتي تقيّمه بنفسك.</Text>
        <Pressable onPress={() => { AsyncStorage.removeItem(KEY).catch(() => {}); setSt(null); setMode('setup'); }}><Text style={s.reset}>تغيير نقطة البداية</Text></Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  center: { alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  back: { fontFamily: F.s, fontSize: 14, color: C.gold },
  title: { fontFamily: F.b, fontSize: 20, color: C.ink },
  lead: { fontFamily: F.r, fontSize: 14, color: C.ink2, textAlign: 'right', lineHeight: 24 },
  label: { fontFamily: F.s, fontSize: 14, color: C.ink, textAlign: 'right', marginTop: 8 },
  chips: { flexDirection: 'row-reverse', gap: 8 },
  chip: { paddingVertical: 9, paddingHorizontal: 18, borderRadius: 999, backgroundColor: C.chip },
  chipOn: { backgroundColor: C.green },
  chipText: { fontFamily: F.s, fontSize: 15, color: C.ink },
  chipTextOn: { color: '#fff' },
  option: { backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.line },
  optTitle: { fontFamily: F.s, fontSize: 16, color: C.ink, textAlign: 'right' },
  optSub: { fontFamily: F.r, fontSize: 12, color: C.muted, textAlign: 'right', marginTop: 2 },
  stats: { flexDirection: 'row-reverse', gap: 8 },
  stat: { flex: 1, backgroundColor: C.green, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  statN: { fontFamily: F.b, fontSize: 22, color: '#fff' },
  statL: { fontFamily: F.m, fontSize: 11, color: '#d8e6dd' },
  card: { backgroundColor: C.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.line, gap: 10 },
  rowBetween: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontFamily: F.b, fontSize: 18, color: C.ink, textAlign: 'right' },
  cardSub: { fontFamily: F.r, fontSize: 13, color: C.muted, textAlign: 'right' },
  link: { fontFamily: F.s, fontSize: 12, color: C.gold },
  ayahBox: { borderTopWidth: 1, borderColor: '#efe5d1', paddingTop: 10, gap: 8 },
  ayah: { fontFamily: F.q, fontSize: 24, lineHeight: 54, color: '#29231b', textAlign: 'right', writingDirection: 'rtl' },
  hiddenText: { color: '#cbbf9f' },
  mark: { fontSize: 17, color: '#9a753e' },
  ayahActs: { flexDirection: 'row-reverse', gap: 8 },
  small: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: C.chip },
  smallText: { fontFamily: F.s, fontSize: 12, color: C.ink },
  primary: { backgroundColor: C.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryText: { fontFamily: F.b, fontSize: 16, color: '#fff' },
  secondary: { borderWidth: 1, borderColor: C.green, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { fontFamily: F.b, fontSize: 15, color: C.green },
  note: { fontFamily: F.r, fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 20 },
  reset: { fontFamily: F.s, fontSize: 12, color: C.gold, textAlign: 'center' },
  error: { fontFamily: F.m, fontSize: 13, color: C.bad, textAlign: 'right' },
  qTrack: { height: 5, backgroundColor: C.line, marginHorizontal: 16, borderRadius: 5, overflow: 'hidden' },
  qFill: { height: 5, backgroundColor: C.gold },
  qMeta: { fontFamily: F.m, fontSize: 12, color: C.muted, textAlign: 'right' },
  qTitle: { fontFamily: F.b, fontSize: 19, color: C.ink, textAlign: 'right' },
  blank: { color: C.gold },
  hint: { fontFamily: F.q, fontSize: 20, color: C.ink2, textAlign: 'right', lineHeight: 40 },
  answer: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14 },
  answerText: { fontFamily: F.q, fontSize: 19, lineHeight: 36, color: C.ink, textAlign: 'right' },
  right: { backgroundColor: C.good, borderColor: C.good },
  wrong: { backgroundColor: C.bad, borderColor: C.bad },
  bigScore: { fontFamily: F.b, fontSize: 56, color: C.green },
  resTitle: { fontFamily: F.b, fontSize: 22, color: C.ink, textAlign: 'center', marginTop: 8 },
  resSub: { fontFamily: F.r, fontSize: 14, color: C.ink2, textAlign: 'center', marginTop: 6, lineHeight: 24 },
});
