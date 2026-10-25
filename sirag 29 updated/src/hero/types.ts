export type HeroEventType =
  | 'prayer_checkin'
  | 'athkar_done'
  | 'habit_checkin'
  | 'fast_done'
  | 'quiz_correct'
  | 'quran_session'
  | 'shop_purchase'
  | 'streak_repaired'
  | 'streak_freeze_used'
  | 'bonus_siraj';

export interface HeroEvent {
  id: string;
  uid: string;
  type: HeroEventType;
  source: string;
  value: number;
  meta?: Record<string, any>;
  at: string; // ISO 8601
}

export type PrayerTimingStatus = 'on_time' | 'late' | 'qada';

export interface PrayerMeta {
  prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  status: PrayerTimingStatus;
  jamaa: boolean;
  dateStr: string; // YYYY-MM-DD
}

export interface AthkarMeta {
  period: 'morning' | 'evening' | 'sleep' | 'post_prayer';
  dateStr: string; // YYYY-MM-DD
}

export interface HeroHabit {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: string;
  category: 'quran' | 'dhikr' | 'knowledge' | 'kindness' | 'fasting' | 'general';
  frequency: 'daily' | 'weekly' | 'custom';
  dueDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  isCustom?: boolean;
}

export interface HeroDailyTask {
  id: string;
  key: string;
  titleAr: string;
  titleEn: string;
  category: 'prayer' | 'athkar' | 'quran' | 'habit' | 'fasting' | 'learning';
  icon: string;
  points: number; // Spendable Siraj
  xp: number;     // Permanent Hero XP
  isCompleted: boolean;
  completedAt?: string;
  meta?: Record<string, any>;
}

export interface HeroLevel {
  level: number;
  nameAr: string;
  nameEn: string;
  minXp: number;
  maxXp: number;
  icon: string;
}

export interface HeroProfile {
  uid: string;
  displayName: string;
  photoUri?: string;
  country?: string;
  countryCode?: string;
  phone?: string;
  age?: number;
  gender?: 'male' | 'female' | '';

  // Core Progression (ONE Engine)
  xp: number;               // Never decreases, not spendable
  level: number;            // Current level (1-10+)
  levelTitleAr: string;
  levelTitleEn: string;
  sirajBalance: number;     // Spendable candles / points
  score: number;            // Legacy score alias (mirrors XP or high scores)

  // Forgiving Streak System
  currentStreak: number;
  longestStreak: number;
  streakFreezeCount: number;
  weeklyDaysCompleted: number; // Out of 7 days
  lastActiveDate?: string;     // YYYY-MM-DD
  isStreakProtectedToday?: boolean;
  streakStatusMessageAr?: string;
  streakStatusMessageEn?: string;

  // Private Worship Stats (NEVER public on any leaderboard or feed)
  jamaaCountThisMonth: number;
  totalPrayersThisMonth: number;

  // Learning & Titles
  mutashabihatCorrectCount: number;
  quranCorrectCount: number;
  triviaCorrectCount: number;
  unlockedTitles: string[];
  activeTitle?: string;
  unlockedItems: string[];

  // Championship historical bests
  championshipScore?: number;
  championshipTime?: number;

  createdAt: string;
  updatedAt: string;
}

export interface IHeroRepository {
  getUser(uid: string): Promise<HeroProfile | null>;
  saveUser(user: HeroProfile): Promise<void>;
  recordEvent(event: HeroEvent): Promise<boolean>;
  getEvents(uid: string, filter?: { since?: string; type?: HeroEventType; date?: string }): Promise<HeroEvent[]>;
  getHabits(uid: string): Promise<HeroHabit[]>;
  saveHabit(uid: string, habit: HeroHabit): Promise<void>;
  getSettings(uid: string): Promise<Record<string, any>>;
  saveSettings(uid: string, settings: Record<string, any>): Promise<void>;
  migrateLegacyUserData(uid?: string): Promise<HeroProfile | null>;
}
