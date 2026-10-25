import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { splitBasmala, plain } from '../src/quran/quranText';

const firsts: { text: string; numberInSurah: number; surah: { number: number } }[] =
  JSON.parse(readFileSync(new URL('./fixtures-first-ayahs.json', import.meta.url), 'utf8'));

test('Quran: the basmala is separated from verse 1 in all 112 surahs that carry it', () => {
  assert.strictEqual(firsts.length, 114);
  for (const a of firsts) {
    const out = splitBasmala(a);
    if (a.surah.number === 1 || a.surah.number === 9) assert.strictEqual(out, a.text, `surah ${a.surah.number} untouched`);
    else {
      assert.ok(!plain(out).startsWith('بسم الله الرحمن الرحيم'), `surah ${a.surah.number} still starts with basmala`);
      assert.ok(out.length > 0, `surah ${a.surah.number} verse text kept`);
    }
  }
});

test('Quran: verses other than the first are never changed', () => {
  const a = { text: firsts[1].text, numberInSurah: 2, surah: { number: 2 } };
  assert.strictEqual(splitBasmala(a), a.text);
});
