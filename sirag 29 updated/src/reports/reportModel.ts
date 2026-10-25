import { HabitPlan, localDay } from '../habits/habitData';
import { effectiveTarget } from '../habits/library';
import { AthkarLog } from '../athkar/athkarEngine';
import { HifzState, addDays } from '../quran/hifz/hifzEngine';
import { PrayerCheckinRecord } from '../prayer/types';
import { PRAYER_IDS } from '../notifications/schedulePlan';
import { COUNTED_PRAYERS } from '../tracking/activityModel';

export type ReportSources = {
  checkins: Record<string, PrayerCheckinRecord>; restDays: string[]; athkar: AthkarLog;
  readDays: Record<string, number[]>; listening: Record<string, number>;
  hifz: HifzState | null; plans: HabitPlan[]; logs: Record<string, Record<string, number>>;
};
export type DayReport = {
  day: string; prayers: number; due: number; onTime: number; late: number; qada: number; congregation: number; rest: boolean;
  morning: boolean; evening: boolean; dhikrSeconds: number; pages: number; listenSeconds: number;
  learned: number; reviewed: number; habitsDone: number; habitsTotal: number; active: boolean;
};
export const datesFor = (end: string, count: number) => Array.from({ length: count }, (_, i) => addDays(end, i - count + 1));
export function buildReport(source: ReportSources, dates: string[], now = new Date(), todaysPrayerTimes?: Record<string, Date>): DayReport[] {
  const today = localDay(now);
  return dates.map(day => {
    const records = PRAYER_IDS.map(p => source.checkins[`${p}_${day}`]);
    const counted = records.filter(r => r && COUNTED_PRAYERS.has(r.status));
    const rest = source.restDays.includes(day);
    const due = rest || day > today ? 0 : day < today || !todaysPrayerTimes ? 5 : PRAYER_IDS.filter(p => now >= todaysPrayerTimes[p]).length;
    const plans = source.plans.filter(p => !['prayer','fajr'].includes(p.id) && p.kind !== 'prayers' && localDay(new Date(p.createdAt)) <= day && (p.frequency === 'daily' || new Date(day+'T12:00:00').getDay() === 5));
    const dhikr = source.athkar[day];
    const result: DayReport = {
      day, prayers: counted.length, due: rest ? 0 : Math.max(due, counted.length), onTime: counted.filter(r => r.status === 'on_time').length,
      late: counted.filter(r => r.status === 'late').length, qada: counted.filter(r => r.status === 'qada').length,
      congregation: counted.filter(r => r.mode === 'jamaa').length, rest,
      morning: !!dhikr?.morning?.done, evening: !!dhikr?.evening?.done,
      dhikrSeconds: (dhikr?.morning?.seconds || 0) + (dhikr?.evening?.seconds || 0),
      pages: new Set(source.readDays[day] || []).size, listenSeconds: Math.max(0, Number(source.listening[day]) || 0),
      learned: Object.values(source.hifz?.items || {}).filter(item => item.learnedOn === day).length,
      reviewed: source.hifz?.reviewed?.[day] || 0,
      habitsDone: plans.filter(p => (source.logs[day]?.[p.id] || 0) >= effectiveTarget(p, day)).length, habitsTotal: plans.length, active: false,
    };
    result.active = result.prayers > 0 || result.morning || result.evening || result.pages > 0 || result.listenSeconds > 0 || result.learned > 0 || result.reviewed > 0 || result.habitsDone > 0;
    return result;
  });
}
export function reportTotals(days: DayReport[]) {
  const sum = (key: keyof DayReport) => days.reduce((n, d) => n + Number(d[key]), 0);
  return { eligiblePrayers: days.filter(d => !d.rest).reduce((n,d)=>n+d.prayers,0), prayers: sum('prayers'), due: sum('due'), onTime: sum('onTime'), late: sum('late'), qada: sum('qada'), congregation: sum('congregation'),
    morning: sum('morning'), evening: sum('evening'), pages: sum('pages'), listenSeconds: sum('listenSeconds'), learned: sum('learned'), reviewed: sum('reviewed'),
    habitsDone: sum('habitsDone'), habitsTotal: sum('habitsTotal'), dhikrSeconds: sum('dhikrSeconds'), activeDays: sum('active'), restDays: sum('rest') };
}
