# بطل مسلم (Batl Muslim) 🏆

تطبيق إسلامي تفاعلي تعليمي وتنافسي موجه للأسرة والأطفال والناشئة، يجمع بين متعة التنافس المعرفي والارتقاء في حفظ القرآن الكريم، الأحاديث الشريفة، والسيرة النبوية.

---

## 🚀 التقنيات المستخدمة (Tech Stack)

- **Framework**: Expo SDK 57 (Managed Workflow)
- **Runtime**: React Native 0.86 / React 19
- **Language**: TypeScript (Strict Mode)
- **Audio Engine**: `expo-audio` with safe audio wrapper (`src/utils/safeAudio.ts`)
- **Camera & AR**: `expo-camera` (Finish Ayah AR Filter)
- **Localization**: Full RTL Arabic-first architecture with English support (`LanguageContext`)
- **Theme**: Semantic theme token system with Light & Dark modes (`ThemeContext`, `src/config/colors.ts`)
- **State & Resilience**: Global `ErrorBoundary`, reusable `StateView` components (`LoadingState`, `EmptyState`, `ErrorState`)
- **Backend / Persistence**: Firebase Auth/Firestore with stable AsyncStorage local session caching
- **Monetization**: Google Mobile Ads (AdMob) with zero-layout-jump fail-safe banner container

---

## 📁 هيكلية المشروع (Project Architecture)

```
├── App.tsx                     # Entry point (Safe Area, Polyfills)
├── firestore.rules             # Least-privilege security rules
├── scripts/
│   └── generate_questions.py  # Question generation script
└── src/
    ├── components/
    │   ├── home/               # Modular Home screen widgets (<350 lines)
    │   ├── profile/            # Modular Profile tabs & modals (<200 lines)
    │   ├── quranAssessment/    # Modular Quran Assessment engine (<200 lines)
    │   ├── voice/              # Modular Voice imitation components (<200 lines)
    │   ├── AdBanner.tsx        # Fail-safe zero-jump ad container
    │   ├── ErrorBoundary.tsx   # React lifecycle crash boundary
    │   └── StateView.tsx       # Standardized loading/empty/error states
    ├── config/
    │   ├── ads.ts              # AdMob unit IDs & configuration
    │   ├── colors.ts           # Semantic palette tokens (Light & Dark)
    │   └── env.ts              # Environment configuration (DSP server, etc.)
    ├── contexts/
    │   ├── AuthContext.tsx     # Session persistence & guest identity
    │   ├── LanguageContext.tsx # RTL-aware direction, arrows, translations
    │   └── ThemeContext.tsx    # Theme token dispatcher
    ├── hooks/
    │   ├── useProfile.ts       # Profile state & portfolio management
    │   ├── useQuranAssessment.ts # Dual-API verse fetch & question compiler
    │   └── useVoiceRecording.ts  # Expo-audio recording, metering & analysis
    └── screens/                # Lightweight screens (<350 lines each)
```

---

## ⚙️ التثبيت والتشغيل المحلي (Quick Start)

### 1. المتطلبات (Prerequisites)
- Node.js 18+ (أو استخدام المسار المحلي `export PATH="$HOME/.local/node/bin:$PATH"`)
- Expo CLI

### 2. تثبيت الحزم (Install)
```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm install
```

### 3. متغيرات البيئة (Environment Variables)
انسخ ملف `.env.example` إلى `.env`:
```bash
cp .env.example .env
```
- `EXPO_PUBLIC_DSP_SERVER_URL`: (اختياري) رابط خادم تحليل النبرة والمخارج الصوتية. في حال تركه فارغاً، يعتمد التطبيق على التحليل الصوتي المدمج ونموذج Whisper السحابي.

### 4. التشغيل (Run Expo Dev Server)
```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm start
```

---

## 🔒 أمان البيانات وقواعد Firestore (Security)

تم تضمين ملف `firestore.rules` لتطبيق سياسة الحد الأدنى من الصلاحيات (Least-Privilege):
- كل مستخدم يمكنه قراءة وتعديل ملفه الشخصي فقط (`/users/{userId}`).
- القراءة العامة متاحة للوحات الصدارة (`/leaderboard`) ومنشورات ساحة التلاوة (`/community_posts`).
- غرف المسابقات الجماعية محمية بحسابات مستخدمين مسجلة أو معرّف ضيف معتمد.
- منع الحذف الجماعي أو التعديل العشوائي من طرف العميل (`default deny`).

---

## 🧪 التحقق البرمجي (Validation)

للتأكد من سلامة الأنماط البرمجية وعدم وجود أخطاء TypeScript:
```bash
export PATH="$HOME/.local/node/bin:$PATH"
npx tsc --noEmit
```
