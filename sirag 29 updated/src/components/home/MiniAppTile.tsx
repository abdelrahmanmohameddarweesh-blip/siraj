import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HomeColors, HomeRadii, HomeSpacing, HomeTypography } from '../../theme/tokens';
import { MiniAppItem } from '../../apps/registry';
import { HomeIcon } from './HomeIcons';

interface MiniAppTileProps {
  item: MiniAppItem;
  onPress: (item: MiniAppItem) => void;
  language: 'ar' | 'en';
}

export function MiniAppTile({ item, onPress, language }: MiniAppTileProps) {
  const title = language === 'ar' ? item.titleAr : item.titleEn;
  const comingSoonText = language === 'ar' ? 'قريبًا' : 'Soon';

  const palette = HomeColors.tilePalettes[item.palette] || HomeColors.tilePalettes.green;

  const a11yLabel = item.enabled
    ? title
    : `${title}، ${comingSoonText}`;

  return (
    <TouchableOpacity
      style={styles.tileContainer}
      onPress={() => onPress(item)}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      {/* 54x54 Icon Box, radius 18 */}
      <View style={[styles.iconBox, { backgroundColor: palette.bg }]}>
        <HomeIcon
          name={item.icon}
          size={24}
          color={palette.icon}
          strokeWidth={1.8}
        />

        {/* Coming soon badge if not enabled */}
        {!item.enabled && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>{comingSoonText}</Text>
          </View>
        )}
      </View>

      {/* Label: 12px, color text */}
      <Text style={styles.tileLabel} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tileContainer: {
    width: '25%', // 4 columns grid
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: HomeSpacing.minTouchTarget,
    gap: 6,
    paddingVertical: 4,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: HomeRadii.tile,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -4,
    end: -4,
    backgroundColor: HomeColors.goldSoft,
    borderRadius: HomeRadii.tag,
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: HomeColors.gold,
  },
  comingSoonText: {
    fontSize: 9,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.goldText,
    includeFontPadding: false,
  },
  tileLabel: {
    fontSize: HomeTypography.fontSize.small,
    lineHeight: HomeTypography.lineHeight.small,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.text,
    textAlign: 'center',
  },
});
