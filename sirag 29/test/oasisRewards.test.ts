import test from 'node:test';
import assert from 'node:assert';
import { todaysHabits, computeGrants, ackGrants, emptyLedger, OasisHabit } from '../src/oasis/oasisRewards';

const day = '2026-10-20';
const plans: any[] = [
  { id: 'quran', title: 'قراءة القرآن', category: 'القرآن', unit: 'صفحة', target: 2, frequency: 'daily', gradual: true, createdAt: '' },
  { id: 'prayer', title: 'المحافظة على الصلوات الخمس', category: 'الصلاة', unit: 'صلاة', target: 5, frequency: 'daily', gradual: true, createdAt: '' },
  { id: 'charity', title: 'الصدقة', category: 'الخير', unit: 'عمل', target: 1, frequency: 'weekly', gradual: true, createdAt: '' },
];
const habitsWith = (done: string[]): OasisHabit[] => todaysHabits({
  day, plans, restDay: false,
  checkins: Object.fromEntries(done.filter(d => !d.startsWith('plan')).map(p => [`${p}_${day}`, { status: 'on_time' }])),
  logs: { [day]: done.includes('plan') ? { quran: 2 } : { quran: 1 } },
});

test('Oasis: today = five prayers + daily plans, without prayer duplicates or weekly plans', () => {
  const h = habitsWith([]);
  assert.deepStrictEqual(h.map(x => x.id), ['prayer:fajr', 'prayer:dhuhr', 'prayer:asr', 'prayer:maghrib', 'prayer:isha', 'plan:quran']);
  assert.strictEqual(h.find(x => x.id === 'plan:quran')!.done, false, 'below target is not done');
});

test('Oasis: rest day hides prayers', () => {
  const h = todaysHabits({ day, plans, restDay: true, checkins: {}, logs: {} });
  assert.deepStrictEqual(h.map(x => x.id), ['plan:quran']);
});

test('Oasis: skipped prayer status does not count', () => {
  const h = todaysHabits({ day, plans: [], restDay: false, checkins: { [`fajr_${day}`]: { status: 'none' } }, logs: {} });
  assert.strictEqual(h[0].done, false);
});

test('Oasis: first completion = seed, next = drops, all done = lantern + bonus seed', () => {
  let l = emptyLedger();
  let r = computeGrants(l, day, habitsWith(['fajr']));
  assert.deepStrictEqual(r.grants.map(g => [g.seeds, g.drops, g.lanterns]), [[1, 0, 0]]);
  r = computeGrants(r.ledger, day, habitsWith(['fajr', 'dhuhr', 'asr']));
  assert.deepStrictEqual(r.grants.map(g => [g.seeds, g.drops]), [[0, 1], [0, 1]]);
  r = computeGrants(r.ledger, day, habitsWith(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'plan']));
  const total = r.grants.reduce((a, g) => ({ s: a.s + g.seeds, d: a.d + g.drops, l: a.l + g.lanterns }), { s: 0, d: 0, l: 0 });
  assert.deepStrictEqual(total, { s: 1, d: 3, l: 1 });
});

test('Oasis: the same completion is never awarded twice', () => {
  const h = habitsWith(['fajr', 'dhuhr']);
  const a = computeGrants(emptyLedger(), day, h);
  const b = computeGrants(a.ledger, day, h);
  assert.strictEqual(b.grants.length, 0);
  const all = habitsWith(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'plan']);
  const c = computeGrants(b.ledger, day, all);
  const d = computeGrants(c.ledger, day, all);
  assert.strictEqual(d.grants.length, 0, 'lantern only once per day');
});

test('Oasis: a new day starts with a seed again', () => {
  const a = computeGrants(emptyLedger(), day, habitsWith(['fajr']));
  const next = todaysHabits({ day: '2026-10-21', plans: [], restDay: false, checkins: { 'fajr_2026-10-21': { status: 'late' } }, logs: {} });
  const b = computeGrants(a.ledger, '2026-10-21', next);
  assert.strictEqual(b.grants[0].seeds, 1);
  assert.strictEqual(b.grants[0].firstOfDay, true);
});

test('Oasis: grants stay pending until the oasis confirms them', () => {
  const a = computeGrants(emptyLedger(), day, habitsWith(['fajr', 'dhuhr']));
  assert.strictEqual(a.ledger.pending.length, 2);
  const b = ackGrants(a.ledger, [a.grants[0].id]);
  assert.deepStrictEqual(b.pending.map(g => g.id), [a.grants[1].id]);
  assert.strictEqual(ackGrants(b, []), b);
});
