import JourneyPassport from '../components/JourneyPassport';
import CinematicPortal from '../components/CinematicPortal';
import CinematicSectionHeader from '../components/CinematicSectionHeader';
import CinematicFeatureAtlas from '../components/CinematicFeatureAtlas';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserProfile } from '../firebase/auth';
import AdBanner from '../components/AdBanner';
import { educationalVideos, VideoItem } from '../data/educationalVideos';

const { width } = Dimensions.get('window');

export default function LearningScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'quizzes' | 'lectures' | 'kids'>('quizzes');
  const [selectedTopic, setSelectedTopic] = useState<string>('الكل');
  const [profile, setProfile] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  // Animation values
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

  // Handle playing video by launching modal
  const handlePlayVideo = (video: VideoItem) => {
    setSelectedVideo(video);
    setVideoModalVisible(true);
  };

  // Reset topic filter on tab change
  const handleTabChange = (tab: 'quizzes' | 'lectures' | 'kids') => {
    setActiveTab(tab);
    setSelectedTopic('الكل');
  };

  // Adult Video Filtered List
  const adultVideos = useMemo(() => {
    const list = educationalVideos.filter((v) => v.audience === 'adults' || v.audience === 'all');
    if (selectedTopic === 'الكل') return list;
    return list.filter((v) => v.topic === selectedTopic);
  }, [selectedTopic]);

  // Kids Video Filtered List
  const kidsVideos = useMemo(() => {
    const list = educationalVideos.filter((v) => v.audience === 'kids' || v.audience === 'all');
    if (selectedTopic === 'الكل') return list;
    return list.filter((v) => v.topic === selectedTopic);
  }, [selectedTopic]);

  // Bta3 Anime & Islamic Anime Dedicated Shelf
  const animeVideos = useMemo(
    () => educationalVideos.filter((v) => v.topic === 'أنمي'),
    []
  );

  // Grouped Shelves for Adults (When 'الكل' selected)
  const samirVideos = useMemo(
    () => educationalVideos.filter((v) => v.speaker.includes('سمير مصطفى')),
    []
  );
  const amjadVideos = useMemo(
    () => educationalVideos.filter((v) => v.speaker.includes('أمجد سمير') || v.speaker.includes('إياد قنيبي')),
    []
  );
  const quranSirahVideos = useMemo(
    () => educationalVideos.filter((v) => v.audience === 'adults' && (v.topic === 'قرآن' || v.topic === 'سيرة')),
    []
  );

  // Grouped Shelves for Kids (When 'الكل' selected)
  const kidsWorshipVideos = useMemo(
    () => educationalVideos.filter((v) => v.audience === 'kids' && v.topic === 'عبادات'),
    []
  );
  const kidsStoriesVideos = useMemo(
    () => educationalVideos.filter((v) => v.audience === 'kids' && v.topic === 'قصص'),
    []
  );
  const kidsQuranMannersVideos = useMemo(
    () => educationalVideos.filter((v) => v.audience === 'kids' && (v.topic === 'قرآن' || v.topic === 'أخلاق')),
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Header with live wallet badge positioned on the LEFT side */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {language === 'ar' ? 'منبر التعلم والقرآن 📚' : 'Learning Hub 📚'}
          </Text>
        </View>

        <Animated.View style={[styles.walletBadge, { backgroundColor: colors.primaryLight, transform: [{ scale: walletScale }] }]}>
          <Text style={{ fontSize: 16, marginRight: 4 }}>🕯️</Text>
          <Text style={[styles.walletText, { color: colors.primary }]}>
            {profile?.sirajBalance ?? 50}
          </Text>
        </Animated.View>
      </View>

      {/* 2. Main Navigation Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'quizzes' && { borderBottomColor: colors.primaryDeep }]}
          onPress={() => handleTabChange('quizzes')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'quizzes' && styles.tabTextActive, { color: activeTab === 'quizzes' ? colors.primaryDeep : colors.textSecondary }]}>
            {language === 'ar' ? 'تحديات التعلم 🎯' : 'Learning Quizzes 🎯'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'lectures' && { borderBottomColor: colors.primaryDeep }]}
          onPress={() => handleTabChange('lectures')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'lectures' && styles.tabTextActive, { color: activeTab === 'lectures' ? colors.primaryDeep : colors.textSecondary }]}>
            {language === 'ar' ? 'مكتبة الكبار 👳‍♂️' : 'Adults Library 👳‍♂️'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'kids' && { borderBottomColor: colors.primaryDeep }]}
          onPress={() => handleTabChange('kids')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'kids' && styles.tabTextActive, { color: activeTab === 'kids' ? colors.primaryDeep : colors.textSecondary }]}>
            {language === 'ar' ? 'مكتبة الأطفال 👶' : 'Kids Library 👶'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Stories-Style Categories Avatar Bar */}
      <View style={[styles.storiesBarSection, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScrollContent}>
          {(activeTab === 'kids'
            ? [
                { id: 'الكل', nameAr: 'الكل', emoji: '✨', colors: ['#0D9488', '#0F766E'] },
                { id: 'أنمي', nameAr: 'أنمي كرتون', emoji: '⚔️', colors: ['#E11D48', '#BE123C'] },
                { id: 'عبادات', nameAr: 'تعلم العبادات', emoji: '🤲', colors: ['#3B82F6', '#1D4ED8'] },
                { id: 'قصص', nameAr: 'قصص الأنبياء', emoji: '📜', colors: ['#F59E0B', '#B45309'] },
                { id: 'قرآن', nameAr: 'تحفيظ القرآن', emoji: '📖', colors: ['#10B981', '#047857'] },
                { id: 'أخلاق', nameAr: 'الآداب والأخلاق', emoji: '🌟', colors: ['#8B5CF6', '#6D28D9'] },
              ]
            : [
                { id: 'الكل', nameAr: 'الكل', emoji: '✨', colors: ['#10B981', '#047857'] },
                { id: 'أنمي', nameAr: 'أنمي إسلامي', emoji: '⚔️', colors: ['#E11D48', '#BE123C'] },
                { id: 'تزكية', nameAr: 'تزكية القلوب', emoji: '💖', colors: ['#EC4899', '#BE185D'] },
                { id: 'عقيدة', nameAr: 'العقيدة واليقين', emoji: '🧠', colors: ['#8B5CF6', '#6D28D9'] },
                { id: 'قرآن', nameAr: 'تفسير القرآن', emoji: '📖', colors: ['#3B82F6', '#1D4ED8'] },
                { id: 'سيرة', nameAr: 'السيرة العطرة', emoji: '🗺️', colors: ['#F59E0B', '#B45309'] },
                { id: 'فقه', nameAr: 'الفقه والعبادات', emoji: '📜', colors: ['#14B8A6', '#0F766E'] },
                { id: 'قصص', nameAr: 'قصص وعبر', emoji: '🌟', colors: ['#6366F1', '#4338CA'] },
              ]
          ).map((item) => {
            const isSelected = selectedTopic === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.storyBubbleItem}
                onPress={() => setSelectedTopic(item.id)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.storyRingContainer,
                  isSelected && styles.storyRingActive
                ]}>
                  <LinearGradient
                    colors={[item.colors[0], item.colors[1]]}
                    style={styles.storyBubbleInner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.storyEmojiText}>{item.emoji}</Text>
                  </LinearGradient>
                </View>
                <Text
                  style={[
                    styles.storyLabelText,
                    { color: isSelected ? colors.primaryDeep : colors.textPrimary },
                    isSelected && { fontFamily: 'IBMPlexSansArabic-Bold', color: '#10B981' }
                  ]}
                  numberOfLines={1}
                >
                  {item.nameAr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Main Content Scroll View */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <JourneyPassport navigation={navigation} compact />
        <CinematicFeatureAtlas language={language} onNavigate={(route) => navigation.navigate(route)} compact />
        <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 10 }}>
          <CinematicPortal scene="quran" title={language === 'ar' ? 'رحلة القرآن الكريم' : 'The Quran Journey'} eyebrow={language === 'ar' ? 'اقرأ · افهم · احفظ · تدبّر' : 'READ · UNDERSTAND · RECALL · REFLECT'} subtitle={language === 'ar' ? 'تعلّم آيات الفاتحة، خطوة بخطوة.' : 'Explore Al-Fatiha, one ayah at a time.'} action={language === 'ar' ? 'ابدأ التعلم ←' : 'Start learning →'} onPress={() => navigation.navigate('QuranJourney')} />
          <CinematicPortal scene="sirah" compact title={language === 'ar' ? 'رحلة السيرة' : 'The Sirah Story'} subtitle={language === 'ar' ? 'قصص حقيقية ومحطات تاريخية' : 'Real history and meaningful milestones'} onPress={() => navigation.navigate('SirahStory')} />
          <CinematicPortal scene="mosque" compact title={language === 'ar' ? 'الحديث والعمل' : 'Hadith in Action'} subtitle={language === 'ar' ? 'افهم الحديث وطبّقه في حياتك' : 'Learn and apply the teaching'} onPress={() => navigation.navigate('HadithInAction')} />
        </View>
        <CinematicSectionHeader titleAr="عوالم التعلّم" titleEn="Learning Worlds" subtitleAr="استكشف المعرفة والمحتوى التعليمي" subtitleEn="Explore knowledge and learning content" symbol="✦" />
        
        {/* TAB 1: QUIZZES & MAPS WITH SIRAJ GAMIFICATION */}
        {activeTab === 'quizzes' && (
          <View style={styles.quizzesSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              مشاريع وخرائط التعلم التفاعلية 🎯
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
              مناهج إيمانية متكاملة لترسيخ سيرة الرسول ﷺ والتلاوة ودقة التجويد واكتساب أنوار السراج 🕯️
            </Text>

            {/* HERO FEATURED CARD: خريطة السيرة */}
            <TouchableOpacity
              style={styles.heroCardContainer}
              onPress={() => navigation.navigate('SirahStory')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#7C2D12', '#451A03']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCardGradient}
              >
                <View style={styles.heroCardHeader}>
                  <View style={styles.heroIconBadge}>
                    <Text style={{ fontSize: 26 }}>🗺️</Text>
                  </View>
                  <View style={styles.heroPointsBadge}>
                    <Text style={styles.heroPointsText}>+٥٠ 🕯️ السراج</Text>
                  </View>
                </View>
                <Text style={styles.heroCardTitle}>خريطة السيرة الكبرى (رحلة البطل) 🏆</Text>
                <Text style={styles.heroCardSub}>
                  تتبع مسيرة النبي ﷺ من الولادة بمكة المكرمة إلى المدينة المنورة واكسب أنوار السراج والوسامات القيادية.
                </Text>
                <View style={styles.heroCTAButton}>
                  <Text style={styles.heroCTAText}>ابدأ رحلة السيرة الآن ➔</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* 2-COLUMN GRID FOR OTHER CHALLENGES */}
            <View style={styles.challengesRow}>
              {/* CARD 1: فهم المقروء */}
              <TouchableOpacity
                style={styles.gridCardItem}
                onPress={() => navigation.navigate('ReadingChallenge')}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#1E3A8A', '#1E40AF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gridCardGradient}
                >
                  <View style={styles.gridCardHeader}>
                    <Text style={{ fontSize: 24 }}>📚</Text>
                    <View style={styles.gridPointsBadge}>
                      <Text style={styles.gridPointsText}>+١٠ 🕯️</Text>
                    </View>
                  </View>
                  <View style={styles.gridCardBody}>
                    <Text style={styles.gridCardTitle} numberOfLines={2}>فهم المقروء والعبر</Text>
                    <Text style={styles.gridCardDesc} numberOfLines={2}>نصوص إسلامية ووعظية لاختبار دقة الفهم.</Text>
                  </View>
                  <View style={styles.gridCardCTA}>
                    <Text style={styles.gridCardCTAText}>ابدأ القراءة ➔</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* CARD 2: محاكاة التلاوة والتجويد */}
              <TouchableOpacity
                style={styles.gridCardItem}
                onPress={() => navigation.navigate('Voice')}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#065F46', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gridCardGradient}
                >
                  <View style={styles.gridCardHeader}>
                    <Text style={{ fontSize: 24 }}>🎙️</Text>
                    <View style={styles.gridPointsBadge}>
                      <Text style={styles.gridPointsText}>+٢٥ 🕯️</Text>
                    </View>
                  </View>
                  <View style={styles.gridCardBody}>
                    <Text style={styles.gridCardTitle} numberOfLines={2}>تحدي التلاوة والتجويد</Text>
                    <Text style={styles.gridCardDesc} numberOfLines={2}>رتل الآية بصوتك وقيّس مخارج الحروف.</Text>
                  </View>
                  <View style={styles.gridCardCTA}>
                    <Text style={styles.gridCardCTAText}>ابدأ التلاوة ➔</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* CARD 3: المتشابهات القرآني */}
              <TouchableOpacity
                style={styles.gridCardItem}
                onPress={() => navigation.navigate('Mutashabihat')}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#92400E', '#B45309']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gridCardGradient}
                >
                  <View style={styles.gridCardHeader}>
                    <Text style={{ fontSize: 24 }}>🧩</Text>
                    <View style={styles.gridPointsBadge}>
                      <Text style={styles.gridPointsText}>+٣٠ 🕯️</Text>
                    </View>
                  </View>
                  <View style={styles.gridCardBody}>
                    <Text style={styles.gridCardTitle} numberOfLines={2}>المتشابهات القرآني</Text>
                    <Text style={styles.gridCardDesc} numberOfLines={2}>ميز بين الألفاظ المتشابهة واحذر اللبس.</Text>
                  </View>
                  <View style={styles.gridCardCTA}>
                    <Text style={styles.gridCardCTAText}>ابدأ التحدي ➔</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* CARD 4: تحدي الحديث الشريف */}
              <TouchableOpacity
                style={styles.gridCardItem}
                onPress={() => navigation.navigate('HadithChallenge')}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#581C87', '#6B21A8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gridCardGradient}
                >
                  <View style={styles.gridCardHeader}>
                    <Text style={{ fontSize: 24 }}>💬</Text>
                    <View style={styles.gridPointsBadge}>
                      <Text style={styles.gridPointsText}>+٢٠ 🕯️</Text>
                    </View>
                  </View>
                  <View style={styles.gridCardBody}>
                    <Text style={styles.gridCardTitle} numberOfLines={2}>الحديث والأسانيد</Text>
                    <Text style={styles.gridCardDesc} numberOfLines={2}>اختبر معلوماتك في رواة الأحاديث ودلالاتها.</Text>
                  </View>
                  <View style={styles.gridCardCTA}>
                    <Text style={styles.gridCardCTAText}>اختبر معلوماتك ➔</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* CARD 5: تحدي إكمال الآية */}
              <TouchableOpacity
                style={styles.gridCardItem}
                onPress={() => navigation.navigate('FinishAyah')}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#075985', '#0369A1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gridCardGradient}
                >
                  <View style={styles.gridCardHeader}>
                    <Text style={{ fontSize: 24 }}>🎧</Text>
                    <View style={styles.gridPointsBadge}>
                      <Text style={styles.gridPointsText}>+٢٠ 🕯️</Text>
                    </View>
                  </View>
                  <View style={styles.gridCardBody}>
                    <Text style={styles.gridCardTitle} numberOfLines={2}>إكمال نهاية الآية</Text>
                    <Text style={styles.gridCardDesc} numberOfLines={2}>استمع للتلاوة واكتشف التكملة الصحيحة.</Text>
                  </View>
                  <View style={styles.gridCardCTA}>
                    <Text style={styles.gridCardCTAText}>أكمل الآية ➔</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* CARD 6: تحدي عدسة القرآن AR (Camera Filter) */}
              <TouchableOpacity
                style={styles.gridCardItem}
                onPress={() => navigation.navigate('FinishAyahCamera')}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#BE185D', '#9D174D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gridCardGradient}
                >
                  <View style={styles.gridCardHeader}>
                    <Text style={{ fontSize: 24 }}>📸</Text>
                    <View style={styles.gridPointsBadge}>
                      <Text style={styles.gridPointsText}>+٤٠ 🕯️</Text>
                    </View>
                  </View>
                  <View style={styles.gridCardBody}>
                    <Text style={styles.gridCardTitle} numberOfLines={2}>تحدي كروت الآية AR</Text>
                    <Text style={styles.gridCardDesc} numberOfLines={2}>فلتر الكاميرا التفاعلي لتسجيل ريلز وستوري.</Text>
                  </View>
                  <View style={styles.gridCardCTA}>
                    <Text style={styles.gridCardCTAText}>افتح الكاميرا ➔</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 2: ADULTS LIBRARY (الكبار) */}
        {activeTab === 'lectures' && (
          <View style={styles.shelvesSection}>
            {selectedTopic !== 'الكل' ? (
              // FILTERED GRID VIEW FOR ADULTS
              <View style={{ paddingHorizontal: 20 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
                  دروس ومحاضرات: {selectedTopic} ({adultVideos.length})
                </Text>
                <View style={styles.videoGrid}>
                  {adultVideos.map((video, idx) => (
                    <TouchableOpacity
                      key={`${video.id}-${idx}`}
                      style={[styles.videoCard, { backgroundColor: colors.surface }]}
                      onPress={() => handlePlayVideo(video)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.thumbnailContainer}>
                        <Image
                          source={{ uri: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` }}
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                        <View style={styles.playButtonOverlay}>
                          <Text style={{ fontSize: 22, color: '#FFFFFF' }}>▶️</Text>
                        </View>
                        <View style={styles.durationBadge}>
                          <Text style={styles.durationText}>{video.duration}</Text>
                        </View>
                        <View style={[styles.topicBadge, { backgroundColor: video.topic === 'أنمي' ? '#E11D48' : colors.primaryDeep }]}>
                          <Text style={styles.topicBadgeText}>{video.topic}</Text>
                        </View>
                      </View>
                      <View style={styles.videoMeta}>
                        <Text style={[styles.videoTitleText, { color: colors.textPrimary }]} numberOfLines={2}>
                          {video.title}
                        </Text>
                        <Text style={styles.speakerLabel}>🎙️ {video.speaker}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              // SHELVES VIEW FOR ADULTS
              <>
                {/* FEATURED ANIME SHELF: بتاع أنمي & أنمي تاريخي */}
                <View style={styles.shelfContainer}>
                  <View style={styles.shelfHeader}>
                    <Text style={{ fontSize: 16 }}>⚔️</Text>
                    <Text style={[styles.shelfTitle, { color: '#E11D48' }]}>
                      سلسلة أنمي التاريخ الإسلامي والبطولات (بتاع أنمي)
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {animeVideos.map((video, idx) => (
                      <TouchableOpacity
                        key={`${video.id}-${idx}`}
                        style={[styles.shelfCard, { backgroundColor: colors.surface, borderColor: '#FCA5A5' }]}
                        onPress={() => handlePlayVideo(video)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.shelfThumbnail}>
                          <Image
                            source={{ uri: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` }}
                            style={styles.shelfImage}
                            resizeMode="cover"
                          />
                          <View style={styles.playOverlayMini}>
                            <Text style={{ fontSize: 18, color: '#FFFFFF' }}>▶️</Text>
                          </View>
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>{video.duration}</Text>
                          </View>
                          <View style={[styles.topicBadge, { backgroundColor: '#E11D48' }]}>
                            <Text style={styles.topicBadgeText}>أنمي</Text>
                          </View>
                        </View>
                        <Text style={[styles.shelfCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                          {video.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* SHELF 1: الشيخ سمير مصطفى */}
                <View style={styles.shelfContainer}>
                  <View style={styles.shelfHeader}>
                    <Text style={{ fontSize: 16 }}>🎙️</Text>
                    <Text style={[styles.shelfTitle, { color: colors.textPrimary }]}>
                      سلسلة فضيلة الشيخ سمير مصطفى (أنوار الإيمان والتزكية)
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {samirVideos.map((video, idx) => (
                      <TouchableOpacity
                        key={`${video.id}-${idx}`}
                        style={[styles.shelfCard, { backgroundColor: colors.surface }]}
                        onPress={() => handlePlayVideo(video)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.shelfThumbnail}>
                          <Image
                            source={{ uri: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` }}
                            style={styles.shelfImage}
                            resizeMode="cover"
                          />
                          <View style={styles.playOverlayMini}>
                            <Text style={{ fontSize: 18, color: '#FFFFFF' }}>▶️</Text>
                          </View>
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>{video.duration}</Text>
                          </View>
                        </View>
                        <Text style={[styles.shelfCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                          {video.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* SHELF 2: المهندس أمجد سمير والدكتور إياد قنيبي */}
                <View style={styles.shelfContainer}>
                  <View style={styles.shelfHeader}>
                    <Text style={{ fontSize: 16 }}>🧠</Text>
                    <Text style={[styles.shelfTitle, { color: colors.textPrimary }]}>
                      سلسلة فاهم ورسائل اليقين (بناء الفكر والعقل المسلم)
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {amjadVideos.map((video, idx) => (
                      <TouchableOpacity
                        key={`${video.id}-${idx}`}
                        style={[styles.shelfCard, { backgroundColor: colors.surface }]}
                        onPress={() => handlePlayVideo(video)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.shelfThumbnail}>
                          <Image
                            source={{ uri: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` }}
                            style={styles.shelfImage}
                            resizeMode="cover"
                          />
                          <View style={styles.playOverlayMini}>
                            <Text style={{ fontSize: 18, color: '#FFFFFF' }}>▶️</Text>
                          </View>
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>{video.duration}</Text>
                          </View>
                        </View>
                        <Text style={[styles.shelfCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                          {video.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* SHELF 3: التفسير والسيرة النبوية */}
                <View style={styles.shelfContainer}>
                  <View style={styles.shelfHeader}>
                    <Text style={{ fontSize: 16 }}>📖</Text>
                    <Text style={[styles.shelfTitle, { color: colors.textPrimary }]}>
                      تفسير القرآن وسلسلة السيرة النبوية
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {quranSirahVideos.map((video, idx) => (
                      <TouchableOpacity
                        key={`${video.id}-${idx}`}
                        style={[styles.shelfCard, { backgroundColor: colors.surface }]}
                        onPress={() => handlePlayVideo(video)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.shelfThumbnail}>
                          <Image
                            source={{ uri: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` }}
                            style={styles.shelfImage}
                            resizeMode="cover"
                          />
                          <View style={styles.playOverlayMini}>
                            <Text style={{ fontSize: 18, color: '#FFFFFF' }}>▶️</Text>
                          </View>
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>{video.duration}</Text>
                          </View>
                        </View>
                        <Text style={[styles.shelfCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                          {video.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        )}

        {/* TAB 3: KIDS LIBRARY (الأطفال) */}
        {activeTab === 'kids' && (
          <View style={styles.shelvesSection}>
            {selectedTopic !== 'الكل' ? (
              // FILTERED GRID VIEW FOR KIDS
              <View style={{ paddingHorizontal: 20 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
                  تعليم الأطفال: {selectedTopic} ({kidsVideos.length})
                </Text>
                <View style={styles.videoGrid}>
                  {kidsVideos.map((video, idx) => (
                    <TouchableOpacity
                      key={`${video.id}-${idx}`}
                      style={[styles.videoCard, { backgroundColor: colors.surface }]}
                      onPress={() => handlePlayVideo(video)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.thumbnailContainer}>
                        <Image
                          source={{ uri: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` }}
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                        <View style={styles.playButtonOverlay}>
                          <Text style={{ fontSize: 22, color: '#FFFFFF' }}>▶️</Text>
                        </View>
                        <View style={styles.durationBadge}>
                          <Text style={styles.durationText}>{video.duration}</Text>
                        </View>
                        <View style={[styles.topicBadge, { backgroundColor: video.topic === 'أنمي' ? '#E11D48' : '#0D9488' }]}>
                          <Text style={styles.topicBadgeText}>{video.topic}</Text>
                        </View>
                      </View>
                      <View style={styles.videoMeta}>
                        <Text style={[styles.videoTitleText, { color: colors.textPrimary }]} numberOfLines={2}>
                          {video.title}
                        </Text>
                        <Text style={styles.speakerLabel}>🎙️ {video.speaker}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              // SHELVES VIEW FOR KIDS
              <>
                {/* ANIME & HEROES CARTOON SHELF FOR KIDS */}
                <View style={styles.shelfContainer}>
                  <View style={styles.shelfHeader}>
                    <Text style={{ fontSize: 16 }}>⚔️</Text>
                    <Text style={[styles.shelfTitle, { color: '#E11D48' }]}>
                      سلسلة أنمي وبطولات الصحابة والأبطال
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {animeVideos.map((video, idx) => (
                      <TouchableOpacity
                        key={`${video.id}-${idx}`}
                        style={[styles.shelfCard, { backgroundColor: colors.surface, borderColor: '#FCA5A5' }]}
                        onPress={() => handlePlayVideo(video)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.shelfThumbnail}>
                          <Image
                            source={{ uri: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` }}
                            style={styles.shelfImage}
                            resizeMode="cover"
                          />
                          <View style={styles.playOverlayMini}>
                            <Text style={{ fontSize: 18, color: '#FFFFFF' }}>▶️</Text>
                          </View>
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>{video.duration}</Text>
                          </View>
                          <View style={[styles.topicBadge, { backgroundColor: '#E11D48' }]}>
                            <Text style={styles.topicBadgeText}>أنمي</Text>
                          </View>
                        </View>
                        <Text style={[styles.shelfCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                          {video.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* SHELF 1: تعليم العبادات مع زكريا */}
                <View style={styles.shelfContainer}>
                  <View style={styles.shelfHeader}>
                    <Text style={{ fontSize: 16 }}>🕌</Text>
                    <Text style={[styles.shelfTitle, { color: colors.textPrimary }]}>
                      تعليم الوضوء والصلاة والعبادات للصغار
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {kidsWorshipVideos.map((video, idx) => (
                      <TouchableOpacity
                        key={`${video.id}-${idx}`}
                        style={[styles.shelfCard, { backgroundColor: colors.surface }]}
                        onPress={() => handlePlayVideo(video)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.shelfThumbnail}>
                          <Image
                            source={{ uri: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` }}
                            style={styles.shelfImage}
                            resizeMode="cover"
                          />
                          <View style={styles.playOverlayMini}>
                            <Text style={{ fontSize: 18, color: '#FFFFFF' }}>▶️</Text>
                          </View>
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>{video.duration}</Text>
                          </View>
                        </View>
                        <Text style={[styles.shelfCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                          {video.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* SHELF 2: قصص الأنبياء كرتون */}
                <View style={styles.shelfContainer}>
                  <View style={styles.shelfHeader}>
                    <Text style={{ fontSize: 16 }}>🎨</Text>
                    <Text style={[styles.shelfTitle, { color: colors.textPrimary }]}>
                      روائع قصص الأنبياء بالصلصال والكرتون
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {kidsStoriesVideos.map((video, idx) => (
                      <TouchableOpacity
                        key={`${video.id}-${idx}`}
                        style={[styles.shelfCard, { backgroundColor: colors.surface }]}
                        onPress={() => handlePlayVideo(video)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.shelfThumbnail}>
                          <Image
                            source={{ uri: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` }}
                            style={styles.shelfImage}
                            resizeMode="cover"
                          />
                          <View style={styles.playOverlayMini}>
                            <Text style={{ fontSize: 18, color: '#FFFFFF' }}>▶️</Text>
                          </View>
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>{video.duration}</Text>
                          </View>
                        </View>
                        <Text style={[styles.shelfCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                          {video.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* SHELF 3: تحفيظ القرآن والأخلاق */}
                <View style={styles.shelfContainer}>
                  <View style={styles.shelfHeader}>
                    <Text style={{ fontSize: 16 }}>✨</Text>
                    <Text style={[styles.shelfTitle, { color: colors.textPrimary }]}>
                      تحفيظ القرآن الكريم وسلوكيات المسلم الصغير
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {kidsQuranMannersVideos.map((video, idx) => (
                      <TouchableOpacity
                        key={`${video.id}-${idx}`}
                        style={[styles.shelfCard, { backgroundColor: colors.surface }]}
                        onPress={() => handlePlayVideo(video)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.shelfThumbnail}>
                          <Image
                            source={{ uri: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` }}
                            style={styles.shelfImage}
                            resizeMode="cover"
                          />
                          <View style={styles.playOverlayMini}>
                            <Text style={{ fontSize: 18, color: '#FFFFFF' }}>▶️</Text>
                          </View>
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>{video.duration}</Text>
                          </View>
                        </View>
                        <Text style={[styles.shelfCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                          {video.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        )}

      </ScrollView>

      {/* 5. Sleek Theater-Mode Video Playback Modal with icon-only close button */}
      <Modal
        visible={videoModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setVideoModalVisible(false)}
      >
        <View style={styles.theaterContainer}>
          {/* Top Panel Controls with ICON-ONLY close button */}
          <View style={styles.theaterHeader}>
            <TouchableOpacity
              style={styles.theaterCloseButton}
              onPress={() => setVideoModalVisible(false)}
            >
              <Text style={styles.theaterCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.theaterTitle} numberOfLines={1}>
              {selectedVideo?.title}
            </Text>
          </View>

          {/* YoutubePlayer component from react-native-youtube-iframe */}
          {selectedVideo && (
            <View style={styles.theaterPlayerBox}>
              <YoutubePlayer
                height={225}
                play={true}
                videoId={selectedVideo.id}
                webViewStyle={{ opacity: 0.99 }}
                webViewProps={{
                  allowsInlineMediaPlayback: true,
                  mediaPlaybackRequiresUserAction: false,
                  androidLayerType: 'hardware',
                  originWhitelist: ['*'],
                }}
              />
            </View>
          )}

          {/* Speaker Card Meta Info */}
          <View style={styles.theaterBioCard}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.bioHeader}>🎙️ تفاصيل الدرس والتبويب</Text>
              <View style={[styles.topicBadgeInline, { backgroundColor: selectedVideo?.topic === 'أنمي' ? '#E11D48' : (selectedVideo?.audience === 'kids' ? '#0D9488' : colors.primaryDeep) }]}>
                <Text style={styles.topicBadgeTextInline}>{selectedVideo?.topic}</Text>
              </View>
            </View>
            <Text style={styles.bioSubtitle}>{selectedVideo?.speaker}</Text>
            <Text style={styles.bioDescription}>
              شاهد وتعلم مجاناً بالكامل. لقد قمنا بدمج مقاطع الفيديو بمشغل محمي لمنع تشتيت الانتباه أو الإعلانات الخارجية المزعجة.
            </Text>
          </View>

          {/* Sticky Ad banner at the bottom of the video theater modal */}
          <AdBanner />
        </View>
      </Modal>

      {/* 6. Sticky Ad placement at bottom of screen */}
      <AdBanner />
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
    paddingTop: 22,
    paddingBottom: 12,
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
  storiesBarSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  storiesScrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row-reverse',
    gap: 14,
    alignItems: 'center',
  },
  storyBubbleItem: {
    alignItems: 'center',
    width: 68,
  },
  storyRingContainer: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2.5,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingActive: {
    borderColor: '#10B981',
    borderWidth: 2.5,
  },
  storyBubbleInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  storyEmojiText: {
    fontSize: 24,
  },
  storyLabelText: {
    fontSize: 10.5,
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginTop: 5,
    textAlign: 'center',
  },
  topicFilterContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  topicChipsScroll: {
    paddingHorizontal: 20,
    flexDirection: 'row-reverse',
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  topicChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  quizzesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 11.5,
    textAlign: 'right',
    lineHeight: 17,
    marginBottom: 20,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  challengesRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // HERO CARD STYLES
  heroCardContainer: {
    width: '100%',
    marginBottom: 18,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#7C2D12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  heroCardGradient: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(254, 215, 170, 0.4)',
  },
  heroCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPointsBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroPointsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  heroCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginBottom: 6,
  },
  heroCardSub: {
    fontSize: 12,
    color: 'rgba(254, 215, 170, 0.9)',
    fontFamily: 'IBMPlexSansArabic-Regular',
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 14,
  },
  heroCTAButton: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heroCTAText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#7C2D12',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },

  // 2-COLUMN GRID CARD STYLES
  gridCardItem: {
    width: (width - 52) / 2,
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  gridCardGradient: {
    padding: 14,
    borderRadius: 18,
    height: 195,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gridCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridPointsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  gridPointsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  gridCardBody: {
    marginVertical: 4,
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    lineHeight: 19,
    marginBottom: 4,
  },
  gridCardDesc: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.82)',
    fontFamily: 'IBMPlexSansArabic-Regular',
    textAlign: 'right',
    lineHeight: 15,
  },
  gridCardCTA: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  gridCardCTAText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  panelHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pointsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  panelTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginTop: 8,
    lineHeight: 20,
  },
  panelDesc: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginTop: 6,
    marginBottom: 10,
  },
  panelCTA: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  panelCTAText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  videoGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  videoCard: {
    width: (width - 50) / 2,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbnailContainer: {
    width: '100%',
    height: 96,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  playButtonOverlay: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  topicBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  topicBadgeText: {
    fontSize: 8.5,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  videoMeta: {
    padding: 10,
  },
  videoTitleText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    lineHeight: 16,
    textAlign: 'right',
    height: 34,
  },
  speakerLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginTop: 4,
    textAlign: 'right',
  },
  shelvesSection: {
    flex: 1,
  },
  shelfContainer: {
    marginBottom: 28,
  },
  shelfHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  shelfTitle: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  horizontalScroll: {
    paddingLeft: 20,
    flexDirection: 'row',
  },
  shelfCard: {
    width: 140,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
    overflow: 'hidden',
  },
  shelfThumbnail: {
    width: '100%',
    height: 80,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shelfImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  playOverlayMini: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shelfCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    lineHeight: 15,
    padding: 8,
    textAlign: 'right',
    height: 38,
  },
  theaterContainer: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.98)',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  theaterHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    marginBottom: 10,
  },
  theaterCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  theaterCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  theaterTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginRight: 12,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  theaterPlayerBox: {
    width: '100%',
    height: 225,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#334155',
  },
  theaterBioCard: {
    margin: 20,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bioHeader: {
    fontSize: 12.5,
    color: '#38BDF8',
    fontWeight: '700',
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  topicBadgeInline: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  topicBadgeTextInline: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  bioSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 8,
  },
  bioDescription: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 18,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
});
