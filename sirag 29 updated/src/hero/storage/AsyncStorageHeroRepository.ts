import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HeroEvent,
  HeroProfile,
  HeroHabit,
  IHeroRepository,
  HeroEventType,
} from '../types';
import {
  calculateEventPoints,
  isEventIdempotent,
  evaluateHeroLevel,
  calculateStreak,
  calculateMonthlyJamaaStats,
  evaluateMilestoneTitles,
} from '../engine';
import { DEFAULT_HABITS } from '../config';

const STORAGE_KEYS = {
  USERS: 'batl-hero-users-v2',
  CURRENT_USER: 'batl-hero-current-user-v2',
  EVENTS: 'batl-hero-events-v1',
  HABITS: 'batl-hero-habits-v1',
  SETTINGS: 'batl-hero-settings-v1',
  MIGRATION: 'batl-hero-migration-flag-v1',
  LEGACY_PLAYERS: 'batl-muslim-players-v1',
  LEGACY_CURRENT_USER: 'batl-muslim-current-user-v1',
  LEGACY_STABLE_GUEST: 'batl-muslim-stable-guest-id-v1',
};

export class AsyncStorageHeroRepository implements IHeroRepository {
  private memoryEventsCache: HeroEvent[] | null = null;

  clearMemoryCache(){this.memoryEventsCache=null;}

  async getUser(uid: string): Promise<HeroProfile | null> {
    try {
      const users = await this.readUsersMap();
      if (users[uid]) return users[uid];

      // Try migrating legacy user if not found
      return await this.migrateLegacyUserData(uid);
    } catch (err) {
      console.warn('[HeroRepository] getUser error:', err);
      return null;
    }
  }

  async saveUser(user: HeroProfile): Promise<void> {
    try {
      const users = await this.readUsersMap();
      const updatedUser: HeroProfile = {
        ...user,
        updatedAt: new Date().toISOString(),
      };
      users[user.uid] = updatedUser;
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // Also persist legacy storage keys so older screens stay in sync
      await AsyncStorage.setItem(STORAGE_KEYS.LEGACY_PLAYERS, JSON.stringify(users));
      await AsyncStorage.setItem(STORAGE_KEYS.LEGACY_CURRENT_USER, JSON.stringify(updatedUser));
    } catch (err) {
      console.warn('[HeroRepository] saveUser error:', err);
    }
  }

  async recordEvent(event: HeroEvent): Promise<boolean> {
    try {
      const events = await this.getEvents(event.uid);

      // 1. Idempotency check: don't score same day/task twice
      if (!isEventIdempotent(events, event)) {
        return false;
      }

      // 2. Append event
      events.push(event);
      this.memoryEventsCache = events;
      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

      // 3. Mutate Hero Profile based on rules engine
      let user = await this.getUser(event.uid);
      if (!user) {
        user = this.createDefaultProfile(event.uid, 'بطل مسلم');
      }

      const { siraj, xp } = calculateEventPoints(event);
      const newXp = Math.max(0, (user.xp || 0) + xp);
      const newSiraj = Math.max(0, (user.sirajBalance ?? 50) + siraj);
      const heroLevel = evaluateHeroLevel(newXp);

      const todayStr = event.meta?.dateStr || event.at.split('T')[0];
      const streakStats = calculateStreak(events, todayStr, user.streakFreezeCount);
      const currentMonth = todayStr.substring(0, 7);
      const jamaaStats = calculateMonthlyJamaaStats(events, currentMonth);

      const updatedProfile: HeroProfile = {
        ...user,
        xp: newXp,
        level: heroLevel.level,
        levelTitleAr: heroLevel.nameAr,
        levelTitleEn: heroLevel.nameEn,
        sirajBalance: newSiraj,
        score: newXp, // keep legacy score synchronized with XP
        currentStreak: streakStats.currentStreak,
        longestStreak: Math.max(user.longestStreak || 0, streakStats.longestStreak),
        weeklyDaysCompleted: streakStats.weeklyDaysCompleted,
        lastActiveDate: todayStr,
        isStreakProtectedToday: streakStats.isProtectedToday,
        streakStatusMessageAr: streakStats.messageAr,
        streakStatusMessageEn: streakStats.messageEn,
        jamaaCountThisMonth: jamaaStats.jamaa,
        totalPrayersThisMonth: jamaaStats.total,
        updatedAt: new Date().toISOString(),
      };

      // Milestone Titles evaluation
      updatedProfile.unlockedTitles = evaluateMilestoneTitles(
        updatedProfile,
        jamaaStats.jamaa
      );

      await this.saveUser(updatedProfile);
      return true;
    } catch (err) {
      console.warn('[HeroRepository] recordEvent error:', err);
      return false;
    }
  }

  async getEvents(
    uid: string,
    filter?: { since?: string; type?: HeroEventType; date?: string }
  ): Promise<HeroEvent[]> {
    try {
      if (!this.memoryEventsCache) {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
        this.memoryEventsCache = raw ? JSON.parse(raw) : [];
      }

      let userEvents = (this.memoryEventsCache || []).filter((e) => e.uid === uid);

      if (filter?.since) {
        userEvents = userEvents.filter((e) => e.at >= filter.since!);
      }
      if (filter?.type) {
        userEvents = userEvents.filter((e) => e.type === filter.type);
      }
      if (filter?.date) {
        userEvents = userEvents.filter((e) => {
          const d = e.meta?.dateStr || e.at.split('T')[0];
          return d === filter.date;
        });
      }

      return userEvents;
    } catch (err) {
      console.warn('[HeroRepository] getEvents error:', err);
      return [];
    }
  }

  async getHabits(uid: string): Promise<HeroHabit[]> {
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_KEYS.HABITS}_${uid}`);
      if (raw) return JSON.parse(raw);
      // Seed default habits on first launch
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.HABITS}_${uid}`,
        JSON.stringify(DEFAULT_HABITS)
      );
      return DEFAULT_HABITS;
    } catch (err) {
      console.warn('[HeroRepository] getHabits error:', err);
      return DEFAULT_HABITS;
    }
  }

  async saveHabit(uid: string, habit: HeroHabit): Promise<void> {
    try {
      const habits = await this.getHabits(uid);
      const existingIdx = habits.findIndex((h) => h.id === habit.id);
      if (existingIdx >= 0) {
        habits[existingIdx] = habit;
      } else {
        habits.push(habit);
      }
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.HABITS}_${uid}`,
        JSON.stringify(habits)
      );
    } catch (err) {
      console.warn('[HeroRepository] saveHabit error:', err);
    }
  }

  async getSettings(uid: string): Promise<Record<string, any>> {
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_KEYS.SETTINGS}_${uid}`);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      return {};
    }
  }

  async saveSettings(uid: string, settings: Record<string, any>): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.SETTINGS}_${uid}`,
        JSON.stringify(settings)
      );
    } catch (err) {
      console.warn('[HeroRepository] saveSettings error:', err);
    }
  }

  /**
   * Versioned migration from existing saved users without data loss.
   */
  async migrateLegacyUserData(targetUid?: string): Promise<HeroProfile | null> {
    try {
      const rawLegacy = await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_PLAYERS);
      const legacyPlayers: Record<string, any> = rawLegacy ? JSON.parse(rawLegacy) : {};

      const rawCurrent = await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_CURRENT_USER);
      const legacyCurrent: any = rawCurrent ? JSON.parse(rawCurrent) : null;

      const uidToMigrate = targetUid || legacyCurrent?.uid;
      if (!uidToMigrate) return null;

      const legacy = legacyPlayers[uidToMigrate] || legacyCurrent;
      if (!legacy) return null;

      const xp = legacy.score || 0;
      const level = evaluateHeroLevel(xp);

      const migratedUser: HeroProfile = {
        uid: legacy.uid || uidToMigrate,
        displayName: legacy.displayName || 'بطل مسلم',
        photoUri: legacy.photoUri,
        country: legacy.country,
        countryCode: legacy.countryCode,
        phone: legacy.phone,
        age: legacy.age,
        gender: legacy.gender,
        xp,
        level: level.level,
        levelTitleAr: level.nameAr,
        levelTitleEn: level.nameEn,
        sirajBalance: legacy.sirajBalance ?? 50,
        score: xp,
        currentStreak: legacy.streak || 0,
        longestStreak: legacy.streak || 0,
        streakFreezeCount: 1, // grant 1 welcome freeze
        weeklyDaysCompleted: Math.min(7, legacy.streak || 0),
        lastActiveDate: legacy.lastPlayedAt?.split('T')[0],
        jamaaCountThisMonth: 0,
        totalPrayersThisMonth: 0,
        mutashabihatCorrectCount: legacy.mutashabihatCorrectCount || 0,
        quranCorrectCount: legacy.quranCorrectCount || 0,
        triviaCorrectCount: legacy.triviaCorrectCount || 0,
        unlockedTitles: legacy.unlockedTitles || [],
        activeTitle: legacy.activeTitle || '',
        unlockedItems: legacy.unlockedItems || [],
        championshipScore: legacy.championshipScore,
        championshipTime: legacy.championshipTime,
        createdAt: legacy.lastPlayedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.saveUser(migratedUser);
      return migratedUser;
    } catch (err) {
      console.warn('[HeroRepository] Migration error:', err);
      return null;
    }
  }

  private async readUsersMap(): Promise<Record<string, HeroProfile>> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : {};
  }

  private createDefaultProfile(uid: string, displayName: string): HeroProfile {
    const level = evaluateHeroLevel(0);
    return {
      uid,
      displayName,
      xp: 0,
      level: level.level,
      levelTitleAr: level.nameAr,
      levelTitleEn: level.nameEn,
      sirajBalance: 50,
      score: 0,
      currentStreak: 0,
      longestStreak: 0,
      streakFreezeCount: 1,
      weeklyDaysCompleted: 0,
      jamaaCountThisMonth: 0,
      totalPrayersThisMonth: 0,
      mutashabihatCorrectCount: 0,
      quranCorrectCount: 0,
      triviaCorrectCount: 0,
      unlockedTitles: [],
      unlockedItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const heroRepository: IHeroRepository = new AsyncStorageHeroRepository();

export function clearHeroMemoryCache(){(heroRepository as AsyncStorageHeroRepository).clearMemoryCache();}
