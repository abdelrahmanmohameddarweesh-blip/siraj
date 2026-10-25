import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HomeColors, HomeRadii, HomeSpacing, HomeTypography } from '../../theme/tokens';
import { HomePrayerItem } from '../../hooks/useHomeData';
import { HomeIcon } from './HomeIcons';

interface PrayerDotProps {
  prayer: HomePrayerItem;
  onPress: (id: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') => void;
  language: 'ar' | 'en';
}

export function PrayerDot({ prayer, onPress, language }: PrayerDotProps) {
  const isNext = prayer.state === 'next';
  const isDone = prayer.state === 'done';
  const isMissedButOpen = prayer.state === 'missed-but-open';
  const name = language === 'ar' ? prayer.nameAr : prayer.nameEn;

  const stateA11yText = isDone
    ? (language === 'ar' ? 'تمت' : 'Completed')
    : isNext
    ? (language === 'ar' ? 'الصلاة القادمة' : 'Next Prayer')
    : isMissedButOpen
    ? (language === 'ar' ? 'فاتت وبانتظار التوثيق' : 'Pending check-in')
    : (language === 'ar' ? 'قادمة' : 'Upcoming');

  const accessibilityLabel = `${name}، الساعة ${prayer.timeFormatted}، ${stateA11yText}`;

  return (
    <TouchableOpacity
      style={styles.touchColumn}
      onPress={() => onPress(prayer.id)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View
        style={[
          styles.circle,
          isDone && styles.circleDone,
          isNext && styles.circleNext,
          !isDone && !isNext && styles.circleUpcoming,
        ]}
      >
        {isDone && (
          <HomeIcon name="check" size={16} color={HomeColors.textWhite} strokeWidth={2.5} />
        )}
        {isNext && (
          <HomeIcon name="bell" size={16} color={HomeColors.primary} strokeWidth={2.2} />
        )}
        {isMissedButOpen && (
          <View style={styles.goldDot} />
        )}
      </View>

      <Text
        style={[
          styles.prayerNameText,
          isNext ? styles.prayerNameNext : styles.prayerNameMuted,
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>

      <Text
        style={[
          styles.prayerTimeText,
          isNext ? styles.prayerTimeNext : styles.prayerTimeMuted,
        ]}
        numberOfLines={1}
      >
        {prayer.timeFormatted}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchColumn: {
    flex: 1,
    minHeight: HomeSpacing.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: HomeRadii.full,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circleDone: {
    backgroundColor: HomeColors.prayerCircleDone,
  },
  circleNext: {
    backgroundColor: HomeColors.gold,
  },
  circleUpcoming: {
    backgroundColor: HomeColors.transparent,
    borderWidth: 1.5,
    borderColor: HomeColors.prayerCircleUpcomingBorder,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: HomeRadii.full,
    backgroundColor: HomeColors.gold,
    position: 'absolute',
    top: 3,
    end: 3,
  },
  prayerNameText: {
    fontSize: HomeTypography.fontSize.tiny,
    lineHeight: HomeTypography.lineHeight.tiny,
    textAlign: 'center',
  },
  prayerNameNext: {
    color: HomeColors.textWhite,
    fontFamily: HomeTypography.fontFamily.semiBold,
  },
  prayerNameMuted: {
    color: HomeColors.onPrimaryMuted,
    fontFamily: HomeTypography.fontFamily.medium,
  },
  prayerTimeText: {
    fontSize: HomeTypography.fontSize.tiny,
    lineHeight: HomeTypography.lineHeight.tiny,
    textAlign: 'center',
    marginTop: 1,
  },
  prayerTimeNext: {
    color: HomeColors.textWhite,
    fontFamily: HomeTypography.fontFamily.semiBold,
  },
  prayerTimeMuted: {
    color: HomeColors.onPrimaryMuted,
    fontFamily: HomeTypography.fontFamily.regular,
  },
});
