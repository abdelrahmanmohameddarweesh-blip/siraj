import CinematicQuestBanner from '../components/CinematicQuestBanner';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Dimensions,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

interface PlayerRanking {
  id: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  isBot?: boolean;
}

export default function GroupQuizResultsScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);

  const { roomId, rankings: initialRankings, settings, initialPlayers } = route.params || {};

  // Find current user's position
  const isLocalUser = (name: string) => name.includes('(أنت)');
  const localPlayerIndex = initialRankings.findIndex((p: any) => isLocalUser(p.name));
  const myRank = localPlayerIndex !== -1 ? localPlayerIndex + 1 : 4;
  const myScore = localPlayerIndex !== -1 ? initialRankings[localPlayerIndex].score : 0;

  // Group Admin checks
  const isAdmin = initialPlayers?.some((p: any) => p.id === 'admin-user' && p.name.includes('أنت'));

  // Separate podium ranks
  const firstPlace = initialRankings[0] || null;
  const secondPlace = initialRankings[1] || null;
  const thirdPlace = initialRankings[2] || null;
  const remainingPlayers = initialRankings.slice(3);

  const handleShareResult = async () => {
    let rankText = language === 'ar' ? `المركز رقم ${myRank}` : `Rank #${myRank}`;
    if (myRank === 1) rankText = language === 'ar' ? 'المركز الأول 🏆' : '1st Place 🏆';

    const shareMessage =
      language === 'ar'
        ? `🕌 لقد شاركت في مسابقة جماعية ضمن تطبيق "بطل مسلم"! \n✨ حققت ${rankText} بمجموع نقاط ${myScore} نقطة في مجال ${settings.category}!\nحمل التطبيق وانضم للمنافسة!`
        : `🕌 I just competed in a group quiz on "Batl Muslim" app! \n✨ I got ${rankText} with a score of ${myScore} pts in ${settings.category}!\nDownload the app and challenge me!`;

    try {
      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.warn('Share failed:', error);
    }
  };

  const handleBackToLobby = () => {
    // Return all players back to the waiting screen, resetting ready flags
    const cleanPlayersList = initialPlayers.map((p: any) => ({
      ...p,
      isReady: p.id === 'admin-user' ? true : false, // Admin stays ready
    }));

    navigation.navigate('GroupQuizWaiting', {
      roomId,
      isAdmin,
      initialSettings: settings,
      overridePlayers: cleanPlayersList,
    });
  };

  const handleChangeSettings = () => {
    // Only available for Host
    navigation.navigate('GroupQuizLobby');
  };

  const handleKickPlayer = (id: string, name: string) => {
    // Admin can remove players from room post-game
    Alert.alert(
      language === 'ar' ? 'طرد لاعب' : 'Kick Player',
      language === 'ar' ? `هل تريد استبعاد اللاعب ${name} من الغرفة للجولة القادمة؟` : `Do you want to exclude ${name} from the room for the next round?`,
      [
        { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ar' ? 'استبعاد' : 'Kick',
          style: 'destructive',
          onPress: () => {
            // Filter player out from lobby lists
            const updatedLobbyPlayers = initialPlayers.filter((p: any) => p.id !== id);
            navigation.navigate('GroupQuizWaiting', {
              roomId,
              isAdmin,
              initialSettings: settings,
              overridePlayers: updatedLobbyPlayers,
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Custom Title Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('HomeTabs', { screen: 'ArenaHub' })}
          style={styles.backBtn}
        >
          <Text style={{ fontSize: 20, color: colors.primaryDeep }}>➔</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'منصة التتويج والنتائج 🏆' : 'Podium & Standings 🏆'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <CinematicQuestBanner chapter={14} icon="🏆" titleAr="قاعة الأبطال" titleEn="Hall of Heroes" descriptionAr="احتفل بجهدك واكتشف ترتيبك في المنافسة" descriptionEn="Celebrate your effort and explore the standings" compact />
        {/* Dynamic congratulations badge */}
        <View style={styles.congratulationsCard}>
          <Text style={styles.congratsTitle}>
            {myRank === 1
              ? (language === 'ar' ? '🏆 تهانينا الحارة يا بطل!' : '🏆 Pure Victory, Hero!')
              : (language === 'ar' ? '💪 أداء رائع ومنافسة شريفة!' : '💪 Great Effort!')}
          </Text>
          <Text style={styles.congratsDesc}>
            {myRank === 1
              ? (language === 'ar'
                  ? 'لقد حققت المركز الأول في ميدان المنافسة الجماعية بجدارة وإتقان. مستوى علمي متميز!'
                  : 'You achieved 1st place in the multiplayer arena. Truly outstanding knowledge!')
              : (language === 'ar'
                  ? `لقد أنهيت التحدي بالترتيب رقم ${myRank} بمجموع ${myScore} نقطة. استمر في المراجعة لتتوج بطلاً للجولة القادمة!`
                  : `You finished at Rank #${myRank} with ${myScore} pts. Keep practicing to claim the crown next time!`)}
          </Text>
        </View>

        {/* Visual Pedestal Podium */}
        <View style={styles.podiumContainer}>
          {/* 2nd Place Pedestal */}
          {secondPlace && (
            <View style={styles.pedestalCol}>
              <View style={styles.avatarWrapper}>
                <Text style={{ fontSize: 26 }}>{secondPlace.avatar}</Text>
                <Text style={styles.medalBadge}>🥈</Text>
              </View>
              <Text style={styles.pedestalName} numberOfLines={1}>{secondPlace.name.replace(' (أنت)', '')}</Text>
              <Text style={styles.pedestalPoints}>{secondPlace.score} {language === 'ar' ? 'نقطة' : 'pts'}</Text>
              <View style={[styles.pedestalBlock, styles.pedestalSilver]}>
                <Text style={styles.pedestalRankText}>2</Text>
              </View>
            </View>
          )}

          {/* 1st Place Pedestal (Center, elevated) */}
          {firstPlace && (
            <View style={[styles.pedestalCol, { marginTop: -20 }]}>
              <View style={styles.avatarWrapper}>
                <Text style={{ fontSize: 32 }}>{firstPlace.avatar}</Text>
                <Text style={styles.medalBadgeGold}>👑</Text>
              </View>
              <Text style={[styles.pedestalName, { fontWeight: '800' }]} numberOfLines={1}>
                {firstPlace.name.replace(' (أنت)', '')}
              </Text>
              <Text style={styles.pedestalPoints}>{firstPlace.score} {language === 'ar' ? 'نقطة' : 'pts'}</Text>
              <View style={[styles.pedestalBlock, styles.pedestalGold]}>
                <Text style={styles.pedestalRankText}>1</Text>
              </View>
            </View>
          )}

          {/* 3rd Place Pedestal */}
          {thirdPlace && (
            <View style={styles.pedestalCol}>
              <View style={styles.avatarWrapper}>
                <Text style={{ fontSize: 24 }}>{thirdPlace.avatar}</Text>
                <Text style={styles.medalBadge}>🥉</Text>
              </View>
              <Text style={styles.pedestalName} numberOfLines={1}>{thirdPlace.name.replace(' (أنت)', '')}</Text>
              <Text style={styles.pedestalPoints}>{thirdPlace.score} {language === 'ar' ? 'نقطة' : 'pts'}</Text>
              <View style={[styles.pedestalBlock, styles.pedestalBronze]}>
                <Text style={styles.pedestalRankText}>3</Text>
              </View>
            </View>
          )}
        </View>

        {/* Standings list title */}
        <Text style={styles.standingsTitle}>
          {language === 'ar' ? '📋 الترتيب التفصيلي للمشاركين:' : '📋 Detailed Standings:'}
        </Text>

        {/* Scrollable detailed list */}
        <View style={styles.standingsList}>
          {initialRankings.map((player: any, index: number) => {
            const isLocal = player.id === 'local-user' || player.id === 'admin-user';
            return (
              <View key={player.id} style={[styles.standingCard, isLocal && { borderColor: colors.primaryDeep, borderWidth: 1.5 }]}>
                <View style={styles.standingCardLeft}>
                  <Text style={styles.standingScore}>{player.score} {language === 'ar' ? 'نقطة' : 'pts'}</Text>
                  
                  {/* Admin Kick player post-game */}
                  {isAdmin && !player.isAdmin && (
                    <TouchableOpacity
                      onPress={() => handleKickPlayer(player.id, player.name)}
                      style={styles.kickBtn}
                    >
                      <Text style={styles.kickBtnText}>{language === 'ar' ? 'استبعاد' : 'Kick'}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.standingCardRight}>
                  <Text style={styles.standingRank}>#{index + 1}</Text>
                  <View style={styles.standingAvatarCircle}>
                    <Text style={{ fontSize: 20 }}>{player.avatar}</Text>
                  </View>
                  <Text style={styles.standingPlayerName}>{player.name}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Interactive Bottom Actions Bar */}
      <View style={styles.actionsBar}>
        {/* Row 1: Back to Lobby (Main Action) */}
        <TouchableOpacity
          onPress={handleBackToLobby}
          style={styles.backLobbyBtn}
          activeOpacity={0.9}
        >
          <Text style={styles.backLobbyBtnText}>➔</Text>
        </TouchableOpacity>

        {/* Row 2: Secondary buttons */}
        <View style={styles.secondaryActionsRow}>
          {isAdmin ? (
            <TouchableOpacity
              onPress={handleChangeSettings}
              style={styles.settingsBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.settingsBtnText}>
                {language === 'ar' ? '⚙️ تغيير الإعدادات' : '⚙️ Adjust Settings'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('HomeTabs', { screen: 'ArenaHub' })}
              style={[styles.settingsBtn, { backgroundColor: '#E5E7EB' }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.settingsBtnText, { color: colors.textPrimary }]}>
                {language === 'ar' ? '🚪 مغادرة الغرفة' : '🚪 Leave Room'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleShareResult}
            style={styles.shareBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.shareBtnText}>
              {language === 'ar' ? '📢 مشاركة النتيجة' : '📢 Share Victory'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDeep,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 180,
  },
  congratulationsCard: {
    backgroundColor: '#E6F4EA',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1E8D9',
    marginBottom: 24,
  },
  congratsTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#137333',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginBottom: 6,
  },
  congratsDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#137333',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 180,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  pedestalCol: {
    flex: 1,
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
    marginBottom: 6,
  },
  medalBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    fontSize: 14,
  },
  medalBadgeGold: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    fontSize: 18,
  },
  pedestalName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    width: '90%',
    textAlign: 'center',
    marginBottom: 2,
  },
  pedestalPoints: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDeep,
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 4,
  },
  pedestalBlock: {
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  pedestalGold: {
    height: 70,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  pedestalSilver: {
    height: 50,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
  },
  pedestalBronze: {
    height: 40,
    backgroundColor: '#FFEDD5',
    borderWidth: 1.5,
    borderColor: '#D97706',
  },
  pedestalRankText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textSecondary,
  },
  standingsTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginBottom: 12,
  },
  standingsList: {
    gap: 8,
  },
  standingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  standingCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  standingScore: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDeep,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  kickBtn: {
    backgroundColor: '#FCE8E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  kickBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C5221F',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  standingCardRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  standingRank: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  standingAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  standingPlayerName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  actionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  backLobbyBtn: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  backLobbyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  settingsBtn: {
    flex: 1,
    backgroundColor: '#FFF8E6',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  settingsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B8860B',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
});
