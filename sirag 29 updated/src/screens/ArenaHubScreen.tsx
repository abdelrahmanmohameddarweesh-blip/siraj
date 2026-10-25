import ChallengeProgressDashboard from '../components/ChallengeProgressDashboard';
import CinematicPortal from '../components/CinematicPortal';
import JourneyPassport from '../components/JourneyPassport';
import CinematicSectionHeader from '../components/CinematicSectionHeader';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { challenges, Challenge } from '../data/challenges';
import { getCurrentUserProfile } from '../firebase/auth';
import LeaderboardScreen from './LeaderboardScreen';
import { useGuestPreferences } from '../hooks/useGuestPreferences';

const { width } = Dimensions.get('window');

// Svg outline icons inside challenge list
function ChallengeIcon({ id, color }: { id: string; color: string }) {
  const strokeColor = color;
  
  if (id === 'voice-challenge') {
    // Mic outline
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
      </Svg>
    );
  }
  if (id === 'hadith') {
    // Message/Chat outline
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </Svg>
    );
  }
  if (id === 'knowledge') {
    // Scroll / Page / Trivia
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <Path d="M14 2v6h6" />
      </Svg>
    );
  }
  if (id === 'quran-assessment') {
    // Book open outline
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </Svg>
    );
  }
  if (id === 'finish-ayah-camera') {
    // Camera outline icon
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <Circle cx="12" cy="13" r="4" />
      </Svg>
    );
  }
  if (id === 'finish-ayah') {
    // Headphones / Audio outline
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </Svg>
    );
  }
  // mutashabihat puzzle/grid outline
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11.75 3v18M3 11.75h18" />
      <Circle cx="12" cy="12" r="9" />
    </Svg>
  );
}

export default function ArenaHubScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { user } = useAuth();
  const preferences = useGuestPreferences();

  const [activeTab, setActiveTab] = useState<'individual' | 'duels' | 'leaderboard'>('individual');
  const [profile, setProfile] = useState<any>(null);

  // Animation spring wallet values
  const walletScale = useRef(new Animated.Value(1)).current;

  // Load user profile details
  const loadProfile = async () => {
    if (user?.uid) {
      try {
        const data = await getCurrentUserProfile(user.uid);
        setProfile(data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.uid]);

  const getDifficultyStyles = (diff: string) => {
    switch (diff) {
      case 'سهل':
        return { bg: '#ECFDF5', text: '#00604F' };
      case 'متوسط':
        return { bg: '#FFF7ED', text: '#973C00' };
      case 'متقدم':
        return { bg: '#FEF2F2', text: '#9F0712' };
      default: // 'بطل'
        return { bg: '#FAF5FF', text: '#6E11B0' };
    }
  };

  const getCategoryThemeColor = (route: string) => {
    if (['Voice', 'QuranAssessment', 'Mutashabihat'].includes(route)) {
      return '#1C64F2'; // Quran sanctuary blue
    }
    return '#D97706'; // Knowledge gold
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Header with custom title & Siraj Wallet */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {language === 'ar' ? 'ميدان المنافسة ⚔️' : 'Competition Arena ⚔️'}
          </Text>
        </View>

        <Animated.View style={[styles.walletBadge, { backgroundColor: colors.primaryLight, transform: [{ scale: walletScale }] }]}>
          <Text style={{ fontSize: 16, marginRight: 4 }}>🕯️</Text>
          <Text style={[styles.walletText, { color: colors.primary }]}>
            {profile?.sirajBalance ?? 50}
          </Text>
        </Animated.View>
      </View>

      {/* 2. Arena Sub Tabs navigation */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'individual' && { borderBottomColor: colors.primaryDeep }]}
          onPress={() => setActiveTab('individual')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'individual' && styles.tabTextActive, { color: activeTab === 'individual' ? colors.primaryDeep : colors.textSecondary }]}>
            {language === 'ar' ? 'مسابقات فردية 🎯' : 'Solo Quizzes 🎯'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'duels' && { borderBottomColor: colors.primaryDeep }]}
          onPress={() => setActiveTab('duels')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'duels' && styles.tabTextActive, { color: activeTab === 'duels' ? colors.primaryDeep : colors.textSecondary }]}>
            {language === 'ar' ? 'مبارزات جماعية ⚔️' : 'Group Duels ⚔️'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'leaderboard' && { borderBottomColor: colors.primaryDeep }]}
          onPress={() => setActiveTab('leaderboard')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive, { color: activeTab === 'leaderboard' ? colors.primaryDeep : colors.textSecondary }]}>
            {language === 'ar' ? 'لوحة الصدارة 🏆' : 'Leaderboard 🏆'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Main Content Container */}
      {activeTab === 'leaderboard' ? (
        // Directly embed Leaderboard component
        <View style={{ flex: 1 }}>
          <LeaderboardScreen />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <JourneyPassport navigation={navigation} compact />
        {activeTab === 'individual' && <ChallengeProgressDashboard navigation={navigation} />}
        <View style={{ marginHorizontal: 16, marginTop: 10 }}>
          <CinematicPortal scene="arena" title={language === 'ar' ? 'ميدان المعرفة' : 'Knowledge Arena'} eyebrow={language === 'ar' ? 'تحديات · منافسات · إنجازات' : 'CHALLENGES · DUELS · ACHIEVEMENTS'} subtitle={language === 'ar' ? 'اختبر معرفتك في ألعاب تنافسية؛ ورحلات القرآن والسيرة مستقلة للتعلّم.' : 'Compete in knowledge games; Quran and Sirah journeys remain dedicated to learning.'} />
        </View>

          
          {activeTab === 'individual' && preferences.focus === 'quran' && (
            <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('QuranJourney')}
              style={{ backgroundColor: '#0B4F44', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#B8801F' }}>
              <Text style={{ color: '#F2C66D', fontWeight: '700', fontSize: 12, textAlign: language === 'ar' ? 'right' : 'left' }}>
                {language === 'ar' ? '✦ مقترح لك حسب هدفك' : '✦ Recommended for your goal'}
              </Text>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 19, marginTop: 7, textAlign: language === 'ar' ? 'right' : 'left' }}>
                {language === 'ar' ? 'تعلّم القرآن خطوة بخطوة' : 'Learn Quran step by step'}
              </Text>
              <Text style={{ color: '#D8EBE5', fontSize: 13, marginTop: 6, textAlign: language === 'ar' ? 'right' : 'left' }}>
                {language === 'ar' ? 'اقرأ آيات الفاتحة وافهمها وراجع حفظك.' : 'Read Al-Fatiha, understand its meaning and review your recall.'}
              </Text>
            </TouchableOpacity>
          )}
          {/* TAB 1: INDIVIDUAL CHALLENGES (Moved from GrowScreen) */}
          {activeTab === 'individual' && (
            <View style={styles.challengesList}>
              {challenges.map((item) => {
                const diffStyles = getDifficultyStyles(item.difficulty);
                const themeColor = getCategoryThemeColor(item.route);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => navigation.navigate(item.route)}
                    style={[styles.challengeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    activeOpacity={0.85}
                  >
                    {/* Trailing Points Column */}
                    <View style={styles.pointsCol}>
                      <Text style={[styles.pointsVal, { color: colors.accentDeep }]}>
                        +{item.points}
                      </Text>
                      <Text style={[styles.pointsLabel, { color: colors.textTertiary }]}>
                        {language === 'ar' ? 'نقطة' : 'XP'}
                      </Text>
                    </View>

                    {/* Main Info Area */}
                    <View style={styles.cardInfoContainer}>
                      <View style={styles.cardHeaderRow}>
                        <View style={[styles.difficultyBadge, { backgroundColor: diffStyles.bg }]}>
                          <Text style={[styles.difficultyText, { color: diffStyles.text }]}>
                            {item.difficulty}
                          </Text>
                        </View>
                        <Text style={[styles.challengeTitle, { color: colors.textPrimary }]}>
                          {item.title}
                        </Text>
                      </View>
                      <Text style={[styles.challengeDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    </View>

                    {/* Icon Tile */}
                    <View style={[styles.iconTile, { backgroundColor: item.color, borderColor: 'rgba(0,0,0,0.03)' }]}>
                      <ChallengeIcon id={item.id} color={themeColor} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* TAB 2: MULTIPLAYER DUELS */}
          {activeTab === 'duels' && (
            <View style={styles.duelsList}>
              {/* Box 1: 1v1 Live Trivia Duel */}
              <TouchableOpacity
                style={[styles.duelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('LiveDuel')}
                activeOpacity={0.85}
              >
                <View style={[styles.duelIconWrapper, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={styles.duelIcon}>⚔️</Text>
                </View>
                <View style={styles.duelInfo}>
                  <Text style={[styles.duelTitle, { color: colors.textPrimary }]}>
                    {language === 'ar' ? 'المبارزة المباشرة 1 ضد 1' : '1v1 Live Speed Duel'}
                  </Text>
                  <Text style={[styles.duelDesc, { color: colors.textSecondary }]}>
                    {language === 'ar'
                      ? 'مواجهة فورية وسريعة للإجابة على الأسئلة الإسلامية في أسرع وقت ضد بطل آخر.'
                      : 'A fast-paced, real-time quiz face-off against a peer.'}
                  </Text>
                </View>
                <Text style={[styles.arrow, { color: colors.primaryDeep }]}>➔</Text>
              </TouchableOpacity>

              {/* Box 2: Group Quizzes */}
              <TouchableOpacity
                style={[styles.duelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('GroupQuizLobby')}
                activeOpacity={0.85}
              >
                <View style={[styles.duelIconWrapper, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={styles.duelIcon}>👥</Text>
                </View>
                <View style={styles.duelInfo}>
                  <Text style={[styles.duelTitle, { color: colors.textPrimary }]}>
                    {language === 'ar' ? 'المسابقات الجماعية وغرف الانتظار' : 'Group Quizzes & Waiting Rooms'}
                  </Text>
                  <Text style={[styles.duelDesc, { color: colors.textSecondary }]}>
                    {language === 'ar'
                      ? 'أنشئ غرفة اختبار جماعية مخصصة، اختر تصنيف الأسئلة، ونافس أصدقاءك في تحدٍ جماعي.'
                      : 'Create a custom group quiz room, invite friends, and compete live!'}
                  </Text>
                </View>
                <Text style={[styles.arrow, { color: colors.primaryDeep }]}>➔</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      )}

      {/* 4. Sticky Ad placement at bottom */}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  walletText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
    height: 50,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  tabTextActive: {
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  challengesList: {
    gap: 12,
  },
  challengeCard: {
    flexDirection: 'row-reverse',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  cardInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  difficultyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    marginRight: 6,
  },
  difficultyText: {
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  challengeDesc: {
    fontSize: 11.5,
    textAlign: 'right',
    lineHeight: 16,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  pointsCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    marginRight: 8,
  },
  pointsVal: {
    fontSize: 14,
    fontWeight: '700',
    writingDirection: 'ltr',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  pointsLabel: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  duelsList: {
    gap: 16,
  },
  duelCard: {
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  duelIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  duelIcon: {
    fontSize: 26,
  },
  duelInfo: {
    flex: 1,
  },
  duelTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  duelDesc: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'IBMPlexSansArabic-Regular',
    textAlign: 'right',
  },
  arrow: {
    fontSize: 16,
    marginRight: 10,
  },
});
