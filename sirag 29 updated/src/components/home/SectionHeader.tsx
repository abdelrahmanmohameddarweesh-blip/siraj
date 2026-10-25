import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HomeColors, HomeSpacing, HomeTypography } from '../../theme/tokens';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onPressAction?: () => void;
  language: 'ar' | 'en';
}

export function SectionHeader({
  title,
  actionText,
  onPressAction,
  language,
}: SectionHeaderProps) {
  const defaultActionText = actionText || (language === 'ar' ? 'عرض الكل' : 'View all');

  return (
    <View style={styles.headerRow}>
      <Text style={styles.titleText}>{title}</Text>

      {onPressAction && (
        <TouchableOpacity
          onPress={onPressAction}
          activeOpacity={0.7}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={`${title}، ${defaultActionText}`}
        >
          <Text style={styles.actionText}>{defaultActionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 2,
    minHeight: 28,
  },
  titleText: {
    fontSize: HomeTypography.fontSize.sectionTitle,
    lineHeight: HomeTypography.lineHeight.sectionTitle,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.text,
  },
  actionBtn: {
    minHeight: HomeSpacing.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: HomeTypography.fontSize.small,
    lineHeight: HomeTypography.lineHeight.small,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
  },
});
