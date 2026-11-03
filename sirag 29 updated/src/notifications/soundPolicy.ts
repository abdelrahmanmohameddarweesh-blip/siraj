/** Pure catalog shared by planning, Android channels, previews and delivery tests. */
export const SOUND_OPTIONS = {
  adhan: [
    { id: "athan", label: "أذان سراج" },
    { id: "gentle", label: "تنبيه هادئ" },
    { id: "default", label: "نغمة الجهاز" },
    { id: "silent", label: "صامت" },
  ],
  wudu: [
    { id: "wudu_drop", label: "قطرات الوضوء" },
    { id: "wudu_soft", label: "استعداد هادئ" },
    { id: "default", label: "نغمة الجهاز" },
    { id: "silent", label: "صامت" },
  ],
  reminder: [
    { id: "prayer_bell", label: "نداء التذكير" },
    { id: "prayer_soft", label: "تذكير لطيف" },
    { id: "default", label: "نغمة الجهاز" },
    { id: "silent", label: "صامت" },
  ],
} as const;
export type SoundRole = keyof typeof SOUND_OPTIONS;
export type SoundId = (typeof SOUND_OPTIONS)[SoundRole][number]["id"];
export type PlannedSound = Exclude<SoundId, "silent"> | null;
export type SoundPreferences = Partial<Record<SoundRole, SoundId>>;
export const SOUND_DEFAULTS = {
  adhan: "athan",
  wudu: "wudu_drop",
  reminder: "prayer_bell",
} as const;
export function selectedSound(
  prefs: SoundPreferences | undefined,
  role: SoundRole,
): SoundId {
  const id = prefs?.[role];
  return SOUND_OPTIONS[role].some((o) => o.id === id)
    ? id!
    : SOUND_DEFAULTS[role];
}
export function plannedSound(
  prefs: SoundPreferences | undefined,
  role: SoundRole,
): PlannedSound {
  const id = selectedSound(prefs, role);
  return id === "silent" ? null : id;
}
export function soundFile(id: SoundId | null): string | null {
  return !id || id === "silent"
    ? null
    : id === "default"
      ? "default"
      : `${id}.wav`;
}
export function soundChannel(role: SoundRole, sound: PlannedSound): string {
  // Android channel audio is immutable. A new choice needs its own stable channel.
  return `siraj-${role}-${sound || "silent"}-v3`;
}
export function prayerSoundRole(type: unknown): SoundRole | null {
  return type === "prayer_athan"
    ? "adhan"
    : type === "prayer_pre"
      ? "wudu"
      : type === "prayer_checkin"
        ? "reminder"
        : null;
}
export function foregroundSound(
  data: Record<string, unknown>,
  sound: unknown,
  active: boolean,
): boolean {
  if (data.attention === "1" || !sound) return false;
  // The active-app router plays the full recording instead of the OS excerpt.
  return !(
    active &&
    data.type === "prayer_athan" &&
    (data.soundId === "athan" || data.soundId === undefined)
  );
}
