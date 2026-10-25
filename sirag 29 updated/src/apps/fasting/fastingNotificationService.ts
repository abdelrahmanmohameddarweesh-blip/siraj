import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { evaluateFasting, toHijri } from './hijriEngine';

const FASTING_SETTINGS_KEY = 'batl-fasting-settings-v1';

export interface FastingSettings {
  remindersEnabled: boolean;
  suhoorReminderEnabled: boolean;
  eveningReminderEnabled: boolean;
  hijriAdjustment: number; // -1, 0, or 1
}

export const DEFAULT_FASTING_SETTINGS: FastingSettings = {
  remindersEnabled: true,
  suhoorReminderEnabled: true,
  eveningReminderEnabled: true,
  hijriAdjustment: 0,
};

export async function getFastingSettings(): Promise<FastingSettings> {
  try {
    const raw = await AsyncStorage.getItem(FASTING_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_FASTING_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('Failed to load fasting settings:', err);
  }
  return DEFAULT_FASTING_SETTINGS;
}

export async function saveFastingSettings(settings: Partial<FastingSettings>): Promise<FastingSettings> {
  const current = await getFastingSettings();
  const updated = { ...current, ...settings };
  try {
    await AsyncStorage.setItem(FASTING_SETTINGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save fasting settings:', err);
  }
  return updated;
}

/**
 * Checks if tomorrow is a recommended fasting day (Monday, Thursday, or White Day)
 * taking into account the user's Hijri adjustment and prohibition rules.
 */
export async function checkTomorrowFasting(customAdjustment?: number): Promise<{
  isFasting: boolean;
  reasonAr?: string;
  reasonEn?: string;
  isForbidden: boolean;
}> {
  const settings = customAdjustment !== undefined ? { hijriAdjustment: customAdjustment } : await getFastingSettings();
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);

  const evaluation = evaluateFasting(tmr, settings.hijriAdjustment);
  return {
    isFasting: evaluation.suggestFasting,
    reasonAr: evaluation.reasonAr,
    reasonEn: evaluation.reasonEn,
    isForbidden: evaluation.isForbidden,
  };
}

/**
 * Schedules fasting reminders for tomorrow if applicable
 */
export async function scheduleFastingReminderForTomorrow(fajrTomorrowTime?: Date): Promise<boolean> {
  const settings = await getFastingSettings();
  if (!settings.remindersEnabled) return false;

  const tomorrowCheck = await checkTomorrowFasting(settings.hijriAdjustment);
  if (!tomorrowCheck.isFasting) return false;

  try {
    // 1. Evening reminder (tonight at 20:30)
    if (settings.eveningReminderEnabled) {
      const tonight = new Date();
      tonight.setHours(20, 30, 0, 0);

      if (tonight > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'تذكير بصيام الغد 🌙',
            body: `غداً بمشيئة الله ${tomorrowCheck.reasonAr}. تقبّل الله طاعتكم ونيتكم.`,
            sound: true,
            data: { screen: 'Fasting' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: tonight,
          },
        });
      }
    }

    // 2. Suhoor reminder (50 minutes before Fajr)
    if (settings.suhoorReminderEnabled && fajrTomorrowTime) {
      const suhoorTime = new Date(fajrTomorrowTime.getTime() - 50 * 60 * 1000);
      if (suhoorTime > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'وقت السحور المبارك 🥛',
            body: 'أوشك أذان الفجر، بارك الله في سحوركم وتقبّل صيامكم.',
            sound: true,
            data: { screen: 'Fasting' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: suhoorTime,
          },
        });
      }
    }

    return true;
  } catch (err) {
    console.warn('Failed to schedule fasting notification:', err);
    return false;
  }
}
