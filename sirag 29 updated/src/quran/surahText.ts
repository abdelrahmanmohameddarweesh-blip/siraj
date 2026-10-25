import AsyncStorage from '@react-native-async-storage/async-storage';
import { splitBasmala } from './quranText';
import type { AyahText } from './hifz/hifzEngine';

const KEY = (n: number) => `sirag-quran-surah-uthmani-v1-${n}`;
/** Uthmani text of a surah (basmala separated), cached for offline use after the first load. */
export async function getSurahText(n: number): Promise<AyahText[]> {
  try { const raw = await AsyncStorage.getItem(KEY(n)); if (raw) return JSON.parse(raw); } catch { /* fetch */ }
  const res = await fetch(`https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`);
  if (!res.ok) throw new Error('network');
  const j = await res.json();
  const ayahs: AyahText[] = (j?.data?.ayahs || []).map((a: any) => ({ s: n, a: a.numberInSurah, text: splitBasmala({ text: a.text, numberInSurah: a.numberInSurah, surah: { number: n } }) }));
  if (!ayahs.length) throw new Error('empty');
  AsyncStorage.setItem(KEY(n), JSON.stringify(ayahs)).catch(() => {});
  return ayahs;
}
export const ayahAudio = (s: number, a: number) => `https://everyayah.com/data/Alafasy_128kbps/${String(s).padStart(3, '0')}${String(a).padStart(3, '0')}.mp3`;
