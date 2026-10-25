/**
 * Memorization engine: daily new verses, a short test on them, and spaced review of everything memorized.
 * The app can't hear recitation, so tests combine recognition questions (pick the missing word, pick the
 * continuation) with honest self-recitation (recite from memory, reveal, rate yourself).
 */
import { plain } from '../quranText';

export type AyahRef = { s: number; a: number };
export type AyahText = AyahRef & { text: string };
export const keyOf = (r: AyahRef) => `${r.s}:${r.a}`;
export const parseKey = (k: string): AyahRef => { const [s, a] = k.split(':').map(Number); return { s, a }; };

export type Order = 'forward' | 'juzAmma';
export type HifzPlan = { start: AyahRef; order: Order; perDay: number };
export type SrsItem = { box: number; due: string; lapses: number; learnedOn: string };
export type HifzState = {
  v: 1;
  plan: HifzPlan;
  cursor: AyahRef;
  items: Record<string, SrsItem>;
  today?: { day: string; keys: string[]; passed: boolean; best: number };
  reviewed?: Record<string, number>;
};
export const INTERVALS = [1, 3, 7, 14, 30, 60];

export function addDays(day: string, n: number): string {
  const d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function newState(plan: HifzPlan): HifzState { return { v: 1, plan, cursor: { ...plan.start }, items: {} }; }

/** Next verse in study order. Juz' 'Amma order goes An-Nas → Al-Falaq → … (surah numbers descending, verses ascending). */
export function nextRef(r: AyahRef, order: Order, lengths: number[]): AyahRef | null {
  if (r.a < lengths[r.s - 1]) return { s: r.s, a: r.a + 1 };
  const s = order === 'forward' ? r.s + 1 : r.s - 1;
  if (s < 1 || s > 114) return null;
  return { s, a: 1 };
}

/** Today's new verses: reused all day once chosen, so the set doesn't change between opening and testing. */
export function todaysKeys(st: HifzState, day: string, perDay: number, lengths: number[]): string[] {
  if (st.today && st.today.day === day) return st.today.keys;
  const keys: string[] = []; let r: AyahRef | null = st.cursor;
  while (r && keys.length < perDay) { if (!st.items[keyOf(r)]) keys.push(keyOf(r)); r = nextRef(r, st.plan.order, lengths); }
  return keys;
}
export function startToday(st: HifzState, day: string, keys: string[]): HifzState {
  return st.today && st.today.day === day ? st : { ...st, today: { day, keys, passed: false, best: 0 } };
}

export const PASS_SCORE = 0.8;
/** Records a test of today's verses; passing adds them to review and moves the cursor on. */
export function completeToday(st: HifzState, day: string, score: number, lengths: number[]): { state: HifzState; passed: boolean; learned: number } {
  const today = st.today && st.today.day === day ? st.today : { day, keys: [], passed: false, best: 0 };
  if (!Number.isFinite(score) || score < 0 || score > 1 || !today.keys.length) return { state: st, passed: false, learned: 0 };
  const best = Math.max(today.best, score);
  if (today.passed || score < PASS_SCORE) return { state: { ...st, today: { ...today, best } }, passed: today.passed, learned: 0 };
  const items = { ...st.items };
  for (const k of today.keys) items[k] = { box: 0, due: addDays(day, INTERVALS[0]), lapses: 0, learnedOn: day };
  let cursor = st.cursor;
  if (today.keys.length) { const last = parseKey(today.keys[today.keys.length - 1]); cursor = nextRef(last, st.plan.order, lengths) || last; }
  return { state: { ...st, items, cursor, today: { ...today, passed: true, best } }, passed: true, learned: today.keys.length };
}

export const dueKeys = (st: HifzState, day: string) => Object.entries(st.items).filter(([, it]) => it.due <= day).sort((a, b) => a[1].due.localeCompare(b[1].due)).map(([k]) => k);

export function reviewAnswer(st: HifzState, key: string, correct: boolean, day: string): HifzState {
  const it = st.items[key]; if (!it) return st;
  const box = correct ? Math.min(it.box + 1, INTERVALS.length - 1) : 0;
  const next: SrsItem = { ...it, box, due: addDays(day, INTERVALS[box]), lapses: it.lapses + (correct ? 0 : 1) };
  return { ...st, items: { ...st.items, [key]: next }, reviewed: { ...(st.reviewed || {}), [day]: ((st.reviewed || {})[day] || 0) + 1 } };
}

/* ---------------- questions ---------------- */
const LETTER = /[\u0621-\u064A\u0671-\u06D3]/;
/** Words of a verse without the stand-alone pause marks (ۚ ۖ ۗ …). */
export const words = (text: string) => text.split(/\s+/).filter(w => LETTER.test(w));

export type Question =
  | { kind: 'missing'; key: string; before: string; after: string; options: string[]; answer: number }
  | { kind: 'continue'; key: string; prompt: string; options: string[]; answer: number }
  | { kind: 'recite'; key: string; text: string; hint: string };

export function rng(seed: number) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function shuffle<T>(arr: T[], r: () => number): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function missingWord(t: AyahText, pool: AyahText[], r: () => number): Question | null {
  const w = words(t.text);
  const candidates = w.map((x, i) => ({ x, i })).filter(c => c.i > 0 && plain(c.x).length >= 3);
  if (!candidates.length) return null;
  const pick = candidates[Math.floor(r() * candidates.length)];
  const right = plain(pick.x);
  const distract: string[] = [];
  for (const x of shuffle(pool.flatMap(p => words(p.text)), r)) {
    const px = plain(x);
    if (px.length >= 3 && px !== right && !distract.some(d => plain(d) === px)) distract.push(x);
    if (distract.length === 3) break;
  }
  if (distract.length < 2) return null;
  const options = shuffle([pick.x, ...distract], r);
  return { kind: 'missing', key: keyOf(t), before: w.slice(0, pick.i).join(' '), after: w.slice(pick.i + 1).join(' '), options, answer: options.indexOf(pick.x) };
}

export function continuation(t: AyahText, pool: AyahText[], r: () => number): Question | null {
  const w = words(t.text);
  if (w.length < 5) return null;
  const cut = Math.max(2, Math.round(w.length * 0.45));
  const right = w.slice(cut).join(' ');
  const others = shuffle(pool.filter(p => keyOf(p) !== keyOf(t)), r).map(p => { const pw = words(p.text); return pw.slice(Math.max(1, Math.round(pw.length * 0.45))).join(' '); })
    .filter(x => x && plain(x) !== plain(right));
  const distract = [...new Set(others)].slice(0, 2);
  if (distract.length < 2) return null;
  const options = shuffle([right, ...distract], r);
  return { kind: 'continue', key: keyOf(t), prompt: w.slice(0, cut).join(' '), options, answer: options.indexOf(right) };
}

export const recite = (t: AyahText): Question => ({ kind: 'recite', key: keyOf(t), text: t.text, hint: words(t.text).slice(0, 2).join(' ') });

/** Today's test: two questions per new verse (one recognition, one recitation). */
export function buildNewTest(targets: AyahText[], pool: AyahText[], seed: number): Question[] {
  const r = rng(seed); const qs: Question[] = [];
  targets.forEach((t, i) => {
    const first = (i % 2 === 0 ? missingWord(t, pool, r) || continuation(t, pool, r) : continuation(t, pool, r) || missingWord(t, pool, r));
    if (first) qs.push(first);
    qs.push(recite(t));
  });
  return qs;
}
/** Review: one question per due verse, alternating question types. */
export function buildReview(targets: AyahText[], pool: AyahText[], seed: number): Question[] {
  const r = rng(seed);
  return targets.map((t, i) => (i % 3 === 2 ? recite(t) : (missingWord(t, pool, r) || continuation(t, pool, r) || recite(t))));
}
export type Answer = { key: string; credit: number };
/** recitation: 'good' = 1, 'minor' = 0.5, 'missed' = 0; choice questions: right = 1. */
export const score = (answers: Answer[]) => answers.length ? answers.reduce((n, a) => n + a.credit, 0) / answers.length : 0;
