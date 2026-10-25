import test from 'node:test';
import assert from 'node:assert';
import {
  toHijri, gregorianToTabularCivil, evaluateFastingForHijri,
  isFastingReminderSupported, verifiedYears,
} from '../src/apps/fasting/hijriEngine';

// --- Conversion: tabular civil vs an independent implementation (ICU islamic-civil) ---
test('Hijri: tabular civil matches ICU islamic-civil for 2000-2039', () => {
  const f = new Intl.DateTimeFormat('en-u-ca-islamic-civil', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' });
  let mismatches = 0;
  for (let t = Date.UTC(2000, 0, 1); t < Date.UTC(2040, 0, 1); t += 86400000) {
    const d = new Date(t);
    const a = gregorianToTabularCivil(d);
    const p = f.formatToParts(d);
    const y = parseInt(p.find((x) => x.type === 'year')!.value, 10);
    const m = +p.find((x) => x.type === 'month')!.value;
    const dd = +p.find((x) => x.type === 'day')!.value;
    if (a.year !== y || a.month !== m || a.day !== dd) mismatches++;
  }
  assert.strictEqual(mismatches, 0);
});

test('Hijri: no Umm al-Qura years are marked verified yet, so reminders are gated off', () => {
  assert.deepStrictEqual(verifiedYears(), []);
  const h = toHijri(new Date(Date.UTC(2026, 9, 13)));
  assert.strictEqual(h.calendarType, 'tabular_civil');
  assert.strictEqual(isFastingReminderSupported(h), false);
});

test('Hijri: ±1 day adjustment shifts the date', () => {
  const d = new Date(Date.UTC(2026, 9, 13));
  const a = toHijri(d, 0), b = toHijri(d, 1);
  const next = new Date(Date.UTC(2026, 9, 14));
  assert.deepStrictEqual([b.year, b.month, b.day], [toHijri(next).year, toHijri(next).month, toHijri(next).day]);
  assert.notDeepStrictEqual([a.month, a.day], [b.month, b.day]);
});

// --- Rules: tested on Hijri input directly, independent of conversion accuracy ---
test('Fasting rules: Eid al-Fitr (1 Shawwal) forbidden', () => {
  const e = evaluateFastingForHijri({ month: 10, day: 1 }, 1);
  assert.strictEqual(e.isForbidden, true);
  assert.strictEqual(e.suggestFasting, false);
});

test('Fasting rules: Eid al-Adha (10 Dhul-Hijjah) forbidden even on Thursday', () => {
  const e = evaluateFastingForHijri({ month: 12, day: 10 }, 4);
  assert.strictEqual(e.isForbidden, true);
});

test('Fasting rules: 11, 12, 13 Dhul-Hijjah forbidden; 13th is not a white day there', () => {
  for (const day of [11, 12, 13]) {
    const e = evaluateFastingForHijri({ month: 12, day }, 1);
    assert.strictEqual(e.isForbidden, true, `day ${day}`);
    assert.strictEqual(e.isWhiteDay, false);
  }
});

test('Fasting rules: 13-15 of other months are white days', () => {
  for (const day of [13, 14, 15]) {
    assert.strictEqual(evaluateFastingForHijri({ month: 7, day }, 0).isWhiteDay, true);
  }
});

test('Fasting rules: Monday/Thursday suggested; Ramadan not a voluntary suggestion', () => {
  assert.strictEqual(evaluateFastingForHijri({ month: 3, day: 5 }, 1).suggestFasting, true);
  assert.strictEqual(evaluateFastingForHijri({ month: 3, day: 5 }, 4).suggestFasting, true);
  assert.strictEqual(evaluateFastingForHijri({ month: 3, day: 5 }, 2).suggestFasting, false);
  assert.strictEqual(evaluateFastingForHijri({ month: 9, day: 14 }, 1).suggestFasting, false);
});
