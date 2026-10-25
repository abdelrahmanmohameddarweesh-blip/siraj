import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HomeColors, HomeRadii, HomeSpacing, HomeTypography } from '../../theme/tokens';
import { HomeIcon } from './HomeIcons';

interface HomeHeaderProps {
  userName: string;
  avatarLetter: string;
  level: number;
  levelTitle: string;
  xpPercent: number;
  streakDays: number;
  points: number;
  onPressProfile: () => void;
  language: 'ar' | 'en';
}

export function HomeHeader({
  userName,
  avatarLetter,
  level,
  levelTitle,
  xpPercent,
  streakDays,
  points,
  onPressProfile,
  language,
}: HomeHeaderProps) {
  const greetingText = language === 'ar' ? `السلام عليكم، ${userName}` : `Salam, ${userName}`;
  const levelText = language === 'ar' ? `المستوى ${level} · ${levelTitle}` : `Level ${level} · ${levelTitle}`;
  const streakA11y = language === 'ar' ? `سلسلة ${streakDays} يومًا متتاليًا` : `Streak: ${streakDays} days`;
  const pointsA11y = language === 'ar' ? `رصيد ${points} نقطة سراج` : `Points: ${points} Siraj points`;
  const profileA11y = language === 'ar' ? 'الملف الشخصي' : 'Profile';

  // Constrain XP bar fill (0 to 100%)
  const clampedXp = Math.max(0, Math.min(100, xpPercent));

  return (
    <View style={styles.headerRow}>
      {/* (a) Avatar */}
      <TouchableOpacity
        style={styles.avatarTouch}
        onPress={onPressProfile}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={profileA11y}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
      </TouchableOpacity>

      {/* (b) Middle Block: Greeting & Level/XP */}
      <TouchableOpacity
        style={styles.middleBlock}
        onPress={onPressProfile}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${greetingText}. ${levelText}`}
      >
        <Text style={styles.greetingText} numberOfLines={1}>
          {greetingText}
        </Text>

        <View style={styles.levelRow}>
          <Text style={styles.levelText} numberOfLines={1}>
            {levelText}
          </Text>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${clampedXp}%` }]} />
          </View>
        </View>
      </TouchableOpacity>

      {/* (c) Streak Chip */}
      <TouchableOpacity
        style={styles.streakChip}
        onPress={onPressProfile}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={streakA11y}
      >
        <HomeIcon name="flame" size={16} color={HomeColors.streakText} strokeWidth={2} />
        <Text style={styles.streakText}>{streakDays}</Text>
      </TouchableOpacity>

      {/* (d) Points Chip */}
      <TouchableOpacity
        style={styles.pointsChip}
        onPress={onPressProfile}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={pointsA11y}
      >
        <HomeIcon name="bolt" size={16} color={HomeColors.goldText} strokeWidth={2} />
        <Text style={styles.pointsText}>{points}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarTouch: {
    minWidth: 46,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: HomeRadii.full,
    backgroundColor: HomeColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: HomeColors.gold,
    fontSize: HomeTypography.fontSize.avatarText,
    fontFamily: HomeTypography.fontFamily.semiBold,
    includeFontPadding: false,
    textAlign: 'center',
  },
  middleBlock: {
    flex: 1,
    minHeight: HomeSpacing.minTouchTarget,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: HomeTypography.fontSize.greeting,
    lineHeight: HomeTypography.lineHeight.greeting,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.text,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  levelText: {
    fontSize: HomeTypography.fontSize.small,
    lineHeight: HomeTypography.lineHeight.small,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.textSecondary,
  },
  xpTrack: {
    width: 56,
    height: 5,
    borderRadius: HomeRadii.xpBar,
    backgroundColor: HomeColors.track,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: HomeRadii.xpBar,
    backgroundColor: HomeColors.primary,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: HomeColors.streakBg,
    borderRadius: HomeRadii.chip,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: HomeSpacing.minTouchTarget,
  },
  streakText: {
    fontSize: 13,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.streakText,
    includeFontPadding: false,
  },
  pointsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: HomeColors.goldSoft,
    borderRadius: HomeRadii.chip,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: HomeSpacing.minTouchTarget,
  },
  pointsText: {
    fontSize: 13,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.goldText,
    includeFontPadding: false,
  },
});
