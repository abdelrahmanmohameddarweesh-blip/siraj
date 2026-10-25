import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = SCREEN_WIDTH * 0.78;
export const CARD_GAP = 12;

export const getHomeStyles = (colors: any) => StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 56,
    gap: 18,
  },
  onboardingBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginVertical: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  onboardingBannerContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  onboardingIconBg: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  onboardingTextCol: {
    flex: 1,
    marginEnd: 12,
    alignItems: 'flex-end',
  },
  onboardingTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  onboardingDescText: {
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'right',
  },
  topHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  greetingCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  greetingLabelText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  profileNameText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sirajHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
  },
  sirajHeaderValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 50,
    backgroundColor: colors.medalGold,
    borderWidth: 2,
  },
  dateTextLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  
  // UNIFIED CARD
  unifiedCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  unifiedHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarCircleFrame: {
    width: 52,
    height: 52,
    borderRadius: 99,
    borderWidth: 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  unifiedNameCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  unifiedNameText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  streakBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  streakFlameIcon: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 10.5,
    color: colors.accentDeep,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  leagueBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  leagueLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.accent,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  leagueMedal: {
    fontSize: 20,
  },
  levelGaugeContainer: {
    width: '100%',
    marginBottom: 16,
  },
  levelProgressLabelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  levelProgressLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  levelProgressValue: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    writingDirection: 'ltr',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 99,
  },
  statsGridRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 14,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statBoxRightBorder: {
    borderRightWidth: 1,
  },
  statEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginTop: 1,
  },

  // SECTION HEADER
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    marginTop: 4,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },

  // PODIUM
  podiumContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    height: 165,
    marginTop: 6,
  },
  podiumCard: {
    width: '31%',
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
    height: 142,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  medalIconWrapper: {
    position: 'absolute',
    top: -12,
    zIndex: 1,
  },
  podiumAvatar: {
    width: 34,
    height: 34,
    borderRadius: 99,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 6,
  },
  podiumAvatarEmoji: {
    fontSize: 18,
  },
  podiumName: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  podiumPlaceLabel: {
    fontSize: 8.5,
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginTop: 1,
  },
  podiumScoreText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginTop: 4,
  },
  podiumTimeText: {
    fontSize: 9,
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginTop: 2,
  },

  // HERO CARD: DAILY GLOBAL CHAMPIONSHIP
  dailyChampionshipCard: {
    borderRadius: 20,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  dailyChampVectors: {
    position: 'absolute',
    left: -20,
    top: -20,
  },
  dailyChampionshipContent: {
    alignItems: 'flex-end',
    width: '100%',
    zIndex: 1,
  },
  dailyChampBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    marginBottom: 8,
  },
  dailyChampTitle: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 4,
  },
  dailyChampMeta: {
    fontSize: 10.5,
    color: colors.primaryPale,
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginBottom: 14,
  },
  dailyChampCTA: {
    backgroundColor: colors.medalGold,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  dailyChampCTAText: {
    fontSize: 11.5,
    color: colors.primaryDark,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },

  // HORIZONTAL SWIPEABLE CAROUSEL
  carouselOuterWrapper: {
    minHeight: 245,
  },
  carouselContainer: {
    marginVertical: 4,
  },
  carouselContent: {
    paddingHorizontal: 4,
    gap: CARD_GAP,
  },
  carouselCardTouch: {
    width: CARD_WIDTH,
    height: 228,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: colors.black || '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  carouselCardItem: {
    width: CARD_WIDTH,
    height: 228,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: colors.black || '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  carouselCardGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    padding: 16,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'space-between',
  },
  carouselCardIllustration: {
    position: 'absolute',
    left: -15,
    bottom: -15,
  },
  carouselCardVectorHolder: {
    position: 'absolute',
    left: -15,
    bottom: -15,
  },
  carouselCardIcon: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'right',
  },
  carouselCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  carouselCardDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.primaryTint,
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginBottom: 16,
    textAlign: 'right',
  },
  carouselCardButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  carouselCardButtonText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },

  // PILLS
  pillsScrollContainer: {
    gap: 8,
    flexDirection: 'row-reverse',
    paddingVertical: 2,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  pillBtnText: {
    fontSize: 11.5,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },

  // AYAH OF TODAY CARD
  ayahCard: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  ayahHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ayahLabelText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  ayahShareButton: {
    padding: 4,
  },
  ayahArabicText: {
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  ayahEnglishText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  ayahMetaText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },

  // WEEKLY LEAGUE STANDINGS
  leagueCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  leagueHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  leagueCountdownText: {
    fontSize: 10.5,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  bracketContainer: {
    gap: 8,
  },
  bracketNode: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  bracketPos: {
    fontSize: 12,
    fontWeight: '700',
  },
  bracketName: {
    fontSize: 12.5,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  bracketStatus: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  // DAILY WORSHIP TRACKER CARD
  trackerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  trackerCardContent: {
    gap: 10,
  },
  trackerCardHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackerBadge: {
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryTintBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trackerBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  trackerTitleText: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Bold',
    lineHeight: 22,
  },
  trackerDescText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  trackerFeaturesRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  trackerFeatureChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  trackerFeatureText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  trackerCTA: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  trackerCTAText: {
    color: colors.white,
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
});

