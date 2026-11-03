import {
  plannedSound,
  soundFile,
  soundChannel,
  prayerSoundRole,
  SOUND_OPTIONS,
  type SoundRole,
} from "./soundPolicy";
import { syncAppBadge } from "./badgeService";
import { hasPlantableSeeds } from "./badgeModel";
/** Applies the notification plan with expo-notifications. Only touches notifications it owns. */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateRollingWeek } from "../prayer/prayerTimesService";
import {
  getSavedCalculationMethod,
  getSavedLocation,
  getSavedMadhab,
} from "../prayer/locationService";
import { HabitPlan, LOG_KEY, PLANS_KEY } from "../habits/habitData";
import {
  buildSchedule,
  DEFAULT_FOLLOW_UP,
  PRAYER_IDS,
  PrayerSettings,
  Planned,
} from "./schedulePlan";
import { reconcileSchedule } from "./reconcileSchedule";
import type { PrayerNotificationConfig } from "../prayer/types";

const CONFIG_KEY = "batl-prayer-notification-config-v1";
const SIG_KEY = "sirag-notif-signature-v2";
const OWN = ["pre:", "athan:", "pfu:", "hab:", "habfu:", "att:"];
export const CHANNELS = {
  athan: "athan_v2",
  checkin: "prayer_checkin",
  habits: "habits",
  silent: "prayer_silent",
  attention: "pending-actions-v1",
} as const;

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function settingsFromConfig(
  c: Partial<PrayerNotificationConfig> | null,
): PrayerSettings {
  const per = {} as PrayerSettings["perPrayer"];
  for (const p of PRAYER_IDS)
    per[p] = {
      enabled: (c as any)?.[p]?.enabled ?? true,
      sound: (c as any)?.[p]?.sound ?? true,
      athanEnabled: (c as any)?.[p]?.athanEnabled ?? true,
    };
  return {
    enabled: c?.notificationsEnabled ?? true,
    sounds: c?.sounds,
    perPrayer: per,
    followUp: c?.checkinFollowUpEnabled ?? true,
    followUpMin: { ...DEFAULT_FOLLOW_UP, ...(c?.followUpMin || {}) },
    preAlertMin: c?.preAlertMin ?? 0,
    preAlertByPrayer: c?.preAlertByPrayer,
    quietEnabled: c?.quietHoursEnabled ?? true,
    quietStart: c?.quietHoursStart || "23:00",
    quietEnd: c?.quietHoursEnd || "04:30",
  };
}
export async function loadPrayerSettings(): Promise<PrayerSettings> {
  return settingsFromConfig(
    await read<PrayerNotificationConfig | null>(CONFIG_KEY, null),
  );
}

export async function ensureChannels() {
  if (Platform.OS === "web") return;
  await Notifications.setNotificationCategoryAsync("PRAYER_CHECKIN_CATEGORY", [
    {
      identifier: "CHECKIN_OPEN",
      buttonTitle: "سجّل الصلاة",
      options: { opensAppToForeground: true },
    },
  ]);
  if (Platform.OS !== "android") return;
  const prefs = (await loadPrayerSettings()).sounds;
  for (const role of Object.keys(SOUND_OPTIONS) as SoundRole[]) {
    const choice = plannedSound(prefs, role);
    for (const sound of new Set([choice, null])) {
      const option = SOUND_OPTIONS[role].find(
        (o) => o.id === (sound || "silent"),
      );
      await Notifications.setNotificationChannelAsync(
        soundChannel(role, sound),
        {
          name: `${role === "adhan" ? "الأذان" : role === "wudu" ? "الوضوء" : "تذكير الصلاة"} · ${option?.label || "صامت"}`,
          importance:
            role === "adhan"
              ? Notifications.AndroidImportance.HIGH
              : Notifications.AndroidImportance.DEFAULT,
          sound: soundFile(sound),
          vibrationPattern: sound ? [0, 200, 150, 200] : [],
        },
      );
    }
  }
  await Notifications.setNotificationChannelAsync(CHANNELS.silent, {
    name: "مواقيت الصلاة بدون صوت",
    importance: Notifications.AndroidImportance.HIGH,
    sound: null,
  });
  await Notifications.setNotificationChannelAsync(CHANNELS.checkin, {
    name: "تفقّد الصلاة",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync(CHANNELS.attention, {
    name: "أعمال بانتظارك · شارة التطبيق",
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    vibrationPattern: [],
    showBadge: true,
  });
  await Notifications.setNotificationChannelAsync(CHANNELS.habits, {
    name: "تذكير العادات",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function hasPermission() {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}
export async function requestPermissionAndSync(): Promise<boolean> {
  try {
    await ensureChannels();
    let st = await Notifications.getPermissionsAsync();
    if (!st.granted && st.canAskAgain)
      st = await Notifications.requestPermissionsAsync();
    if (st.granted) {
      await ensureChannels();
      await syncNotifications(true);
    }
    return st.granted;
  } catch {
    return false;
  }
}

export async function planNow(now = new Date()): Promise<Planned[]> {
  const [
    loc,
    method,
    madhab,
    config,
    plans,
    logs,
    checkins,
    restDays,
    profile,
    oasis,
  ] = await Promise.all([
    getSavedLocation(),
    getSavedCalculationMethod(),
    getSavedMadhab(),
    read<PrayerNotificationConfig | null>(CONFIG_KEY, null),
    read<HabitPlan[]>(PLANS_KEY, []),
    read<Record<string, Record<string, number>>>(LOG_KEY, {}),
    read<Record<string, { status?: string }>>(
      "batl-prayer-checkin-records-v1",
      {},
    ),
    read<string[]>("batl-prayer-rest-days-v1", []),
    read<{ gender?: string; name?: string } | null>(
      "sirag-personal-profile-v1",
      null,
    ),
    read<any>("sirag-oasis-state-v1", null),
  ]);
  const days = calculateRollingWeek(
    loc,
    now,
    7,
    method,
    madhab,
    config?.adjustments,
  );
  return buildSchedule({
    now,
    days,
    badgesEnabled: config?.badgesEnabled !== false && !!profile,
    canPlant: hasPlantableSeeds(oasis),
    displayName: profile?.name,
    personalizedNotifications: config?.personalizedNotifications,
    prayer: settingsFromConfig(config),
    limit: Platform.OS === "ios" ? 60 : 400,
    plans,
    logs,
    checkins,
    restDays: profile?.gender === "female" ? restDays : [],
  });
}

let running: Promise<void> | null = null;
let resync = false;
export async function syncNotifications(
  force = false,
  strict = false,
): Promise<void> {
  if (running) {
    if (!strict) {
      resync = true;
      return running;
    }
    await running;
    if (running) await running;
    return syncNotifications(force, strict);
  }
  running = (async () => {
    try {
      await syncAppBadge();
      if (!(await hasPermission())) return;
      await ensureChannels();
      const existing = await Notifications.getAllScheduledNotificationsAsync();
      const owned = existing.filter((n) =>
        OWN.some((p) => n.identifier.startsWith(p)),
      );
      // Reserve capacity for other app features before reconciling our requests.
      const capacity = Math.max(
        0,
        (Platform.OS === "ios" ? 60 : 400) - (existing.length - owned.length),
      );
      const exact =
        Platform.OS !== "android" ||
        (await Notifications.getExactAlarmPermissionsAsync()).granted;
      // Include delivery mode in the signature so granting exact-alarm access
      // upgrades already scheduled best-effort adhans instead of retaining them.
      const planned = (await planNow()).slice(0, capacity).map((n) => {
        const role = prayerSoundRole(n.data.type);
        if (!role) return n;
        return {
          ...n,
          data: {
            ...n.data,
            soundChannel: soundChannel(role, n.sound),
            ...(role === "adhan"
              ? { deliveryMode: exact ? "alarmClock" : "bestEffort" }
              : {}),
          },
        };
      });
      const sig = JSON.stringify(planned);
      const stored = await AsyncStorage.getItem(SIG_KEY);
      if (
        !force &&
        sig === stored &&
        owned.length === planned.length &&
        planned.every((n) => owned.some((e) => e.identifier === n.id))
      )
        return;
      let previous: unknown[] = [];
      try {
        const parsed = JSON.parse(stored || "[]");
        if (Array.isArray(parsed)) previous = parsed;
      } catch {
        /* previous format is replaced once */
      }
      const changes = reconcileSchedule(
        previous,
        planned,
        owned.map((n) => n.identifier),
      );
      await Promise.all(
        changes.cancel.map((id) =>
          Notifications.cancelScheduledNotificationAsync(id),
        ),
      );
      for (const n of changes.schedule) {
        if (n.at.getTime() <= Date.now()) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: n.id,
          content: {
            ...(n.channel === "attention" && Platform.OS === "ios"
              ? {}
              : { title: n.title, body: n.body }),
            data: n.data,
            ...(n.badge === undefined ? {} : { badge: n.badge }),
            ...(n.data.type === "prayer_checkin"
              ? { categoryIdentifier: "PRAYER_CHECKIN_CATEGORY" }
              : {}),
            sound: soundFile(n.sound) || false,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: n.at,
            channelId: prayerSoundRole(n.data.type)
              ? soundChannel(prayerSoundRole(n.data.type)!, n.sound)
              : CHANNELS[n.channel],
            delivery:
              n.data.deliveryMode === "alarmClock"
                ? "alarmClock"
                : "bestEffort",
          },
        });
      }
      await AsyncStorage.setItem(SIG_KEY, sig);
    } catch (e) {
      console.warn("[notifications] sync failed", e);
      if (strict) throw e;
    } finally {
      running = null;
      if (resync) {
        resync = false;
        void syncNotifications(true);
      }
    }
  })();
  return running;
}
let timer: ReturnType<typeof setTimeout> | null = null;
/** Call after anything that changes the plan: a check-in, a habit log, a new plan, a city change. */
export function syncNotificationsSoon() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    syncNotifications();
  }, 800);
}
