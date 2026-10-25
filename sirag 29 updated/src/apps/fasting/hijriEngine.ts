/**
 * Hijri calendar + voluntary-fasting rules for "بطل مسلم".
 *
 * CALENDAR IMPLEMENTED: Tabular civil Islamic calendar (arithmetic, 30-year cycle,
 * leap years 2,5,7,10,13,16,18,21,24,26,29; Friday epoch, 16 July 622 CE Julian).
 * Evidence: matches ICU `islamic-civil` on every day 2000-01-01..2039-12-31 (14,610 days),
 * checked in test/hijriEngine.test.ts.
 * KNOWN ERROR: it is NOT Umm al-Qura and NOT moon sighting. It can differ from the
 * officially announced date by 1, occasionally 2 days. Users can apply a ±1 day adjustment.
 *
 * UMM AL-QURA: An earlier hand-typed table was found to disagree with ICU's Umm al-Qura
 * calendar on most days and has been REMOVED. Add years to VERIFIED_UMM_AL_QURA only after
 * checking them against KACST's published table. Currently: NONE verified.
 */

export interface HijriDate {
  year: number;
  month: number; // 1-12
  day: number;
  monthNameAr: string;
  monthNameEn: string;
  calendarType: 'umm_al_qura_verified' | 'tabular_civil';
}

export const HIJRI_MONTH_NAMES_AR = [
  '', 'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];
export const HIJRI_MONTH_NAMES_EN = [
  '', 'Muharram', 'Safar', 'Rabi I', 'Rabi II', 'Jumada I', 'Jumada II',
  'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];

/**
 * Month lengths per Hijri year, ONLY for years checked against KACST's published table.
 * Shape: { [hijriYear]: { start: 'YYYY-MM-DD' (Gregorian date of 1 Muharram), months: number[12] } }
 */
export const VERIFIED_UMM_AL_QURA: Record<number, { start: string; months: number[] }> = {};

export function verifiedYears(): number[] {
  return Object.keys(VERIFIED_UMM_AL_QURA).map(Number).sort();
}

export function gregorianToJd(year: number, month: number, day: number): number {
  if (month <= 2) { year -= 1; month += 12; }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
}

export function gregorianToTabularCivil(date: Date): { year: number; month: number; day: number } {
  const jd = gregorianToJd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()) + 0.5;
  const l = Math.floor(jd) - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const lp = l - 10631 * n + 354;
  const j = Math.floor((10985 - lp) / 5316) * Math.floor((50 * lp) / 17719) +
    Math.floor(lp / 5670) * Math.floor((43 * lp) / 15238);
  const l2 = lp - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l2) / 709);
  const day = l2 - Math.floor((709 * month) / 24);
  return { year: 30 * n + j - 30, month, day };
}

function fromVerifiedTable(utcMs: number): Omit<HijriDate, 'monthNameAr' | 'monthNameEn'> | null {
  for (const y of verifiedYears()) {
    const { start, months } = VERIFIED_UMM_AL_QURA[y];
    let rem = Math.round((utcMs - Date.parse(start + 'T00:00:00Z')) / 86400000);
    if (rem < 0) continue;
    for (let m = 0; m < 12; m++) {
      if (rem < months[m]) return { year: y, month: m + 1, day: rem + 1, calendarType: 'umm_al_qura_verified' };
      rem -= months[m];
    }
  }
  return null;
}

/** Converts using a verified Umm al-Qura year if available, else tabular civil. */
export function toHijri(date: Date, adjustmentDays = 0): HijriDate {
  const t = new Date(date.getTime() + adjustmentDays * 86400000);
  const utc = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  const v = fromVerifiedTable(utc);
  const base = v ?? { ...gregorianToTabularCivil(t), calendarType: 'tabular_civil' as const };
  return { ...base, monthNameAr: HIJRI_MONTH_NAMES_AR[base.month], monthNameEn: HIJRI_MONTH_NAMES_EN[base.month] };
}

/** Fasting reminders are only allowed when the date comes from a verified Umm al-Qura year. */
export function isFastingReminderSupported(h: HijriDate): boolean {
  return h.calendarType === 'umm_al_qura_verified';
}

export interface FastingEvaluation {
  suggestFasting: boolean;
  reasonAr?: string;
  reasonEn?: string;
  isForbidden: boolean;
  forbiddenReasonAr?: string;
  forbiddenReasonEn?: string;
  isMondayOrThursday: boolean;
  isWhiteDay: boolean;
}

/** Pure rule check on a Hijri date + weekday (0=Sun..6=Sat). Independent of conversion. */
export function evaluateFastingForHijri(h: { month: number; day: number; monthNameAr?: string; monthNameEn?: string }, dayOfWeek: number): FastingEvaluation {
  const isMondayOrThursday = dayOfWeek === 1 || dayOfWeek === 4;
  const forbidden = (ar: string, en: string): FastingEvaluation => ({
    suggestFasting: false, isForbidden: true, forbiddenReasonAr: ar, forbiddenReasonEn: en,
    isMondayOrThursday, isWhiteDay: false,
  });
  if (h.month === 10 && h.day === 1) return forbidden('يوم عيد الفطر: لا يُصام', 'Eid al-Fitr: no fasting');
  if (h.month === 12 && h.day === 10) return forbidden('يوم عيد الأضحى: لا يُصام', 'Eid al-Adha: no fasting');
  if (h.month === 12 && h.day >= 11 && h.day <= 13)
    return forbidden(`أيام التشريق (${h.day} ذو الحجة): لا تُصام`, `Days of Tashreeq (${h.day} Dhu al-Hijjah): no fasting`);
  if (h.month === 9)
    return { suggestFasting: false, isForbidden: false, reasonAr: 'شهر رمضان (صيام الفريضة)', reasonEn: 'Ramadan (obligatory fast)', isMondayOrThursday, isWhiteDay: false };
  if (h.day >= 13 && h.day <= 15)
    return { suggestFasting: true, isForbidden: false, reasonAr: `الأيام البيض (${h.day} ${h.monthNameAr ?? ''})`, reasonEn: `White Days (${h.day} ${h.monthNameEn ?? ''})`, isMondayOrThursday, isWhiteDay: true };
  if (dayOfWeek === 1)
    return { suggestFasting: true, isForbidden: false, reasonAr: 'صيام يوم الإثنين', reasonEn: 'Monday fast', isMondayOrThursday, isWhiteDay: false };
  if (dayOfWeek === 4)
    return { suggestFasting: true, isForbidden: false, reasonAr: 'صيام يوم الخميس', reasonEn: 'Thursday fast', isMondayOrThursday, isWhiteDay: false };
  return { suggestFasting: false, isForbidden: false, isMondayOrThursday: false, isWhiteDay: false };
}

export function evaluateFasting(date: Date, adjustmentDays = 0): FastingEvaluation {
  return evaluateFastingForHijri(toHijri(date, adjustmentDays), date.getDay());
}
