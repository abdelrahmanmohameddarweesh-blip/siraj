import test from 'node:test';
import assert from 'node:assert';
import {
  canAddHabit, applyCheckin, missState, weeklyAdherence,
  shouldSuggestEasing, reminderLadder,
} from '../src/apps/habits/habitEngine';
import { UserHabitRecord } from '../src/apps/habits/habitCatalog';

const base: UserHabitRecord = {
  id: 'h1', templateId: 'witr_prayer', titleAr: 'الوتر', titleEn: 'Witr', icon: 'moon',
  obligation: 'sunnah_muakkadah', period: 7, plan: 'steady', targetDescriptionAr: '',
  anchor: 'isha', intensity: 'steady', startDate: '2026-10-01', completedDays: 0,
  currentStreak: 0, missedYesterday: false, status: 'active', adherenceRate: 0,
};

test('Habits: max 3 active', () => {
  assert.strictEqual(canAddHabit([base, base]), true);
  assert.strictEqual(canAddHabit([base, base, base]), false);
  assert.strictEqual(canAddHabit([base, base, { ...base, status: 'graduated' }]), true);
});

test('Habits: check-in is idempotent per day and builds streak', () => {
  let h = applyCheckin(base, '2026-10-01');
  h = applyCheckin(h, '2026-10-01');
  assert.strictEqual(h.completedDays, 1);
  h = applyCheckin(h, '2026-10-02');
  assert.strictEqual(h.currentStreak, 2);
  h = applyCheckin(h, '2026-10-05');
  assert.strictEqual(h.currentStreak, 1);
});

test('Habits: never miss twice states', () => {
  const h = { ...base, lastCompletedDate: '2026-10-03' };
  assert.strictEqual(missState(h, '2026-10-04'), 'ok');
  assert.strictEqual(missState(h, '2026-10-05'), 'missed_once');
  assert.strictEqual(missState(h, '2026-10-06'), 'missed_twice');
});

test('Habits: low adherence suggests easing (not on starter)', () => {
  const a = weeklyAdherence(['2026-10-07', '2026-10-05'], '2026-10-07');
  assert.strictEqual(a, 29);
  assert.strictEqual(shouldSuggestEasing(a, 'steady'), true);
  assert.strictEqual(shouldSuggestEasing(a, 'starter'), false);
});

test('Habits: graduates at end of period', () => {
  let h = base;
  for (let d = 1; d <= 7; d++) h = applyCheckin(h, `2026-10-0${d}`);
  assert.strictEqual(h.status, 'graduated');
});

test('Habits: reminder ladder respects intensity cap and quiet hours', () => {
  const anchor = new Date(2026, 9, 1, 19, 30);
  assert.strictEqual(reminderLadder(anchor, 'gentle', () => false).length, 1);
  assert.strictEqual(reminderLadder(anchor, 'strict', () => false).length, 3);
  const quietAfter20 = (d: Date) => d.getHours() >= 20;
  assert.strictEqual(reminderLadder(anchor, 'strict', quietAfter20).length, 2);
});
