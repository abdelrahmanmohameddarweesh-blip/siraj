/** Morning/evening adhkar sessions: counts per dhikr, completion, time spent and streaks. */
import type { Dhikr } from './athkarData';

export type Session = 'morning' | 'evening';
export type SessionLog = { counts: Record<string, number>; done: boolean; startedAt?: string; completedAt?: string; seconds: number };
export type AthkarLog = Record<string, Partial<Record<Session, SessionLog>>>;
export const ATHKAR_LOG_KEY = 'sirag-athkar-log-v1';

/** Before Asr it's the morning session; from Asr until the next Fajr it's the evening session. */
export function sessionFor(now: Date, times?: { fajr: Date; asr: Date } | null): Session {
  if (!times) return now.getHours() < 15 ? 'morning' : 'evening';
  return now >= times.fajr && now < times.asr ? 'morning' : 'evening';
}
export const emptySession = (): SessionLog => ({ counts: {}, done: false, seconds: 0 });

export function tap(log: SessionLog, item: Dhikr, list: Dhikr[], nowIso: string): SessionLog {
  const cur = log.counts[item.id] || 0;
  if (cur >= item.repeat) return log;
  const counts: Record<string, number> = { ...log.counts, [item.id]: cur + 1 };
  const done = list.every(d => (counts[d.id] || 0) >= d.repeat);
  return { ...log, counts, startedAt: log.startedAt || nowIso, done, completedAt: done && !log.done ? nowIso : log.completedAt };
}
/** Marks a dhikr fully read in one tap (for long counts read off-screen). */
export function completeItem(log: SessionLog, item: Dhikr, list: Dhikr[], nowIso: string): SessionLog {
  const counts: Record<string, number> = { ...log.counts, [item.id]: item.repeat };
  const done = list.every(d => (counts[d.id] || 0) >= d.repeat);
  return { ...log, counts, startedAt: log.startedAt || nowIso, done, completedAt: done && !log.done ? nowIso : log.completedAt };
}
export function progress(log: SessionLog | undefined, list: Dhikr[]) {
  const total = list.length;
  const items = list.filter(d => (log?.counts[d.id] || 0) >= d.repeat).length;
  const reps = list.reduce((n, d) => n + Math.min(log?.counts[d.id] || 0, d.repeat), 0);
  const allReps = list.reduce((n, d) => n + d.repeat, 0);
  return { items, total, ratio: allReps ? reps / allReps : 0 };
}
/** Consecutive days (ending today or yesterday) on which the session was completed. */
export function streak(log: AthkarLog, s: Session, today: string, addDays: (d: string, n: number) => string): number {
  let d = log[today]?.[s]?.done ? today : addDays(today, -1), n = 0;
  while (log[d]?.[s]?.done) { n++; d = addDays(d, -1); }
  return n;
}
export function weekSummary(log: AthkarLog, today: string, addDays: (d: string, n: number) => string) {
  let morning = 0, evening = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(today, -i); if (log[d]?.morning?.done) morning++; if (log[d]?.evening?.done) evening++; }
  return { morning, evening };
}
