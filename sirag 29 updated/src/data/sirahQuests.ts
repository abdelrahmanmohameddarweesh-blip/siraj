export interface SirahCheckpoint {
  id: number;
  titleAr: string;
  titleEn: string;
  narrativeAr: string;
  narrativeEn: string;
  questionAr: string;
  questionEn: string;
  optionsAr: string[];
  optionsEn: string[];
  correctIndex: number;
  badgeNameAr: string;
  badgeNameEn: string;
  badgeEmoji: string;
  xpReward: number;
}

export const sirahCheckpoints: SirahCheckpoint[] = [
  {
    id: 1,
    titleAr: 'المولد النبوي والنشأة',
    titleEn: 'The Noble Birth & Upbringing',
    narrativeAr: 'ولد النبي محمد ﷺ في مكة المكرمة في عام الفيل يتيماً، ونشأ في رعاية جده عبد المطلب ثم عمه أبي طالب، واشتهر بين قومه بالصدق والأمانة.',
    narrativeEn: 'Prophet Muhammad ﷺ was born orphaned in Makkah in the Year of the Elephant. Raised by his grandfather Abdul Muttalib and later his uncle Abu Talib, he became renowned for his absolute honesty and trustworthiness (Al-Amin).',
    questionAr: 'في أي شهر هجري ولد النبي محمد ﷺ؟',
    questionEn: 'In which Hijri month was the Prophet Muhammad ﷺ born?',
    optionsAr: ['رجب', 'شعبان', 'ربيع الأول', 'رمضان'],
    optionsEn: ['Rajab', 'Sha\'ban', 'Rabi\' al-Awwal', 'Ramadan'],
    correctIndex: 2,
    badgeNameAr: 'شبل مكة',
    badgeNameEn: 'Makkah Cub',
    badgeEmoji: '👶',
    xpReward: 50,
  },
  {
    id: 2,
    titleAr: 'نزول الوحي في غار حراء',
    titleEn: 'The First Revelation at Hira',
    narrativeAr: 'بينما كان النبي يتعبد في غار حراء، نزل عليه الملك جبريل عليه السلام بأولى آيات القرآن الكريم: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ"، مؤذناً ببدء الرسالة.',
    narrativeEn: 'While worshipping in seclusion in the Cave of Hira, the Angel Jibreel descended upon the Prophet ﷺ with the very first verses of the Holy Quran: "Read in the name of your Lord Who created," declaring the start of prophethood.',
    questionAr: 'ما هي أول كلمة نزل بها الوحي جبريل على النبي ﷺ؟',
    questionEn: 'What was the first word revealed by Angel Jibreel to the Prophet ﷺ?',
    optionsAr: ['اكتب', 'اقرأ', 'اسمع', 'قم'],
    optionsEn: ['Write', 'Read (Iqra)', 'Listen', 'Arise'],
    correctIndex: 1,
    badgeNameAr: 'مستكشف حراء',
    badgeNameEn: 'Hira Explorer',
    badgeEmoji: '🏔️',
    xpReward: 50,
  },
  {
    id: 3,
    titleAr: 'الدعوة السرية وتأسيس النواة',
    titleEn: 'The Secret Daw\'ah',
    narrativeAr: 'بدأت الدعوة إلى الإسلام سراً لثلاث سنوات تفادياً لبطش قريش، وتأسست النواة الأولى للمسلمين في دار الأرقم بن أبي الأرقم حيث كانوا يتعلمون القرآن.',
    narrativeEn: 'The call to Islam began secretly for three years to avoid early persecution. The first nucleus of Muslims met secretly at Dar al-Arqam to learn Quranic verses and strengthen their faith.',
    questionAr: 'أين كان يجتمع النبي ﷺ سراً بالمسلمين الأوائل لتعليمهم الدين؟',
    questionEn: 'Where did the Prophet ﷺ secretly gather with the early Muslims to teach them Islam?',
    optionsAr: ['دار الأرقم', 'شعب أبي طالب', 'دار الندوة', 'غار ثور'],
    optionsEn: ['Dar al-Arqam', 'She\'b Abu Talib', 'Dar al-Nadwah', 'Cave Thawr'],
    correctIndex: 0,
    badgeNameAr: 'حارس العقيدة',
    badgeNameEn: 'Faith Guardian',
    badgeEmoji: '🛡️',
    xpReward: 50,
  },
  {
    id: 4,
    titleAr: 'الجهر بالدعوة ومواجهة الصعاب',
    titleEn: 'The Public Call & Tribulations',
    narrativeAr: 'أمر الله نبيه بالصدع بالحق، فوقف على جبل الصفا ودعا قريشاً علناً. واجه المسلمون الأوائل أشد أنواع التعذيب والحصار صابرين محتسبين.',
    narrativeEn: 'Allah commanded the Prophet ﷺ to proclaim the message openly. He stood atop Mount Safa and invited Makkah publicly. Early Muslims faced severe torture and boycotts but stood firm in faith.',
    questionAr: 'على أي جبل وقف النبي ﷺ ليعلن دعوة الإسلام علناً لأول مرة؟',
    questionEn: 'On which mount did the Prophet ﷺ stand to announce Islam publicly for the first time?',
    optionsAr: ['جبل أحد', 'جبل الصفا', 'جبل عرفات', 'جبل النور'],
    optionsEn: ['Mount Uhud', 'Mount Safa', 'Mount Arafat', 'Mount Al-Noor'],
    correctIndex: 1,
    badgeNameAr: 'جبل الصبر',
    badgeNameEn: 'Patience Mountain',
    badgeEmoji: '🌋',
    xpReward: 50,
  },
  {
    id: 5,
    titleAr: 'الهجرة النبوية المباركة',
    titleEn: 'The Blessed Hijrah Migration',
    narrativeAr: 'هاجر النبي ﷺ وصاحبه أبو بكر الصديق رضي الله عنه إلى يثرب (المدينة المنورة)، مستعينين بالتخطيط الدقيق والتوكل التام، فاستقبلهم الأنصار بالأناشيد.',
    narrativeEn: 'The Prophet ﷺ and his companion Abu Bakr migrated from Makkah to Yathrib (later Madinah), demonstrating perfect planning and trust in Allah. The Ansar welcomed them with immense joy and nasheeds.',
    questionAr: 'من هو الصحابي الجليل الذي رافق النبي ﷺ في هجرته التاريخية؟',
    questionEn: 'Who was the noble companion who accompanied the Prophet ﷺ on the historic Hijrah migration?',
    optionsAr: ['عمر بن الخطاب', 'عثمان بن عفان', 'علي بن أبي طالب', 'أبو بكر الصديق'],
    optionsEn: ['Umar ibn al-Khattab', 'Uthman ibn Affan', 'Ali ibn Abi Talib', 'Abu Bakr al-Siddiq'],
    correctIndex: 3,
    badgeNameAr: 'مهاجر شجاع',
    badgeNameEn: 'Brave Muhajir',
    badgeEmoji: '🐪',
    xpReward: 50,
  },
  {
    id: 6,
    titleAr: 'تأسيس المجتمع الجديد بالمدينة',
    titleEn: 'Establishing Madinah Community',
    narrativeAr: 'عند وصوله للمدينة، بنى النبي ﷺ مسجده، وآخى بين المهاجرين والأنصار في أعظم ميثاق تآخي عرفه البشر، وكتب وثيقة المدينة لتنظيم شؤون المجتمع.',
    narrativeEn: 'Upon arrival, the Prophet ﷺ built his mosque, established the historical brotherhood between Muhajirun and Ansar, and wrote the Madinah Constitution to unite all tribes.',
    questionAr: 'ما هو الاسم الذي أطلقه النبي ﷺ على سكان يثرب الذين نصروا المسلمين؟',
    questionEn: 'What title did the Prophet ﷺ give to the inhabitants of Yathrib who supported the Muslims?',
    optionsAr: ['المهاجرون', 'الأنصار', 'الأوس', 'الخزرج'],
    optionsEn: ['The Muhajirun', 'The Ansar', 'Al-Aws', 'Al-Khazraj'],
    correctIndex: 1,
    badgeNameAr: 'باني المجتمع',
    badgeNameEn: 'Community Builder',
    badgeEmoji: '🤝',
    xpReward: 50,
  },
];
