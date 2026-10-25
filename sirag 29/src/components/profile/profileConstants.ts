export interface HistoricalArtifact {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  badge: string;
  youtubeVideoId: string;
}

export const countriesList = [
  { code: 'EG', nameAr: 'مصر 🇪🇬', nameEn: 'Egypt' },
  { code: 'SA', nameAr: 'السعودية 🇸🇦', nameEn: 'Saudi Arabia' },
  { code: 'JO', nameAr: 'الأردن 🇯🇴', nameEn: 'Jordan' },
  { code: 'PS', nameAr: 'فلسطين 🇵🇸', nameEn: 'Palestine' },
  { code: 'AE', nameAr: 'الإمارات 🇦🇪', nameEn: 'UAE' },
  { code: 'MA', nameAr: 'المغرب 🇲🇦', nameEn: 'Morocco' },
  { code: 'OTH', nameAr: 'أخرى 🌍', nameEn: 'Other' },
];

export const HISTORICAL_ARTIFACTS: HistoricalArtifact[] = [
  {
    id: 'art_zulfiqar',
    titleAr: 'سيف "ذو الفقار" الشريف',
    titleEn: 'Ali\'s Zulfiqar Sword',
    descAr: 'السيف الأسطوري ذو الرأسين للإمام علي بن أبي طالب رضي الله عنه، رمز الشجاعة والإيمان.',
    descEn: 'The legendary double-pointed sword of Imam Ali, a symbol of bravery and faith.',
    badge: '⚔️',
    youtubeVideoId: 'q2vP164x65A',
  },
  {
    id: 'art_khalid',
    titleAr: 'سيف "خالد بن الوليد"',
    titleEn: 'Sword of Khalid ibn al-Walid',
    descAr: 'سيف القائد المظفر "سيف الله المسلول" الذي خاض به فتوحات الإسلام الكبرى.',
    descEn: 'The sword of the legendary commander, "The Drawn Sword of Allah".',
    badge: '🗡️',
    youtubeVideoId: 'E5yN5rR_qgU',
  },
  {
    id: 'art_hamzah',
    titleAr: 'درع "حمزة بن عبد المطلب"',
    titleEn: 'Shield of Hamzah',
    descAr: 'درع "أسد الله وسيد الشهداء" الذي خاض به بدر وأحد مدافعاً عن النبي ﷺ.',
    descEn: 'The battle shield of Hamzah, the "Lion of Allah", who defended the Prophet (ﷺ) at Badr and Uhud.',
    badge: '🛡️',
    youtubeVideoId: 'gW3zJbM-tG4',
  },
  {
    id: 'art_saad',
    titleAr: 'قوس "سعد بن أبي وقاص"',
    titleEn: 'Bow of Sa\'d ibn Abi Waqqas',
    descAr: 'قوس أول من رمى بسهم في سبيل الله، الصحابي الذي فداه النبي بأبويه يوم أحد.',
    descEn: 'The bow of the first companion to shoot an arrow in the way of Allah.',
    badge: '🏹',
    youtubeVideoId: 'yvP6K1K92oA',
  },
  {
    id: 'art_alparslan',
    titleAr: 'خوذة السلطان "ألب أرسلان"',
    titleEn: 'Helmet of Alp Arslan',
    descAr: 'خوذة بطل معركة ملاذكرد الخالدة الذي حمى ديار الإسلام من الزوال.',
    descEn: 'The helmet of Alp Arslan, hero of the Battle of Manzikert who defended the Islamic world.',
    badge: '🪖',
    youtubeVideoId: 'U1B9a4X_3L0',
  },
  {
    id: 'art_uqab',
    titleAr: 'الراية النبوية "العُقاب"',
    titleEn: 'Al-Uqab Banner of the Prophet',
    descAr: 'الراية السوداء الرسمية للنبي محمد ﷺ في الغزوات وصدر الإسلام.',
    descEn: 'The official black banner of the Prophet Muhammad (ﷺ) during battles.',
    badge: '🏴',
    youtubeVideoId: 'jP5Vb_x4O3w',
  },
  {
    id: 'art_ring',
    titleAr: 'خاتم "الرسول ﷺ" الشريف',
    titleEn: 'Signet Ring of the Prophet',
    descAr: 'خاتم الفضة المنقوش عليه "محمد رسول الله" الذي استخدمه لختم رسائل دعوة الملوك للإسلام.',
    descEn: 'The Prophet’s (ﷺ) silver signet ring used to seal the letters calling kings to Islam.',
    badge: '💍',
    youtubeVideoId: 't2VbX4k92OA',
  },
];

export interface QuranicTitle {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  emoji: string;
  targetTest: 'mutashabihat' | 'quran' | 'trivia' | 'total';
  targetValue: number;
}

export const QURANIC_TITLES: QuranicTitle[] = [
  {
    id: 'title_knight',
    titleAr: 'فارس المتشابهات',
    titleEn: 'Knight of Mutashabihat',
    descAr: 'أكمل ٣٠ إجابة صحيحة في اختبار المتشابهات لتنال هذا اللقب.',
    descEn: 'Achieve 30 correct answers in Mutashabihat test.',
    emoji: '🛡️',
    targetTest: 'mutashabihat',
    targetValue: 30,
  },
  {
    id: 'title_hafidh',
    titleAr: 'الحافظ المتقن',
    titleEn: 'Precise Memorizer',
    descAr: 'أكمل ٥٠ إجابة صحيحة في تقييم الحفظ لتنال هذا اللقب.',
    descEn: 'Achieve 50 correct answers in Quran Assessment.',
    emoji: '🏆',
    targetTest: 'quran',
    targetValue: 50,
  },
  {
    id: 'title_pulpit',
    titleAr: 'سراج المنبر',
    titleEn: 'Lantern of the Pulpit',
    descAr: 'أكمل ٤٠ إجابة صحيحة في تحدي المعلومات والحديث لتنال هذا اللقب.',
    descEn: 'Achieve 40 correct answers in Trivia/Hadith challenge.',
    emoji: '🕯️',
    targetTest: 'trivia',
    targetValue: 40,
  },
  {
    id: 'title_heavens',
    titleAr: 'قارئ الجنان',
    titleEn: 'Reciter of Heavens',
    descAr: 'أكمل ١٠٠ إجابة صحيحة إجمالاً في جميع الاختبارات لتنال اللقب الأسمى.',
    descEn: 'Achieve 100 total correct answers across all quizzes.',
    emoji: '👑',
    targetTest: 'total',
    targetValue: 100,
  },
];

export const prayersCatalog = [
  { key: 'fajr', labelAr: 'صلاة الفجر 🌅', labelEn: 'Fajr Prayer 🌅' },
  { key: 'dhuhr', labelAr: 'صلاة الظهر ☀️', labelEn: 'Dhuhr Prayer ☀️' },
  { key: 'asr', labelAr: 'صلاة العصر ⛅', labelEn: 'Asr Prayer ⛅' },
  { key: 'maghrib', labelAr: 'صلاة المغرب 🌇', labelEn: 'Maghrib Prayer 🌇' },
  { key: 'isha', labelAr: 'صلاة العشاء 🌌', labelEn: 'Isha Prayer 🌌' },
];

export const deedsCatalog = [
  { key: 'quran', labelAr: 'قراءة الورد القرآني 📖', labelEn: 'Quran Daily Reading 📖' },
  { key: 'morning_adhkar', labelAr: 'أذكار الصباح 🌅', labelEn: 'Morning Adhkar 🌅' },
  { key: 'evening_adhkar', labelAr: 'أذكار المساء 🌇', labelEn: 'Evening Adhkar 🌇' },
  { key: 'charity', labelAr: 'الصدقة أو صلة الرحم 🤝', labelEn: 'Charity or Family Bond 🤝' },
  { key: 'tongue', labelAr: 'حفظ اللسان وغض البصر 👁️', labelEn: 'Guarding Tongue & Gaze 👁️' },
];
