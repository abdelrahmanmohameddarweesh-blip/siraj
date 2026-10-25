import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface WeeklyLeagueCardProps {
  styles: any;
}

export function WeeklyLeagueCard({ styles }: WeeklyLeagueCardProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  return (
    <>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>
          {language === 'ar' ? 'دوري الفرسان الأسبوعي 🛡️' : 'Weekly Fursan League 🛡️'}
        </Text>
      </View>

      <View style={[styles.leagueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.leagueHeader}>
          <Text style={[styles.leagueTitleText, { color: colors.textPrimary }]}>
            {language === 'ar' ? 'المجموعات النشطة' : 'Active Divisions'}
          </Text>
          <Text style={[styles.leagueCountdownText, { color: colors.textSecondary }]}>
            ⏱️ {language === 'ar' ? 'ينتهي خلال: ٢ ي' : 'Ends in: 2d'}
          </Text>
        </View>

        {/* Bracket Standings list */}
        <View style={styles.bracketContainer}>
          <View style={styles.bracketNode}>
            <Text style={[styles.bracketPos, { color: colors.textSecondary }]}>1</Text>
            <Text style={[styles.bracketName, { color: colors.textPrimary }]}>Aisha R.</Text>
            <Text style={styles.bracketStatus}>🟢 {language === 'ar' ? 'صعود' : 'Promote'}</Text>
          </View>
          <View style={styles.bracketNode}>
            <Text style={[styles.bracketPos, { color: colors.textSecondary }]}>2</Text>
            <Text style={[styles.bracketName, { color: colors.textPrimary }]}>Zain B.</Text>
            <Text style={styles.bracketStatus}>🟢 {language === 'ar' ? 'صعود' : 'Promote'}</Text>
          </View>
          <View style={[styles.bracketNode, { backgroundColor: colors.primaryTint }]}>
            <Text style={[styles.bracketPos, { color: colors.primaryOnTint }]}>3</Text>
            <Text style={[styles.bracketName, { color: colors.textPrimary, fontWeight: '700' }]}>
              {language === 'ar' ? 'أنت' : 'You'}
            </Text>
            <Text style={[styles.bracketStatus, { color: colors.primaryOnTint }]}>🟢 {language === 'ar' ? 'صعود' : 'Promote'}</Text>
          </View>
          <View style={styles.bracketNode}>
            <Text style={[styles.bracketPos, { color: colors.textSecondary }]}>4</Text>
            <Text style={[styles.bracketName, { color: colors.textPrimary }]}>Sara K.</Text>
            <Text style={[styles.bracketStatus, { color: colors.textSecondary }]}>➖ {language === 'ar' ? 'ثابت' : 'Safe'}</Text>
          </View>
        </View>
      </View>
    </>
  );
}
