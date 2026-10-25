import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface ChallengerProfileCardProps {
  user: any;
  currentLevel: number;
  currentXP: number;
  targetXP: number;
  streakDays: number;
  challengesPlayed: number;
  challengesWon: number;
  localRank: number;
  globalRank: number;
  styles: any;
}

export function ChallengerProfileCard({
  user,
  currentLevel,
  currentXP,
  targetXP,
  streakDays,
  challengesPlayed,
  challengesWon,
  localRank,
  globalRank,
  styles,
}: ChallengerProfileCardProps) {
  const { colors } = useTheme();
  const { language, formatNumber } = useLanguage();

  return (
    <View style={[styles.unifiedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.unifiedHeaderRow}>
        {/* Avatar with golden glowing ring */}
        <View style={[styles.avatarCircleFrame, { borderColor: colors.medalGold, overflow: 'hidden' }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primaryTint }]}>
            {user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={{ width: 44, height: 44, borderRadius: 22 }} />
            ) : (
              <Text style={styles.avatarEmoji}>🧔</Text>
            )}
          </View>
        </View>

        <View style={styles.unifiedNameCol}>
          <Text style={[styles.unifiedNameText, { color: colors.textPrimary }]}>
            {user?.displayName || (language === 'ar' ? 'المنافس البطل' : 'Challenger Hero')}
          </Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakFlameIcon}>🔥</Text>
            <Text style={styles.streakText}>
              {formatNumber(streakDays)} {language === 'ar' ? 'يوم متتالي' : 'Day Streak'}
            </Text>
          </View>
        </View>

        <View style={styles.leagueBadgeContainer}>
          <Text style={styles.leagueLabel}>{language === 'ar' ? 'النخبة' : 'Gold III'}</Text>
          <Text style={styles.leagueMedal}>🏆</Text>
        </View>
      </View>

      {/* Level Progress Gauge */}
      <View style={styles.levelGaugeContainer}>
        <View style={styles.levelProgressLabelRow}>
          <Text style={[styles.levelProgressLabel, { color: colors.textSecondary }]}>
            {language === 'ar' ? `المستوى ${formatNumber(currentLevel)}` : `Level ${currentLevel}`}
          </Text>
          <Text style={[styles.levelProgressValue, { color: colors.textPrimary }]}>
            {formatNumber(currentXP)} / {formatNumber(targetXP)} XP
          </Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
          <View style={[styles.progressBarFill, { width: `${(currentXP / targetXP) * 100}%`, backgroundColor: colors.primary }]} />
        </View>
      </View>

      {/* 4 Stats Grid with border cells */}
      <View style={[styles.statsGridRow, { borderTopColor: colors.border }]}>
        <View style={[styles.statBox, styles.statBoxRightBorder, { borderRightColor: colors.border }]}>
          <Text style={styles.statEmoji}>🛡️</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatNumber(challengesPlayed)}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{language === 'ar' ? 'التحديات' : 'Played'}</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxRightBorder, { borderRightColor: colors.border }]}>
          <Text style={styles.statEmoji}>🏆</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatNumber(challengesWon)}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{language === 'ar' ? 'الفوز' : 'Wins'}</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxRightBorder, { borderRightColor: colors.border }]}>
          <Text style={styles.statEmoji}>📍</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>#{formatNumber(localRank)}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{language === 'ar' ? 'المحلي' : 'Local Rank'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>🌐</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>#{formatNumber(globalRank)}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{language === 'ar' ? 'العالمي' : 'Global Rank'}</Text>
        </View>
      </View>
    </View>
  );
}
