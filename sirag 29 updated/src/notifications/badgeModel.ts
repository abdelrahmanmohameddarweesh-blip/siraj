import type { DayTimes, PrayerId, PrayerSettings } from "./schedulePlan";
const PRAYERS: PrayerId[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const DEFAULT_GRACE: Record<PrayerId, number> = {
  fajr: 35,
  dhuhr: 30,
  asr: 30,
  maghrib: 20,
  isha: 30,
};
const COUNTED = new Set(["on_time", "late", "qada"]);
export function badgeGrace(prayer: PrayerId, settings: PrayerSettings): number {
  const value =
    settings.followUp && settings.followUpMin[prayer] > 0
      ? settings.followUpMin[prayer]
      : DEFAULT_GRACE[prayer];
  return Number.isFinite(value) && value > 0 && value <= 180
    ? value
    : DEFAULT_GRACE[prayer];
}
export function pendingActions(input: {
  now: Date;
  day?: DayTimes;
  settings: PrayerSettings;
  checkins: Record<string, { status?: string } | undefined>;
  rest: boolean;
  canPlant: boolean;
  enabled: boolean;
}) {
  const prayers =
    input.enabled && input.settings.enabled && input.day && !input.rest
      ? PRAYERS.filter(
          (p) =>
            input.settings.perPrayer[p]?.enabled &&
            !COUNTED.has(
              input.checkins[`${p}_${input.day!.dateStr}`]?.status || "",
            ) &&
            input.now.getTime() >=
              input.day![p].getTime() + badgeGrace(p, input.settings) * 60000,
        )
      : [];
  const planting = input.enabled && input.canPlant;
  return { prayers, planting, count: prayers.length + Number(planting) };
}
export function hasPlantableSeeds(state: any): boolean {
  if (!state || !Number.isFinite(state.seeds) || state.seeds < 1) return false;
  const plots = state.oases?.[state.locIdx ?? 0]?.plots;
  return Array.isArray(plots) && (plots.length === 0 || plots.some((p) => !p));
}
