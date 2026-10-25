import AsyncStorage from '@react-native-async-storage/async-storage';

export type Badge = {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  emoji: string;
  color: string;
};

export const badgesCatalog: Badge[] = [
  {
    id: 'trivia-scholar',
    titleAr: 'العلامة',
    titleEn: 'Scholar',
    descAr: 'حقق أكثر من ١٠٠ نقطة في تحدي المعلومات',
    descEn: 'Earn over 100 points in Trivia',
    emoji: '🎓',
    color: '#3B82F6',
  },
  {
    id: 'voice-reciter',
    titleAr: 'قارئ الغراء',
    titleEn: 'Qari Reciter',
    descAr: 'أكمل تلاوة القرآن بدقة ونجاح',
    descEn: 'Successfully complete a Vocal Recitation',
    emoji: '🎙️',
    color: '#8B5CF6',
  },
  {
    id: 'prayer-keeper',
    titleAr: 'المصلّي المحافظ',
    titleEn: 'Prayer Keeper',
    descAr: 'حافظ على صلواتك الخمس في المتابع اليومي',
    descEn: 'Log at least 5 total prayers in the Tracker',
    emoji: '🕌',
    color: '#10B981',
  },
  {
    id: 'quran-memorizer',
    titleAr: 'حافظ الوحيين',
    titleEn: 'Memorizer',
    descAr: 'أكمل اختبارات حفظ الآيات في القرآن',
    descEn: 'Complete a Quran Memorization challenge',
    emoji: '📖',
    color: '#F59E0B',
  },
  {
    id: 'sirah-badge-1',
    titleAr: 'شبل مكة',
    titleEn: 'Makkah Cub',
    descAr: 'أكمل المرحلة الأولى من خريطة السيرة النبوية',
    descEn: 'Complete Checkpoint 1 on the Sirah Map',
    emoji: '👶',
    color: '#EC4899',
  },
  {
    id: 'sirah-badge-2',
    titleAr: 'مستكشف حراء',
    titleEn: 'Hira Explorer',
    descAr: 'أكمل المرحلة الثانية من خريطة السيرة النبوية',
    descEn: 'Complete Checkpoint 2 on the Sirah Map',
    emoji: '🏔️',
    color: '#3B82F6',
  },
  {
    id: 'sirah-badge-3',
    titleAr: 'حارس العقيدة',
    titleEn: 'Faith Guardian',
    descAr: 'أكمل المرحلة الثالثة من خريطة السيرة النبوية',
    descEn: 'Complete Checkpoint 3 on the Sirah Map',
    emoji: '🛡️',
    color: '#8B5CF6',
  },
  {
    id: 'sirah-badge-4',
    titleAr: 'جبل الصبر',
    titleEn: 'Patience Mountain',
    descAr: 'أكمل المرحلة الرابعة من خريطة السيرة النبوية',
    descEn: 'Complete Checkpoint 4 on the Sirah Map',
    emoji: '🌋',
    color: '#F59E0B',
  },
  {
    id: 'sirah-badge-5',
    titleAr: 'مهاجر شجاع',
    titleEn: 'Brave Muhajir',
    descAr: 'أكمل المرحلة الخامسة من خريطة السيرة النبوية',
    descEn: 'Complete Checkpoint 5 on the Sirah Map',
    emoji: '🐪',
    color: '#10B981',
  },
  {
    id: 'sirah-badge-6',
    titleAr: 'باني المجتمع',
    titleEn: 'Community Builder',
    descAr: 'أكمل المرحلة السادسة من خريطة السيرة النبوية',
    descEn: 'Complete Checkpoint 6 on the Sirah Map',
    emoji: '🤝',
    color: '#F43F5E',
  },
];

// Helper to check which badges are unlocked based on stats
export async function checkUnlockedBadges(userScore: number): Promise<string[]> {
  const unlockedIds: string[] = [];

  // 1. Check Scholar (Trivia score >= 100)
  if (userScore >= 100) {
    unlockedIds.push('trivia-scholar');
  }

  try {
    // 2. Check Reciter
    const keys = await AsyncStorage.getAllKeys();
    const recitationsDone = await AsyncStorage.getItem('completed-recitations-count');
    if (recitationsDone && parseInt(recitationsDone, 10) > 0) {
      unlockedIds.push('voice-reciter');
    }

    // 3. Check Prayer Keeper
    const prayerKeys = keys.filter((k) => k.startsWith('prayer-tracker-'));
    let totalChecked = 0;
    for (const key of prayerKeys) {
      const dataStr = await AsyncStorage.getItem(key);
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        totalChecked += Object.values(parsed).filter(Boolean).length;
      }
    }
    if (totalChecked >= 5) {
      unlockedIds.push('prayer-keeper');
    }

    // 4. Check Quran Memorizer
    const memorizedDone = await AsyncStorage.getItem('completed-memorization-count');
    if (memorizedDone && parseInt(memorizedDone, 10) > 0) {
      unlockedIds.push('quran-memorizer');
    }

    // 5. Check Sirah checkpoints
    for (let id = 1; id <= 6; id++) {
      const done = await AsyncStorage.getItem(`completed-sirah-checkpoint-${id}`);
      if (done === 'true') {
        unlockedIds.push(`sirah-badge-${id}`);
      }
    }
  } catch (err) {
    console.error('Error checking badges:', err);
  }

  return unlockedIds;
}
