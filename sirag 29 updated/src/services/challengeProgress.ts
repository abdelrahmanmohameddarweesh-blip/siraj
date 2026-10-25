import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChallengeKind = 'reading' | 'hadith' | 'trivia' | 'sirah';
export type ChallengeEvent = {
  id: string;
  kind: ChallengeKind;
  completedAt: string;
  correct: number;
  total: number;
  points: number;
  detail?: string;
};
export type ChallengeSummary = {
  sessions: number; correct: number; questions: number; points: number;
  bestAccuracy: number; lastPlayed: string | null;
};
export const CHALLENGE_KINDS: ChallengeKind[] = ['reading', 'hadith', 'trivia', 'sirah'];
const KEY = 'batl-challenge-history-v1';
const MAX_HISTORY = 250;
const isKind = (value: unknown): value is ChallengeKind => CHALLENGE_KINDS.includes(value as ChallengeKind);
const safeNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
export const dateKey = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export const sanitizeEvents = (value: unknown): ChallengeEvent[] => {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  const valid: ChallengeEvent[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || !isKind(item.kind) || typeof item.id !== 'string' || !item.id || ids.has(item.id)) continue;
    if (typeof item.completedAt !== 'string' || !dateKey(item.completedAt)) continue;
    const total = Math.floor(safeNumber(item.total));
    const correct = Math.min(total, Math.floor(safeNumber(item.correct)));
    valid.push({ id: item.id, kind: item.kind, completedAt: item.completedAt,
      correct, total, points: Math.floor(safeNumber(item.points)),
      detail: typeof item.detail === 'string' ? item.detail.slice(0, 100) : undefined });
    ids.add(item.id);
    if (valid.length >= MAX_HISTORY) break;
  }
  return valid.sort((a,b) => b.completedAt.localeCompare(a.completedAt));
};
export const loadChallengeHistory = async (): Promise<ChallengeEvent[]> => {
  try { return sanitizeEvents(JSON.parse((await AsyncStorage.getItem(KEY)) || '[]')); }
  catch (error) { console.warn('Challenge history could not be loaded', error); return []; }
};
// Serializes writes within one running app so simultaneous challenge completions do not overwrite each other.
let pending: Promise<unknown> = Promise.resolve();
export const recordChallenge = (event: ChallengeEvent): Promise<ChallengeEvent[]> => {
  const task = pending.catch(() => {}).then(async () => {
    const old = await loadChallengeHistory();
    const next = sanitizeEvents([event, ...old]);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  });
  pending = task;
  return task;
};
export const summarizeChallenges = (events: ChallengeEvent[], kind?: ChallengeKind): ChallengeSummary => {
  const selected = events.filter(event => !kind || event.kind === kind);
  const questions = selected.reduce((sum,event) => sum + event.total, 0);
  const correct = selected.reduce((sum,event) => sum + event.correct, 0);
  return { sessions: selected.length, correct, questions,
    points: selected.reduce((sum,event) => sum + event.points, 0),
    bestAccuracy: selected.reduce((best,event) => Math.max(best, event.total ? Math.round(100*event.correct/event.total) : 0),0),
    lastPlayed: selected[0]?.completedAt || null };
};
export const calculateChallengeStreak = (events: ChallengeEvent[], now = new Date()): number => {
  const days = new Set(events.map(event => dateKey(event.completedAt)));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(dateKey(cursor.toISOString()))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (streak < 3660 && days.has(dateKey(cursor.toISOString()))) {
    streak++; cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};
export const unlockedChallengeBadges = (events: ChallengeEvent[]) => {
  const summary = summarizeChallenges(events);
  const kinds = new Set(events.map(e => e.kind));
  return [
    { id:'first', icon:'🌱', ar:'أول تحدٍ', en:'First challenge', unlocked:summary.sessions >= 1 },
    { id:'five', icon:'🏅', ar:'خمسة تحديات', en:'Five challenges', unlocked:summary.sessions >= 5 },
    { id:'explorer', icon:'🧭', ar:'مستكشف العلوم', en:'Knowledge explorer', unlocked:kinds.size >= 3 },
    { id:'perfect', icon:'✨', ar:'نتيجة كاملة', en:'Perfect result', unlocked:events.some(e => e.total > 0 && e.correct === e.total) },
    { id:'streak', icon:'🔥', ar:'ثلاثة أيام', en:'Three-day streak', unlocked:calculateChallengeStreak(events) >= 3 },
    { id:'master', icon:'🏆', ar:'عشرون إجابة صحيحة', en:'Twenty correct answers', unlocked:summary.correct >= 20 },
  ];
};
