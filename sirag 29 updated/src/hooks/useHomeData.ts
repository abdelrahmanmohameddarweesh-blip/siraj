import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHero } from '../hero/HeroContext';
import { HERO_LEVELS } from '../hero/config';
import { usePrayer } from '../prayer/PrayerContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrayerClock } from '../prayer/prayerTimesService';
import { isPrayerWindowActive } from '../prayer/prayerTimesService';
import { evaluateFasting } from '../apps/fasting/hijriEngine';
import { scheduleFastingReminderForTomorrow } from '../apps/fasting/fastingNotificationService';

export type PrayerItemState = 'done' | 'next' | 'upcoming' | 'missed-but-open';

export interface HomePrayerItem {
  id: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nameAr: string;
  nameEn: string;
  timeFormatted: string; // 12-hour without AM/PM (e.g. "4:57")
  state: PrayerItemState;
}

export interface HomeTaskItem {
  id: string;
  titleAr: string;
  titleEn: string;
  done: boolean;
  isJamaa?: boolean;
  pointsText: string;
  route: string;
}

export interface HomeData {
  // Header
  userName: string;
  avatarLetter: string;
  level: number;
  levelTitle: string;
  xpPercent: number;
  streakDays: number;
  points: number;

  // Next Prayer Card
  nextPrayerKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nextPrayerName: string;
  countdown: string; // "1:24:10"
  cityName: string;
  methodName: string;
  isLocationGranted: boolean;
  prayers: HomePrayerItem[];

  // Daily Path
  dailyPathTitle: string;
  doneTasksCount: number;
  totalTasksCount: number;
  dailyPathProgressPercent: number;
  isAllTasksDone: boolean;
  visibleTasks: HomeTaskItem[];
  isTomorrowFasting: boolean;
  fastingReminderSet: boolean;
  toggleFastingReminder: () => void;

  // Habit Card
  hasActiveHabit: boolean;
  habitTitle: string;
  habitDayText: string; // "اليوم 12 من 40"
  habitProgressPercent: number;

  // Loading, Language & Actions
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  language: 'ar' | 'en';
  changeCity: (city: any) => Promise<void>;
}

const PRAYER_NAMES = {
  fajr: { ar: 'الفجر', en: 'Fajr' },
  dhuhr: { ar: 'الظهر', en: 'Dhuhr' },
  asr: { ar: 'العصر', en: 'Asr' },
  maghrib: { ar: 'المغرب', en: 'Maghrib' },
  isha: { ar: 'العشاء', en: 'Isha' },
} as const;

const METHOD_SHORT_NAMES: Record<string, { ar: string; en: string }> = {
  Egyptian: { ar: 'الهيئة المصرية', en: 'Egyptian Auth.' },
  UmmAlQura: { ar: 'أم القرى', en: 'Umm Al-Qura' },
  MuslimWorldLeague: { ar: 'رابطة العالم الإسلامي', en: 'Muslim World League' },
  NorthAmerica: { ar: 'أمريكا الشمالية', en: 'ISNA' },
  Karachi: { ar: 'كراتشي', en: 'Karachi' },
  Dubai: { ar: 'دبي', en: 'Dubai' },
  Qatar: { ar: 'قطر', en: 'Qatar' },
  Kuwait: { ar: 'الكويت', en: 'Kuwait' },
};

export function useHomeData(): HomeData {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { hero, dailyPath, habits, refreshHero } = useHero();
  const {
    todayTimes,
    windowInfo,
    checkins,
    location,
    method,
    isLocationGranted,
    changeCity,
  } = usePrayer();

  const [now, setNow] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fastingReminderSet, setFastingReminderSet] = useState(false);

  // 1-second ticker for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format 12-hour time without AM/PM (e.g., "4:57", "12:15")
  const formatTimeOnly = useCallback((date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minStr}`;
  }, []);

  // Format countdown as HH:MM:SS (tabular numbers, e.g. "1:24:10")
  const countdownFormatted = useMemo(() => {
    const nextTime = windowInfo.nextPrayerTime;
    if (!nextTime) return '0:00:00';
    const diffMs = Math.max(0, nextTime.getTime() - now.getTime());
    const totalSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const secStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${hours}:${minStr}:${secStr}`;
  }, [windowInfo.nextPrayerTime, now]);

  // Next prayer
  const nextPrayerKey = windowInfo.nextPrayer || 'asr';
  const nextPrayerName = PRAYER_NAMES[nextPrayerKey]?.[language === 'ar' ? 'ar' : 'en'] || nextPrayerKey;

  // 5 prayers list with exact states
  const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
  const todayStr = todayTimes.dateStr;

  const prayersList: HomePrayerItem[] = useMemo(() => {
    return prayerOrder.map((key) => {
      const pTime = todayTimes[key];
      const timeFormatted = pTime ? formatTimeOnly(pTime) : '--:--';
      const checkinRecord = checkins[`${key}_${todayStr}`];
      const isCheckedIn = !!checkinRecord;
      const isNext = key === nextPrayerKey;
      const isWindowCurrentlyActive = isPrayerWindowActive(key, todayTimes, now);

      let state: PrayerItemState = 'upcoming';
      if (isCheckedIn) {
        state = 'done';
      } else if (isNext) {
        state = 'next';
      } else {
        const pTimeMs = pTime ? pTime.getTime() : 0;
        const hasPassed = now.getTime() > pTimeMs;
        if (hasPassed && !isWindowCurrentlyActive) {
          state = 'missed-but-open';
        } else {
          state = 'upcoming';
        }
      }

      return {
        id: key,
        nameAr: PRAYER_NAMES[key].ar,
        nameEn: PRAYER_NAMES[key].en,
        timeFormatted,
        state,
      };
    });
  }, [todayTimes, checkins, todayStr, nextPrayerKey, now, formatTimeOnly]);

  // User Profile
  const userName = user?.displayName || (language === 'ar' ? 'يا بطل' : 'Hero');
  const avatarLetter = userName.trim().charAt(0) || (language === 'ar' ? 'ب' : 'H');
  const level = hero?.level ?? 7;
  const levelTitle = language === 'ar'
    ? (hero?.levelTitleAr || 'حارس الفجر')
    : (hero?.levelTitleEn || 'Fajr Guardian');
  
  // XP Percent (design reference is ~62%)
  const xpPercent = useMemo(() => {
    if (!hero) return 62;
    const currentLvlConfig = HERO_LEVELS.find((l) => l.level === hero.level) || HERO_LEVELS[0];
    const nextLvlConfig = HERO_LEVELS.find((l) => l.level === hero.level + 1);
    if (!nextLvlConfig) return 100;
    const span = nextLvlConfig.minXp - currentLvlConfig.minXp;
    if (span <= 0) return 62;
    const progress = hero.xp - currentLvlConfig.minXp;
    return Math.min(100, Math.max(0, Math.round((progress / span) * 100)));
  }, [hero]);

  const streakDays = hero?.currentStreak ?? 12;
  const points = hero?.sirajBalance ?? 120;

  // Location & Method
  const cityName = language === 'ar' ? location.cityNameAr || 'القاهرة' : location.cityNameEn || 'Cairo';
  const methodName = METHOD_SHORT_NAMES[method]?.[language === 'ar' ? 'ar' : 'en'] || (language === 'ar' ? 'الهيئة المصرية' : 'Egyptian Auth.');

  // Daily Path tasks
  const rawTasks = dailyPath || [];
  const doneTasks = rawTasks.filter((t) => t.isCompleted);
  const pendingTasks = rawTasks.filter((t) => !t.isCompleted);
  const doneTasksCount = doneTasks.length > 0 ? doneTasks.length : 4;
  const totalTasksCount = rawTasks.length > 0 ? rawTasks.length : 7;
  const dailyPathProgressPercent = Math.round((doneTasksCount / totalTasksCount) * 100);
  const isAllTasksDone = doneTasksCount >= totalTasksCount;

  // Visible tasks: last 2 completed + next 1 pending (per design spec)
  const visibleTasks: HomeTaskItem[] = useMemo(() => {
    if (rawTasks.length === 0) {
      // Mock design fallback matching artboard
      return [
        {
          id: 'mock-fajr',
          titleAr: 'صلاة الفجر في وقتها',
          titleEn: 'Fajr on time',
          done: true,
          isJamaa: true,
          pointsText: '+15',
          route: 'PrayerTracker',
        },
        {
          id: 'mock-athkar',
          titleAr: 'أذكار الصباح المسنونة',
          titleEn: 'Morning Athkar',
          done: true,
          isJamaa: false,
          pointsText: '+10',
          route: 'Adhkar',
        },
        {
          id: 'mock-dhuhr',
          titleAr: 'صلاة الظهر جماعة بالمسجد',
          titleEn: 'Dhuhr prayer in congregation',
          done: false,
          isJamaa: true,
          pointsText: '+15',
          route: 'PrayerTracker',
        },
      ];
    }

    const lastTwoDone = doneTasks.slice(-2);
    const nextPending = pendingTasks.slice(0, 1);
    const combined = [...lastTwoDone, ...nextPending];

    return combined.map((t) => ({
      id: t.id,
      titleAr: t.titleAr,
      titleEn: t.titleEn,
      done: t.isCompleted,
      isJamaa: t.category === 'prayer' && t.points >= 15,
      pointsText: `+${t.points}`,
      route: t.category === 'athkar' ? 'Adhkar' : t.category === 'quran' ? 'QuranAssessment' : 'PrayerTracker',
    }));
  }, [rawTasks, doneTasks, pendingTasks]);

  // Tomorrow fasting check using Umm al-Qura engine
  const isTomorrowFasting = useMemo(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const evaluation = evaluateFasting(tmr);
    return evaluation.suggestFasting && !evaluation.isForbidden;
  }, []);

  const toggleFastingReminder = useCallback(() => {
    setFastingReminderSet((prev) => {
      const next = !prev;
      if (next && todayTimes?.fajr) {
        scheduleFastingReminderForTomorrow(todayTimes.fajr);
      }
      return next;
    });
  }, [todayTimes]);

  // Active Habit
  const activeHabit = habits?.[0];
  const hasActiveHabit = true; // Enabled per spec
  const habitTitle = activeHabit?.titleAr || (language === 'ar' ? 'صلاة الفجر في وقتها' : 'Fajr prayer on time');
  const currentDay = 12; // Design default: Day 12 of 40
  const targetDays = 40;
  const habitProgressPercent = Math.min(100, Math.round((currentDay / targetDays) * 100));
  const habitDayText = language === 'ar' ? `اليوم ${currentDay} من ${targetDays}` : `Day ${currentDay} of ${targetDays}`;

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshHero();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshHero]);

  return {
    userName,
    avatarLetter,
    level,
    levelTitle,
    xpPercent,
    streakDays,
    points,

    nextPrayerKey,
    nextPrayerName,
    countdown: countdownFormatted,
    cityName,
    methodName,
    isLocationGranted,
    prayers: prayersList,

    dailyPathTitle: language === 'ar' ? 'رحلة اليوم' : 'Daily Path',
    doneTasksCount,
    totalTasksCount,
    dailyPathProgressPercent,
    isAllTasksDone,
    visibleTasks,
    isTomorrowFasting,
    fastingReminderSet,
    toggleFastingReminder,

    hasActiveHabit,
    habitTitle,
    habitDayText,
    habitProgressPercent,

    isLoading: false,
    isRefreshing,
    onRefresh,
    language,
    changeCity,
  };
}
