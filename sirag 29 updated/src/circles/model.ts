import { localDay } from "../habits/habitData";
import { addDays } from "../quran/hifz/hifzEngine";
export type Activity = "reading" | "listening";
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
};
export type Membership = {
  uid: string;
  name: string;
  activity: Activity;
  goal: number;
  visible: boolean;
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
};
export type PrivateDay = {
  day: string;
  pages: number;
  seconds: number;
  done: boolean;
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
export function journeyDays(start: string) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
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
    value > (activity === "reading" ? 604 : 180)
  )
    throw new Error(
      "اختر هدفًا من ١ إلى " +
        (activity === "reading" ? "٦٠٤ صفحة" : "١٨٠ دقيقة"),
    );
  return value;
}
export function inviteCode(input: string) {
  const match = input.match(/[?&]code=([a-fA-F0-9]{12})\b/);
  return (match?.[1] || input).trim().toUpperCase().replace(/[\s-]/g, "");
}
