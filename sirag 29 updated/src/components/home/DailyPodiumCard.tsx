import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Colors } from '../../config/colors';

export const PODIUM_WINNERS = [
  { rank: 2, name: 'عبد الله', nameEn: 'Abdullah', score: '95', time: '14ث', timeEn: '14s', medal: '2', color: Colors.medalSilver },
  { rank: 1, name: 'يوسف أ.', nameEn: 'Yusuf A.', score: '98', time: '12ث', timeEn: '12s', medal: '1', color: Colors.medalGold, isWinner: true },
  { rank: 3, name: 'فاطمة', nameEn: 'Fatima', score: '92', time: '15ث', timeEn: '15s', medal: '3', color: Colors.medalBronze },
];

interface DailyPodiumCardProps {
  styles: any;
}

export function DailyPodiumCard({ styles }: DailyPodiumCardProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  return (
    <>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>
          {language === 'ar' ? 'منصة تتويج الأمس 🏆' : "Yesterday's Daily Podium 🏆"}
        </Text>
      </View>

      <View style={styles.podiumContainer}>
        {PODIUM_WINNERS.map((winner, idx) => (
          <View
            key={idx}
            style={[
              styles.podiumCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              winner.isWinner && { borderColor: colors.medalGold, borderWidth: 2, transform: [{ scale: 1.04 }] },
            ]}
          >
            {/* Crown/Medal Custom SVG instead of emojis for better alignment */}
            <View style={styles.medalIconWrapper}>
              {winner.rank === 1 ? (
                <Svg width="22" height="22" viewBox="0 0 24 24" fill={colors.medalGold}>
                  <Path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 14h14v2H5v-2z" />
                </Svg>
              ) : (
                <Svg width="18" height="18" viewBox="0 0 24 24" fill={winner.rank === 2 ? colors.medalSilver : colors.medalBronze}>
                  <Circle cx="12" cy="12" r="10" />
                  <Path d="M12 7l1.5 3.5H17l-3 2.5 1 4-3-2.5-3 2.5 1-4-3-2.5h3.5L12 7z" fill={colors.white} />
                </Svg>
              )}
            </View>

            <View style={[styles.podiumAvatar, { backgroundColor: winner.isWinner ? colors.primaryTint : colors.neutralTint }]}>
              <Text style={styles.podiumAvatarEmoji}>{winner.rank === 1 ? '🧔' : winner.rank === 2 ? '👨' : '👩'}</Text>
            </View>
            <Text style={[styles.podiumName, { color: colors.textPrimary }]}>
              {language === 'ar' ? winner.name : winner.nameEn}
            </Text>
            <Text style={[styles.podiumPlaceLabel, { color: colors.textSecondary }]}>
              {winner.rank === 1
                ? language === 'ar' ? 'المركز الأول' : '1st Place'
                : winner.rank === 2
                  ? language === 'ar' ? 'المركز الثاني' : '2nd Place'
                  : language === 'ar' ? 'المركز الثالث' : '3rd Place'}
            </Text>
            <Text style={[styles.podiumScoreText, { color: colors.primaryDeep }]}>
              {winner.score} {language === 'ar' ? 'نقطة' : 'pts'}
            </Text>
            <Text style={[styles.podiumTimeText, { color: colors.textSecondary }]}>
              ⏱️ {language === 'ar' ? winner.time : winner.timeEn}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}
