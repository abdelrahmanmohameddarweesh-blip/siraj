/**
 * Pure planner for every local notification the app sends (prayers + habits).
 * The scheduler turns this list into real notifications; keeping it pure makes it testable.
 */
import type { HabitPlan, HabitReminder } from '../habits/habitData';
import { effectiveTarget } from '../habits/library';

export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export const PRAYER_IDS: PrayerId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const PRAYER_AR: Record<PrayerId, string> = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
/** Minutes after the adhan when the congregation is usually over (iqama + prayer). Maghrib is shorter. */
export const DEFAULT_FOLLOW_UP: Record<PrayerId, number> = { fajr: 35, dhuhr: 30, asr: 30, maghrib: 20, isha: 30 };

export type DayTimes = { dateStr: string; fajr: Date; sunrise: Date; dhuhr: Date; asr: Date; maghrib: Date; isha: Date };
export type PrayerSettings = {
  enabled: boolean;
  perPrayer: Record<PrayerId, { enabled: boolean; sound: boolean }>;
  followUp: boolean;
  followUpMin: Record<PrayerId, number>;
  preAlertMin: number; // 0 = off
  quietStart: string; quietEnd: string; quietEnabled: boolean; // applies to habit reminders only
};
export type Planned = {
  id: string; at: Date; title: string; body: string;
  channel: 'athan' | 'checkin' | 'habits';
  sound: 'athan' | 'default' | null;
  data: Record<string, string>;
};
export type PlanInput = {
  now: Date;
  days: DayTimes[];
  prayer: PrayerSettings;
  plans: HabitPlan[];
  logs: Record<string, Record<string, number> | undefined>;
  checkins: Record<string, { status?: string } | undefined>;
  restDays: string[];
  limit?: number;
};

const COUNTED = new Set(['on_time', 'late', 'qada']);
const mins = (d: Date, m: number) => new Date(d.getTime() + m * 60000);
function inQuiet(d: Date, s: PrayerSettings) {
  if (!s.quietEnabled) return false;
  const [sh, sm] = s.quietStart.split(':').map(Number), [eh, em] = s.quietEnd.split(':').map(Number);
  const t = d.getHours() * 60 + d.getMinutes(), a = sh * 60 + sm, b = eh * 60 + em;
  return a > b ? (t >= a || t < b) : (t >= a && t < b);
}
export function reminderTime(r: HabitReminder, day: DayTimes): Date {
  if (r.anchor === 'clock') {
    const [h, m] = (r.clock || '09:00').split(':').map(Number);
    const d = new Date(day.dateStr + 'T00:00:00'); d.setHours(h, m, 0, 0); return d;
  }
  return mins(day[r.anchor], r.offsetMin);
}
const HABIT_COPY: Record<string, (p: HabitPlan, t: number) => { title: string; body: string }> = {
  adhkar_morning: () => ({ title: 'أذكار الصباح 🌅', body: 'دقائق قليلة تبدأ بها يومك.' }),
  adhkar_evening: () => ({ title: 'أذكار المساء 🌇', body: 'حان وقت أذكار المساء.' }),
  hifz: (_p, t) => ({ title: 'ورد الحفظ 🧠', body: `آيات اليوم: ${t.toLocaleString('ar-EG')}، ثم اختبار قصير.` }),
  hifz_review: (_p, t) => ({ title: 'مراجعة الحفظ 🔁', body: `راجع ${t.toLocaleString('ar-EG')} آيات مما حفظت.` }),
  quran_read: (_p, t) => ({ title: 'وردك من القرآن 📖', body: `${t.toLocaleString('ar-EG')} ${t === 1 ? 'صفحة' : 'صفحات'} اليوم.` }),
};
const copyFor = (p: HabitPlan, t: number) => (HABIT_COPY[p.kind || ''] || ((pl: HabitPlan, tt: number) => ({ title: pl.title, body: `هدف اليوم: ${tt.toLocaleString('ar-EG')} ${pl.unit}` })))(p, t);

export function buildSchedule(input: PlanInput): Planned[] {
  const out: Planned[] = [];
  const s = input.prayer, nowMs = input.now.getTime() + 5000;
  for (const day of input.days) {
    const rest = input.restDays.includes(day.dateStr);
    if (s.enabled && !rest) {
      for (const p of PRAYER_IDS) {
        const cfg = s.perPrayer[p]; if (!cfg?.enabled) continue;
        const at = day[p];
        if (s.preAlertMin > 0) out.push({ id: `pre:${day.dateStr}:${p}`, at: mins(at, -s.preAlertMin), title: `${PRAYER_AR[p]} بعد ${s.preAlertMin.toLocaleString('ar-EG')} دقائق`, body: 'وقت مناسب للوضوء والاستعداد.', channel: 'checkin', sound: 'default', data: { type: 'prayer_pre', prayer: p, date: day.dateStr } });
        out.push({ id: `athan:${day.dateStr}:${p}`, at, title: `حان الآن وقت صلاة ${PRAYER_AR[p]} 🕌`, body: 'حيّ على الصلاة، حيّ على الفلاح.', channel: 'athan', sound: cfg.sound ? 'athan' : 'default', data: { type: 'prayer_athan', prayer: p, date: day.dateStr } });
        const done = COUNTED.has(String(input.checkins[`${p}_${day.dateStr}`]?.status));
        if (s.followUp && !done) out.push({ id: `pfu:${day.dateStr}:${p}`, at: mins(at, s.followUpMin[p] ?? DEFAULT_FOLLOW_UP[p]), title: `هل صليت ${PRAYER_AR[p]}؟`, body: 'اضغط لتسجيل صلاتك.', channel: 'checkin', sound: 'default', data: { type: 'prayer_checkin', prayer: p, date: day.dateStr } });
      }
    }
    for (const plan of input.plans) {
      if (!plan?.reminders?.length || plan.kind === 'prayers') continue;
      if (plan.frequency === 'weekly' && new Date(day.dateStr + 'T12:00:00').getDay() !== 5) continue; // weekly plans: Friday
      const target = effectiveTarget(plan, day.dateStr);
      const done = (input.logs[day.dateStr]?.[plan.id] || 0) >= target;
      if (done) continue;
      const copy = copyFor(plan, target);
      plan.reminders.forEach((r, i) => {
        const at = reminderTime(r, day);
        if (!inQuiet(at, s)) out.push({ id: `hab:${day.dateStr}:${plan.id}:${i}`, at, title: copy.title, body: copy.body, channel: 'habits', sound: 'default', data: { type: 'habit', planId: plan.id, kind: plan.kind || 'count', date: day.dateStr } });
      });
      if (plan.followUpMin) {
        const at = mins(reminderTime(plan.reminders[0], day), plan.followUpMin);
        if (!inQuiet(at, s)) out.push({ id: `habfu:${day.dateStr}:${plan.id}`, at, title: `لم تكمل ${plan.title} بعد`, body: 'ما زال هناك وقت اليوم.', channel: 'habits', sound: 'default', data: { type: 'habit', planId: plan.id, kind: plan.kind || 'count', date: day.dateStr } });
      }
    }
  }
  const limit = input.limit ?? 60; // iOS keeps at most 64 pending notifications
  return out.filter(n => n.at.getTime() > nowMs).sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, limit);
}

/** Where tapping a notification should take the user. */
export function routeFor(data: Record<string, any> | undefined): { screen: string; params?: Record<string, any> } {
  if (!data) return { screen: 'Home' };
  if (data.type === 'prayer_checkin') return { screen: 'PrayerTracker', params: { checkin: data.prayer, date: data.date } };
  if (data.type === 'prayer_athan' || data.type === 'prayer_pre') return { screen: 'PrayerTracker' };
  if (data.type === 'oasis') return { screen: 'Oasis' };
  if (data.type === 'habit') {
    if (data.kind === 'adhkar_morning') return { screen: 'Adhkar', params: { session: 'morning' } };
    if (data.kind === 'adhkar_evening') return { screen: 'Adhkar', params: { session: 'evening' } };
    if (data.kind === 'hifz' || data.kind === 'hifz_review') return { screen: 'Hifz' };
    if (data.kind === 'quran_read') return { screen: 'QuranReader' };
  }
  return { screen: 'Home' };
}
