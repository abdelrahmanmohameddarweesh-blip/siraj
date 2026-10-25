import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { surahsList } from '../src/data/surahs';
import { newState, todaysKeys, startToday, completeToday, dueKeys, reviewAnswer, nextRef, words, missingWord, continuation, buildNewTest, rng, addDays, score, keyOf } from '../src/quran/hifz/hifzEngine';

const lengths = surahsList.map(s => s.totalAyahs);
const firsts: any[] = JSON.parse(readFileSync(new URL('./fixtures-first-ayahs.json', import.meta.url), 'utf8'));
const day = '2026-10-20';

test('Hifz: Juz \'Amma order goes from An-Nas backwards, forward order goes on', () => {
  assert.deepStrictEqual(nextRef({ s: 114, a: 6 }, 'juzAmma', lengths), { s: 113, a: 1 });
  assert.deepStrictEqual(nextRef({ s: 114, a: 2 }, 'juzAmma', lengths), { s: 114, a: 3 });
  assert.deepStrictEqual(nextRef({ s: 1, a: 7 }, 'forward', lengths), { s: 2, a: 1 });
  assert.strictEqual(nextRef({ s: 114, a: 6 }, 'forward', lengths), null);
});

test('Hifz: today\'s verses are fixed for the day; passing adds them to review and moves on', () => {
  let st = newState({ start: { s: 114, a: 1 }, order: 'juzAmma', perDay: 3 });
  const keys = todaysKeys(st, day, 3, lengths);
  assert.deepStrictEqual(keys, ['114:1', '114:2', '114:3']);
  st = startToday(st, day, keys);
  const fail = completeToday(st, day, 0.6, lengths);
  assert.strictEqual(fail.passed, false); assert.strictEqual(Object.keys(fail.state.items).length, 0);
  const pass = completeToday(fail.state, day, 0.9, lengths);
  assert.strictEqual(pass.learned, 3);
  assert.deepStrictEqual(pass.state.cursor, { s: 114, a: 4 });
  assert.strictEqual(pass.state.items['114:1'].due, addDays(day, 1));
  assert.strictEqual(completeToday(pass.state, day, 1, lengths).learned, 0, 'no double credit');
  assert.deepStrictEqual(todaysKeys(pass.state, addDays(day, 1), 3, lengths), ['114:4', '114:5', '114:6']);
});

test('Hifz: spaced review grows the gap when right and resets when wrong', () => {
  let st = newState({ start: { s: 114, a: 1 }, order: 'juzAmma', perDay: 1 });
  st = completeToday(startToday(st, day, ['114:1']), day, 1, lengths).state;
  const d1 = addDays(day, 1);
  assert.deepStrictEqual(dueKeys(st, day), []);
  assert.deepStrictEqual(dueKeys(st, d1), ['114:1']);
  st = reviewAnswer(st, '114:1', true, d1);
  assert.strictEqual(st.items['114:1'].due, addDays(d1, 3));
  st = reviewAnswer(st, '114:1', false, addDays(d1, 3));
  assert.strictEqual(st.items['114:1'].box, 0); assert.strictEqual(st.items['114:1'].lapses, 1);
  assert.strictEqual(st.reviewed![d1], 1);
});

test('Hifz: questions use real words and always contain the right answer', () => {
  const pool = firsts.slice(77, 114).map(a => ({ s: a.surah.number, a: 1, text: a.text }));
  const r = rng(3);
  for (const t of pool) {
    const q = missingWord(t, pool, r);
    if (q && q.kind === 'missing') { assert.ok(q.options.length >= 3); assert.ok(words(t.text).includes(q.options[q.answer])); }
    const c = continuation(t, pool, r);
    if (c && c.kind === 'continue') assert.ok(t.text.replace(/\s+/g, ' ').includes(c.options[c.answer].split(' ')[0]));
  }
  const test1 = buildNewTest(pool.slice(0, 3), pool, 7);
  assert.ok(test1.length >= 4);
  assert.ok(test1.some(q => q.kind === 'recite'));
  assert.strictEqual(score([{ key: 'a', credit: 1 }, { key: 'b', credit: 0.5 }]), 0.75);
});
