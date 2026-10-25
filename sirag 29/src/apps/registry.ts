/**
 * Registry of mini-apps for the "تطبيقاتك" (Your Apps) grid.
 * In RTL order, starting from the right edge, row 1 then row 2:
 * Row 1: 1 الصلاة (clock/green), 2 القبلة (compass/blue), 3 الأذكار (moon/gold), 4 الصيام (calendar/purple)
 * Row 2: 5 القرآن (book-open/rose), 6 العادات (target/green), 7 الميدان (trophy/gold), 8 المتجر (shopping-bag/blue)
 */

export type MiniAppPalette = 'green' | 'blue' | 'gold' | 'purple' | 'rose';

export type MiniAppIconName =
  | 'clock'
  | 'compass'
  | 'moon'
  | 'calendar'
  | 'book-open'
  | 'target'
  | 'trophy'
  | 'shopping-bag';

export interface MiniAppItem {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: MiniAppIconName;
  palette: MiniAppPalette;
  route: string;
  enabled: boolean;
  comingSoonMessageAr?: string;
  comingSoonMessageEn?: string;
}

export const MINI_APPS_REGISTRY: MiniAppItem[] = [
  {
    id: 'prayer',
    titleAr: 'الصلاة',
    titleEn: 'Prayer',
    icon: 'clock',
    palette: 'green',
    route: 'PrayerTracker',
    enabled: true,
  },
  {
    id: 'qibla',
    titleAr: 'القبلة',
    titleEn: 'Qibla',
    icon: 'compass',
    palette: 'blue',
    route: 'Qibla',
    enabled: false,
    comingSoonMessageAr: 'ميزة بوصلة القبلة الدقيقة قيد التطوير وستتاح قريبًا بإذن الله.',
    comingSoonMessageEn: 'Accurate Qibla compass is coming soon in sha Allah.',
  },
  {
    id: 'adhkar',
    titleAr: 'الأذكار',
    titleEn: 'Adhkar',
    icon: 'moon',
    palette: 'gold',
    route: 'Adhkar',
    enabled: true,
  },
  {
    id: 'fasting',
    titleAr: 'الصيام',
    titleEn: 'Fasting',
    icon: 'calendar',
    palette: 'purple',
    route: 'Fasting',
    enabled: false,
    comingSoonMessageAr: 'متابع صيام النوافل والإثنين والخميس قادم قريبًا بإذن الله.',
    comingSoonMessageEn: 'Sunnah fasting tracker is coming soon in sha Allah.',
  },
  {
    id: 'quran',
    titleAr: 'القرآن',
    titleEn: 'Quran',
    icon: 'book-open',
    palette: 'rose',
    route: 'QuranAssessment',
    enabled: true,
  },
  {
    id: 'habits',
    titleAr: 'العادات',
    titleEn: 'Habits',
    icon: 'target',
    palette: 'green',
    route: 'Habits',
    enabled: false,
    comingSoonMessageAr: 'صانع العادات الإيمانية الـ 40 يوماً قادم في التحديث القادم!',
    comingSoonMessageEn: '40-day Islamic habit builder is coming in the next update!',
  },
  {
    id: 'arena',
    titleAr: 'الميدان',
    titleEn: 'Arena',
    icon: 'trophy',
    palette: 'gold',
    route: 'ArenaHub',
    enabled: true,
  },
  {
    id: 'shop',
    titleAr: 'المتجر',
    titleEn: 'Shop',
    icon: 'shopping-bag',
    palette: 'blue',
    route: 'Shop',
    enabled: true,
  },
];
