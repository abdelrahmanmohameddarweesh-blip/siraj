export interface VideoItem {
  id: string; // YouTube Video ID
  title: string;
  speaker: string;
  category: 'lectures' | 'kids' | 'general';
  audience: 'adults' | 'kids' | 'all';
  topic: 'عقيدة' | 'سيرة' | 'تزكية' | 'فقه' | 'عبادات' | 'قصص' | 'أخلاق' | 'قرآن' | 'أنمي';
  duration: string;
}

export const educationalVideos: VideoItem[] = [
  // ==========================================
  // 1. أنمي إسلامي وتاريخي (BTA3 ANIME & HISTORICAL ANIME)
  // ==========================================
  {
    id: "1a1ntXVfRx8",
    title: "خالد بن الوليد | ميلاد بطل لا يُهزم (أنمي تاريخي سينمائي)",
    speaker: "بتاع أنمي - Bta3 Anime",
    category: "general",
    audience: "all",
    topic: "أنمي",
    duration: "18:20"
  },
  {
    id: "znhlt5gzCJQ",
    title: "أقوى القتالات في التاريخ الإسلامي - نزالات فردية أرعبت جيوشاً كاملة",
    speaker: "بتاع أنمي - Bta3 Anime",
    category: "general",
    audience: "all",
    topic: "أنمي",
    duration: "14:15"
  },
  {
    id: "4QPczxhd_M8",
    title: "قصة أصحاب الأخدود وشجاعة الغلام المسلم (أنمي)",
    speaker: "بتاع أنمي - Bta3 Anime",
    category: "general",
    audience: "all",
    topic: "أنمي",
    duration: "16:40"
  },
  {
    id: "W9eCzG-_CIs",
    title: "أنا الذي سمتني أمي حيدرة - بطولات علي بن أبي طالب في خيبر",
    speaker: "بتاع أنمي - Bta3 Anime",
    category: "general",
    audience: "all",
    topic: "أنمي",
    duration: "12:05"
  },
  {
    id: "oHyQOacEYPc",
    title: "عمر بن الخطاب - الفاروق الذي كان يخشاه إبليس (أنمي)",
    speaker: "التاريخ أنمي",
    category: "general",
    audience: "all",
    topic: "أنمي",
    duration: "15:30"
  },
  {
    id: "7ToHTW_KZOE",
    title: "علي بن أبي طالب | أسد الله الغالب وأول فدائي في الإسلام",
    speaker: "ورثة الأنبياء أنمي",
    category: "general",
    audience: "all",
    topic: "أنمي",
    duration: "19:10"
  },
  {
    id: "vWAJv9ML40g",
    title: "أسد الله حمزة بن عبد المطلب - أعظم محارب في الإسلام",
    speaker: "التاريخ أنمي",
    category: "general",
    audience: "all",
    topic: "أنمي",
    duration: "17:45"
  },
  {
    id: "O6W8n9QTQ30",
    title: "نساء خالدات في التاريخ الإسلامي ومواقف البطولات (أنمي)",
    speaker: "التاريخ أنمي",
    category: "general",
    audience: "all",
    topic: "أنمي",
    duration: "13:50"
  },
  {
    id: "Rqbg8hZ3pLQ",
    title: "قصة طالوت وجالوت وداود عليه السلام (أنمي)",
    speaker: "التاريخ أنمي",
    category: "general",
    audience: "all",
    topic: "أنمي",
    duration: "21:10"
  },

  // ==========================================
  // 2. مكتبة الكبار (ADULTS LIBRARY)
  // ==========================================

  // --- الشيخ سمير مصطفى (تزكية وإيمان) ---
  {
    id: "pr-keWOH3yE",
    title: "مشاعر الموت والمصير المؤثر - موعظة توقظ القلوب",
    speaker: "الشيخ سمير مصطفى",
    category: "lectures",
    audience: "adults",
    topic: "تزكية",
    duration: "18:45"
  },
  {
    id: "FI43gB2FSp8",
    title: "لا تكثر من مخالطة الناس - حفظ القلب واللسان",
    speaker: "الشيخ سمير مصطفى",
    category: "lectures",
    audience: "adults",
    topic: "تزكية",
    duration: "12:30"
  },
  {
    id: "q6Jn-jS2c6g",
    title: "الخلاص من فتنة النظر إلى النساء ومفاتن الدنيا",
    speaker: "الشيخ سمير مصطفى",
    category: "lectures",
    audience: "adults",
    topic: "تزكية",
    duration: "18:45"
  },
  {
    id: "mThqr-T6W7Q",
    title: "غمٌّ بِغم - علاج الهموم والضيق ومخاوف المستقبل",
    speaker: "الشيخ سمير مصطفى",
    category: "lectures",
    audience: "adults",
    topic: "تزكية",
    duration: "15:20"
  },

  // --- المهندس أمجد سمير (سلسلة فاهم وبناء العقل المسلم) ---
  {
    id: "agFMbV32JIc",
    title: "فاهم 54 | التحرر من الغفلة وتجديد اليقظة والهمة",
    speaker: "المهندس أمجد سمير",
    category: "lectures",
    audience: "adults",
    topic: "عقيدة",
    duration: "32:15"
  },
  {
    id: "DdxrQV_bkkY",
    title: "فاهم 55 | التحرر من التفاهة وصناعة الشخصية المسلمة الجادة",
    speaker: "المهندس أمجد سمير",
    category: "lectures",
    audience: "adults",
    topic: "عقيدة",
    duration: "28:40"
  },
  {
    id: "-W6ijtUgXiU",
    title: "فاهم 57 | التحرر من العادة والتخلص من الإدمان السلوكي",
    speaker: "المهندس أمجد سمير",
    category: "lectures",
    audience: "adults",
    topic: "تزكية",
    duration: "35:10"
  },

  // --- الدكتور إياد قنيبي (سلسلة رحلة اليقين) ---
  {
    id: "tePvGHNP5Gw",
    title: "رحلة اليقين 1: بناء الدعائم الإيمانية ومواجهة الفتن المعاصرة",
    speaker: "د. إياد قنيبي",
    category: "lectures",
    audience: "adults",
    topic: "عقيدة",
    duration: "22:40"
  },
  {
    id: "Ex1vGpRAC_o",
    title: "رحلة اليقين 2: أدلة وجود الله واليقين الراسخ في القلب",
    speaker: "د. إياد قنيبي",
    category: "lectures",
    audience: "adults",
    topic: "عقيدة",
    duration: "25:15"
  },
  {
    id: "2UkbCb8oNgA",
    title: "النداء الأخير لترسيخ العقيدة وحماية الشباب المسلم",
    speaker: "د. إياد قنيبي",
    category: "lectures",
    audience: "adults",
    topic: "عقيدة",
    duration: "19:50"
  },

  // --- الشيخ محمد متولي الشعراوي (تفسير القرآن) ---
  {
    id: "abX1Dzv7Jhs",
    title: "تفسير سورة الكهف (الحلقة 1) - تدبر الآيات الأولى",
    speaker: "الشيخ محمد متولي الشعراوي",
    category: "lectures",
    audience: "adults",
    topic: "قرآن",
    duration: "45:10"
  },
  {
    id: "P6Uw4cdG-tw",
    title: "تفسير سورة الكهف (الحلقة 2) - قصة أصحاب الكهف والعبر منها",
    speaker: "الشيخ محمد متولي الشعراوي",
    category: "lectures",
    audience: "adults",
    topic: "قرآن",
    duration: "42:30"
  },

  // --- السيرة النبوية العطرة ---
  {
    id: "f5QeWsfYyQo",
    title: "السيرة النبوية 1: حال العرب قبل الإسلام وحاجة البشرية للرسالة",
    speaker: "الشيخ نبيل العوضي",
    category: "lectures",
    audience: "adults",
    topic: "سيرة",
    duration: "30:00"
  },
  {
    id: "Ke3S1LBu26Y",
    title: "السيرة النبوية 2: عام الفيل ومولد خاتم الأنبياء ﷺ",
    speaker: "الشيخ نبيل العوضي",
    category: "lectures",
    audience: "adults",
    topic: "سيرة",
    duration: "33:15"
  },
  {
    id: "PzVUqMYsfro",
    title: "السيرة النبوية 3: تاريخ الجزيرة العربية ودخول الأديان",
    speaker: "د. طارق السويدان",
    category: "lectures",
    audience: "adults",
    topic: "سيرة",
    duration: "38:20"
  },

  // ==========================================
  // 3. مكتبة الأطفال (KIDS LIBRARY)
  // ==========================================

  // --- تعلم مع زكريا (تعليم العبادات والآداب) ---
  {
    id: "y3Hd5srW_ak",
    title: "كارتون تعليم الوضوء للأطفال خطوة بخطوة بطريقة سهلة وممتعة",
    speaker: "تعلم مع زكريا",
    category: "kids",
    audience: "kids",
    topic: "عبادات",
    duration: "06:12"
  },
  {
    id: "edL3W38ODd4",
    title: "كارتون تعليم الصلاة للأطفال خطوة بخطوة بالترتيب الصحيح",
    speaker: "تعلم مع زكريا",
    category: "kids",
    audience: "kids",
    topic: "عبادات",
    duration: "08:45"
  },
  {
    id: "SfkiBOJP51o",
    title: "تعليم الأدعية والأذكار اليومية للأطفال الصغار",
    speaker: "تعلم مع زكريا",
    category: "kids",
    audience: "kids",
    topic: "أخلاق",
    duration: "07:20"
  },
  {
    id: "f4RTGt6tHDE",
    title: "حصن المسلم الصغير - أذكار النوم والصباح والمساء",
    speaker: "أذكار المسلم الصغير",
    category: "kids",
    audience: "kids",
    topic: "أخلاق",
    duration: "05:40"
  },

  // --- قصص الأنبياء والقرآن للأطفال ---
  {
    id: "bUg3v78h864",
    title: "قصة سيدنا آدم عليه السلام بالصلصال - أول الخلق وأبو البشر",
    speaker: "قصص الأنبياء للأطفال",
    category: "kids",
    audience: "kids",
    topic: "قصص",
    duration: "14:20"
  },
  {
    id: "NR2ttrqwrRg",
    title: "قصة سيدنا نوح عليه السلام والسفينة العظيمة بالصلصال",
    speaker: "قصص الأنبياء للأطفال",
    category: "kids",
    audience: "kids",
    topic: "قصص",
    duration: "15:10"
  },
  {
    id: "OB00NcJAULk",
    title: "قصة النبيين زكريا ويحيى عليهما السلام للأطفال",
    speaker: "ماسبيرو أطفال",
    category: "kids",
    audience: "kids",
    topic: "قصص",
    duration: "12:45"
  },

  // --- تحفيظ القرآن الكريم للأطفال ---
  {
    id: "1sxcXLFqudc",
    title: "سورة الفاتحة للأطفال - الشيخ المنشاوي المعلم مع ترديد الأطفال",
    speaker: "الشيخ المنشاوي للأطفال",
    category: "kids",
    audience: "kids",
    topic: "قرآن",
    duration: "04:30"
  },
  {
    id: "CmDbSjP39Os",
    title: "جزء عم كاملاً - المصحف المعلم للأطفال بترديد التلميذ",
    speaker: "الشيخ المنشاوي للأطفال",
    category: "kids",
    audience: "kids",
    topic: "قرآن",
    duration: "48:00"
  },

  // --- أخلاق وسلوكيات المسلم الصغير ---
  {
    id: "LUvvLB8-h0w",
    title: "فيلم سلوكيات المسلم الصغير - تعليم الآداب والأخلاق الحسنة",
    speaker: "كرتون المسلم الصغير",
    category: "kids",
    audience: "kids",
    topic: "أخلاق",
    duration: "11:15"
  },
  {
    id: "9RB8y_kjYg8",
    title: "احترام الكبير والبر بالوالدين - كرتون سلوكيات المسلم الصغير",
    speaker: "كرتون المسلم الصغير",
    category: "kids",
    audience: "kids",
    topic: "أخلاق",
    duration: "06:50"
  },
  {
    id: "imuKoGpJYww",
    title: "آداب الحديث والصدق مع الأصدقاء والأقارب",
    speaker: "كرتون المسلم الصغير",
    category: "kids",
    audience: "kids",
    topic: "أخلاق",
    duration: "07:10"
  },

  // ==========================================
  // 4. المزيد من الدروس والتحديات التعليمية المتميزة
  // ==========================================
  {
    id: "qJpZ-2xXzO8",
    title: "أحكام التجويد للمبتدئين | المخارج والصفات ونطق الحروف الصحيح",
    speaker: "الشيخ أمنية عثمان",
    category: "lectures",
    audience: "all",
    topic: "قرآن",
    duration: "25:30"
  },
  {
    id: "4k3B9Y72O2s",
    title: "سلسلة أركان الإسلام | 1. شهادة أن لا إله إلا الله وأن محمداً رسول الله",
    speaker: "د. عمر عبد الكافي",
    category: "lectures",
    audience: "adults",
    topic: "عقيدة",
    duration: "30:45"
  },
  {
    id: "8Rj0Xp9s5-A",
    title: "أسرار الخشوع في الصلاة وعلاج السرحان والوسوسة",
    speaker: "الشيخ مشاري الخراز",
    category: "lectures",
    audience: "adults",
    topic: "فقه",
    duration: "22:15"
  },
  {
    id: "10Kq8yZ004U",
    title: "قصة النبي يوسف عليه السلام كاملة مع العبر والدروس التربوية",
    speaker: "الشيخ نبيل العوضي",
    category: "lectures",
    audience: "all",
    topic: "قصص",
    duration: "55:00"
  },
  {
    id: "9mPzX9W_140",
    title: "فقه الطهارة والوضوء الصحيح بأبسط طريقة علمية",
    speaker: "د. محمد راتب النابلسي",
    category: "lectures",
    audience: "adults",
    topic: "فقه",
    duration: "18:20"
  },
  {
    id: "5L0x9W11kKo",
    title: "قصة موسى عليه السلام وفرعون | العزة واليقين بنصر الله",
    speaker: "د. طارق السويدان",
    category: "lectures",
    audience: "all",
    topic: "قصص",
    duration: "42:10"
  }
];
