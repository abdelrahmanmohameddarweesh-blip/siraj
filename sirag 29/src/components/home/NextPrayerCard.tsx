import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { HomeColors, HomeRadii, HomeSpacing, HomeTypography } from '../../theme/tokens';
import { HomePrayerItem } from '../../hooks/useHomeData';
import { PrayerDot } from './PrayerDot';

interface NextPrayerCardProps {
  nextPrayerName: string;
  countdown: string;
  cityName: string;
  methodName: string;
  isLocationGranted: boolean;
  prayers: HomePrayerItem[];
  onPressCard: () => void;
  onPressPrayer: (id: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') => void;
  onPressSelectCity?: () => void;
  language: 'ar' | 'en';
}

export function NextPrayerCard({
  nextPrayerName,
  countdown,
  cityName,
  methodName,
  isLocationGranted,
  prayers,
  onPressCard,
  onPressPrayer,
  onPressSelectCity,
  language,
}: NextPrayerCardProps) {
  const orderedPrayers = (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const)
    .map(id => prayers.find(prayer => prayer.id === id))
    .filter((prayer): prayer is HomePrayerItem => Boolean(prayer));
  const nextPrayerLabel = language === 'ar' ? 'الصلاة القادمة' : 'Next Prayer';
  const locationSubtitle = `${cityName} · ${methodName}`;
  const selectCityPrompt = language === 'ar' ? 'حدّد مدينتك 📍' : 'Set your city 📍';

  const cardA11yLabel = language === 'ar'
    ? `بطاقة مواقيت الصلاة: الصلاة القادمة ${nextPrayerName} بعد ${countdown}. ${locationSubtitle}`
    : `Prayer times card: Next prayer is ${nextPrayerName} in ${countdown}. ${locationSubtitle}`;

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPressCard}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={cardA11yLabel}
    >
      {/* Top Row */}
      <View style={styles.topRow}>
        {/* Start / Right Block: Label + Prayer Name */}
        <View style={styles.prayerTitleBlock}>
          <Text style={styles.nextPrayerLabel}>{nextPrayerLabel}</Text>
          <Text style={styles.prayerNameHeading}>{nextPrayerName}</Text>
        </View>

        {/* End / Left Block: Countdown + City/Method */}
        <View style={styles.countdownBlock}>
          <Text
            style={styles.countdownText}
            accessibilityLiveRegion="none"
            accessibilityLabel={`${language === 'ar' ? 'الوقت المتبقي' : 'Time remaining'}: ${countdown}`}
          >
            {countdown}
          </Text>

          {!isLocationGranted && onPressSelectCity ? (
            <TouchableOpacity
              style={styles.cityPromptBtn}
              onPress={onPressSelectCity}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={selectCityPrompt}
            >
              <Text style={styles.cityPromptText}>{selectCityPrompt}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.locationSubtitleText} numberOfLines={1}>
              {locationSubtitle}
            </Text>
          )}
        </View>
      </View>

      {/* 1px Divider */}
      <View style={styles.divider} />

      {/* Prayers Row: 5 equal columns in RTL order */}
      <View style={[styles.prayersRow, { flexDirection: language === 'ar' ? 'row-reverse' : 'row' }]}>
        {orderedPrayers.map((p) => (
          <PrayerDot
            key={p.id}
            prayer={p}
            onPress={onPressPrayer}
            language={language}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: HomeColors.primary,
    borderRadius: HomeRadii.prayerCard,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: 'column',
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  prayerTitleBlock: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  nextPrayerLabel: {
    fontSize: HomeTypography.fontSize.small,
    lineHeight: HomeTypography.lineHeight.small,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.onPrimaryMuted,
  },
  prayerNameHeading: {
    fontSize: HomeTypography.fontSize.prayerName,
    lineHeight: HomeTypography.lineHeight.prayerName,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.textWhite,
    marginTop: 2,
  },
  countdownBlock: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  countdownText: {
    fontSize: HomeTypography.fontSize.countdown,
    lineHeight: HomeTypography.lineHeight.countdown,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.gold,
    letterSpacing: 1,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    ...Platform.select({
      ios: { fontVariant: ['tabular-nums'] },
      android: { includeFontPadding: false },
    }),
  },
  locationSubtitleText: {
    fontSize: HomeTypography.fontSize.small,
    lineHeight: HomeTypography.lineHeight.small,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.onPrimaryMuted,
    marginTop: 2,
    textAlign: 'right',
  },
  cityPromptBtn: {
    marginTop: 2,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: HomeRadii.tag,
    backgroundColor: HomeColors.goldSoft,
  },
  cityPromptText: {
    fontSize: HomeTypography.fontSize.tiny,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.goldText,
  },
  divider: {
    height: 1,
    backgroundColor: HomeColors.primaryDivider,
    marginHorizontal: -2,
  },
  prayersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 0,
  },
});
