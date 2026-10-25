import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CoarseLocation,
  CalculationMethodName,
  MadhabName,
  PrayerTimesDay,
  PrayerNotificationConfig,
  PrayerCheckinRecord,
  CheckinStatus,
  CheckinMode,
  CheckinPlace,
} from './types';
import { DEFAULT_CITY, PredefinedCity } from './cities';
import {
  calculatePrayerTimes,
  calculateRollingWeek,
  getCurrentPrayerWindow,
  PrayerWindowInfo,
} from './prayerTimesService';
import {
  getSavedLocation,
  saveLocation,
  getSavedCalculationMethod,
  saveCalculationMethod,
  getSavedMadhab,
  saveMadhab,
  detectDeviceLocation,
} from './locationService';
import {
  getNotificationConfig,
  saveNotificationConfig,
  scheduleRollingWeekPrayerNotifications,
  requestNotificationPermission,
} from './prayerNotificationService';
import { heroRepository } from '../hero/storage/AsyncStorageHeroRepository';

const CHECKIN_RECORDS_KEY = 'batl-prayer-checkin-records-v1';
const REST_DAYS_KEY = 'batl-prayer-rest-days-v1';

interface PrayerContextType {
  location: CoarseLocation;
  method: CalculationMethodName;
  madhab: MadhabName;
  todayTimes: PrayerTimesDay;
  rollingWeek: PrayerTimesDay[];
  windowInfo: PrayerWindowInfo;
  notificationConfig: PrayerNotificationConfig;
  checkins: Record<string, PrayerCheckinRecord>;
  isRestDayToday: boolean;
  isLocationGranted: boolean;
  changeCity: (city: PredefinedCity) => Promise<void>;
  changeMethod: (method: CalculationMethodName) => Promise<void>;
  changeMadhab: (madhab: MadhabName) => Promise<void>;
  detectLocation: () => Promise<boolean>;
  updateNotifications: (cfg: Partial<PrayerNotificationConfig>) => Promise<void>;
  requestNotifications: () => Promise<boolean>;
  submitPrayerCheckin: (
    prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
    status: CheckinStatus,
    mode?: CheckinMode,
    dateStr?: string,
    place?: CheckinPlace
  ) => Promise<boolean>;
  toggleRestDay: () => Promise<void>;
  activePrayerForCheckin: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | null;
}

const PrayerContext = createContext<PrayerContextType | undefined>(undefined);

export function PrayerProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<CoarseLocation>(DEFAULT_CITY);
  const [method, setMethod] = useState<CalculationMethodName>('Egyptian');
  const [madhab, setMadhab] = useState<MadhabName>('shafii');
  const [notificationConfig, setNotificationConfig] = useState<PrayerNotificationConfig | null>(null);
  const [checkins, setCheckins] = useState<Record<string, PrayerCheckinRecord>>({});
  const [restDays, setRestDays] = useState<string[]>([]);
  const [isLocationGranted, setIsLocationGranted] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(new Date());

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Update clock every minute for accurate active windows
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load saved preferences on launch
  useEffect(() => {
    async function init() {
      const savedLoc = await getSavedLocation();
      const savedMethod = await getSavedCalculationMethod();
      const savedMadhab = await getSavedMadhab();
      const savedCfg = await getNotificationConfig();

      setLocation(savedLoc);
      setMethod(savedMethod);
      setMadhab(savedMadhab);
      setNotificationConfig(savedCfg);

      try {
        const rawCheckins = await AsyncStorage.getItem(CHECKIN_RECORDS_KEY);
        if (rawCheckins) setCheckins(JSON.parse(rawCheckins));

        const rawRest = await AsyncStorage.getItem(REST_DAYS_KEY);
        if (rawRest) setRestDays(JSON.parse(rawRest));
      } catch (err) {
        console.warn('[PrayerProvider] Error reading checkins:', err);
      }
    }
    init();
  }, []);

  const todayTimes = useMemo(() => {
    return calculatePrayerTimes(location, now, method, madhab);
  }, [location, now, method, madhab]);

  const rollingWeek = useMemo(() => {
    return calculateRollingWeek(location, now, 7, method, madhab);
  }, [location, now, method, madhab]);

  const windowInfo = useMemo(() => {
    return getCurrentPrayerWindow(todayTimes, now);
  }, [todayTimes, now]);

  // Rebuild notification schedule whenever week/method/location/config changes
  // Reschedule only when location, method, madhab or settings change (not every minute).
  useEffect(() => {
    if (notificationConfig) scheduleRollingWeekPrayerNotifications(rollingWeek, notificationConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, method, madhab, notificationConfig]);

  const changeCity = useCallback(
    async (city: PredefinedCity) => {
      setLocation(city);
      setMethod(city.defaultMethod);
      await saveLocation(city);
      await saveCalculationMethod(city.defaultMethod);
    },
    []
  );

  const changeMethod = useCallback(
    async (newMethod: CalculationMethodName) => {
      setMethod(newMethod);
      await saveCalculationMethod(newMethod);
    },
    []
  );

  const changeMadhab = useCallback(
    async (newMadhab: MadhabName) => {
      setMadhab(newMadhab);
      await saveMadhab(newMadhab);
    },
    []
  );

  const detectLocation = useCallback(async () => {
    const res = await detectDeviceLocation();
    setLocation(res.location);
    if (res.detectedMethod) setMethod(res.detectedMethod);
    setIsLocationGranted(res.granted);
    return res.granted;
  }, []);

  const updateNotifications = useCallback(
    async (cfg: Partial<PrayerNotificationConfig>) => {
      if (!notificationConfig) return;
      const updated = { ...notificationConfig, ...cfg };
      setNotificationConfig(updated);
      await saveNotificationConfig(updated);
    },
    [notificationConfig]
  );

  const requestNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission();
    if (notificationConfig) {
      const updated = { ...notificationConfig, notificationsEnabled: granted };
      setNotificationConfig(updated);
      await saveNotificationConfig(updated);
    }
    return granted;
  }, [notificationConfig]);

  const isRestDayToday = useMemo(() => {
    return restDays.includes(todayStr);
  }, [restDays, todayStr]);

  const toggleRestDay = useCallback(async () => {
    let next: string[];
    if (isRestDayToday) {
      next = restDays.filter((d) => d !== todayStr);
    } else {
      next = [...restDays, todayStr];
    }
    setRestDays(next);
    await AsyncStorage.setItem(REST_DAYS_KEY, JSON.stringify(next));
  }, [isRestDayToday, restDays, todayStr]);

  const submitPrayerCheckin = useCallback(
    async (
      prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
      status: CheckinStatus,
      mode: CheckinMode = 'alone',
      dateString = todayStr,
      place?: CheckinPlace
    ) => {
      const key = `${prayer}_${dateString}`;
      const isJamaa = mode === 'jamaa';

      // 1. Emit event to Hero Engine
      const accepted = await heroRepository.recordEvent({
        id: `evt-prayer-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        uid: 'guest-device-stable',
        type: 'prayer_checkin',
        source: 'prayer_checkin_sheet',
        value: 1,
        meta: {
          prayer,
          status,
          jamaa: isJamaa,
          place: isJamaa ? place : undefined,
          dateStr: dateString,
        },
        at: new Date().toISOString(),
      });

      // 2. Save local checkin record
      const record: PrayerCheckinRecord = {
        prayer,
        dateStr: dateString,
        status,
        mode,
        place: isJamaa ? place : undefined,
        checkedInAt: new Date().toISOString(),
        pointsAwarded: status === 'on_time' ? (isJamaa ? 15 : 10) : status === 'late' ? (isJamaa ? 8 : 5) : 3,
        xpAwarded: status === 'on_time' ? (isJamaa ? 25 : 15) : status === 'late' ? (isJamaa ? 12 : 8) : 5,
      };

      const nextCheckins = { ...checkins, [key]: record };
      setCheckins(nextCheckins);
      await AsyncStorage.setItem(CHECKIN_RECORDS_KEY, JSON.stringify(nextCheckins));

      return accepted;
    },
    [checkins, todayStr]
  );

  const activePrayerForCheckin = useMemo(() => {
    return windowInfo.activePrayer;
  }, [windowInfo.activePrayer]);

  const value = useMemo(
    () => ({
      location,
      method,
      madhab,
      todayTimes,
      rollingWeek,
      windowInfo,
      notificationConfig: notificationConfig || {
        notificationsEnabled: false,
        fajr: { enabled: true, offsetMinutes: 0, sound: true },
        dhuhr: { enabled: true, offsetMinutes: 0, sound: true },
        asr: { enabled: true, offsetMinutes: 0, sound: true },
        maghrib: { enabled: true, offsetMinutes: 0, sound: true },
        isha: { enabled: true, offsetMinutes: 0, sound: true },
        checkinReminderMinutes: 30,
        checkinFollowUpEnabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '04:30',
      },
      checkins,
      isRestDayToday,
      isLocationGranted,
      changeCity,
      changeMethod,
      changeMadhab,
      detectLocation,
      updateNotifications,
      requestNotifications,
      submitPrayerCheckin,
      toggleRestDay,
      activePrayerForCheckin,
    }),
    [
      location,
      method,
      madhab,
      todayTimes,
      rollingWeek,
      windowInfo,
      notificationConfig,
      checkins,
      isRestDayToday,
      isLocationGranted,
      changeCity,
      changeMethod,
      changeMadhab,
      detectLocation,
      updateNotifications,
      requestNotifications,
      submitPrayerCheckin,
      toggleRestDay,
      activePrayerForCheckin,
    ]
  );

  return <PrayerContext.Provider value={value}>{children}</PrayerContext.Provider>;
}

export function usePrayer() {
  const context = useContext(PrayerContext);
  if (!context) {
    throw new Error('usePrayer must be used within a PrayerProvider');
  }
  return context;
}
