import CinematicJourneyPanel from '../components/CinematicJourneyPanel';
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllPlayers, getCurrentUserProfile } from '../firebase/auth';
import AdBanner from '../components/AdBanner';
import { LoadingState, EmptyState, ErrorState } from '../components/StateView';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../config/colors';

const getFlagEmoji = (code?: string) => {
  if (!code) return '🌍';
  switch (code) {
    case 'EG': return '🇪🇬';
    case 'SA': return '🇸🇦';
    case 'JO': return '🇯🇴';
    case 'PS': return '🇵🇸';
    case 'AE': return '🇦🇪';
    case 'MA': return '🇲🇦';
    default: return '🌍';
  }
};

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'worldwide' | 'country'>('worldwide');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const topPlayers = await getAllPlayers();
      setAllPlayers(topPlayers);

      if (user?.uid) {
        const profile = await getCurrentUserProfile(user.uid);
        setCurrentUserProfile(profile);
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError(
        language === 'ar'
          ? 'تعذر تحميل قائمة المتصدرين. يرجى التحقق من الاتصال والمحاولة مرة أخرى.'
          : 'Could not load leaderboard. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const filteredPlayers = useMemo(() => {
    if (filterMode === 'worldwide') {
      return allPlayers.slice(0, 10);
    }
    const code = currentUserProfile?.countryCode;
    if (!code) return [];
    return allPlayers.filter((p) => p.countryCode === code).slice(0, 10);
  }, [allPlayers, filterMode, currentUserProfile]);

  const firstPlace = filteredPlayers[0] || null;
  const secondPlace = filteredPlayers[1] || null;
  const thirdPlace = filteredPlayers[2] || null;
  const remainingPlayers = filteredPlayers.slice(3);

  const hasCountryCode = !!currentUserProfile?.countryCode;

  return (
    <View style={styles.container}>
      <CinematicJourneyPanel titleAr="مجلس الأبطال" titleEn="Hall of Heroes" subtitleAr="كل خطوة في التعلم تستحق الاحتفاء، تابع ترتيب الأبطال" subtitleEn="Celebrate learning milestones and discover the hero rankings" icon="★" compact />
      {/* Worldwide vs. Country Filter Selector */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, filterMode === 'worldwide' && styles.tabBtnActive]}
          onPress={() => setFilterMode('worldwide')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, filterMode === 'worldwide' && styles.tabBtnTextActive]}>
            {t('worldwide')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, filterMode === 'country' && styles.tabBtnActive]}
          onPress={() => setFilterMode('country')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, filterMode === 'country' && styles.tabBtnTextActive]}>
            {t('localCountry')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={loadData} disabled={loading} activeOpacity={0.85}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.surface} />
        ) : (
          <Text style={styles.refreshButtonText}>
            {language === 'ar' ? 'تحديث الترتيب 🔄' : 'Refresh Leaderboard 🔄'}
          </Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingState message={language === 'ar' ? 'جارٍ تحميل المتصدرين...' : 'Loading leaderboard...'} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : filterMode === 'country' && !hasCountryCode ? (
          <View style={styles.warningContainer}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <Text style={styles.warningText}>
              {language === 'ar'
                ? 'الرجاء تحديد دولتك من صفحة الملف الشخصي لتفعيل الترتيب المحلي لرؤية منافسيك في نفس البلد!'
                : 'Please select your country in the Profile screen to activate the local leaderboard and see rivals in your country!'}
            </Text>
          </View>
        ) : filteredPlayers.length === 0 ? (
          <EmptyState
            icon="🌱"
            title={language === 'ar' ? 'لا توجد نتائج بعد' : 'No Scores Yet'}
            description={
              language === 'ar'
                ? 'لا توجد نتائج في لوحة الصدارة هذه بعد. كن البطل الأول وابدأ اللعب!'
                : 'No scores in this leaderboard yet. Be the first hero and start playing!'
            }
          />
        ) : (
          <>
            {/* Top 3 Podium Section */}
            <View style={styles.podiumContainer}>
              {/* 2nd Place (Left) */}
              <View style={[styles.podiumCol, styles.podiumColSide]}>
                <View style={[styles.avatarFrame, styles.avatarSilver]}>
                  <Text style={styles.avatarEmoji}>🥈</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {secondPlace ? secondPlace.displayName : 'شاغر'} {secondPlace && getFlagEmoji(secondPlace.countryCode)}
                </Text>
                <Text style={styles.podiumScore}>
                  {secondPlace ? `${secondPlace.score} ن` : '-'}
                </Text>
                <View style={[styles.podiumBar, styles.barSilver]}>
                  <Text style={styles.podiumRankText}>٢</Text>
                </View>
              </View>

              {/* 1st Place (Center - Elevated) */}
              <View style={[styles.podiumCol, styles.podiumColCenter]}>
                <View style={[styles.avatarFrame, styles.avatarGold]}>
                  <Text style={styles.avatarEmoji}>🏆</Text>
                </View>
                <Text style={[styles.podiumName, styles.podiumNameGold]} numberOfLines={1}>
                  {firstPlace ? firstPlace.displayName : 'شاغر'} {firstPlace && getFlagEmoji(firstPlace.countryCode)}
                </Text>
                <Text style={styles.podiumScoreGold}>
                  {firstPlace ? `${firstPlace.score} ن` : '-'}
                </Text>
                <View style={[styles.podiumBar, styles.barGold]}>
                  <Text style={styles.podiumRankTextGold}>١</Text>
                </View>
              </View>

              {/* 3rd Place (Right) */}
              <View style={[styles.podiumCol, styles.podiumColSide]}>
                <View style={[styles.avatarFrame, styles.avatarBronze]}>
                  <Text style={styles.avatarEmoji}>🥉</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {thirdPlace ? thirdPlace.displayName : 'شاغر'} {thirdPlace && getFlagEmoji(thirdPlace.countryCode)}
                </Text>
                <Text style={styles.podiumScore}>
                  {thirdPlace ? `${thirdPlace.score} ن` : '-'}
                </Text>
                <View style={[styles.podiumBar, styles.barBronze]}>
                  <Text style={styles.podiumRankText}>٣</Text>
                </View>
              </View>
            </View>

            {/* Remaining Players List */}
            {remainingPlayers.length > 0 && (
              <View style={styles.listContainer}>
                {remainingPlayers.map((player, index) => (
                  <View key={player.uid} style={styles.playerRow}>
                    <Text style={styles.playerScore}>{player.score ?? 0} {language === 'ar' ? 'نقطة' : 'Pts'}</Text>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>
                        {player.displayName || 'ضيف'} {getFlagEmoji(player.countryCode)}
                      </Text>
                      <Text style={styles.playerRankHint}>
                        {language === 'ar' ? `الترتيب #${index + 4}` : `Rank #${index + 4}`}
                      </Text>
                    </View>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>{index + 4}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
      <View style={styles.adWrapper}>
        <AdBanner />
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutralTint,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.surface,
    fontWeight: '900',
  },
  warningContainer: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  warningEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 30,
  },
  podiumContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  podiumCol: {
    alignItems: 'center',
    flex: 1,
  },
  podiumColSide: {
    marginTop: 20,
  },
  podiumColCenter: {
    zIndex: 1,
  },
  avatarFrame: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  avatarGold: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderColor: colors.medalGold,
    backgroundColor: colors.accentLight,
  },
  avatarSilver: {
    borderColor: colors.medalSilver,
    backgroundColor: colors.neutralTint,
  },
  avatarBronze: {
    borderColor: colors.medalBronze,
    backgroundColor: colors.accentTint,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
    width: 80,
  },
  podiumNameGold: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '800',
  },
  podiumScore: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  podiumScoreGold: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '800',
    marginBottom: 8,
  },
  podiumBar: {
    width: '80%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barGold: {
    height: 60,
    backgroundColor: colors.accentLight,
    borderWidth: 1.5,
    borderColor: colors.medalGold,
  },
  barSilver: {
    height: 45,
    backgroundColor: colors.neutralTint,
    borderWidth: 1.5,
    borderColor: colors.medalSilver,
  },
  barBronze: {
    height: 35,
    backgroundColor: colors.accentTint,
    borderWidth: 1.5,
    borderColor: colors.medalBronze,
  },
  podiumRankText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  podiumRankTextGold: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.accentDeep,
  },
  listContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.background,
    paddingHorizontal: 8,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  playerScore: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  playerInfo: {
    flex: 1,
    marginRight: 12,
  },
  playerRankHint: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  adWrapper: {
    marginTop: 12,
  },
});
