import { localDay } from '../habits/habitData';
export const COUNTED_PRAYERS = new Set(['on_time', 'late', 'qada']);
export function playbackCredit(previous: { position: number; at: number; playing: boolean }, current: { position: number; at: number }, seeking = false): number {
  const delta = current.position - previous.position;
  const elapsed = Math.max(0, (current.at - previous.at) / 1000);
  if (seeking || !previous.playing || !Number.isFinite(delta) || delta <= 0 || delta > elapsed + 1.5) return 0;
  return Math.min(delta, elapsed);
}
/** Attribute actual seconds to local calendar days, including playback across midnight. */
export function splitPlayback(seconds: number, end: Date): Record<string, number> {
  const out: Record<string, number> = {};
  let cursor = new Date(end.getTime() - Math.max(0, seconds) * 1000);
  while (cursor < end) {
    const boundary = new Date(cursor); boundary.setHours(24, 0, 0, 0);
    const next = Math.min(end.getTime(), boundary.getTime());
    out[localDay(cursor)] = (out[localDay(cursor)] || 0) + (next - cursor.getTime()) / 1000;
    cursor = new Date(next);
  }
  return out;
}
export function prayerCount(records: Record<string, { status?: string }>, day: string, onlyFajr = false) {
  return ['fajr','dhuhr','asr','maghrib','isha'].filter(p => (!onlyFajr || p === 'fajr') && COUNTED_PRAYERS.has(records[`${p}_${day}`]?.status || '')).length;
}
