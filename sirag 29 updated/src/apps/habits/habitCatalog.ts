export type HabitObligation = 'obligatory' | 'sunnah_muakkadah' | 'sunnah' | 'recommended';

export type HabitPeriod = 7 | 21 | 40 | 90;

export type HabitPlanTier = 'starter' | 'steady' | 'strong';

export type ReminderIntensity = 'gentle' | 'steady' | 'strict';

export type HabitAnchor =
  | 'fajr'
  | 'duha'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'qiyam_last_third'
  | 'before_sleep';

export interface HabitTemplate {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: string;
  obligation: HabitObligation;
  obligationLabelAr: string;
  defaultAnchor: HabitAnchor;
  linkedFeature?: 'fajr' | 'athkar' | 'fasting';
  plans: {
    starter: { titleAr: string; titleEn: string; targetTextAr: string };
    steady: { titleAr: string; titleEn: string; targetTextAr: string };
    strong: { titleAr: string; titleEn: string; targetTextAr: string };
  };
}

export interface UserHabitRecord {
  id: string;
  templateId: string;
  titleAr: string;
  titleEn: string;
  icon: string;
  obligation: HabitObligation;
  period: HabitPeriod;
  plan: HabitPlanTier;
  targetDescriptionAr: string;
  anchor: HabitAnchor;
  intensity: ReminderIntensity;
  startDate: string; // YYYY-MM-DD
  completedDays: number;
  currentStreak: number;
  lastCompletedDate?: string;
  missedYesterday: boolean;
  status: 'active' | 'graduated' | 'paused';
  adherenceRate: number; // 0 to 100%
  linkedFeature?: 'fajr' | 'athkar' | 'fasting';
}

/**
 * Starter Habit Catalog (9 Config-Driven Data Templates)
 */
export const STARTER_HABITS_CATALOG: HabitTemplate[] = [
  {
    id: 'fajr_on_time',
    titleAr: 'صلاة الفجر في وقتها',
    titleEn: 'Fajr on Time',
    descAr: 'المحافظة على أداء فريضة الفجر في وقتها ومع الجماعة للأجر العظيم والبركة.',
    descEn: 'Perform Fajr prayer on time with the congregation.',
    icon: 'target',
    obligation: 'obligatory',
    obligationLabelAr: 'واجب',
    defaultAnchor: 'fajr',
    linkedFeature: 'fajr',
    plans: {
      starter: { titleAr: 'مبتدئ', titleEn: 'Starter', targetTextAr: 'صلاة الفجر حاضراً قبل طلوع الشمس' },
      steady: { titleAr: 'مثابر', titleEn: 'Steady', targetTextAr: 'صلاة الفجر مع الأذان وركعتي السنة' },
      strong: { titleAr: 'عازم', titleEn: 'Strong', targetTextAr: 'صلاة الفجر في المسجد جماعة والمكوث للشروق' },
    },
  },
  {
    id: 'daily_quran',
    titleAr: 'ورد القرآن اليومي',
    titleEn: 'Daily Quran Wird',
    descAr: 'قراءة آيات من كتاب الله بتدبر وحضور قلب يومياً.',
    descEn: 'Recite daily Quran pages with reflection and presence.',
    icon: 'book-open',
    obligation: 'sunnah',
    obligationLabelAr: 'سنة',
    defaultAnchor: 'fajr',
    plans: {
      starter: { titleAr: 'مبتدئ', titleEn: 'Starter', targetTextAr: 'صفحة واحدة يومياً (نصف حزب شهرياً)' },
      steady: { titleAr: 'مثابر', titleEn: 'Steady', targetTextAr: '٤ صفحات يومياً (جزء كل ٥ أيام)' },
      strong: { titleAr: 'عازم', titleEn: 'Strong', targetTextAr: 'جزء كامل يومياً (ختمة شهرية مباركة)' },
    },
  },
  {
    id: 'duha_prayer',
    titleAr: 'صلاة الضحى',
    titleEn: 'Duha Prayer',
    descAr: 'صلاة الأوابين وصدقة عن سائر مفاصل الجسد (٣٦٠ مفصلاً).',
    descEn: 'The prayer of the oft-returning, charity for all 360 joints.',
    icon: 'clock',
    obligation: 'sunnah_muakkadah',
    obligationLabelAr: 'سنة مؤكدة',
    defaultAnchor: 'duha',
    plans: {
      starter: { titleAr: 'مبتدئ', titleEn: 'Starter', targetTextAr: 'ركعتان في وقت الضحى' },
      steady: { titleAr: 'مثابر', titleEn: 'Steady', targetTextAr: '٤ ركعات ضحى' },
      strong: { titleAr: 'عازم', titleEn: 'Strong', targetTextAr: '٨ ركعات ضحى بخشوع وتطويل' },
    },
  },
  {
    id: 'witr_prayer',
    titleAr: 'صلاة الوتر',
    titleEn: 'Witr Prayer',
    descAr: 'ختام صلاة الليل التي وصى بها النبي ﷺ أصحابه قبل النوم.',
    descEn: 'Conclusion of night prayers as encouraged by the Prophet ﷺ.',
    icon: 'moon',
    obligation: 'sunnah_muakkadah',
    obligationLabelAr: 'سنة مؤكدة',
    defaultAnchor: 'before_sleep',
    plans: {
      starter: { titleAr: 'مبتدئ', titleEn: 'Starter', targetTextAr: 'ركعة واحدة أو ثلاث قبل النوم' },
      steady: { titleAr: 'مثابر', titleEn: 'Steady', targetTextAr: 'ثلاث ركعات مع قراءة الأعلى والكافرون والإخلاص' },
      strong: { titleAr: 'عازم', titleEn: 'Strong', targetTextAr: 'خمس ركعات وتر مع دعاء القنوت' },
    },
  },
  {
    id: 'fasting_sunnah',
    titleAr: 'صيام الإثنين والخميس',
    titleEn: 'Mon/Thu Fasting',
    descAr: 'تعرض الأعمال على الله يومي الإثنين والخميس وسنة النبي ﷺ صيامهما.',
    descEn: 'Deeds are presented on Mondays and Thursdays; fast as was the Sunnah.',
    icon: 'calendar',
    obligation: 'sunnah',
    obligationLabelAr: 'سنة',
    defaultAnchor: 'fajr',
    linkedFeature: 'fasting',
    plans: {
      starter: { titleAr: 'مبتدئ', titleEn: 'Starter', targetTextAr: 'صيام يوم واحد أسبوعياً (إما الإثنين أو الخميس)' },
      steady: { titleAr: 'مثابر', titleEn: 'Steady', targetTextAr: 'صيام اليومين معاً (الإثنين والخميس)' },
      strong: { titleAr: 'عازم', titleEn: 'Strong', targetTextAr: 'صيام الإثنين والخميس والأيام البيض شهرياً' },
    },
  },
  {
    id: 'athkar_daily',
    titleAr: 'أذكار الصباح والمساء',
    titleEn: 'Morning & Evening Athkar',
    descAr: 'حصن المسلم اليومي ودرع الحماية من كل شر وسوء.',
    descEn: 'Daily fortress and spiritual shield from all harm.',
    icon: 'moon',
    obligation: 'sunnah',
    obligationLabelAr: 'سنة',
    defaultAnchor: 'fajr',
    linkedFeature: 'athkar',
    plans: {
      starter: { titleAr: 'مبتدئ', titleEn: 'Starter', targetTextAr: 'المعوذات وآية الكرسي وسيد الاستغفار' },
      steady: { titleAr: 'مثابر', titleEn: 'Steady', targetTextAr: 'أذكار الصباح والمساء كاملة' },
      strong: { titleAr: 'عازم', titleEn: 'Strong', targetTextAr: 'الأذكار كاملة مع ١٠٠ تسبيحة و١٠٠ استغفار' },
    },
  },
  {
    id: 'quran_memorization',
    titleAr: 'حفظ سورة من القرآن',
    titleEn: 'Memorize a Surah',
    descAr: 'تثبيت وحفظ آيات من الذكر الحكيم للارتقاء في درجات الجنة.',
    descEn: 'Commit verses of the Holy Quran to heart.',
    icon: 'book-open',
    obligation: 'sunnah',
    obligationLabelAr: 'سنة',
    defaultAnchor: 'maghrib',
    plans: {
      starter: { titleAr: 'مبتدئ', titleEn: 'Starter', targetTextAr: 'آية واحدة يومياً مع التكرار' },
      steady: { titleAr: 'مثابر', titleEn: 'Steady', targetTextAr: '٣ آيات يومياً مع مراجعة السابق' },
      strong: { titleAr: 'عازم', titleEn: 'Strong', targetTextAr: 'نصف صفحة حفظاً ومراجعة ربع حزب' },
    },
  },
  {
    id: 'daily_charity',
    titleAr: 'صدقة يومية ولو يسيرة',
    titleEn: 'Daily Charity',
    descAr: 'ما نقص مال من صدقة، والصدقة تطفئ غضب الرب وتدفع ميتة السوء.',
    descEn: 'Daily giving, smiling, or helping to purify wealth and soul.',
    icon: 'shopping-bag',
    obligation: 'recommended',
    obligationLabelAr: 'مستحب',
    defaultAnchor: 'dhuhr',
    plans: {
      starter: { titleAr: 'مبتدئ', titleEn: 'Starter', targetTextAr: 'صدقة يسيرة أو إطعام طير أو ابتسامة صدقة' },
      steady: { titleAr: 'مثابر', titleEn: 'Steady', targetTextAr: 'صدقة مالية يومية أو تفريج كربة محتاج' },
      strong: { titleAr: 'عازم', titleEn: 'Strong', targetTextAr: 'سقيا ماء أو كفالة يتيم أو صدقة جارية' },
    },
  },
  {
    id: 'qiyam_al_layl',
    titleAr: 'قيام الليل',
    titleEn: 'Qiyam al-Layl',
    descAr: 'شرف المؤمن ودأب الصالحين في الثلث الأخير من الليل.',
    descEn: 'The honor of the believer and habit of the righteous in the night.',
    icon: 'moon',
    obligation: 'sunnah_muakkadah',
    obligationLabelAr: 'سنة مؤكدة',
    defaultAnchor: 'qiyam_last_third',
    plans: {
      starter: { titleAr: 'مبتدئ', titleEn: 'Starter', targetTextAr: 'ركعتان خفيفتان قبل الفجر بنصف ساعة' },
      steady: { titleAr: 'مثابر', titleEn: 'Steady', targetTextAr: '٤ ركعات في الثلث الأخير مع الاستغفار بالأسحار' },
      strong: { titleAr: 'عازم', titleEn: 'Strong', targetTextAr: '٨ ركعات مع إطالة القراءة ودعاء السحر' },
    },
  },
];
