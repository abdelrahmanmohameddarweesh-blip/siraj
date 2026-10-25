# قائمة المهام والتطوير (Batl Muslim Roadmap & Checklist)

## ✅ المهام المنجزة (Completed on `enhancements` branch)

1. **تسجيل الصوت الصوتي (Voice Recording Engine)**
   - [x] الانتقال من `expo-av` إلى `expo-audio` مع غلاف أمان مرن (`safeAudio.ts`).
   - [x] دعم متغير البيئة `EXPO_PUBLIC_DSP_SERVER_URL` بدون تعليق أداء التطبيق محلياً.
   - [x] دعم نموذج Whisper السحابي للتحقق من الكلمات مع نموذج صوتي محلي غير متصل عند انقطاع الإنترنت.

2. **الجلسات والمصادقة (Auth & Session Persistence)**
   - [x] إصلاح استعادة الجلسة ومزامنتها عبر AsyncStorage و Firebase.
   - [x] إنشاء معرّف ضيف مستقر (`guest_uuid`) لا يتغير عند إعادة فتح التطبيق.
   - [x] توحيد كائن `AppUser` ومنع أخطاء الحقول المفقودة (`sirajBalance`, `unlockedItems`, `gender`).

3. **الإعلانات الخالية من القفزات (Fail-Safe Zero-Jump AdBanner)**
   - [x] معالجة أعطال تحميل الإعلانات وحجز ارتفاع مسبق ثابت (50dp) يمنع قفز واجهة المستخدم (CLS = 0).
   - [x] توثيق معرّفات إعلانات AdMob التجريبية والإنتاجية.

4. **إمكانية الوصول والتباين (Accessibility & WCAG AA)**
   - [x] إضافة `accessibilityRole`, `accessibilityLabel`, و `accessibilityState` لكافة الأزرار التفاعلية.
   - [x] ضمان أبعاد لمس لا تقل عن 44x44pt.
   - [x] ضبط تباين الألوان لتحقيق معيار WCAG AA.

5. **نظام الألوان والوضع الداكن (Theme Tokens & Dark Mode)**
   - [x] استبدال الألوان الصلبة برموز ألوان ديناميكية تدعم الوضعين الفاتح والداكن.
   - [x] دعم كامل لألوان البطاقات، النصوص، والحدود من خلال `ThemeContext`.

6. **حالات التحميل والفراغ والأخطاء (Resilience & State Views)**
   - [x] إنشاء `ErrorBoundary` عالمي لمنع انهيار التطبيق مع زر إعادة تشغيل.
   - [x] توحيد `LoadingState`, `EmptyState`, و `ErrorState` مع إمكانية إعادة المحاولة (Retry).

7. **تفكيك الشاشات الكبيرة (Screen Splitting & Modularity)**
   - [x] تقليص `ProfileScreen.tsx` من 2,444 سطر إلى 170 سطر (`src/components/profile/` + `useProfile`).
   - [x] تقليص `QuranAssessmentScreen.tsx` من 2,178 سطر إلى 178 سطر (`src/components/quranAssessment/` + `useQuranAssessment`).
   - [x] تقليص `HomeScreen.tsx` من 1,315 سطر إلى 337 سطر (`src/components/home/` + `homeStyles`).
   - [x] تقليص `VoiceScreen.tsx` من 1,697 سطر إلى 163 سطر (`src/components/voice/` + `useVoiceRecording`).

8. **صقل واجهة المستخدم والاتجاه (RTL & UI Polish)**
   - [x] عكس اتجاهات الأسهم تلقائياً حسب اللغة (العربية: رجوع `→`، تقدم `←` / الإنجليزية: رجوع `←`، تقدم `→`).
   - [x] تطبيق `marginStart` / `marginEnd` وتضمين `SafeAreaProvider`.
   - [x] دعم `KeyboardAvoidingView` في نماذج الإدخال.

9. **الأمان والتنظيف (Security & Housekeeping)**
   - [x] كتابة ملف `firestore.rules` بقواعد صلاحيات صارمة.
   - [x] حذف الملفات المتروكة (`MinimalApp.tsx`) ونقل سكريبت توليد الأسئلة إلى `scripts/`.
   - [x] تحديث التوثيق وقائمة المهام.

---

## 📱 قرارات تتطلب جهاز حقيقي أو إعداد المستخدم (Requires Device / User Setup)

- [ ] **إعلانات AdMob الإنتاجية**: استبدال المعرفات التجريبية في `src/config/ads.ts` بمعرفات الحساب الحقيقي عند النشر على المتاجر.
- [ ] **نشر قواعد Firestore**: تطبيق ملف `firestore.rules` في لوحة تحكم Firebase عبر الأمر `firebase deploy --only firestore:rules`.
- [ ] **خادم DSP الصوتي (اختياري)**: إدخال رابط الخادم المخصص في ملف `.env` (`EXPO_PUBLIC_DSP_SERVER_URL`) في حال الرغبة بمقارنة الخصائص الصوتية خارج بيئة الهاتف.
- [ ] **اختبار إذن الكاميرا والميكروفون على أجهزة iOS/Android حقيقية**: تجربة فلتر AR وسماح التسجيل الصوتي الحي.
