import CinematicJourneyPanel from '../../components/CinematicJourneyPanel';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeColors, HomeRadii, HomeSpacing, HomeTypography } from '../../theme/tokens';
import { useLanguage } from '../../contexts/LanguageContext';
import { useHero } from '../../hero/HeroContext';
import { usePrayer } from '../../prayer/PrayerContext';
import { MORNING_ATHKAR, EVENING_ATHKAR, DhikrItem } from './data/hisnAlMuslim';
import { HomeIcon } from '../../components/home/HomeIcons';

export function AdhkarScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { checkinAthkar } = useHero();
  const { todayTimes } = usePrayer();

  // 1. Auto-pick morning vs evening based on time & prayer times
  const initialCategory = useMemo<'morning' | 'evening'>(() => {
    const now = new Date();
    if (todayTimes?.fajr && todayTimes?.asr) {
      // Morning: from Fajr until Asr; Evening: from Asr until next morning Fajr
      if (now >= todayTimes.fajr && now < todayTimes.asr) {
        return 'morning';
      }
      return 'evening';
    }
    // Fallback hour-based (5 AM - 3:30 PM = morning, else evening)
    const hour = now.getHours();
    return hour >= 5 && hour < 16 ? 'morning' : 'evening';
  }, [todayTimes]);

  const [category, setCategory] = useState<'morning' | 'evening'>(initialCategory);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [completedSessions, setCompletedSessions] = useState<{ morning: boolean; evening: boolean }>({
    morning: false,
    evening: false,
  });
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const storageKey = `batl-athkar-${todayStr}-${category}`;

  const currentList: DhikrItem[] = category === 'morning' ? MORNING_ATHKAR : EVENING_ATHKAR;
  const currentItem = currentList[currentIndex] || currentList[0];
  const targetCount = currentItem?.count || 1;
  const currentCount = counts[currentItem?.id] ?? 0;
  const isCurrentDone = currentCount >= targetCount;

  // Total session progress
  const doneItemsCount = useMemo(() => {
    return currentList.filter((item) => (counts[item.id] ?? 0) >= item.count).length;
  }, [currentList, counts]);

  const allItemsDone = doneItemsCount === currentList.length;

  // 2. Load stored progress
  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true);
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          setCounts(parsed.counts || {});
          setCurrentIndex(parsed.currentIndex || 0);
        } else {
          setCounts({});
          setCurrentIndex(0);
        }
      } catch (err) {
        console.warn('Failed to load athkar progress:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProgress();
  }, [storageKey]);

  // Save progress
  const persistProgress = useCallback(
    async (newCounts: Record<string, number>, newIdx: number) => {
      try {
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify({ counts: newCounts, currentIndex: newIdx })
        );
      } catch (err) {
        console.warn('Failed to save athkar progress:', err);
      }
    },
    [storageKey]
  );

  // 3. Per-item Tap Counter with Haptics
  const handleTap = useCallback(async () => {
    if (isCurrentDone) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback on web/unsupported
    }

    const nextCount = currentCount + 1;
    const nextCounts = { ...counts, [currentItem.id]: nextCount };
    setCounts(nextCounts);

    if (nextCount >= targetCount) {
      // Success vibration when item completes
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // Auto advance to next item after small delay if not last
      if (currentIndex < currentList.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        persistProgress(nextCounts, nextIdx);
        return;
      }
    }

    persistProgress(nextCounts, currentIndex);
  }, [isCurrentDone, currentCount, counts, currentItem, targetCount, currentIndex, currentList.length, persistProgress]);

  // 4. End of session CTA "أنهيت الأذكار"
  const handleFinishSession = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    // Dispatch event to Hero engine
    await checkinAthkar(category, todayStr);

    setCompletedSessions((prev) => ({ ...prev, [category]: true }));
    setIsFinished(true);
  };

  const handleResetSession = async () => {
    setCounts({});
    setCurrentIndex(0);
    setIsFinished(false);
    await AsyncStorage.removeItem(storageKey);
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={HomeColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      {/* Header bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'رجوع' : 'Back'}
        >
          <Text style={styles.backBtnText}>➔</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>
          {category === 'morning'
            ? language === 'ar' ? 'أذكار الصباح 🌅' : 'Morning Adhkar 🌅'
            : language === 'ar' ? 'أذكار المساء 🌇' : 'Evening Adhkar 🌇'}
        </Text>
        <TouchableOpacity
          onPress={handleResetSession}
          style={styles.resetBtn}
          accessibilityRole="button"
          accessibilityLabel="إعادة الأذكار"
        >
          <HomeIcon name="clock" size={20} color={HomeColors.textSecondary} />
        </TouchableOpacity>
      </View>

      <CinematicJourneyPanel titleAr="أنوار الذكر" titleEn="Moments of Remembrance" subtitleAr="اذكر الله بقلب حاضر، وواصل وردك اليومي خطوة بخطوة" subtitleEn="Build a mindful daily remembrance routine, one step at a time" icon="☪" progress={currentList.length ? doneItemsCount / currentList.length * 100 : 0} progressLabelAr="أذكار مكتملة" progressLabelEn="Remembrances completed" compact />
      {/* Category switcher */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, category === 'morning' && styles.tabBtnActive]}
          onPress={() => {
            setCategory('morning');
            setIsFinished(false);
          }}
          accessibilityRole="button"
          accessibilityLabel="أذكار الصباح"
        >
          <Text style={[styles.tabBtnText, category === 'morning' && styles.tabBtnTextActive]}>
            🌅 أذكار الصباح
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, category === 'evening' && styles.tabBtnActive]}
          onPress={() => {
            setCategory('evening');
            setIsFinished(false);
          }}
          accessibilityRole="button"
          accessibilityLabel="أذكار المساء"
        >
          <Text style={[styles.tabBtnText, category === 'evening' && styles.tabBtnTextActive]}>
            🌇 أذكار المساء
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Tracker */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {language === 'ar'
              ? `الذكر ${currentIndex + 1} من ${currentList.length}`
              : `Dhikr ${currentIndex + 1} of ${currentList.length}`}
          </Text>
          <Text style={styles.progressFraction}>
            {doneItemsCount} / {currentList.length} مكتمل
          </Text>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${Math.round((doneItemsCount / currentList.length) * 100)}%` },
            ]}
          />
        </View>
      </View>

      {/* Main Content Area */}
      {isFinished ? (
        <View style={styles.finishCard}>
          <View style={styles.finishBadge}>
            <HomeIcon name="check" size={36} color={HomeColors.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.finishTitle}>
            {language === 'ar' ? 'تقبّل الله طاعتك يا بطل! 🌟' : 'May Allah accept your Dhikr! 🌟'}
          </Text>
          <Text style={styles.finishSubtitle}>
            {language === 'ar'
              ? 'تم تسجيل إتمام الأذكار في رحلة اليوم وإضافة +10 قناديل سراج ورصيد الخبرة.'
              : 'Athkar recorded in daily path! +10 Siraj candles & XP awarded.'}
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Home')}
            accessibilityRole="button"
            accessibilityLabel="العودة للرئيسية"
          >
            <Text style={styles.primaryBtnText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.cardScroll} contentContainerStyle={styles.cardContent}>
          {/* Dhikr Card */}
          <View style={styles.dhikrCard}>
            <Text style={styles.dhikrText}>{currentItem.text}</Text>

            {currentItem.benefit ? (
              <View style={styles.benefitBox}>
                <Text style={styles.benefitLabel}>💡 الفضل والأثر:</Text>
                <Text style={styles.benefitText}>{currentItem.benefit}</Text>
              </View>
            ) : null}

            <View style={styles.sourceBox}>
              <Text style={styles.sourceText}>📖 {currentItem.source}</Text>
              {currentItem.grade && (
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeText}>{currentItem.grade}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Large Tap Counter Button */}
          <TouchableOpacity
            style={[styles.tapCounterBtn, isCurrentDone && styles.tapCounterBtnDone]}
            onPress={handleTap}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`اضغط للتسبيح: ${currentCount} من ${targetCount}`}
          >
            <Text style={styles.tapCounterCount}>
              {currentCount} / {targetCount}
            </Text>
            <Text style={styles.tapCounterHint}>
              {isCurrentDone ? '✓ تم بحمد الله - اضغط للتالي' : 'المس في أي مكان للعد'}
            </Text>
          </TouchableOpacity>

          {/* Navigation controls between items */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.arrowBtn, currentIndex === 0 && styles.arrowBtnDisabled]}
              onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              accessibilityRole="button"
              accessibilityLabel="الذكر السابق"
            >
              <Text style={styles.arrowText}>السابق</Text>
            </TouchableOpacity>

            {/* End of list CTA: "أنهيت الأذكار" */}
            {allItemsDone || currentIndex === currentList.length - 1 ? (
              <TouchableOpacity
                style={styles.finishCtaBtn}
                onPress={handleFinishSession}
                accessibilityRole="button"
                accessibilityLabel="أنهيت الأذكار"
              >
                <Text style={styles.finishCtaText}>أنهيت الأذكار 🏁</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.arrowBtn}
                onPress={() => setCurrentIndex((prev) => Math.min(currentList.length - 1, prev + 1))}
                accessibilityRole="button"
                accessibilityLabel="الذكر التالي"
              >
                <Text style={styles.arrowText}>التالي</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Scholarly notice footer */}
          <View style={styles.reviewNotice}>
            <Text style={styles.reviewNoticeText}>
              🛡️ المصدر: حصن المسلم · بيانات قيد المراجعة الشرعية والتدقيق
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HomeColors.pageBg,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HomeSpacing.screenHorizontal,
    paddingVertical: 12,
  },
  backBtn: {
    minWidth: HomeSpacing.minTouchTarget,
    minHeight: HomeSpacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 22,
    color: HomeColors.primary,
  },
  screenTitle: {
    fontSize: HomeTypography.fontSize.greeting,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.text,
  },
  resetBtn: {
    minWidth: HomeSpacing.minTouchTarget,
    minHeight: HomeSpacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: HomeSpacing.screenHorizontal,
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    minHeight: HomeSpacing.minTouchTarget,
    borderRadius: HomeRadii.chip,
    backgroundColor: HomeColors.surface,
    borderWidth: 1,
    borderColor: HomeColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: HomeColors.primarySoft,
    borderColor: HomeColors.primary,
  },
  tabBtnText: {
    fontSize: HomeTypography.fontSize.task,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.textSecondary,
  },
  tabBtnTextActive: {
    color: HomeColors.primary,
    fontFamily: HomeTypography.fontFamily.semiBold,
  },
  progressContainer: {
    paddingHorizontal: HomeSpacing.screenHorizontal,
    gap: 6,
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: HomeTypography.fontSize.small,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.text,
  },
  progressFraction: {
    fontSize: HomeTypography.fontSize.small,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
  },
  track: {
    height: 6,
    backgroundColor: HomeColors.trackSoft,
    borderRadius: HomeRadii.progressBar,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: HomeColors.primary,
    borderRadius: HomeRadii.progressBar,
  },
  cardScroll: {
    flex: 1,
  },
  cardContent: {
    paddingHorizontal: HomeSpacing.screenHorizontal,
    gap: 16,
    paddingBottom: 24,
  },
  dhikrCard: {
    backgroundColor: HomeColors.surface,
    borderRadius: HomeRadii.card,
    borderWidth: 1,
    borderColor: HomeColors.border,
    padding: 20,
    gap: 14,
  },
  dhikrText: {
    fontSize: 18,
    lineHeight: 32,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.text,
    textAlign: 'center',
  },
  benefitBox: {
    backgroundColor: HomeColors.goldSoft,
    borderRadius: HomeRadii.button,
    padding: 12,
    gap: 4,
  },
  benefitLabel: {
    fontSize: HomeTypography.fontSize.tiny,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.goldText,
  },
  benefitText: {
    fontSize: HomeTypography.fontSize.small,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.goldText,
    lineHeight: 18,
  },
  sourceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  sourceText: {
    fontSize: HomeTypography.fontSize.tiny,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
    flex: 1,
  },
  gradeBadge: {
    backgroundColor: HomeColors.primarySoft,
    borderRadius: HomeRadii.tag,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  gradeText: {
    fontSize: HomeTypography.fontSize.tiny,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.primary,
  },
  tapCounterBtn: {
    backgroundColor: HomeColors.primary,
    borderRadius: HomeRadii.prayerCard,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: HomeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  tapCounterBtnDone: {
    backgroundColor: HomeColors.goldDeep,
  },
  tapCounterCount: {
    fontSize: 32,
    fontFamily: HomeTypography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  tapCounterHint: {
    fontSize: HomeTypography.fontSize.small,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.onPrimaryMuted,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  arrowBtn: {
    flex: 1,
    minHeight: HomeSpacing.minTouchTarget,
    backgroundColor: HomeColors.surface,
    borderWidth: 1,
    borderColor: HomeColors.border,
    borderRadius: HomeRadii.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowBtnDisabled: {
    opacity: 0.4,
  },
  arrowText: {
    fontSize: HomeTypography.fontSize.task,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.text,
  },
  finishCtaBtn: {
    flex: 1.5,
    minHeight: HomeSpacing.minTouchTarget,
    backgroundColor: HomeColors.primary,
    borderRadius: HomeRadii.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishCtaText: {
    fontSize: HomeTypography.fontSize.task,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: '#FFFFFF',
  },
  finishCard: {
    marginHorizontal: HomeSpacing.screenHorizontal,
    backgroundColor: HomeColors.surface,
    borderRadius: HomeRadii.card,
    borderWidth: 1,
    borderColor: HomeColors.border,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  },
  finishBadge: {
    width: 72,
    height: 72,
    borderRadius: HomeRadii.full,
    backgroundColor: HomeColors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishTitle: {
    fontSize: 20,
    fontFamily: HomeTypography.fontFamily.bold,
    color: HomeColors.text,
    textAlign: 'center',
  },
  finishSubtitle: {
    fontSize: HomeTypography.fontSize.task,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: HomeColors.primary,
    borderRadius: HomeRadii.button,
    paddingHorizontal: 24,
    minHeight: HomeSpacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: HomeTypography.fontSize.task,
    fontFamily: HomeTypography.fontFamily.semiBold,
  },
  reviewNotice: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  reviewNoticeText: {
    fontSize: HomeTypography.fontSize.tiny,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
    textAlign: 'center',
  },
});
