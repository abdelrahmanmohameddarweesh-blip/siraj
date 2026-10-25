import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  HeroProfile,
  HeroEvent,
  HeroDailyTask,
  HeroHabit,
  HeroEventType,
  PrayerTimingStatus,
} from './types';
import { heroRepository } from './storage/AsyncStorageHeroRepository';
import { generateDailyPath, calculateMonthlyJamaaStats } from './engine';
import { useAuth } from '../contexts/AuthContext';
import { STREAK_CONFIG } from './config';

interface HeroContextType {
  hero: HeroProfile | null;
  dailyPath: HeroDailyTask[];
  events: HeroEvent[];
  habits: HeroHabit[];
  isLoading: boolean;
  refreshHero: () => Promise<void>;
  dispatchEvent: (
    type: HeroEventType,
    source: string,
    value: number,
    meta?: Record<string, any>
  ) => Promise<boolean>;
  checkinPrayer: (
    prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
    status: PrayerTimingStatus,
    jamaa: boolean,
    dateStr?: string
  ) => Promise<boolean>;
  checkinAthkar: (
    period: 'morning' | 'evening' | 'sleep' | 'post_prayer',
    dateStr?: string
  ) => Promise<boolean>;
  checkinHabit: (habitId: string, dateStr?: string) => Promise<boolean>;
  checkinFasting: (dateStr?: string) => Promise<boolean>;
  repairStreak: () => Promise<{ success: boolean; message: string }>;
  useStreakFreeze: () => Promise<{ success: boolean; message: string }>;
  jamaaMonthlyStats: { jamaa: number; total: number; ratio: number };
}

const HeroContext = createContext<HeroContextType | undefined>(undefined);

export function HeroProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [hero, setHero] = useState<HeroProfile | null>(null);
  const [events, setEvents] = useState<HeroEvent[]>([]);
  const [habits, setHabits] = useState<HeroHabit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const activeUid = user?.uid || 'guest-device-stable';

  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const loadHeroData = useCallback(async () => {
    if (!activeUid) return;
    try {
      setIsLoading(true);
      let profile = await heroRepository.getUser(activeUid);

      if (!profile) {
        profile = await heroRepository.migrateLegacyUserData(activeUid);
      }

      const userEvents = await heroRepository.getEvents(activeUid);
      const userHabits = await heroRepository.getHabits(activeUid);

      setHero(profile);
      setEvents(userEvents);
      setHabits(userHabits);
    } catch (err) {
      console.warn('[HeroProvider] Error loading hero data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeUid]);

  useEffect(() => {
    loadHeroData();
  }, [loadHeroData]);

  const dispatchEvent = useCallback(
    async (
      type: HeroEventType,
      source: string,
      value: number,
      meta?: Record<string, any>
    ): Promise<boolean> => {
      const event: HeroEvent = {
        id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        uid: activeUid,
        type,
        source,
        value,
        meta: {
          dateStr: todayStr,
          ...meta,
        },
        at: new Date().toISOString(),
      };

      const accepted = await heroRepository.recordEvent(event);
      if (accepted) {
        // Refresh local context state
        const updatedProfile = await heroRepository.getUser(activeUid);
        const updatedEvents = await heroRepository.getEvents(activeUid);
        if (updatedProfile) setHero(updatedProfile);
        setEvents(updatedEvents);
      }
      return accepted;
    },
    [activeUid, todayStr]
  );

  const checkinPrayer = useCallback(
    async (
      prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
      status: PrayerTimingStatus,
      jamaa: boolean,
      dateStr = todayStr
    ) => {
      return await dispatchEvent('prayer_checkin', 'prayer_tracker', 1, {
        prayer,
        status,
        jamaa,
        dateStr,
      });
    },
    [dispatchEvent, todayStr]
  );

  const checkinAthkar = useCallback(
    async (period: 'morning' | 'evening' | 'sleep' | 'post_prayer', dateStr = todayStr) => {
      return await dispatchEvent('athkar_done', 'athkar_sheet', 1, {
        period,
        dateStr,
      });
    },
    [dispatchEvent, todayStr]
  );

  const checkinHabit = useCallback(
    async (habitId: string, dateStr = todayStr) => {
      return await dispatchEvent('habit_checkin', 'habit_tracker', 1, {
        habitId,
        dateStr,
      });
    },
    [dispatchEvent, todayStr]
  );

  const checkinFasting = useCallback(
    async (dateStr = todayStr) => {
      return await dispatchEvent('fast_done', 'fasting_tracker', 1, {
        dateStr,
      });
    },
    [dispatchEvent, todayStr]
  );

  const repairStreak = useCallback(async () => {
    if (!hero) return { success: false, message: 'المستخدم غير متاح' };
    if ((hero.sirajBalance || 0) < STREAK_CONFIG.streak_repair_cost) {
      return {
        success: false,
        message: `تحتاج إلى ${STREAK_CONFIG.streak_repair_cost} شمعة سراج لإصلاح التتابع. رصيدك الحالي: ${hero.sirajBalance}`,
      };
    }

    const success = await dispatchEvent(
      'streak_repaired',
      'streak_repair_sheet',
      STREAK_CONFIG.streak_repair_cost,
      {
        repairedDate: todayStr,
      }
    );

    return {
      success,
      message: success
        ? 'تم إصلاح تتابعك المبارك بنجاح! استمر في طريق الهمة يا بطل 🌟'
        : 'تم إصلاح اليوم مسبقاً.',
    };
  }, [hero, dispatchEvent, todayStr]);

  const useStreakFreeze = useCallback(async () => {
    if (!hero) return { success: false, message: 'المستخدم غير متاح' };
    if ((hero.streakFreezeCount || 0) <= 0) {
      return {
        success: false,
        message: 'لا تملك درع حماية للتتابع (Streak Freeze). يمكنك الحصول عليه من متجر السراج.',
      };
    }

    // Decrement freeze
    const updatedHero: HeroProfile = {
      ...hero,
      streakFreezeCount: hero.streakFreezeCount - 1,
    };
    await heroRepository.saveUser(updatedHero);

    const success = await dispatchEvent('streak_freeze_used', 'streak_shield', 0, {
      protectedDate: todayStr,
    });

    return {
      success,
      message: 'تم تفعيل درع حماية التتابع لهذا اليوم بنجاح 🛡️',
    };
  }, [hero, dispatchEvent, todayStr]);

  const dailyPath = useMemo(() => {
    return generateDailyPath(todayStr, events, habits);
  }, [todayStr, events, habits]);

  const jamaaMonthlyStats = useMemo(() => {
    const currentMonth = todayStr.substring(0, 7);
    return calculateMonthlyJamaaStats(events, currentMonth);
  }, [events, todayStr]);

  const value = useMemo(
    () => ({
      hero,
      dailyPath,
      events,
      habits,
      isLoading,
      refreshHero: loadHeroData,
      dispatchEvent,
      checkinPrayer,
      checkinAthkar,
      checkinHabit,
      checkinFasting,
      repairStreak,
      useStreakFreeze,
      jamaaMonthlyStats,
    }),
    [
      hero,
      dailyPath,
      events,
      habits,
      isLoading,
      loadHeroData,
      dispatchEvent,
      checkinPrayer,
      checkinAthkar,
      checkinHabit,
      checkinFasting,
      repairStreak,
      useStreakFreeze,
      jamaaMonthlyStats,
    ]
  );

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
}

export function useHero() {
  const context = useContext(HeroContext);
  if (!context) {
    throw new Error('useHero must be used within a HeroProvider');
  }
  return context;
}
