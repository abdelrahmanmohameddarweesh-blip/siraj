import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePrayer } from '../../prayer/PrayerContext';
import { PRAYER_NAMES } from '../../prayer/prayerNotificationService';
import { formatPrayerClock } from '../../prayer/prayerTimesService';

interface DailyWorshipCardProps {
  onNavigateTracker: () => void;
  styles: any;
}

const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export function DailyWorshipCard({ onNavigateTracker, styles }: DailyWorshipCardProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const {
    todayTimes,
    windowInfo,
    checkins,
    isRestDayToday,
    location,
  } = usePrayer();

  const nextPrayerKey = windowInfo.nextPrayer;
  const nextPrayerName = nextPrayerKey
    ? (PRAYER_NAMES[nextPrayerKey]?.[language === 'ar' ? 'ar' : 'en'] || nextPrayerKey)
    : '';

  const activePrayerKey = windowInfo.activePrayer;

  const todayStr = todayTimes.dateStr;

  return (
    <>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>
          {language === 'ar' ? 'متابع العبادات اليومي 🕌' : 'Daily Worship Tracker 🕌'}
        </Text>
        <Text style={[localStyles.locationPill, { color: colors.textSecondary }]}>
          📍 {language === 'ar' ? location.cityNameAr : location.cityNameEn}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.trackerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onNavigateTracker}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={language === 'ar' ? 'متابع العبادات اليومي' : 'Daily Worship Tracker'}
      >
        <View style={styles.trackerCardContent}>
          <View style={styles.trackerCardHeaderRow}>
            <View style={styles.trackerBadge}>
              <Text style={styles.trackerBadgeText}>
                {isRestDayToday
                  ? (language === 'ar' ? 'يوم راحة مبارك 🌿' : 'Rest Day 🌿')
                  : (language === 'ar' ? 'مواقيت الصلاة الدقيقة ⏱️' : 'Accurate Offline Prayer Times ⏱️')}
              </Text>
            </View>
            <Text style={{ fontSize: 26 }}>🕌</Text>
          </View>

          {/* Next Prayer Banner */}
          {nextPrayerKey && (
            <View style={[localStyles.nextPrayerBanner, { backgroundColor: colors.primaryLight || '#E6F4EA' }]}>
              <Text style={[localStyles.nextPrayerTitle, { color: colors.primaryDeep || '#0B4F44' }]}>
                {language === 'ar'
                  ? `الصلاة القادمة: ${nextPrayerName}`
                  : `Next Prayer: ${nextPrayerName}`}
              </Text>
              <Text style={[localStyles.nextPrayerTime, { color: colors.primary }]}>
                {windowInfo.timeRemainingFormatted}
              </Text>
            </View>
          )}

          {/* 5 Prayers Times Strip */}
          <View style={localStyles.prayersStrip}>
            {PRAYER_KEYS.map((key) => {
              const prayerTime = todayTimes[key];
              const timeFormatted = prayerTime ? formatPrayerClock(prayerTime, language === 'ar' ? 'ar' : 'en') : '--:--';
              const name = PRAYER_NAMES[key]?.[language === 'ar' ? 'ar' : 'en'] || key;
              const checkinRecord = checkins[`${key}_${todayStr}`];
              const isCheckedIn = !!checkinRecord;
              const isActive = activePrayerKey === key;

              return (
                <View
                  key={key}
                  style={[
                    localStyles.prayerPill,
                    {
                      backgroundColor: isActive ? (colors.accentLight || '#FEF3C7') : colors.surface || '#F9FAFB',
                      borderColor: isActive ? (colors.accent || '#F59E0B') : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      localStyles.prayerPillName,
                      { color: isActive ? (colors.accentDark || '#B45309') : colors.textPrimary },
                    ]}
                  >
                    {name}
                  </Text>
                  <Text style={[localStyles.prayerPillTime, { color: colors.textSecondary }]}>
                    {timeFormatted}
                  </Text>
                  <Text style={localStyles.prayerStatusDot}>
                    {isCheckedIn ? '✅' : isActive ? '⏳' : '○'}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.trackerFeaturesRow}>
            <View style={[styles.trackerFeatureChip, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.trackerFeatureText, { color: colors.primary }]}>🕌 حساب دقيق بدون إنترنت</Text>
            </View>
            <View style={[styles.trackerFeatureChip, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.trackerFeatureText, { color: colors.accent }]}>✨ تفقد وتوثيق الصلوات</Text>
            </View>
          </View>

          <View style={[styles.trackerCTA, { backgroundColor: colors.primaryDeep }]}>
            <Text style={styles.trackerCTAText}>
              {language === 'ar' ? 'افتح جدول الصلاة والتفقد ←' : 'Open Prayer Tracker & Check-in →'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
}

const localStyles = StyleSheet.create({
  locationPill: {
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  nextPrayerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  nextPrayerTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  nextPrayerTime: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  prayersStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginVertical: 10,
  },
  prayerPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerPillName: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 2,
  },
  prayerPillTime: {
    fontSize: 9,
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginBottom: 2,
  },
  prayerStatusDot: {
    fontSize: 10,
    marginTop: 2,
  },
});
