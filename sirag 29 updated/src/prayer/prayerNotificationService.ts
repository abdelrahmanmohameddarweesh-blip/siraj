import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureChannels, syncNotificationsSoon } from '../notifications/scheduler';
import {
  PrayerNotificationConfig,
  PrayerTimesDay,
  PrayerKey,
} from './types';

const STORAGE_KEYS = {
  CONFIG: 'batl-prayer-notification-config-v1',
  PERMISSION_ASKED: 'batl-notification-permission-prompted-v1',
};

export const DEFAULT_NOTIFICATION_CONFIG: PrayerNotificationConfig = {
  notificationsEnabled: true,
  fajr: { enabled: true, offsetMinutes: 0, sound: true },
  dhuhr: { enabled: true, offsetMinutes: 0, sound: true },
  asr: { enabled: true, offsetMinutes: 0, sound: true },
  maghrib: { enabled: true, offsetMinutes: 0, sound: true },
  isha: { enabled: true, offsetMinutes: 0, sound: true },
  checkinReminderMinutes: 30, // Ask "هل صليت؟" ~30 min after prayer
  checkinFollowUpEnabled: true,
  quietHoursEnabled: true,
  quietHoursStart: '23:00',
  quietHoursEnd: '04:30',
};

// Configure global notification presentation in foreground
Notifications.setNotificationHandler({
  handleNotification: async (n) => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: (n?.request?.content?.data as any)?.type !== 'prayer_athan',
    shouldSetBadge: false,
  }),
});

export const NOTIFICATION_CHANNELS = {
  ADHAN: 'prayer_adhan',
  CHECKIN: 'prayer_checkin',
  QUIET: 'quiet_reminders',
};

export const CHECKIN_CATEGORY = 'PRAYER_CHECKIN_CATEGORY';

export const PRAYER_NAMES: Record<string, { ar: string; en: string }> = {
  fajr: { ar: 'صلاة الفجر', en: 'Fajr Prayer' },
  dhuhr: { ar: 'صلاة الظهر', en: 'Dhuhr Prayer' },
  asr: { ar: 'صلاة العصر', en: 'Asr Prayer' },
  maghrib: { ar: 'صلاة المغرب', en: 'Maghrib Prayer' },
  isha: { ar: 'صلاة العشاء', en: 'Isha Prayer' },
};

/**
 * Setup Android Channels and Notification Interactive Categories
 */
export async function setupNotificationChannelsAndCategories(): Promise<void> {
  // Channels now live in src/notifications/scheduler.ts (adhan channel with its own sound).
  await ensureChannels();
}

/**
 * Ask local notifications permission with graceful fallback.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    await setupNotificationChannelsAndCategories();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_ASKED, 'true');
    const granted = finalStatus === 'granted';

    if (granted) {
      await setupNotificationChannelsAndCategories();
    }
    return granted;
  } catch (err) {
    console.warn('[PrayerNotifications] Error requesting permission:', err);
    return false;
  }
}

export async function getNotificationConfig(): Promise<PrayerNotificationConfig> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
    return raw ? { ...DEFAULT_NOTIFICATION_CONFIG, ...JSON.parse(raw) } : DEFAULT_NOTIFICATION_CONFIG;
  } catch (err) {
    return DEFAULT_NOTIFICATION_CONFIG;
  }
}

export async function saveNotificationConfig(config: PrayerNotificationConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    syncNotificationsSoon();
  } catch (err) {
    console.warn('[PrayerNotifications] Error saving config:', err);
    throw err;
  }
}

/**
 * Checks whether a given timestamp falls into user's quiet hours.
 */
function isTimeInQuietHours(date: Date, config: PrayerNotificationConfig): boolean {
  if (!config.quietHoursEnabled) return false;

  const [startH, startM] = config.quietHoursStart.split(':').map(Number);
  const [endH, endM] = config.quietHoursEnd.split(':').map(Number);

  const hour = date.getHours();
  const min = date.getMinutes();
  const timeVal = hour * 60 + min;
  const startVal = startH * 60 + startM;
  const endVal = endH * 60 + endM;

  if (startVal > endVal) {
    // Overnight quiet hours, e.g. 23:00 to 04:30
    return timeVal >= startVal || timeVal <= endVal;
  }
  return timeVal >= startVal && timeVal <= endVal;
}

/**
 * Rolling Scheduler:
 * iOS limit is 64 pending notifications. 7 days * 5 prayers = 35 notifications max.
 * Rebuilt on app open, location change, method change, and day roll.
 */
export async function scheduleRollingWeekPrayerNotifications(
  _weekDays: PrayerTimesDay[],
  _config: PrayerNotificationConfig
): Promise<void> {
  // Replaced by the unified planner (prayers + habits) in src/notifications. It only reschedules
  // when something actually changed, instead of rebuilding everything every minute.
  syncNotificationsSoon();
}
