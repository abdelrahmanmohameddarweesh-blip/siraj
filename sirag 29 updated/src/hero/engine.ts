import {
  HeroEvent,
  HeroProfile,
  HeroLevel,
  HeroDailyTask,
  HeroHabit,
} from './types';
import {
  PRAYER_REWARDS,
  TASK_REWARDS,
  DAILY_CAPS,
  STREAK_CONFIG,
  HERO_LEVELS,
  HERO_TITLES,
} from './config';

/**
 * Calculates spendable Siraj points and permanent Hero XP for a given event.
 */
export function calculateEventPoints(
  event: Omit<HeroEvent, 'id' | 'at'>
): { siraj: number; xp: number } {
  switch (event.type) {
    case 'prayer_checkin': {
      const status = event.meta?.status || 'on_time';
      const isJamaa = Boolean(event.meta?.jamaa);
      const rewardTable = PRAYER_REWARDS[status as keyof typeof PRAYER_REWARDS] || PRAYER_REWARDS.on_time;
      const rewards = isJamaa ? rewardTable.jamaa : rewardTable.alone;
      return { siraj: rewards.siraj, xp: rewards.xp };
    }

    case 'athkar_done': {
      return {
        siraj: TASK_REWARDS.athkar_session.siraj,
        xp: TASK_REWARDS.athkar_session.xp,
      };
    }

    case 'habit_checkin': {
      if (event.meta?.isLinkedBonus) {
        return {
          siraj: TASK_REWARDS.habit_linked_bonus.siraj,
          xp: TASK_REWARDS.habit_linked_bonus.xp,
        };
      }
      return {
        siraj: TASK_REWARDS.habit_checkin.siraj,
        xp: TASK_REWARDS.habit_checkin.xp,
      };
    }

    case 'fast_done': {
      return {
        siraj: TASK_REWARDS.fasting_day.siraj,
        xp: TASK_REWARDS.fasting_day.xp,
      };
    }

    case 'quran_session': {
      return {
        siraj: TASK_REWARDS.quran_session.siraj,
        xp: TASK_REWARDS.quran_session.xp,
      };
    }

    case 'quiz_correct': {
      const count = Math.max(1, event.value || 1);
      return {
        siraj: Math.min(DAILY_CAPS.max_quiz_points_per_day, count * TASK_REWARDS.quiz_correct_answer.siraj),
        xp: count * TASK_REWARDS.quiz_correct_answer.xp,
      };
    }

    case 'shop_purchase': {
      const cost = Math.max(0, event.value || 0);
      return { siraj: -cost, xp: 0 };
    }

    case 'streak_repaired': {
      return { siraj: -STREAK_CONFIG.streak_repair_cost, xp: 10 };
    }

    case 'streak_freeze_used': {
      return { siraj: 0, xp: 0 };
    }

    case 'bonus_siraj': {
      return { siraj: event.value || 0, xp: Math.round((event.value || 0) * 0.5) };
    }

    default:
      return { siraj: 0, xp: 0 };
  }
}

/**
 * Checks whether the incoming event is a duplicate to guarantee idempotency.
 * Same day / same task never scores twice.
 */
export function isEventIdempotent(
  existingEvents: HeroEvent[],
  newEvent: Omit<HeroEvent, 'id'>
): boolean {
  const newDate = newEvent.meta?.dateStr || newEvent.at.split('T')[0];

  if (newEvent.type === 'prayer_checkin') {
    const prayer = newEvent.meta?.prayer;
    const exists = existingEvents.some((e) => {
      if (e.type !== 'prayer_checkin') return false;
      const eDate = e.meta?.dateStr || e.at.split('T')[0];
      return eDate === newDate && e.meta?.prayer === prayer;
    });
    return !exists;
  }

  if (newEvent.type === 'athkar_done') {
    const period = newEvent.meta?.period;
    const exists = existingEvents.some((e) => {
      if (e.type !== 'athkar_done') return false;
      const eDate = e.meta?.dateStr || e.at.split('T')[0];
      return eDate === newDate && e.meta?.period === period;
    });
    return !exists;
  }

  if (newEvent.type === 'habit_checkin') {
    const habitId = newEvent.meta?.habitId;
    const exists = existingEvents.some((e) => {
      if (e.type !== 'habit_checkin') return false;
      const eDate = e.meta?.dateStr || e.at.split('T')[0];
      return eDate === newDate && e.meta?.habitId === habitId;
    });
    return !exists;
  }

  if (newEvent.type === 'fast_done') {
    const exists = existingEvents.some((e) => {
      if (e.type !== 'fast_done') return false;
      const eDate = e.meta?.dateStr || e.at.split('T')[0];
      return eDate === newDate;
    });
    return !exists;
  }

  return true;
}

/**
 * Returns current Hero Level details given total XP.
 */
export function evaluateHeroLevel(xp: number): HeroLevel {
  const safeXp = Math.max(0, xp || 0);
  for (let i = HERO_LEVELS.length - 1; i >= 0; i--) {
    if (safeXp >= HERO_LEVELS[i].minXp) {
      return HERO_LEVELS[i];
    }
  }
  return HERO_LEVELS[0];
}

/**
 * Calculates forgiving streaks and weekly goals based on events.
 */
export function calculateStreak(
  events: HeroEvent[],
  todayStr: string,
  freezeCount = 0
): {
  currentStreak: number;
  longestStreak: number;
  weeklyDaysCompleted: number;
  isCompletedToday: boolean;
  isProtectedToday: boolean;
  canRepair: boolean;
  messageAr: string;
  messageEn: string;
} {
  // Aggregate daily qualifying task counts
  const dayStats: Record<string, { count: number; protectedOrRepaired: boolean }> = {};

  for (const e of events) {
    const d = e.meta?.dateStr || e.at.split('T')[0];
    if (!dayStats[d]) {
      dayStats[d] = { count: 0, protectedOrRepaired: false };
    }

    if (e.type === 'streak_freeze_used' || e.type === 'streak_repaired') {
      dayStats[d].protectedOrRepaired = true;
    } else if (
      e.type === 'prayer_checkin' ||
      e.type === 'athkar_done' ||
      e.type === 'habit_checkin' ||
      e.type === 'fast_done' ||
      e.type === 'quran_session'
    ) {
      dayStats[d].count += 1;
    }
  }

  const isDayQualified = (dateString: string) => {
    const stat = dayStats[dateString];
    if (!stat) return false;
    return stat.protectedOrRepaired || stat.count >= STREAK_CONFIG.min_daily_tasks_for_streak;
  };

  const isCompletedToday = isDayQualified(todayStr);
  const isProtectedToday = Boolean(dayStats[todayStr]?.protectedOrRepaired);

  // Consecutive streak evaluation backwards
  let currentStreak = 0;
  let checkDate = new Date(todayStr);

  // If today isn't completed yet, check if yesterday was qualified to preserve running streak
  if (!isCompletedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (isDayQualified(dateStr)) {
      currentStreak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate weekly days completed in current 7-day period
  const today = new Date(todayStr);
  const dayOfWeek = today.getDay(); // 0 is Sunday
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);

  let weeklyDaysCompleted = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    if (isDayQualified(dStr)) {
      weeklyDaysCompleted += 1;
    }
  }

  // Check if yesterday was missed and can be repaired
  const yesterday = new Date(todayStr);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const canRepair = !isDayQualified(yesterdayStr) && currentStreak === 0;

  let messageAr = `ثباتك مبارك! ${currentStreak} أيام متتالية`;
  let messageEn = `Keep it up! ${currentStreak} days streak`;

  if (currentStreak === 0) {
    messageAr = STREAK_CONFIG.comeback_message_ar;
    messageEn = STREAK_CONFIG.comeback_message_en;
  }

  return {
    currentStreak,
    longestStreak: Math.max(currentStreak, 1),
    weeklyDaysCompleted,
    isCompletedToday,
    isProtectedToday,
    canRepair,
    messageAr,
    messageEn,
  };
}

/**
 * Calculates private monthly Jamaa prayer statistics.
 * NEVER exposed to public leaderboards or feeds.
 */
export function calculateMonthlyJamaaStats(
  events: HeroEvent[],
  yearMonth: string // YYYY-MM
): { jamaa: number; total: number; ratio: number } {
  let jamaa = 0;
  let total = 0;

  for (const e of events) {
    if (e.type !== 'prayer_checkin') continue;
    const dateStr = e.meta?.dateStr || e.at.split('T')[0];
    if (dateStr.startsWith(yearMonth)) {
      total += 1;
      if (e.meta?.jamaa) {
        jamaa += 1;
      }
    }
  }

  const ratio = total > 0 ? Math.round((jamaa / total) * 100) : 0;
  return { jamaa, total, ratio };
}

/**
 * Generates the dynamic Daily Path ("رحلة اليوم") for a given date.
 */
export function generateDailyPath(
  dateStr: string,
  events: HeroEvent[],
  habits: HeroHabit[] = []
): HeroDailyTask[] {
  const dayEvents = events.filter((e) => {
    const d = e.meta?.dateStr || e.at.split('T')[0];
    return d === dateStr;
  });

  const isPrayerDone = (prayer: string) =>
    dayEvents.find((e) => e.type === 'prayer_checkin' && e.meta?.prayer === prayer);

  const isAthkarDone = (period: string) =>
    dayEvents.find((e) => e.type === 'athkar_done' && e.meta?.period === period);

  const isQuranDone = () => dayEvents.find((e) => e.type === 'quran_session');
  const isQuizDone = () => dayEvents.find((e) => e.type === 'quiz_correct');

  const tasks: HeroDailyTask[] = [
    {
      id: `task_fajr_${dateStr}`,
      key: 'prayer_fajr',
      titleAr: 'صلاة الفجر',
      titleEn: 'Fajr Prayer',
      category: 'prayer',
      icon: '🌅',
      points: 15,
      xp: 25,
      isCompleted: Boolean(isPrayerDone('fajr')),
      completedAt: isPrayerDone('fajr')?.at,
      meta: { prayer: 'fajr' },
    },
    {
      id: `task_athkar_morning_${dateStr}`,
      key: 'athkar_morning',
      titleAr: 'أذكار الصباح',
      titleEn: 'Morning Athkar',
      category: 'athkar',
      icon: '📿',
      points: 10,
      xp: 15,
      isCompleted: Boolean(isAthkarDone('morning')),
      completedAt: isAthkarDone('morning')?.at,
      meta: { period: 'morning' },
    },
    {
      id: `task_dhuhr_${dateStr}`,
      key: 'prayer_dhuhr',
      titleAr: 'صلاة الظهر',
      titleEn: 'Dhuhr Prayer',
      category: 'prayer',
      icon: '☀️',
      points: 15,
      xp: 25,
      isCompleted: Boolean(isPrayerDone('dhuhr')),
      completedAt: isPrayerDone('dhuhr')?.at,
      meta: { prayer: 'dhuhr' },
    },
    {
      id: `task_asr_${dateStr}`,
      key: 'prayer_asr',
      titleAr: 'صلاة العصر',
      titleEn: 'Asr Prayer',
      category: 'prayer',
      icon: '🌤️',
      points: 15,
      xp: 25,
      isCompleted: Boolean(isPrayerDone('asr')),
      completedAt: isPrayerDone('asr')?.at,
      meta: { prayer: 'asr' },
    },
    {
      id: `task_maghrib_${dateStr}`,
      key: 'prayer_maghrib',
      titleAr: 'صلاة المغرب',
      titleEn: 'Maghrib Prayer',
      category: 'prayer',
      icon: '🌇',
      points: 15,
      xp: 25,
      isCompleted: Boolean(isPrayerDone('maghrib')),
      completedAt: isPrayerDone('maghrib')?.at,
      meta: { prayer: 'maghrib' },
    },
    {
      id: `task_athkar_evening_${dateStr}`,
      key: 'athkar_evening',
      titleAr: 'أذكار المساء',
      titleEn: 'Evening Athkar',
      category: 'athkar',
      icon: '🌙',
      points: 10,
      xp: 15,
      isCompleted: Boolean(isAthkarDone('evening')),
      completedAt: isAthkarDone('evening')?.at,
      meta: { period: 'evening' },
    },
    {
      id: `task_isha_${dateStr}`,
      key: 'prayer_isha',
      titleAr: 'صلاة العشاء',
      titleEn: 'Isha Prayer',
      category: 'prayer',
      icon: '🌌',
      points: 15,
      xp: 25,
      isCompleted: Boolean(isPrayerDone('isha')),
      completedAt: isPrayerDone('isha')?.at,
      meta: { prayer: 'isha' },
    },
    {
      id: `task_quran_${dateStr}`,
      key: 'quran_wird',
      titleAr: 'ورد القرآن الكريم اليومي',
      titleEn: 'Daily Quran Recitation',
      category: 'quran',
      icon: '📖',
      points: 15,
      xp: 20,
      isCompleted: Boolean(isQuranDone()),
      completedAt: isQuranDone()?.at,
    },
    {
      id: `task_quiz_${dateStr}`,
      key: 'daily_challenge',
      titleAr: 'تحدي المعرفة الإسلامية اليومي',
      titleEn: 'Daily Knowledge Challenge',
      category: 'learning',
      icon: '⚡',
      points: 10,
      xp: 15,
      isCompleted: Boolean(isQuizDone()),
      completedAt: isQuizDone()?.at,
    },
  ];

  // Append user habits
  for (const habit of habits) {
    const isHabitDone = dayEvents.find(
      (e) => e.type === 'habit_checkin' && e.meta?.habitId === habit.id
    );
    tasks.push({
      id: `task_habit_${habit.id}_${dateStr}`,
      key: `habit_${habit.id}`,
      titleAr: habit.titleAr,
      titleEn: habit.titleEn,
      category: 'habit',
      icon: habit.icon,
      points: 5,
      xp: 10,
      isCompleted: Boolean(isHabitDone),
      completedAt: isHabitDone?.at,
      meta: { habitId: habit.id },
    });
  }

  return tasks;
}

/**
 * Checks unlocked titles and awards new ones including private Jamaa milestones.
 */
export function evaluateMilestoneTitles(
  profile: HeroProfile,
  jamaaCountThisMonth = 0
): string[] {
  const titles = new Set<string>(profile.unlockedTitles || []);

  if (profile.mutashabihatCorrectCount >= 30) {
    titles.add('title_knight');
  }
  if (profile.quranCorrectCount >= 50) {
    titles.add('title_hafidh');
  }
  if (profile.triviaCorrectCount >= 40) {
    titles.add('title_pulpit');
  }

  const totalCorrect =
    (profile.mutashabihatCorrectCount || 0) +
    (profile.quranCorrectCount || 0) +
    (profile.triviaCorrectCount || 0);

  if (totalCorrect >= 100) {
    titles.add('title_heavens');
  }

  // Private milestone for Jamaa prayer dedication!
  if (jamaaCountThisMonth >= 25) {
    titles.add('title_jamaa_guardian');
  }

  return Array.from(titles);
}
