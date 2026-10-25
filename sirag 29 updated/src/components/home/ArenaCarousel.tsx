import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.76, 305);
const CARD_GAP = 14;

export interface ChallengeItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  route: string;
  params?: any;
  icon: string;
  color: string;
  gradientColors?: [string, string, ...string[]];
  badgeAr?: string;
  badgeEn?: string;
  rewardSiraj?: number;
  activeCount?: string;
}

interface ArenaCarouselProps {
  challengesData: ChallengeItem[];
  onSelectChallenge: (item: ChallengeItem) => void;
  styles?: any;
}

const ARENA_META: Record<
  string,
  {
    badgeAr: string;
    badgeEn: string;
    reward: string;
    activePlayersAr: string;
    activePlayersEn: string;
    ctaAr: string;
    ctaEn: string;
    gradient: [string, string, string];
  }
> = {
  '1v1': {
    badgeAr: 'مباشر ⚡',
    badgeEn: 'Live 1v1 ⚡',
    reward: '+٢٥ 🪙',
    activePlayersAr: '١.٤ ألف بطل',
    activePlayersEn: '1.4k Active',
    ctaAr: 'ابدأ المبارزة',
    ctaEn: 'Start Duel',
    gradient: ['#044E3F', '#065F46', '#022C22'],
  },
  'finish-ayah-camera': {
    badgeAr: 'فلتر الكاميرا 📸',
    badgeEn: 'AR Camera 📸',
    reward: '+٢٠ 🪙',
    activePlayersAr: '٩٢٠ يتحدون',
    activePlayersEn: '920 Playing',
    ctaAr: 'افتح الكاميرا',
    ctaEn: 'Open Filter',
    gradient: ['#9D174D', '#BE185D', '#500724'],
  },
  'finish-ayah': {
    badgeAr: 'تلاوة صوتية 🎧',
    badgeEn: 'Audio Recitation 🎧',
    reward: '+٢٠ 🪙',
    activePlayersAr: '١.١ ألف يستمعون',
    activePlayersEn: '1.1k Listening',
    ctaAr: 'استمع وأكمل',
    ctaEn: 'Listen & Complete',
    gradient: ['#075985', '#0284C7', '#082F49'],
  },
  'rapid': {
    badgeAr: 'سرعة فائقة 🔥',
    badgeEn: 'Rapid Fire 🔥',
    reward: '+١٥ 🪙',
    activePlayersAr: '١.٨ ألف في الميدان',
    activePlayersEn: '1.8k Active',
    ctaAr: 'تحدَّ السرعة',
    ctaEn: 'Speed Run',
    gradient: ['#92400E', '#B45309', '#451A03'],
  },
  'quran-assess': {
    badgeAr: 'إتقان الحفظ 📖',
    badgeEn: 'Quran Testing 📖',
    reward: '+٣٠ 🪙',
    activePlayersAr: '٧٤٠ يقيمون حفظهم',
    activePlayersEn: '740 Assessing',
    ctaAr: 'ابدأ التقييم',
    ctaEn: 'Start Test',
    gradient: ['#1E3A8A', '#2563EB', '#0F172A'],
  },
  'hadith-verify': {
    badgeAr: 'علوم الحديث 💬',
    badgeEn: 'Hadith Study 💬',
    reward: '+٢٠ 🪙',
    activePlayersAr: '١.٣ ألف يتبارون',
    activePlayersEn: '1.3k Active',
    ctaAr: 'اختبر علمك',
    ctaEn: 'Test Hadith',
    gradient: ['#581C87', '#7C3AED', '#2E1065'],
  },
  'sirah-quest': {
    badgeAr: 'رحلة تفاعلية 🗺️',
    badgeEn: 'Biography Quest 🗺️',
    reward: '+٢٥ 🪙',
    activePlayersAr: '١.٦ ألف في الرحلة',
    activePlayersEn: '1.6k On Quest',
    ctaAr: 'ادخل الخريطة',
    ctaEn: 'Open Quest',
    gradient: ['#7C2D12', '#9A3412', '#431407'],
  },
  'siraj-shop': {
    badgeAr: 'متجر الصرح 🕯️',
    badgeEn: 'Hero Store 🕯️',
    reward: 'جوائز 🏆',
    activePlayersAr: 'مقتنيات نادرة',
    activePlayersEn: 'Rare Items',
    ctaAr: 'تصفح المتجر',
    ctaEn: 'Open Shop',
    gradient: ['#B45309', '#D97706', '#78350F'],
  },
};

function ArenaWatermark({ id }: { id: string }) {
  if (id === '1v1') {
    return (
      <Svg viewBox="0 0 24 24" width="125" height="125" opacity="0.14" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
        <Path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
        <Path d="M13 19l6-6" />
        <Path d="M16 16l4 4" />
        <Path d="M19 21l2-2" />
        <Path d="M9.5 6.5L21 18v3h-3L6.5 9.5" />
        <Path d="M11 5L5 11" />
        <Path d="M8 8L4 4" />
        <Path d="M5 3L3 5" />
      </Svg>
    );
  }
  if (id === 'finish-ayah-camera') {
    return (
      <Svg viewBox="0 0 24 24" width="125" height="125" opacity="0.15" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
        <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <Circle cx="12" cy="13" r="4" />
      </Svg>
    );
  }
  if (id === 'finish-ayah') {
    return (
      <Svg viewBox="0 0 24 24" width="125" height="125" opacity="0.15" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
        <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </Svg>
    );
  }
  if (id === 'rapid') {
    return (
      <Svg viewBox="0 0 24 24" width="125" height="125" opacity="0.15" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
        <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </Svg>
    );
  }
  if (id === 'quran-assess') {
    return (
      <Svg viewBox="0 0 24 24" width="125" height="125" opacity="0.15" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
        <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </Svg>
    );
  }
  if (id === 'hadith-verify') {
    return (
      <Svg viewBox="0 0 24 24" width="125" height="125" opacity="0.15" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
        <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </Svg>
    );
  }
  if (id === 'sirah-quest') {
    return (
      <Svg viewBox="0 0 24 24" width="125" height="125" opacity="0.15" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
        <Circle cx="12" cy="12" r="10" />
        <Path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z" />
      </Svg>
    );
  }
  // siraj-shop
  return (
    <Svg viewBox="0 0 24 24" width="125" height="125" opacity="0.15" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
      <Path d="M12 2v3M9 5h6M9 5a4 4 0 0 0-4 4v7a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4M9 5h6" />
      <Circle cx="12" cy="2" r="2" fill="#FFFFFF" />
    </Svg>
  );
}

export function ArenaCarousel({ challengesData, onSelectChallenge }: ArenaCarouselProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const step = CARD_WIDTH + CARD_GAP;
    const index = Math.round(offsetX / step);
    if (index >= 0 && index < challengesData.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={localStyles.wrapper}>
      {/* Section Header with Arena Mode Count */}
      <View style={localStyles.sectionHeader}>
        <View style={localStyles.headerTextCol}>
          <View style={localStyles.headerTitleRow}>
            <Text style={[localStyles.sectionTitle, { color: colors.textPrimary }]}>
              {language === 'ar' ? 'اختر ميدان التحدي ⚡' : 'Select Arena Mode ⚡'}
            </Text>
            <View style={[localStyles.countBadge, { backgroundColor: colors.accentLight || '#FEF3C7' }]}>
              <Text style={[localStyles.countBadgeText, { color: colors.accentDark || '#B45309' }]}>
                {language === 'ar' ? `${challengesData.length} ميادين` : `${challengesData.length} Arenas`}
              </Text>
            </View>
          </View>
          <Text style={[localStyles.sectionSubtitle, { color: colors.textSecondary }]}>
            {language === 'ar'
              ? 'مبارزات مباشرة، مسابقات صوتية، ومغامرات معرفية ممتعة'
              : 'Live duels, voice quizzes, and noble knowledge quests'}
          </Text>
        </View>
      </View>

      {/* Horizontal Carousel */}
      <View style={localStyles.carouselContainer}>
        <FlatList
          data={challengesData}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={localStyles.listContent}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          snapToAlignment="start"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => {
            const meta = ARENA_META[item.id] || {
              badgeAr: 'تحدي إيماني ✨',
              badgeEn: 'Hero Arena ✨',
              reward: '+١٥ 🪙',
              activePlayersAr: 'نشط الآن',
              activePlayersEn: 'Active Now',
              ctaAr: 'ادخل الميدان',
              ctaEn: 'Enter Arena',
              gradient: (item.gradientColors || ['#065F46', '#047857', '#022C22']) as [string, string, string],
            };

            const gradientColors = (item.gradientColors || meta.gradient) as [string, string, ...string[]];

            return (
              <TouchableOpacity
                style={localStyles.cardTouch}
                onPress={() => onSelectChallenge(item)}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={language === 'ar' ? item.titleAr : item.titleEn}
              >
                <LinearGradient
                  colors={gradientColors}
                  style={localStyles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Subtle Vector Background Illustration */}
                  <View style={localStyles.watermarkHolder} pointerEvents="none">
                    <ArenaWatermark id={item.id} />
                  </View>

                  {/* Top Bar: Category Tag + Siraj Reward Pill */}
                  <View style={localStyles.cardTopRow}>
                    <View style={localStyles.categoryChip}>
                      <Text style={localStyles.categoryChipText}>
                        {language === 'ar' ? meta.badgeAr : meta.badgeEn}
                      </Text>
                    </View>

                    <View style={localStyles.rewardChip}>
                      <Text style={localStyles.rewardChipText}>{meta.reward}</Text>
                    </View>
                  </View>

                  {/* Center Content: Icon + Title + Description */}
                  <View style={localStyles.cardCenterContent}>
                    <View style={localStyles.iconBox}>
                      <Text style={localStyles.iconEmoji}>{item.icon}</Text>
                    </View>

                    <Text style={localStyles.cardTitle} numberOfLines={1}>
                      {language === 'ar' ? item.titleAr : item.titleEn}
                    </Text>

                    <Text style={localStyles.cardDesc} numberOfLines={2}>
                      {language === 'ar' ? item.descAr : item.descEn}
                    </Text>
                  </View>

                  {/* Bottom Bar: Active Player Count + CTA Pill Button */}
                  <View style={localStyles.cardBottomRow}>
                    <View style={localStyles.activeUsersBox}>
                      <View style={localStyles.pulseDot} />
                      <Text style={localStyles.activeUsersText}>
                        {language === 'ar' ? meta.activePlayersAr : meta.activePlayersEn}
                      </Text>
                    </View>

                    <View style={localStyles.ctaPill}>
                      <Text style={[localStyles.ctaPillText, { color: gradientColors[0] || colors.primaryDeep }]}>
                        {language === 'ar' ? meta.ctaAr : meta.ctaEn}
                      </Text>
                      <Text style={[localStyles.ctaArrow, { color: gradientColors[0] || colors.primaryDeep }]}>
                        {language === 'ar' ? '←' : '→'}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Pagination Indicators */}
      <View style={localStyles.paginationRow}>
        {challengesData.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <View
              key={item.id}
              style={[
                localStyles.dot,
                isActive
                  ? [localStyles.dotActive, { backgroundColor: colors.primaryDeep || '#0B4F44' }]
                  : { backgroundColor: colors.borderStrong || '#D1D5DB' },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginTop: 2,
  },
  carouselContainer: {
    marginHorizontal: -20, // stretch edge-to-edge for comfortable horizontal scrolling
  },
  listContent: {
    paddingHorizontal: 20,
    gap: CARD_GAP,
    paddingVertical: 4,
  },
  cardTouch: {
    width: CARD_WIDTH,
    height: 228,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    position: 'relative',
  },
  watermarkHolder: {
    position: 'absolute',
    left: -12,
    bottom: -12,
  },
  cardTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  categoryChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  rewardChip: {
    backgroundColor: 'rgba(242, 198, 109, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(242, 198, 109, 0.45)',
  },
  rewardChipText: {
    color: '#FDE68A',
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  cardCenterContent: {
    zIndex: 2,
    marginTop: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconEmoji: {
    fontSize: 24,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  cardDesc: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: 'IBMPlexSansArabic-Regular',
    textAlign: 'right',
  },
  cardBottomRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    marginTop: 4,
  },
  activeUsersBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  activeUsersText: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 10.5,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  ctaPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  ctaArrow: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  paginationRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
  },
});
