import { HeroLevel, PrayerTimingStatus } from './types';

// ============================================================================
// 1. PRAYER SCORING CONFIG
// ============================================================================
export const PRAYER_REWARDS: Record<
  PrayerTimingStatus,
  { jamaa: { siraj: number; xp: number }; alone: { siraj: number; xp: number } }
> = {
  on_time: {
    jamaa: { siraj: 15, xp: 25 }, // on time + jamaa 15
    alone: { siraj: 10, xp: 15 }, // on time alone 10
  },
  late: {
    jamaa: { siraj: 8, xp: 12 },  // late + jamaa 8
    alone: { siraj: 5, xp: 8 },   // late alone 5
  },
  qada: {
    jamaa: { siraj: 3, xp: 5 },   // qada 3
    alone: { siraj: 3, xp: 5 },
  },
};

// ============================================================================
// 2. OTHER TASK REWARDS CONFIG TABLE
// ============================================================================
export const TASK_REWARDS = {
  athkar_session: { siraj: 10, xp: 15 }, // Morning / Evening Athkar: 10
  habit_checkin: { siraj: 5, xp: 10 },
  habit_linked_bonus: { siraj: 5, xp: 5 }, // Small once-per-day habit bonus for feature-linked habits
  fasting_day: { siraj: 15, xp: 20 },      // Rebalanced in line with Sunnah tasks
  quran_session: { siraj: 15, xp: 20 },
  quiz_correct_answer: { siraj: 2, xp: 5 },
};

// ============================================================================
// 3. DAILY CAPS CONFIG (PREVENTS GAMING/ABUSE)
// ============================================================================
export const DAILY_CAPS = {
  max_prayers_scored: 5,
  max_athkar_sessions_scored: 2, // 1 morning, 1 evening
  max_quiz_points_per_day: 50,
  max_habits_scored_per_day: 10,
};

// ============================================================================
// 4. FORGIVING STREAK RULES
// ============================================================================
export const STREAK_CONFIG = {
  min_daily_tasks_for_streak: 3, // Day counts if user completes >= 3 tasks
  weekly_goal_days: 5,           // Forgiving goal: 5 of 7 days in a week
  streak_repair_cost: 30,        // Siraj cost to repair a broken streak
  max_streak_freezes: 2,         // Max freezes a hero can hold
  streak_freeze_cost: 40,        // Siraj cost to purchase a freeze in shop
  comeback_message_ar: 'لا تحزن يا بطل، خطوة اليوم تعيدك لمسارك المبارك! 🌟',
  comeback_message_en: 'Never mind, Hero! Today’s effort brings you right back on track! 🌟',
};

// ============================================================================
// 5. HERO LEVELS (10 LEVELS)
// ============================================================================
export const HERO_LEVELS: HeroLevel[] = [
  { level: 1, nameAr: 'الساعي للخير', nameEn: 'The Seeker', minXp: 0, maxXp: 99, icon: '🌱' },
  { level: 2, nameAr: 'المستمسك بالهدي', nameEn: 'The Steadfast', minXp: 100, maxXp: 249, icon: '🌿' },
  { level: 3, nameAr: 'الحريص على الأثر', nameEn: 'The Mindful', minXp: 250, maxXp: 499, icon: '🛡️' },
  { level: 4, nameAr: 'سراج الميدان', nameEn: 'Lantern of the Arena', minXp: 500, maxXp: 899, icon: '🕯️' },
  { level: 5, nameAr: 'فارس الجماعة', nameEn: 'Champion of Jamaa', minXp: 900, maxXp: 1399, icon: '🕌' },
  { level: 6, nameAr: 'ريحانة المحراب', nameEn: 'Fragrance of Mihrab', minXp: 1400, maxXp: 2099, icon: '🌸' },
  { level: 7, nameAr: 'حارس الفجر', nameEn: 'Guardian of Fajr', minXp: 2100, maxXp: 2999, icon: '🌅' },
  { level: 8, nameAr: 'همام البصيرة', nameEn: 'Hero of Insight', minXp: 3000, maxXp: 4199, icon: '⚔️' },
  { level: 9, nameAr: 'عماد الفرسان', nameEn: 'Pillar of Champions', minXp: 4200, maxXp: 5999, icon: '👑' },
  { level: 10, nameAr: 'البطل المخلص', nameEn: 'The Devoted Hero', minXp: 6000, maxXp: Infinity, icon: '🏆' },
];

/**
 * Returns level name with gender awareness (male / female / default)
 */
export function getHeroLevelTitle(level: number, gender?: 'male' | 'female' | ''): { ar: string; en: string } {
  const lvl = HERO_LEVELS.find((l) => l.level === level) || HERO_LEVELS[0];
  if (gender === 'female') {
    const FEMALE_TITLES: Record<number, string> = {
      1: 'الساعية للخير',
      2: 'المستمسكة بالهدي',
      3: 'الحريصة على الأثر',
      4: 'سراج الميدان',
      5: 'رائدة الجماعة',
      6: 'ريحانة المحراب',
      7: 'حارسة الفجر',
      8: 'ذات البصيرة',
      9: 'عماد الأبطال',
      10: 'البطلة المخلصة',
    };
    return { ar: FEMALE_TITLES[level] || lvl.nameAr, en: lvl.nameEn };
  }
  return { ar: lvl.nameAr, en: lvl.nameEn };
}

// ============================================================================
// 6. TITLES CATALOG & REQUIREMENTS
// ============================================================================
export interface TitleDefinition {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  icon: string;
  isPrivate?: boolean; // Private worship titles are only visible to the user
}

export const HERO_TITLES: TitleDefinition[] = [
  {
    id: 'title_knight',
    nameAr: 'فارس المتشابهات',
    nameEn: 'Knight of Mutashabihat',
    descAr: 'أتقن ٣٠ إجابة صحيحة في تحدي المتشابهات القرآنية',
    descEn: 'Achieved 30 correct answers in Quran Mutashabihat',
    icon: '🛡️',
  },
  {
    id: 'title_hafidh',
    nameAr: 'الحافظ المتقن',
    nameEn: 'Proficient Hafidh',
    descAr: 'أتقن ٥٠ إجابة صحيحة في تقييم حفظ القرآن',
    descEn: 'Achieved 50 correct answers in Quran assessment',
    icon: '📖',
  },
  {
    id: 'title_pulpit',
    nameAr: 'سراج المنبر',
    nameEn: 'Lantern of the Pulpit',
    descAr: 'أجاب ٤٠ إجابة صحيحة في المسابقات الثقافية والإسلامية',
    descEn: 'Answered 40 questions correctly in Islamic trivia',
    icon: '🕯️',
  },
  {
    id: 'title_heavens',
    nameAr: 'قارئ الجنان',
    nameEn: 'Reciter of the Heavens',
    descAr: 'تجاوز ١٠٠ إجابة صحيحة تراكمية عبر كافة مسارات التعلم',
    descEn: 'Accumulated 100+ correct answers across all learning modes',
    icon: '✨',
  },
  {
    id: 'title_jamaa_guardian',
    nameAr: 'حارس الجماعة',
    nameEn: 'Guardian of Jamaa',
    descAr: 'أدى ٢٥ صلاة جماعة في المسجد خلال هذا الشهر',
    descEn: 'Performed 25 Jamaa prayers in the mosque this month',
    icon: '🕌',
    isPrivate: true, // Private worship milestone!
  },
];

// ============================================================================
// 7. DEFAULT HABITS SEED
// ============================================================================
export const DEFAULT_HABITS = [
  {
    id: 'habit_quran_page',
    titleAr: 'قراءة صفحة من المصحف',
    titleEn: 'Read 1 Page of Quran',
    icon: '📖',
    category: 'quran' as const,
    frequency: 'daily' as const,
  },
  {
    id: 'habit_salawat',
    titleAr: 'الصلاة على النبي ﷺ (١٠٠ مرة)',
    titleEn: '100 Blessings upon the Prophet ﷺ',
    icon: '📿',
    category: 'dhikr' as const,
    frequency: 'daily' as const,
  },
  {
    id: 'habit_duha',
    titleAr: 'صلاة الضحى (ركعتان)',
    titleEn: 'Duha Prayer (2 Rakats)',
    icon: '☀️',
    category: 'general' as const,
    frequency: 'daily' as const,
  },
  {
    id: 'habit_kindness',
    titleAr: 'عمل بر أو إحسان',
    titleEn: 'Act of Kindness / Charity',
    icon: '🤝',
    category: 'kindness' as const,
    frequency: 'daily' as const,
  },
];
