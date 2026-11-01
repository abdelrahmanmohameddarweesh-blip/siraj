import type { PrayerNotificationConfig } from "../prayer/types";
export type PrayerPreset = "gentle" | "steady" | "strong";
export function prayerPresetPatch(
  preset: PrayerPreset,
): Partial<PrayerNotificationConfig> {
  return {
    reminderIntensity: preset,
    notificationsEnabled: true,
    checkinFollowUpEnabled: preset !== "gentle",
    preAlertMin: preset === "strong" ? 10 : 0,
    preAlertByPrayer: {},
    followUpMin: {},
  };
}

/** Enabling one follow-up from an adhan-only plan must not enable all the others. */
export function followUpPatch(
  config: Partial<PrayerNotificationConfig>,
  prayer: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha",
  minutes: number,
): Partial<PrayerNotificationConfig> {
  const defaults =
    config.checkinFollowUpEnabled === false
      ? { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
      : config.followUpMin;
  return {
    checkinFollowUpEnabled: true,
    followUpMin: { ...defaults, [prayer]: minutes },
  };
}
