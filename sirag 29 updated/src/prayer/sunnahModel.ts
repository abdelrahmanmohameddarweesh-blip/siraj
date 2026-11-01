import type { PrayerId } from "../notifications/schedulePlan";
export const SUNNAH_KEY = "siraj-sunnah-v1";
export const SUNNAH_SLOTS = [
  {
    id: "fajr_before",
    prayer: "fajr",
    side: "before",
    label: "قبل الفجر",
    max: 2,
  },
  {
    id: "dhuhr_before",
    prayer: "dhuhr",
    side: "before",
    label: "قبل الظهر",
    max: 4,
  },
  {
    id: "dhuhr_after",
    prayer: "dhuhr",
    side: "after",
    label: "بعد الظهر",
    max: 2,
  },
  {
    id: "maghrib_after",
    prayer: "maghrib",
    side: "after",
    label: "بعد المغرب",
    max: 2,
  },
  {
    id: "isha_after",
    prayer: "isha",
    side: "after",
    label: "بعد العشاء",
    max: 2,
  },
] as const;
export type SunnahSlot = (typeof SUNNAH_SLOTS)[number]["id"];
export type SunnahLog = Record<string, Partial<Record<SunnahSlot, number>>>;
export function setSunnah(
  log: SunnahLog,
  day: string,
  slot: SunnahSlot,
  rakats: number,
): SunnahLog {
  const definition = SUNNAH_SLOTS.find((s) => s.id === slot);
  if (
    !definition ||
    !Number.isInteger(rakats) ||
    rakats < 0 ||
    rakats > definition.max ||
    rakats % 2
  )
    throw new Error("Invalid sunnah record");
  return { ...log, [day]: { ...log[day], [slot]: rakats } };
}
export function sunnahTotal(log: SunnahLog, day: string) {
  return SUNNAH_SLOTS.reduce(
    (n, s) => n + Math.max(0, Math.min(s.max, Number(log[day]?.[s.id]) || 0)),
    0,
  );
}
export const slotsForPrayer = (prayer: PrayerId) =>
  SUNNAH_SLOTS.filter((s) => s.prayer === prayer);
