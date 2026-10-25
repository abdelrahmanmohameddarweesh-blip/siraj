import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface ChampionshipHeroCardProps {
  onNavigateChampionship: () => void;
  styles: any;
}

export function ChampionshipHeroCard({ onNavigateChampionship, styles }: ChampionshipHeroCardProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  return (
    <View style={[styles.dailyChampionshipCard, { backgroundColor: colors.primaryDeep }]}>
      {/* Custom vector backdrop matching mock-up */}
      <View style={styles.dailyChampVectors}>
        <Svg viewBox="0 0 160 160" width="160" height="160" opacity="0.12">
          <Circle cx="80" cy="80" r="70" fill="none" stroke={colors.white} strokeWidth="2" />
          <Circle cx="80" cy="80" r="50" fill="none" stroke={colors.white} strokeWidth="2" />
          <Line x1="10" y1="80" x2="150" y2="80" stroke={colors.white} strokeWidth="2" />
          <Line x1="80" y1="10" x2="80" y2="150" stroke={colors.white} strokeWidth="2" />
          <Path d="M30,30 Q80,80 130,30" fill="none" stroke={colors.white} strokeWidth="2" />
          <Path d="M30,130 Q80,80 130,130" fill="none" stroke={colors.white} strokeWidth="2" />
        </Svg>
      </View>

      <View style={styles.dailyChampionshipContent}>
        <Text style={styles.dailyChampBadge}>🏆 {language === 'ar' ? 'البطولة اليومية الموحدة' : 'Daily Championship'}</Text>
        <Text style={styles.dailyChampTitle}>
          {language === 'ar' ? 'تحدي اليوم: السيرة النبوية الكبرى' : 'Today: Sirah of the Prophet'}
        </Text>
        <Text style={styles.dailyChampMeta}>
          ⏱️ {language === 'ar' ? 'ينتهي خلال: 04س 22د' : 'Ends in: 04h 22m'} · 🟢 {language === 'ar' ? '1.8 ألف يلعبون الآن' : '1.8k Active'}
        </Text>

        <TouchableOpacity
          style={styles.dailyChampCTA}
          onPress={onNavigateChampionship}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'شارك في البطولة اليومية' : 'Join Daily Championship'}
        >
          <Text style={styles.dailyChampCTAText}>
            {language === 'ar' ? 'شارك الآن ←' : 'Participate Now →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
