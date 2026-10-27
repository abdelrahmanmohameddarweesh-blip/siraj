import { localDay } from "../habits/habitData";
import { addDays } from "../quran/hifz/hifzEngine";
export const activityOptions = {
  reading: {
    label: "قراءة القرآن",
    unit: "صفحة",
    max: 604,
    defaultGoal: 2,
    screen: "QuranReader",
  },
  listening: {
    label: "الاستماع للقرآن",
    unit: "دقيقة",
    max: 180,
    defaultGoal: 10,
    screen: "QuranReader",
  },
  prayers: {
    label: "الصلاة",
    unit: "صلاة",
    max: 5,
    defaultGoal: 5,
    screen: "PrayerTracker",
  },
  adhkar_morning: {
    label: "أذكار الصباح",
    unit: "ورد",
    max: 1,
    defaultGoal: 1,
    screen: "Adhkar",
  },
  adhkar_evening: {
    label: "أذكار المساء",
    unit: "ورد",
    max: 1,
    defaultGoal: 1,
    screen: "Adhkar",
  },
  hifz: {
    label: "حفظ القرآن",
    unit: "آية",
    max: 1000,
    defaultGoal: 1,
    screen: "Hifz",
  },
  hifz_review: {
    label: "مراجعة الحفظ",
    unit: "آية",
    max: 1000,
    defaultGoal: 5,
    screen: "Hifz",
  },
  custom: {
    label: "عادة أخرى",
    unit: "مرة",
    max: 10000,
    defaultGoal: 1,
    screen: "",
  },
} as const;
export type Activity = keyof typeof activityOptions;
export type CircleOptions = {
  maxMembers: number;
  showNames: boolean;
  showGroupProgress: boolean;
  showMemberProgress: boolean;
  showCompletedMembers: boolean;
  showPendingMembers: boolean;
};
export const defaultCircleOptions: CircleOptions = {
  maxMembers: 10,
  showNames: true,
  showGroupProgress: true,
  showMemberProgress: false,
  showCompletedMembers: true,
  showPendingMembers: false,
};
export type CircleDraft = CircleOptions & {
  name: string;
  activity: Activity;
  goal: number;
  startDay: string;
  endDay: string;
  habitName?: string;
};
export type Circle = {
  id: string;
  name: string;
  ownerUid: string;
  activity: Activity;
  startDay: string;
  endDay: string;
  timeZone: string;
  memberCount: number;
  createdAt: number;
  maxMembers?: number;
  sharedGoal?: number;
  habitName?: string | null;
  showNames?: boolean;
  showGroupProgress?: boolean;
  showMemberProgress?: boolean;
  showCompletedMembers?: boolean;
  showPendingMembers?: boolean;
  allowPersonalGoals?: boolean;
};
export type Membership = {
  uid: string;
  name: string;
  activity: Activity;
  goal: number;
  visible: boolean;
  nameVisible?: boolean;
  reminders: boolean;
  summary: boolean;
  reminderHour: number;
  reminderMinute: number;
  pushToken?: string | null;
};
export type Companion = {
  uid: string;
  name: string;
  visible: boolean;
  statuses?: Record<string, boolean | null>;
  progress?: Record<string, number | null>;
  alias?: string;
};
export type PrivateDay = {
  day: string;
  pages: number;
  seconds: number;
  done: boolean;
  value?: number;
  percent?: number;
};
export type CircleDetail = {
  circle: Circle;
  member: Membership;
  companions: Companion[];
  days: Record<string, number>;
  mine: Record<string, PrivateDay>;
  encouragement: {
    id: string;
    name: string;
    message: string;
    day: string;
    createdAt: number;
  }[];
};
export function journeyDays(start: string, end?: string) {
  const count = end
    ? Math.round(
        (Date.parse(end + "T12:00:00Z") - Date.parse(start + "T12:00:00Z")) /
          86400000,
      ) + 1
    : 7;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !Number.isFinite(count) ||
    count < 1 ||
    count > 90 ||
    new Date(start + "T12:00:00Z").toISOString().slice(0, 10) !== start ||
    (end && new Date(end + "T12:00:00Z").toISOString().slice(0, 10) !== end)
  )
    throw new Error("اختر تاريخين صحيحين لمدة من يوم إلى ٩٠ يومًا");
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}
export function circleDay(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function canonicalProgress(
  readDays: Record<string, number[]>,
  seconds: number,
  day: string,
) {
  return {
    pages: new Set(
      (readDays[day] || []).filter(
        (p) => Number.isInteger(p) && p >= 1 && p <= 604,
      ),
    ).size,
    seconds: Math.min(86400, Math.max(0, Math.floor(Number(seconds) || 0))),
  };
}
export function canSync(circle: Circle, now = new Date()) {
  const day = circleDay(circle.timeZone, now);
  return (
    day >= circle.startDay && day <= circle.endDay && day === localDay(now)
  );
}
export function parseGoal(input: string, activity: Activity) {
  const value = Number(
    input
      .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
      .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776)),
  );
  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > activityOptions[activity].max
  )
    throw new Error(
      `الهدف من ١ إلى ${activityOptions[activity].max} ${activityOptions[activity].unit}`,
    );
  return value;
}
export function inviteCode(input: string) {
  const match = input.match(/[?&]code=([a-fA-F0-9]{12})\b/);
  return (match?.[1] || input).trim().toUpperCase().replace(/[\s-]/g, "");
}

export function progressForHabit(
  activity: Activity,
  source: import("../reports/reportModel").ReportSources,
  day: string,
) {
  const q = canonicalProgress(source.readDays, source.listening[day], day);
  let value = 0;
  if (activity === "prayers")
    value = ["fajr", "dhuhr", "asr", "maghrib", "isha"].filter((p) =>
      ["on_time", "late", "qada"].includes(
        source.checkins[`${p}_${day}`]?.status,
      ),
    ).length;
  if (activity === "adhkar_morning")
    value = Number(!!source.athkar[day]?.morning?.done);
  if (activity === "adhkar_evening")
    value = Number(!!source.athkar[day]?.evening?.done);
  if (activity === "hifz")
    value = Object.values(source.hifz?.items || {}).filter(
      (i) => i.learnedOn === day,
    ).length;
  if (activity === "hifz_review") value = source.hifz?.reviewed?.[day] || 0;
  return {
    pages: activity === "reading" ? q.pages : 0,
    seconds: activity === "listening" ? q.seconds : 0,
    value: Math.max(
      0,
      Math.min(activityOptions[activity].max, Math.floor(value)),
    ),
  };
}

export function invitationFromURL(
  raw: string | null | undefined,
  base = "",
): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    let host = "";
    try {
      const configured = new URL(base);
      if (configured.protocol === "https:") host = configured.hostname;
    } catch {}
    const trusted =
      (url.protocol === "sirag:" &&
        (url.hostname === "sohba" || url.pathname === "/sohba")) ||
      (url.protocol === "https:" &&
        !!host &&
        url.hostname === host &&
        ["/", "/join"].includes(url.pathname));
    const code = (url.searchParams.get("code") || "").toUpperCase();
    return trusted && /^[A-F0-9]{12}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}
