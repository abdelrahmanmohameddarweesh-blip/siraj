import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { AppState } from 'react-native';
import { localDay } from '../habits/habitData';
import { logKind } from '../habits/habitLog';
import { updateJSON } from '../storage/jsonStore';
import { COUNTED_PRAYERS, prayerCount } from '../tracking/activityModel';
import { syncNotificationsSoon } from '../notifications/scheduler';
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

  const todayStr = localDay(now);
  const checkinBusy = useRef(false);

  // Update clock every minute for accurate active windows
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') setNow(new Date()); });
    return () => { clearInterval(timer); listener.remove(); };
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
  }, [location, method, madhab, notificationConfig, todayStr]);

  const changeCity = useCallback(
    async (city: PredefinedCity) => {
      await saveLocation(city);
      await saveCalculationMethod(city.defaultMethod);
      setLocation(city);
      setMethod(city.defaultMethod);
    },
    []
  );

  const changeMethod = useCallback(
    async (newMethod: CalculationMethodName) => {
      await saveCalculationMethod(newMethod);
      setMethod(newMethod);
    },
    []
  );

  const changeMadhab = useCallback(
    async (newMadhab: MadhabName) => {
      await saveMadhab(newMadhab);
      setMadhab(newMadhab);
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
      const base = notificationConfig || await getNotificationConfig();
      const updated = { ...base, ...cfg };
      await saveNotificationConfig(updated);
      setNotificationConfig(updated);
    },
    [notificationConfig]
  );

  const requestNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission();
    if (notificationConfig) {
      const updated = { ...notificationConfig, notificationsEnabled: granted };
      await saveNotificationConfig(updated);
      setNotificationConfig(updated);
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
    await AsyncStorage.setItem(REST_DAYS_KEY, JSON.stringify(next));
    setRestDays(next);
    syncNotificationsSoon();
  }, [isRestDayToday, restDays, todayStr]);

  const submitPrayerCheckin = useCallback(
    async (
      prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
      status: CheckinStatus,
      mode: CheckinMode = 'alone',
      dateString = todayStr,
      place?: CheckinPlace
    ) => {
      if (checkinBusy.current) throw new Error('انتظر اكتمال الحفظ');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString) || localDay(new Date(dateString + 'T12:00:00')) !== dateString || dateString > localDay()) throw new Error('Invalid check-in date');
      if (dateString === localDay() && COUNTED_PRAYERS.has(status) && new Date() < todayTimes[prayer]) throw new Error('لم يدخل وقت الصلاة بعد');
      checkinBusy.current = true;
      try {
        const key = `${prayer}_${dateString}`;
        const counted = COUNTED_PRAYERS.has(status);
        const isJamaa = mode === 'jamaa';
        const record: PrayerCheckinRecord = {
          prayer, dateStr: dateString, status, mode, ...(isJamaa && place ? { place } : {}),
          checkedInAt: new Date().toISOString(),
          pointsAwarded: !counted ? 0 : status === 'on_time' ? (isJamaa ? 15 : 10) : status === 'late' ? (isJamaa ? 8 : 5) : 3,
          xpAwarded: !counted ? 0 : status === 'on_time' ? (isJamaa ? 25 : 15) : status === 'late' ? (isJamaa ? 12 : 8) : 5,
        };
        const saved = await updateJSON<Record<string, PrayerCheckinRecord>>(CHECKIN_RECORDS_KEY, {}, previous => ({ ...previous, [key]: record }));
        setCheckins(saved);
        await logKind(['prayers','prayer'], prayerCount(saved, dateString), 'set', dateString);
        await logKind(['fajr'], prayerCount(saved, dateString, true), 'set', dateString);
        syncNotificationsSoon();
        // Reward engine keeps its own per-prayer/day idempotency; reports use the canonical saved record.
        if (counted) await heroRepository.recordEvent({
          id: `evt-prayer-${dateString}-${prayer}`, uid: 'guest-device-stable', type: 'prayer_checkin',
          source: 'prayer_checkin_sheet', value: 1,
          meta: { prayer, status, jamaa: isJamaa, ...(place ? { place } : {}), dateStr: dateString }, at: record.checkedInAt,
        });
        return true;
      } finally { checkinBusy.current = false; }
    },
    [todayStr, todayTimes]
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
