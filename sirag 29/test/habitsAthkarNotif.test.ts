import test from 'node:test';
import assert from 'node:assert';
import { LIBRARY, recommend, planFromPreset, effectiveTarget, findHabit } from '../src/habits/library';
import { ATHKAR } from '../src/athkar/athkarData';
import { tap, emptySession, progress, sessionFor, streak, completeItem } from '../src/athkar/athkarEngine';
import { buildSchedule, routeFor, DEFAULT_FOLLOW_UP, PrayerSettings } from '../src/notifications/schedulePlan';
import { addDays } from '../src/quran/hifz/hifzEngine';

test('Library: every habit has three plans and the recommendation never exceeds level or time', () => {
  for (const h of LIBRARY) {
    assert.strictEqual(h.presets.length, 3, h.id);
    assert.strictEqual(recommend(h, { level: 'start', time: 'long' }).preset.id, 'gentle');
    assert.strictEqual(recommend(h, { level: 'regular', time: 'short' }).preset.id, 'gentle');
    assert.strictEqual(recommend(h, { level: 'some', time: 'long' }).preset.id, 'steady');
    assert.strictEqual(recommend(h, { level: 'regular', time: 'long' }).preset.id, 'strong');
  }
  const r = recommend(findHabit('quran')!, { level: 'some', time: 'mid', moment: 'isha' });
  assert.strictEqual(r.preset.reminders[0].anchor, 'isha', 'chosen moment is used');
  const adhkar = recommend(findHabit('morning_adhkar')!, { level: 'some', time: 'mid', moment: 'isha' });
  assert.strictEqual(adhkar.preset.reminders[0].anchor, 'fajr', 'adhkar keep their natural time');
});

test('Library: gradual plans rise step by step and stop at the maximum', () => {
  const p = planFromPreset(findHabit('quran')!, findHabit('quran')!.presets[0], { now: new Date('2026-10-01T10:00:00') });
  assert.strictEqual(effectiveTarget(p, '2026-10-01'), 1);
  assert.strictEqual(effectiveTarget(p, '2026-10-08'), 2);
  assert.strictEqual(effectiveTarget(p, '2026-12-30'), 5);
  assert.strictEqual(effectiveTarget({ ...p, gradual: false }, '2026-10-01'), 5);
});

test('Athkar: 24 imported items, counting, completion and streaks', () => {
  assert.strictEqual(ATHKAR.length, 24);
  assert.ok(ATHKAR.every(d => d.text.length > 10 && d.repeat >= 1 && d.audio.startsWith('https://')));
  let log = emptySession();
  for (const d of ATHKAR) for (let i = 0; i < d.repeat + 2; i++) log = tap(log, d, ATHKAR, 'x');
  assert.strictEqual(log.done, true);
  assert.strictEqual(log.counts[ATHKAR[16].id], ATHKAR[16].repeat, 'never counts past the repeat');
  assert.strictEqual(progress(log, ATHKAR).items, 24);
  const half = completeItem(emptySession(), ATHKAR[0], ATHKAR, 'x');
  assert.strictEqual(half.done, false);
  assert.strictEqual(sessionFor(new Date('2026-10-20T07:00:00'), { fajr: new Date('2026-10-20T04:30:00'), asr: new Date('2026-10-20T15:10:00') }), 'morning');
  assert.strictEqual(sessionFor(new Date('2026-10-20T16:00:00'), { fajr: new Date('2026-10-20T04:30:00'), asr: new Date('2026-10-20T15:10:00') }), 'evening');
  const L: any = { '2026-10-18': { morning: { done: true } }, '2026-10-19': { morning: { done: true } } };
  assert.strictEqual(streak(L, 'morning', '2026-10-20', addDays), 2);
});

const T = (h: number, m = 0) => { const d = new Date('2026-10-20T00:00:00'); d.setHours(h, m, 0, 0); return d; };
const day = { dateStr: '2026-10-20', fajr: T(4, 30), sunrise: T(6), dhuhr: T(11, 40), asr: T(14, 50), maghrib: T(17, 20), isha: T(18, 40) };
const settings = (o: Partial<PrayerSettings> = {}): PrayerSettings => ({
  enabled: true, perPrayer: { fajr: { enabled: true, sound: true }, dhuhr: { enabled: true, sound: true }, asr: { enabled: true, sound: false }, maghrib: { enabled: true, sound: true }, isha: { enabled: true, sound: true } },
  followUp: true, followUpMin: { ...DEFAULT_FOLLOW_UP }, preAlertMin: 0, quietEnabled: true, quietStart: '23:00', quietEnd: '04:30', ...o,
});

test('Notifications: adhan with its sound, then «هل صليت؟» after the congregation, skipped once checked in', () => {
  const plan = buildSchedule({ now: T(0, 1), days: [day], prayer: settings(), plans: [], logs: {}, checkins: { 'dhuhr_2026-10-20': { status: 'on_time' } }, restDays: [] });
  const athan = plan.filter(n => n.id.startsWith('athan:'));
  assert.strictEqual(athan.length, 5);
  assert.strictEqual(athan.find(n => n.data.prayer === 'fajr')!.sound, 'athan', 'fajr adhan is not silenced by quiet hours');
  assert.strictEqual(athan.find(n => n.data.prayer === 'asr')!.sound, 'default');
  const fu = plan.filter(n => n.id.startsWith('pfu:'));
  assert.deepStrictEqual(fu.map(n => n.data.prayer), ['fajr', 'asr', 'maghrib', 'isha'], 'no question for a prayer already recorded');
  assert.strictEqual(fu.find(n => n.data.prayer === 'maghrib')!.at.getTime(), T(17, 40).getTime());
  assert.strictEqual(fu[0].title, 'هل صليت الفجر؟');
  assert.deepStrictEqual(routeFor(fu[0].data), { screen: 'PrayerTracker', params: { checkin: 'fajr', date: '2026-10-20' } });
});

test('Notifications: habit reminders follow prayer times, skip done habits and quiet hours', () => {
  const morning = planFromPreset(findHabit('morning_adhkar')!, findHabit('morning_adhkar')!.presets[1]);
  const late: any = { ...planFromPreset(findHabit('witr')!, findHabit('witr')!.presets[0]), reminders: [{ anchor: 'clock', offsetMin: 0, clock: '23:30' }] };
  const plan = buildSchedule({ now: T(0, 1), days: [day], prayer: settings({ enabled: false }), plans: [morning, late], logs: {}, checkins: {}, restDays: [] });
  const r = plan.find(n => n.id === 'hab:2026-10-20:morning_adhkar:0')!;
  assert.strictEqual(r.at.getTime(), T(4, 50).getTime());
  assert.ok(plan.some(n => n.id === 'habfu:2026-10-20:morning_adhkar'));
  assert.ok(!plan.some(n => n.data.planId === 'witr'), 'quiet hours');
  assert.deepStrictEqual(routeFor(r.data), { screen: 'Adhkar', params: { session: 'morning' } });
  const done = buildSchedule({ now: T(0, 1), days: [day], prayer: settings({ enabled: false }), plans: [morning], logs: { '2026-10-20': { morning_adhkar: 1 } }, checkins: {}, restDays: [] });
  assert.strictEqual(done.length, 0);
  const capped = buildSchedule({ now: T(0, 1), days: Array(20).fill(day), prayer: settings(), plans: [morning], logs: {}, checkins: {}, restDays: [] });
  assert.ok(capped.length <= 60);
});
