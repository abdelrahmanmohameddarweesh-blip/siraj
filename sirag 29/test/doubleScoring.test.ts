import test from 'node:test';
import assert from 'node:assert';
import { calculateEventPoints, isEventIdempotent } from '../src/hero/engine';
import { TASK_REWARDS, PRAYER_REWARDS } from '../src/hero/config';
import { HeroEvent } from '../src/hero/types';

test('Double Scoring Prevention: Base prayer scores prayer rewards', () => {
  const prayerEvent = {
    uid: 'u1',
    type: 'prayer_checkin' as const,
    source: 'prayer_tracker',
    value: 1,
    meta: { prayer: 'fajr', status: 'on_time', jamaa: true, dateStr: '2026-10-12' },
  };
  const pts = calculateEventPoints(prayerEvent);
  assert.strictEqual(pts.siraj, PRAYER_REWARDS.on_time.jamaa.siraj); // 15
  assert.strictEqual(pts.xp, PRAYER_REWARDS.on_time.jamaa.xp);       // 25
});

test('Double Scoring Prevention: Linked habit scores ONLY habit bonus, not duplicate base points', () => {
  const linkedHabitEvent = {
    uid: 'u1',
    type: 'habit_checkin' as const,
    source: 'prayer_auto_link',
    value: 1,
    meta: { habitId: 'habit_fajr', isLinkedBonus: true, dateStr: '2026-10-12' },
  };
  const pts = calculateEventPoints(linkedHabitEvent);
  assert.strictEqual(pts.siraj, TASK_REWARDS.habit_linked_bonus.siraj); // 5
  assert.strictEqual(pts.xp, TASK_REWARDS.habit_linked_bonus.xp);       // 5
  // Verify it is NOT awarding full prayer or standard habit base rewards
  assert.notStrictEqual(pts.siraj, 15);
  assert.notStrictEqual(pts.xp, 25);
});

test('Double Scoring Prevention: Checking in linked habit twice on same day is rejected by idempotency', () => {
  const existingEvents: HeroEvent[] = [
    {
      id: 'e1',
      uid: 'u1',
      type: 'habit_checkin',
      source: 'prayer_auto_link',
      value: 1,
      meta: { habitId: 'habit_fajr', dateStr: '2026-10-12' },
      at: '2026-10-12T05:00:00.000Z',
    },
  ];

  // User attempts manual checkin on same day
  const duplicateAttempt = {
    uid: 'u1',
    type: 'habit_checkin' as const,
    source: 'habit_tracker',
    value: 1,
    meta: { habitId: 'habit_fajr', dateStr: '2026-10-12' },
    at: '2026-10-12T08:00:00.000Z',
  };

  const allowed = isEventIdempotent(existingEvents, duplicateAttempt);
  assert.strictEqual(allowed, false, 'Duplicate habit checkin must be rejected on same day');
});

test('Fasting Reward Rebalance: fast_done awards Sunnah prayer-level points (15 Siraj, 20 XP)', () => {
  const fastEvent = {
    uid: 'u1',
    type: 'fast_done' as const,
    source: 'fasting_card',
    value: 1,
    meta: { dateStr: '2026-10-12' },
  };
  const pts = calculateEventPoints(fastEvent);
  assert.strictEqual(pts.siraj, 15);
  assert.strictEqual(pts.xp, 20);
});
