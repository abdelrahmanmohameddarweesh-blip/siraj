import CinematicJourneyPanel from '../../components/CinematicJourneyPanel';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeColors, HomeRadii, HomeSpacing, HomeTypography } from '../../theme/tokens';
import { useLanguage } from '../../contexts/LanguageContext';
import { useHero } from '../../hero/HeroContext';
import { usePrayer } from '../../prayer/PrayerContext';
import { toHijri, evaluateFasting, FastingEvaluation } from './hijriEngine';
import {
  getFastingSettings,
  saveFastingSettings,
  FastingSettings,
  scheduleFastingReminderForTomorrow,
} from './fastingNotificationService';
import { HomeIcon } from '../../components/home/HomeIcons';

export function FastingScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { events, dispatchEvent } = useHero();
  const { todayTimes } = usePrayer();

  const [settings, setSettings] = useState<FastingSettings | null>(null);
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  // Load settings & check today's checkin status
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const s = await getFastingSettings();
        setSettings(s);

        const done = events.some((e) => e.type === 'fast_done' && (e.meta?.dateStr === todayStr || e.at.startsWith(todayStr)));
        setIsCheckedInToday(done);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [events, todayStr]);

  const hijriToday = useMemo(() => {
    return toHijri(today, settings?.hijriAdjustment ?? 0);
  }, [today, settings?.hijriAdjustment]);

  const todayEval: FastingEvaluation = useMemo(() => {
    return evaluateFasting(today, settings?.hijriAdjustment ?? 0);
  }, [today, settings?.hijriAdjustment]);

  // Upcoming 14-day schedule of fasting days
  const upcomingSchedule = useMemo(() => {
    const list = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const h = toHijri(d, settings?.hijriAdjustment ?? 0);
      const ev = evaluateFasting(d, settings?.hijriAdjustment ?? 0);
      if (ev.suggestFasting || ev.isForbidden) {
        list.push({ date: d, hijri: h, eval: ev });
      }
    }
    return list;
  }, [settings?.hijriAdjustment]);

  // Handle Check-in
  const handleCheckin = useCallback(async () => {
    if (todayEval.isForbidden) {
      Alert.alert(
        language === 'ar' ? 'تنبيه شرعي' : 'Ruling Notice',
        todayEval.forbiddenReasonAr || 'لا يشرع الصيام في هذا اليوم'
      );
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    await dispatchEvent('fast_done', 'fasting_screen', 1, {
      dateStr: todayStr,
      hijriDay: hijriToday.day,
      hijriMonth: hijriToday.month,
      reason: todayEval.reasonAr || 'صيام تطوع',
    });

    setIsCheckedInToday(true);
  }, [todayEval, language, dispatchEvent, todayStr, hijriToday]);

  const handleAdjustmentChange = async (adj: number) => {
    if (!settings) return;
    const updated = await saveFastingSettings({ hijriAdjustment: adj });
    setSettings(updated);
  };

  const handleToggleReminder = async (key: keyof FastingSettings, val: boolean) => {
    if (!settings) return;
    const updated = await saveFastingSettings({ [key]: val });
    setSettings(updated);
    if (val && todayTimes?.fajr) {
      scheduleFastingReminderForTomorrow(todayTimes.fajr);
    }
  };

  if (loading || !settings) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={HomeColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'رجوع' : 'Back'}
        >
          <Text style={styles.backBtnText}>➔</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{language === 'ar' ? 'الصيام والتاريخ الهجري 🌙' : 'Fasting & Hijri 🌙'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <CinematicJourneyPanel titleAr="رحلة الصيام" titleEn="Your Fasting Journey" subtitleAr="تابع أيام الصيام والتاريخ الهجري في مساحة واحدة" subtitleEn="Track fasting days and the Hijri calendar in one place" icon="☾" compact />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hijri Date Display Banner */}
        <View style={styles.dateBanner}>
          <Text style={styles.hijriDateText}>
            {hijriToday.day} {hijriToday.monthNameAr} {hijriToday.year} هـ
          </Text>
          <Text style={styles.gregorianDateText}>
            {today.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Today's Status & Check-in Card */}
        <View style={[styles.todayCard, todayEval.isForbidden && styles.todayCardForbidden]}>
          <View style={styles.statusRow}>
            <View style={styles.statusIconBox}>
              <HomeIcon
                name={todayEval.isForbidden ? 'bell' : 'calendar'}
                size={24}
                color={todayEval.isForbidden ? '#DC2626' : HomeColors.primary}
              />
            </View>
            <View style={styles.statusCol}>
              <Text style={styles.statusTitle}>
                {todayEval.isForbidden
                  ? todayEval.forbiddenReasonAr
                  : todayEval.suggestFasting
                  ? todayEval.reasonAr
                  : 'اليوم ليس من أيام الصيام المسنونة'}
              </Text>
              <Text style={styles.statusSub}>
                {todayEval.isForbidden
                  ? 'نهى النبي ﷺ عن صيام هذا اليوم'
                  : todayEval.suggestFasting
                  ? 'صيام مبارك بنيّة صالحة، يرفع في ميزان حسناتك'
                  : 'يمكنك صيام التطوع المطلق أو قضاء ما عليك'}
              </Text>
            </View>
          </View>

          {/* Check-in Button */}
          {!todayEval.isForbidden && (
            <TouchableOpacity
              style={[styles.checkinBtn, isCheckedInToday && styles.checkinBtnDone]}
              onPress={handleCheckin}
              disabled={isCheckedInToday}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={isCheckedInToday ? 'تم تسجيل الصيام اليوم' : 'سجّل صيامك اليوم'}
            >
              <Text style={styles.checkinBtnText}>
                {isCheckedInToday ? '✓ تم تسجيل صيامك اليوم (+15 سراج)' : 'سجّل صيام اليوم (+15 قنديل سراج)'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hijri Adjustment Control */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ضبط تقويم أم القرى والرؤية 🔭</Text>
          <Text style={styles.sectionSubtitle}>
            نظراً لاختلاف ثبوت رؤية الهلال بين البلدان، يمكنك تعديل التاريخ الهجري بيوم واحد:
          </Text>
          <View style={styles.adjRow}>
            {[-1, 0, 1].map((adj) => {
              const isSelected = settings.hijriAdjustment === adj;
              const label = adj === 0 ? 'تلقائي (أم القرى)' : adj === 1 ? '+1 يوم' : '-1 يوم';
              return (
                <TouchableOpacity
                  key={adj}
                  style={[styles.adjBtn, isSelected && styles.adjBtnActive]}
                  onPress={() => handleAdjustmentChange(adj)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <Text style={[styles.adjBtnText, isSelected && styles.adjBtnTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Fasting Notification Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>تنبيهات صيام التطوع 🔔</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchLabel}>تذكير ليلة الصيام (مساءً)</Text>
              <Text style={styles.switchSub}>إشعار في الثامنة والنصف مساءً لعقد النية</Text>
            </View>
            <Switch
              value={settings.eveningReminderEnabled}
              onValueChange={(v) => handleToggleReminder('eveningReminderEnabled', v)}
              trackColor={{ false: HomeColors.trackSoft, true: HomeColors.primarySoft }}
              thumbColor={settings.eveningReminderEnabled ? HomeColors.primary : HomeColors.border}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchLabel}>تنبيه وقت السحور 🥛</Text>
              <Text style={styles.switchSub}>إشعار قبل أذان الفجر بـ 50 دقيقة لتناول السحور</Text>
            </View>
            <Switch
              value={settings.suhoorReminderEnabled}
              onValueChange={(v) => handleToggleReminder('suhoorReminderEnabled', v)}
              trackColor={{ false: HomeColors.trackSoft, true: HomeColors.primarySoft }}
              thumbColor={settings.suhoorReminderEnabled ? HomeColors.primary : HomeColors.border}
            />
          </View>
        </View>

        {/* Upcoming Fasting Days */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>الأيام القادمة للصيام 📅</Text>
          <View style={styles.scheduleList}>
            {upcomingSchedule.map((item, index) => {
              const dayName = item.date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                weekday: 'long',
                month: 'numeric',
                day: 'numeric',
              });
              return (
                <View key={index} style={styles.scheduleRow}>
                  <View style={styles.scheduleCol}>
                    <Text style={styles.scheduleDate}>{dayName}</Text>
                    <Text style={styles.scheduleHijri}>
                      {item.hijri.day} {item.hijri.monthNameAr}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.reasonBadge,
                      item.eval.isForbidden ? styles.reasonBadgeForbidden : styles.reasonBadgeSunnah,
                    ]}
                  >
                    <Text
                      style={[
                        styles.reasonBadgeText,
                        item.eval.isForbidden && { color: '#DC2626' },
                      ]}
                    >
                      {item.eval.isForbidden ? 'محرم صومه (تشريق/عيد)' : item.eval.reasonAr}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: HomeSpacing.screenHorizontal,
    gap: 14,
    paddingBottom: 24,
  },
  dateBanner: {
    backgroundColor: HomeColors.primary,
    borderRadius: HomeRadii.card,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  hijriDateText: {
    fontSize: 24,
    fontFamily: HomeTypography.fontFamily.bold,
    color: HomeColors.gold,
  },
  gregorianDateText: {
    fontSize: HomeTypography.fontSize.small,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.onPrimaryMuted,
  },
  todayCard: {
    backgroundColor: HomeColors.surface,
    borderRadius: HomeRadii.card,
    borderWidth: 1,
    borderColor: HomeColors.border,
    padding: 18,
    gap: 16,
  },
  todayCardForbidden: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusIconBox: {
    width: 44,
    height: 44,
    borderRadius: HomeRadii.full,
    backgroundColor: HomeColors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCol: {
    flex: 1,
    gap: 4,
  },
  statusTitle: {
    fontSize: HomeTypography.fontSize.task,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.text,
  },
  statusSub: {
    fontSize: HomeTypography.fontSize.small,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
    lineHeight: 18,
  },
  checkinBtn: {
    backgroundColor: HomeColors.primary,
    borderRadius: HomeRadii.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: HomeSpacing.minTouchTarget,
  },
  checkinBtnDone: {
    backgroundColor: HomeColors.primarySoft,
  },
  checkinBtnText: {
    color: '#FFFFFF',
    fontSize: HomeTypography.fontSize.task,
    fontFamily: HomeTypography.fontFamily.semiBold,
  },
  sectionCard: {
    backgroundColor: HomeColors.surface,
    borderRadius: HomeRadii.card,
    borderWidth: 1,
    borderColor: HomeColors.border,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    fontSize: HomeTypography.fontSize.sectionTitle,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.text,
  },
  sectionSubtitle: {
    fontSize: HomeTypography.fontSize.small,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
    lineHeight: 18,
  },
  adjRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  adjBtn: {
    flex: 1,
    minHeight: HomeSpacing.minTouchTarget,
    borderRadius: HomeRadii.button,
    backgroundColor: HomeColors.pageBg,
    borderWidth: 1,
    borderColor: HomeColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjBtnActive: {
    backgroundColor: HomeColors.primarySoft,
    borderColor: HomeColors.primary,
  },
  adjBtnText: {
    fontSize: HomeTypography.fontSize.small,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.textSecondary,
  },
  adjBtnTextActive: {
    color: HomeColors.primary,
    fontFamily: HomeTypography.fontFamily.semiBold,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  switchCol: {
    flex: 1,
    gap: 2,
  },
  switchLabel: {
    fontSize: HomeTypography.fontSize.task,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.text,
  },
  switchSub: {
    fontSize: HomeTypography.fontSize.tiny,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: HomeColors.border,
  },
  scheduleList: {
    gap: 10,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: HomeColors.border,
  },
  scheduleCol: {
    gap: 2,
  },
  scheduleDate: {
    fontSize: HomeTypography.fontSize.task,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.text,
  },
  scheduleHijri: {
    fontSize: HomeTypography.fontSize.tiny,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
  },
  reasonBadge: {
    borderRadius: HomeRadii.tag,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reasonBadgeSunnah: {
    backgroundColor: HomeColors.primarySoft,
  },
  reasonBadgeForbidden: {
    backgroundColor: '#FEE2E2',
  },
  reasonBadgeText: {
    fontSize: HomeTypography.fontSize.tiny,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.primary,
  },
});
