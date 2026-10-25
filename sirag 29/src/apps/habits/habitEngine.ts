/**
 * Habit engine: pure functions, no React / storage. Unit-tested in test/habitEngine.test.ts.
 */
import { UserHabitRecord, HabitPeriod, ReminderIntensity } from './habitCatalog';

export const MAX_ACTIVE_HABITS = 3;
export const LOW_ADHERENCE_THRESHOLD = 50; // percent, over the last 7 days

export function canAddHabit(habits: UserHabitRecord[]): boolean {
  return habits.filter((h) => h.status === 'active').length < MAX_ACTIVE_HABITS;
}

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

/** Applies a "Done" check-in. Idempotent for the same day. */
export function applyCheckin(h: UserHabitRecord, dateStr: string): UserHabitRecord {
  if (h.lastCompletedDate === dateStr) return h;
  const gap = h.lastCompletedDate ? dayDiff(h.lastCompletedDate, dateStr) : 1;
  const next: UserHabitRecord = {
    ...h,
    completedDays: h.completedDays + 1,
    currentStreak: gap === 1 ? h.currentStreak + 1 : 1,
    lastCompletedDate: dateStr,
    missedYesterday: false,
  };
  return maybeGraduate(next, dateStr);
}

/**
 * "Never miss twice": returns 'ok' | 'missed_once' (gentle nudge) | 'missed_twice' (offer easier plan).
 * Never removes points or progress.
 */
export function missState(h: UserHabitRecord, todayStr: string): 'ok' | 'missed_once' | 'missed_twice' {
  if (!h.lastCompletedDate) return dayDiff(h.startDate, todayStr) >= 2 ? 'missed_twice' : 'ok';
  const gap = dayDiff(h.lastCompletedDate, todayStr);
  if (gap <= 1) return 'ok';
  if (gap === 2) return 'missed_once';
  return 'missed_twice';
}

/** Adherence over the last 7 days given the list of completed dates. */
export function weeklyAdherence(completedDates: string[], todayStr: string): number {
  const done = completedDates.filter((d) => {
    const g = dayDiff(d, todayStr);
    return g >= 0 && g < 7;
  }).length;
  return Math.round((done / 7) * 100);
}

export function shouldSuggestEasing(adherence: number, plan: UserHabitRecord['plan']): boolean {
  return adherence < LOW_ADHERENCE_THRESHOLD && plan !== 'starter';
}

export function maybeGraduate(h: UserHabitRecord, todayStr: string): UserHabitRecord {
  const elapsed = dayDiff(h.startDate, todayStr) + 1;
  if (h.status === 'active' && elapsed >= (h.period as HabitPeriod)) {
    return { ...h, status: 'graduated' };
  }
  return h;
}

/**
 * Reminder ladder with hard cap: anchor time, +20 min, final in the evening (21:00).
 * Gentle = 1, Steady = 2, Strict = 3. Drops reminders inside quiet hours.
 */
export function reminderLadder(
  anchor: Date,
  intensity: ReminderIntensity,
  isQuiet: (d: Date) => boolean
): Date[] {
  const evening = new Date(anchor);
  evening.setHours(21, 0, 0, 0);
  const all = [anchor, new Date(anchor.getTime() + 20 * 60000), evening];
  const count = intensity === 'gentle' ? 1 : intensity === 'steady' ? 2 : 3;
  return all
    .slice(0, count)
    .filter((d, i, arr) => !isQuiet(d) && (i === 0 || d > arr[i - 1]));
}
