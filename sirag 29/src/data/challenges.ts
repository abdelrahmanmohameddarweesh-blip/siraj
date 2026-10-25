export type Challenge = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  route: string;
  color: string;
  difficulty: 'سهل' | 'متوسط' | 'متقدم' | 'بطل';
  points: number;
};

export const challenges: Challenge[] = [
  {
    id: 'voice-challenge',
    title: 'تدريب التلاوة الصوتية',
    description: 'تدرّب على القراءة والاستماع؛ لا تُعد نتائج التشابه الصوتي حكمًا على صحة التجويد.',
    emoji: '🎙️',
    route: 'Voice',
    color: '#F7EBF7',
    difficulty: 'بطل',
    points: 25,
  },


  {
    id: 'hadith',
    title: 'فهم الحديث والعمل به',
    description: 'تعلّم معنى الحديث ودلالته، ثم راجع فهمك بمواقف وأسئلة تعليمية.',
    emoji: '💬',
    route: 'HadithChallenge',
    color: '#EBEBF7',
    difficulty: 'متوسط',
    points: 15,
  },
  {
    id: 'knowledge',
    title: 'تحدي المعرفة الإسلامية',
    description: 'المسابقة الكبرى في الفقه، السيرة، القرآن، والتاريخ الإسلامي.',
    emoji: '📝',
    route: 'Trivia',
    color: '#F2F2F2',
    difficulty: 'متوسط',
    points: 10,
  },

  {
    id: 'quran-assessment',
    title: 'مراجعة الحفظ',
    description: 'أداة مراجعة اختيارية للحفظ؛ لا تقيس منزلة الإنسان أو أجره.',
    emoji: '📖',
    route: 'QuranAssessment',
    color: '#EAF2F8',
    difficulty: 'متقدم',
    points: 25,
  },
  {
    id: 'mutashabihat',
    title: 'تمييز الآيات المتشابهة',
    description: 'قارن الألفاظ المتقاربة لتثبيت الحفظ، مع مراجعة مواضع الاختلاف.',
    emoji: '🧩',
    route: 'Mutashabihat',
    color: '#F4F1EA',
    difficulty: 'متقدم',
    points: 30,
  },
  {
    id: 'finish-ayah-camera',
    title: 'مراجعة إكمال الآية بالكاميرا',
    description: 'مراجعة اختيارية للآيات باستخدام عرض الكاميرا؛ لا يلزم تصوير نفسك.',
    emoji: '📸',
    route: 'FinishAyahCamera',
    color: '#FFF7ED',
    difficulty: 'متوسط',
    points: 25,
  },
  {
    id: 'finish-ayah',
    title: 'مراجعة إكمال الآية',
    description: 'استرجع تتمة الآية لتعزيز الحفظ، وراجع النص الصحيح عند الخطأ.',
    emoji: '🎧',
    route: 'FinishAyah',
    color: '#E6F4EA',
    difficulty: 'متوسط',
    points: 20,
  },
];
