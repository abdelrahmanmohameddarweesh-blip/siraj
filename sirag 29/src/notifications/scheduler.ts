/** Applies the notification plan with expo-notifications. Only touches notifications it owns. */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateRollingWeek } from '../prayer/prayerTimesService';
import { getSavedCalculationMethod, getSavedLocation, getSavedMadhab } from '../prayer/locationService';
import { HabitPlan, LOG_KEY, PLANS_KEY } from '../habits/habitData';
import { buildSchedule, DEFAULT_FOLLOW_UP, PRAYER_IDS, PrayerSettings, Planned } from './schedulePlan';
import type { PrayerNotificationConfig } from '../prayer/types';

const CONFIG_KEY = 'batl-prayer-notification-config-v1';
const SIG_KEY = 'sirag-notif-signature-v1';
const LEGACY_CLEARED = 'sirag-notif-legacy-cleared-v1';
const OWN = ['pre:', 'athan:', 'pfu:', 'hab:', 'habfu:'];
export const CHANNELS = { athan: 'athan_v2', checkin: 'prayer_checkin', habits: 'habits' } as const;

async function read<T>(key: string, fallback: T): Promise<T> {
  try { const raw = await AsyncStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}

export function settingsFromConfig(c: Partial<PrayerNotificationConfig> | null): PrayerSettings {
  const per = {} as PrayerSettings['perPrayer'];
  for (const p of PRAYER_IDS) per[p] = { enabled: (c as any)?.[p]?.enabled ?? true, sound: (c as any)?.[p]?.sound ?? true };
  return {
    enabled: c?.notificationsEnabled ?? true, perPrayer: per,
    followUp: c?.checkinFollowUpEnabled ?? true,
    followUpMin: { ...DEFAULT_FOLLOW_UP, ...(c?.followUpMin || {}) },
    preAlertMin: c?.preAlertMin ?? 0,
    quietEnabled: c?.quietHoursEnabled ?? true, quietStart: c?.quietHoursStart || '23:00', quietEnd: c?.quietHoursEnd || '04:30',
  };
}
export async function loadPrayerSettings(): Promise<PrayerSettings> { return settingsFromConfig(await read<PrayerNotificationConfig | null>(CONFIG_KEY, null)); }

export async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  // Android fixes a channel's sound when it is created, so the adhan gets its own channel.
  await Notifications.setNotificationChannelAsync(CHANNELS.athan, { name: 'الأذان', importance: Notifications.AndroidImportance.HIGH, sound: 'athan.wav', vibrationPattern: [0, 300, 200, 300] });
  await Notifications.setNotificationChannelAsync(CHANNELS.checkin, { name: 'تفقّد الصلاة', importance: Notifications.AndroidImportance.DEFAULT });
  await Notifications.setNotificationChannelAsync(CHANNELS.habits, { name: 'تذكير العادات', importance: Notifications.AndroidImportance.DEFAULT });
}

export async function hasPermission() { try { return (await Notifications.getPermissionsAsync()).granted; } catch { return false; } }
export async function requestPermissionAndSync(): Promise<boolean> {
  try {
    let st = await Notifications.getPermissionsAsync();
    if (!st.granted && st.canAskAgain) st = await Notifications.requestPermissionsAsync();
    if (st.granted) { await ensureChannels(); await syncNotifications(true); }
    return st.granted;
  } catch { return false; }
}

export async function planNow(now = new Date()): Promise<Planned[]> {
  const [loc, method, madhab, settings, plans, logs, checkins, restDays] = await Promise.all([
    getSavedLocation(), getSavedCalculationMethod(), getSavedMadhab(), loadPrayerSettings(),
    read<HabitPlan[]>(PLANS_KEY, []), read<Record<string, Record<string, number>>>(LOG_KEY, {}),
    read<Record<string, { status?: string }>>('batl-prayer-checkin-records-v1', {}), read<string[]>('batl-prayer-rest-days-v1', []),
  ]);
  const days = calculateRollingWeek(loc, now, 3, method, madhab);
  return buildSchedule({ now, days, prayer: settings, plans, logs, checkins, restDays });
}

let running: Promise<void> | null = null;
export async function syncNotifications(force = false): Promise<void> {
  if (running) return running;
  running = (async () => {
    try {
      if (!(await hasPermission())) return;
      if (!(await AsyncStorage.getItem(LEGACY_CLEARED))) {
        await Notifications.cancelAllScheduledNotificationsAsync(); // the old scheduler left unnamed notifications
        await AsyncStorage.setItem(LEGACY_CLEARED, '1'); force = true;
      }
      const planned = await planNow();
      const sig = planned.map(n => n.id + '@' + n.at.getTime()).join('|');
      if (!force && sig === (await AsyncStorage.getItem(SIG_KEY))) return;
      const existing = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(existing.filter(n => OWN.some(p => n.identifier.startsWith(p))).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
      for (const n of planned) {
        await Notifications.scheduleNotificationAsync({
          identifier: n.id,
          content: { title: n.title, body: n.body, data: n.data, sound: n.sound === 'athan' ? 'athan.wav' : n.sound ? true : false },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at, channelId: CHANNELS[n.channel] },
        });
      }
      await AsyncStorage.setItem(SIG_KEY, sig);
    } catch (e) { console.warn('[notifications] sync failed', e); }
    finally { running = null; }
  })();
  return running;
}
let timer: ReturnType<typeof setTimeout> | null = null;
/** Call after anything that changes the plan: a check-in, a habit log, a new plan, a city change. */
export function syncNotificationsSoon() { if (timer) clearTimeout(timer); timer = setTimeout(() => { timer = null; syncNotifications(); }, 800); }
