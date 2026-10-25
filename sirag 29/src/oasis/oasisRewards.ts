/**
 * Oasis rewards: turns real, recorded worship activity into oasis rewards exactly once.
 *
 * Rules (per local day):
 *  - the first completed habit of the day grants 1 seed
 *  - every further completed habit grants 1 water drop
 *  - completing every habit of the day grants 1 lantern and 1 bonus seed (once per day)
 *
 * Each completion has a stable event id (`day:habitId`) stored in a ledger, so re-opening the
 * oasis, editing a log, or tapping twice can never award the same completion again.
 * Grants stay "pending" until the oasis confirms it applied them (exactly-once hand-off).
 * Rewards are never taken back: undoing a log or missing a day removes nothing.
 */
import type { HabitPlan } from '../habits/habitData';
import { effectiveTarget } from '../habits/library';

export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export const PRAYERS: { id: PrayerId; name: string; icon: string }[] = [
  { id: 'fajr', name: 'الفجر', icon: '🌅' },
  { id: 'dhuhr', name: 'الظهر', icon: '☀️' },
  { id: 'asr', name: 'العصر', icon: '🌤️' },
  { id: 'maghrib', name: 'المغرب', icon: '🌇' },
  { id: 'isha', name: 'العشاء', icon: '🌙' },
];
const CATEGORY_ICON: Record<string, string> = {
  'القرآن': '📖', 'الصلاة': '🕌', 'الأذكار': '📿', 'الدعاء': '🤲',
  'الأخلاق والأسرة': '🤝', 'الخير': '💝', 'العلم': '📚',
};
/** Plans that duplicate the five individual prayer check-ins. */
const PRAYER_DUPLICATES = new Set(['prayer', 'fajr']);
const COUNTED_STATUSES = new Set(['on_time', 'late', 'qada']);

export type OasisHabit = {
  id: string;
  name: string;
  sub: string;
  icon: string;
  kind: 'prayer' | 'plan';
  /** 0 = the five prayers, 1 = the user's own habits */
  g: 0 | 1;
  done: boolean;
  planId?: string;
  target?: number;
  unit?: string;
  planKind?: string;
};

export type HabitSources = {
  day: string;
  checkins: Record<string, { status?: string } | undefined>;
  plans: HabitPlan[];
  logs: Record<string, Record<string, number> | undefined>;
  restDay: boolean;
};

export function todaysHabits(src: HabitSources): OasisHabit[] {
  const out: OasisHabit[] = [];
  if (!src.restDay) {
    for (const p of PRAYERS) {
      const rec = src.checkins[`${p.id}_${src.day}`];
      out.push({ id: `prayer:${p.id}`, name: p.name, sub: 'صلاة', icon: p.icon, kind: 'prayer', g: 0, done: !!rec && COUNTED_STATUSES.has(String(rec.status)) });
    }
  }
  for (const plan of src.plans) {
    if (!plan || plan.frequency !== 'daily' || PRAYER_DUPLICATES.has(plan.id) || plan.kind === 'prayers') continue;
    const value = src.logs[src.day]?.[plan.id] || 0;
    const target = effectiveTarget(plan, src.day);
    out.push({
      id: `plan:${plan.id}`, name: plan.title, sub: `${target} ${plan.unit}`, icon: CATEGORY_ICON[plan.category] || '✨',
      kind: 'plan', g: 1, done: value >= target, planId: plan.id, target, unit: plan.unit, planKind: plan.kind,
    });
  }
  return out;
}

export type Grant = {
  id: string;
  day: string;
  habitId: string;
  seeds: number;
  drops: number;
  lanterns: number;
  firstOfDay: boolean;
  allDone: boolean;
};
export type Ledger = {
  v: 1;
  days: Record<string, { events: string[]; allDone?: boolean }>;
  pending: Grant[];
};
export const emptyLedger = (): Ledger => ({ v: 1, days: {}, pending: [] });

export function normalizeLedger(raw: unknown): Ledger {
  const l = raw as Ledger;
  if (!l || l.v !== 1 || typeof l.days !== 'object' || !Array.isArray(l.pending)) return emptyLedger();
  return l;
}

/** Awards any newly completed habits. Pure: returns a new ledger and the new grants. */
export function computeGrants(ledger: Ledger, day: string, habits: OasisHabit[]): { ledger: Ledger; grants: Grant[] } {
  const days = { ...ledger.days };
  const today = { events: [...(days[day]?.events || [])], allDone: days[day]?.allDone };
  const grants: Grant[] = [];
  for (const h of habits) {
    if (!h.done) continue;
    const eventId = `${day}:${h.id}`;
    if (today.events.includes(eventId)) continue;
    const first = today.events.length === 0;
    today.events.push(eventId);
    grants.push({ id: eventId, day, habitId: h.id, seeds: first ? 1 : 0, drops: first ? 0 : 1, lanterns: 0, firstOfDay: first, allDone: false });
  }
  if (habits.length > 0 && habits.every(h => h.done) && !today.allDone) {
    today.allDone = true;
    const last = grants[grants.length - 1];
    const bonus = { lanterns: 1, seeds: 1, allDone: true };
    if (last) Object.assign(last, { lanterns: last.lanterns + bonus.lanterns, seeds: last.seeds + bonus.seeds, allDone: true });
    else grants.push({ id: `${day}:all-done`, day, habitId: '', seeds: 1, drops: 0, lanterns: 1, firstOfDay: false, allDone: true });
  }
  days[day] = today;
  // keep 60 days of history
  const keep = Object.keys(days).sort().slice(-60);
  const pruned: Ledger['days'] = {};
  for (const k of keep) pruned[k] = days[k];
  return { ledger: { v: 1, days: pruned, pending: [...ledger.pending, ...grants] }, grants };
}

/** Removes grants the oasis has confirmed (they appear in its applied list). */
export function ackGrants(ledger: Ledger, appliedIds: string[]): Ledger {
  if (!ledger.pending.length) return ledger;
  const applied = new Set(appliedIds);
  const pending = ledger.pending.filter(g => !applied.has(g.id));
  return pending.length === ledger.pending.length ? ledger : { ...ledger, pending };
}
