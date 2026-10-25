# وثيقة التغييرات الشاملة (Changelog & Audit Summary)

**المشروع:** بطل مسلم (Batl Muslim)  
**الفرع:** `enhancements`  
**البيئة:** Expo SDK 57 · React Native 0.86 · React 19 · TypeScript (Strict)

---

## 📌 ملخص المهام المنجزة (Completed Tasks)

| # | المهمة | كود الالتزام (Commit) | الملفات المتأثرة | ملخص الإجراء البرمجي |
|---|---|---|---|---|
| **1** | **تحديث محرك الصوت** | `4545ac1` | `src/utils/safeAudio.ts`, `src/config/env.ts`, `src/screens/VoiceScreen.tsx`, `.env.example` | الانتقال من `expo-av` المهملة إلى `expo-audio` عبر غلاف أمان مرن، ودعم متغير بيئة ديناميكي `EXPO_PUBLIC_DSP_SERVER_URL` مع فحص صحي (Health Check) يمنع تجميد واجهة المستخدم عند عدم توفر الخادم. |
| **2** | **الجلسات واستقرار المصادقة** | `ca9493a` | `src/contexts/AuthContext.tsx`, `src/firebase/auth.ts` | معالجة فقدان بيانات المستخدم عند الخروج، حفظ واستعادة الجلسة محلياً عبر AsyncStorage مع Firebase، توليد معرّف ضيف مستقر ودائم (`guest_uuid`)، وتوحيد حقول `AppUser`. |
| **3** | **إعلانات AdMob المرنة** | `f76f3bb` | `src/components/AdBanner.tsx`, `src/config/ads.ts` | حجز مساحة ثابتة ومسبقة لشريط الإعلانات (50dp) لتفادي القفزات اللحظية في الواجهة (CLS = 0)، معالجة أعطال التحميل بصمت ودون انهيار التطبيق، وتوثيق المعرّفات التجريبية. |
| **4** | **إمكانية الوصول والتباين** | `26fba67` | شاشات ومكونات التطبيق الأساسية | إضافة خصائص الوصول (`accessibilityRole`, `accessibilityLabel`, `accessibilityState`)، ضمان أبعاد لمس تفاعلية لا تقل عن 44x44pt، وضبط درجات الألوان لتوافق معيار التباين WCAG AA. |
| **5** | **نظام الألوان والوضع الداكن** | `583fe69` | `src/config/colors.ts`, `src/screens/ProfileScreen.tsx`, `src/screens/ShopScreen.tsx` | استبدال مئات الألوان الصلبة العشوائية برموز ثيمات ديناميكية (`Colors` & `ThemeContext`) وتفعيل التبديل المتناسق بين الوضع الفاتح والوضع الداكن. |
| **6** | **حالات التحميل والفراغ والأخطاء** | `fd7a9cf` | `src/components/ErrorBoundary.tsx`, `src/components/StateView.tsx`, `src/App.tsx`, `src/screens/*` | إنشاء `ErrorBoundary` شامل يحمي التطبيق من الانهيار عند حدوث خطأ غير متوقع، وتوحيد شاشات التحميل (`LoadingState`) والفراغ (`EmptyState`) والخطأ (`ErrorState`) مع زر إعادة المحاولة. |
| **7.1** | **تفكيك شاشة الحساب الشخصي** | `f00cee1` | `src/screens/ProfileScreen.tsx`, `src/components/profile/*`, `src/hooks/useProfile.ts` | تقليص حجم الشاشة من 2,444 سطراً إلى 170 سطراً عبر استخراج 7 مكونات معيارية وهوك إدارة البيانات `useProfile`. |
| **7.2** | **تفكيك شاشة تقييم القرآن** | `ec90974` | `src/screens/QuranAssessmentScreen.tsx`, `src/components/quranAssessment/*`, `src/hooks/useQuranAssessment.ts` | تقليص حجم الشاشة من 2,178 سطراً إلى 178 سطراً عبر استخراج مكونات اللوبي، التعليمات، التقييم، والنتائج مع هوك تجميع الأسئلة. |
| **7.3** | **تفكيك الشاشة الرئيسية** | `a599731` | `src/screens/HomeScreen.tsx`, `src/components/home/*` | تقليص حجم الشاشة من 1,315 سطراً إلى 337 سطراً عبر استخراج بطاقة المنافس، منصة التتويج، البطولة الموحدة، كنز التحديات، آية اليوم، ودوري الفرسان. |
| **7.4** | **تفكيك شاشة محاكاة التلاوة** | `bc8e425` | `src/screens/VoiceScreen.tsx`, `src/components/voice/*`, `src/hooks/useVoiceRecording.ts` | تقليص حجم الشاشة من 1,697 سطراً إلى 163 سطراً عبر استخراج خطوات اختيار القارئ والآيات وبطاقات التسجيل والنتائج وهوك التسجيل والتحليل. |
| **8** | **صقل الاتجاه والواجهات (RTL)** | `40d7416` | `src/contexts/LanguageContext.tsx`, `src/App.tsx`, الشاشات الرئيسية | تفعيل التوجيه الديناميكي للأسهم والأزرار حسب لغة التطبيق (رجوع بالعربية: `→`، تقدم: `←`)، تضمين `SafeAreaProvider` لحماية النوتش، وتطبيق `KeyboardAvoidingView` على حقول الإدخال. |
| **9** | **الأمان والتنظيف والتوثيق** | `687a191` | `firestore.rules`, `README.md`, `TODO.md`, `scripts/generate_questions.py` | كتابة قواعد Firestore بأدنى صلاحيات (Least-Privilege)، حذف الملفات المتروكة (`MinimalApp.tsx`) ونقل سكريبت توليد الأسئلة، وتحديث التوثيق الشامل. |

---

## 🔍 تعليمات التحقق والاختبار (Verification Guide)

### 1. الفحص الثابت للأنماط (Static Type Check)
قم بتشغيل الأمر التالي للتأكد من خلو المشروع تماماً من أي أخطاء في الرموز أو الأنواع:
```bash
export PATH="$HOME/.local/node/bin:$PATH"
npx tsc --noEmit
```
*(النتيجة الحالية: 0 أخطاء).*

### 2. تدفق التشغيل الحي (End-to-End Runtime Flow)
1. **بدء التطبيق**: تشغيل `npm start` واختيار المحاكي أو تطبيق Expo Go.
2. **تسجيل الدخول / الضيف**: الدخول السلس وحفظ معرّف المستخدم واستعادة الرصيد والإنجازات عند إغلاق التطبيق وإعادة فتحه.
3. **التحدي الرئيسي**: خوض مسابقة أسئلة في `TriviaScreen` واحتساب نقاط السراج بنجاح.
4. **محاكاة التلاوة**: فتح `VoiceScreen`، اختيار القارئ والآيات، وتجربة التسجيل الصوتي بدون تعليق الواجهة.
5. **لوحة الصدارة والحساب**: تصفح الترتيب والتحقق من انتقال التبويبات بسلاسة.

---

## 📱 قائمة الإجراءات والقرارات المطلوبة من المستخدم (Device & User Action Items)

1. **معرّفات إعلانات AdMob الإنتاجية**:
   - الملف: `src/config/ads.ts`
   - الإجراء: استبدال معرّفات الاختبار بمعرّفات الوحدات الإعلانية الصادرة من حساب AdMob الخاص بك عند إنشاء البناء النهائي للمتاجر.
2. **نشر قواعد Firestore الأمنية**:
   - الملف: `firestore.rules`
   - الإجراء: نشر القواعد إلى مشروع Firebase الخاص بك عبر الأمر:
     ```bash
     firebase deploy --only firestore:rules
     ```
3. **خادم التحليل الصوتي المتقدم (اختياري)**:
   - الملف: `.env`
   - الإجراء: في حال قمت بنشر خادم DSP المخصص (Python FastAPI/Flask)، قم بإضافة الرابط في المتغير:
     ```bash
     EXPO_PUBLIC_DSP_SERVER_URL=https://your-dsp-server.domain.com
     ```
     *(في حال تركه فارغاً، يستمر التطبيق بالعمل ذاتياً عبر المعالجة المدمجة ونموذج Whisper).*
4. **أذونات العتاد في الأجهزة الحقيقية**:
   - منح إذن الميكروفون لشاشة `VoiceScreen`.
   - منح إذن الكاميرا الأمامية لشاشة `FinishAyahCameraScreen`.

## Milestone 2 — guest preference-aware home and Arena
- Shared local guest preference reader with focus refresh.
- Cinematic Home Hero card in deep green/gold, with Quran-first recommendation and profile customization action.
- Quran-first Arena assessment recommendation, preserving existing challenges.
- Removed Arena banner from the ad-free first phase.

## Milestone 3 — Cinematic home design alignment (October 2026)
- Added `src/components/home/CinematicHome.tsx` with deep-emerald/gold Hero header, stylized mosque skyline, Quran CTA, quick access, Batl Worlds entry cards and Arena panel.
- Rebuilt Home screen composition around the approved Arabic RTL visual reference while retaining live prayer, daily path, habit and mini-app functionality.
- Recolored shared bottom navigation to emerald/gold and respected Arabic/English tab labels.
- No registration requirement, WhatsApp integration, paid service or invented religious source added.
- TypeScript/TSX syntax parsed; full dependency-based typecheck and device QA still required.
