import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HomeColors, HomeRadii, HomeSpacing, HomeTypography } from '../../theme/tokens';
import { HomeIcon } from './HomeIcons';

interface HabitCardProps {
  hasActiveHabit: boolean;
  title: string;
  dayText: string;
  progressPercent: number;
  onPress: () => void;
  language: 'ar' | 'en';
}

export function HabitCard({
  hasActiveHabit,
  title,
  dayText,
  progressPercent,
  onPress,
  language,
}: HabitCardProps) {
  const emptyTitle = language === 'ar' ? 'ابدأ عادة جديدة' : 'Start a new habit';
  const emptyActionText = language === 'ar' ? 'استكشف العادات' : 'Explore habits';

  const clampedProgress = Math.max(0, Math.min(100, progressPercent));

  const a11yLabel = hasActiveHabit
    ? `${language === 'ar' ? 'العادة النشطة' : 'Active habit'}: ${title}، ${dayText}`
    : `${emptyTitle}، ${emptyActionText}`;

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      {/* 46x46 Icon box, radius 14, bg gold, icon color habitIconText, "target" icon 24px */}
      <View style={styles.iconBox}>
        <HomeIcon name="target" size={24} color={HomeColors.habitIconText} strokeWidth={1.8} />
      </View>

      {/* Text block (flex 1) */}
      <View style={styles.textBlock}>
        {hasActiveHabit ? (
          <>
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.dayText}>{dayText}</Text>
            {/* Bar: height 6, radius 3, track habitBorder, fill goldDeep */}
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${clampedProgress}%` }]} />
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.titleText}>{emptyTitle}</Text>
            <View style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>{emptyActionText}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: HomeColors.habitBg,
    borderWidth: 1,
    borderColor: HomeColors.habitBorder,
    borderRadius: HomeRadii.card,
    padding: 16,
    minHeight: 80,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: HomeRadii.habitIcon,
    backgroundColor: HomeColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
  },
  titleText: {
    fontSize: HomeTypography.fontSize.task,
    lineHeight: HomeTypography.lineHeight.task,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.text,
  },
  dayText: {
    fontSize: HomeTypography.fontSize.small,
    lineHeight: HomeTypography.lineHeight.small,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.habitText,
    marginTop: 2,
  },
  barTrack: {
    height: 6,
    borderRadius: HomeRadii.xpBar,
    backgroundColor: HomeColors.habitBorder,
    overflow: 'hidden',
    marginTop: 8,
    width: '100%',
  },
  barFill: {
    height: '100%',
    borderRadius: HomeRadii.xpBar,
    backgroundColor: HomeColors.goldDeep,
  },
  emptyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyButton: {
    backgroundColor: HomeColors.gold,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: HomeRadii.button,
    minHeight: HomeSpacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButtonText: {
    fontSize: HomeTypography.fontSize.small,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.habitIconText,
  },
});
