import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Share, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { readCommunityPosts, saveCommunityPosts, type CommunityPost } from '../data/communityFeed';
import { readers } from '../data/readers';
import AdBanner from '../components/AdBanner';
import { LoadingState, EmptyState, ErrorState } from '../components/StateView';

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

const countriesList = [
  { code: 'ALL', nameAr: 'كل البلدان 🌍', nameEn: 'All Countries' },
  { code: 'EG', nameAr: 'مصر 🇪🇬', nameEn: 'Egypt' },
  { code: 'SA', nameAr: 'السعودية 🇸🇦', nameEn: 'Saudi Arabia' },
  { code: 'JO', nameAr: 'الأردن 🇯🇴', nameEn: 'Jordan' },
  { code: 'PS', nameAr: 'فلسطين 🇵🇸', nameEn: 'Palestine' },
  { code: 'AE', nameAr: 'الإمارات 🇦🇪', nameEn: 'UAE' },
  { code: 'MA', nameAr: 'المغرب 🇲🇦', nameEn: 'Morocco' },
];

export default function CommunityFeedScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [playingPostId, setPlayingPostId] = useState<string | null>(null);

  // Active Filters States
  const [filterReader, setFilterReader] = useState<string>('ALL');
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [filterStyle, setFilterStyle] = useState<string>('ALL');
  const [filterAccuracy, setFilterAccuracy] = useState<string>('ALL');

  const loadFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await readCommunityPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
      setError(
        language === 'ar'
          ? 'تعذر تحميل مشاركات المجتمع. يرجى التحقق من اتصالك والمحاولة مجدداً.'
          : 'Could not load community recitations. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFeed();
    });
    return unsubscribe;
  }, [navigation]);

  // Dynamic filtering logic
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (filterReader !== 'ALL' && post.readerId !== filterReader) return false;
      if (filterCountry !== 'ALL' && post.countryCode !== filterCountry) return false;
      if (filterStyle !== 'ALL' && post.style !== filterStyle) return false;
      if (filterAccuracy !== 'ALL') {
        const threshold = parseInt(filterAccuracy, 10);
        if (post.matchPercentage < threshold) return false;
      }
      return true;
    });
  }, [posts, filterReader, filterCountry, filterStyle, filterAccuracy]);

  const handleVote = async (postId: string, type: 'mashallah' | 'subhanallah') => {
    const updated = posts.map(post => {
      if (post.id === postId) {
        if (type === 'mashallah') {
          const hasVoted = !!post.hasVotedMashallah;
          return {
            ...post,
            mashallahCount: hasVoted ? post.mashallahCount - 1 : post.mashallahCount + 1,
            hasVotedMashallah: !hasVoted,
          };
        } else {
          const hasVoted = !!post.hasVotedSubhanallah;
          return {
            ...post,
            subhanallahCount: hasVoted ? post.subhanallahCount - 1 : post.subhanallahCount + 1,
            hasVotedSubhanallah: !hasVoted,
          };
        }
      }
      return post;
    });
    setPosts(updated);
    await saveCommunityPosts(updated);
  };

  // Share recording card
  const handleSharePost = async (post: CommunityPost) => {
    try {
      const message = `🎙️ استمع إلى تلاوة ${post.userName} المباركة لـ [${post.surahName}] عبر تطبيق *بطل مسلم* 🏆:\n\n⭐ نسبة التطابق: ${post.matchPercentage}%\n\nحمل التطبيق واستمع للتلاوات الحية الآن! 🚀`;
      await Share.share({ message });

      // Increment shares count
      const updated = posts.map(p => {
        if (p.id === post.id) {
          return { ...p, sharesCount: (p.sharesCount || 0) + 1 };
        }
        return p;
      });
      setPosts(updated);
      await saveCommunityPosts(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle audio playback simulation & count plays
  const handleTogglePlay = (post: CommunityPost) => {
    if (playingPostId === post.id) {
      setPlayingPostId(null);
    } else {
      setPlayingPostId(post.id);
      // Increment plays count
      const updated = posts.map(p => {
        if (p.id === post.id) {
          return { ...p, playsCount: (p.playsCount || 0) + 1 };
        }
        return p;
      });
      setPosts(updated);
      saveCommunityPosts(updated);
    }
  };

  const getReaderAvatarSymbol = (readerId: string) => {
    switch (readerId) {
      case 'free_voice': return '🎤';
      case 'abdulbasit': return '🕌';
      case 'minshawi': return '📖';
      case 'husary': return '💡';
      case 'sudais': return '🕋';
      default: return '🎙️';
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Feed Header (Fixed safe top offset so title and description appear cleanly) */}
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>
          {language === 'ar' ? 'منبر التلاوة والمجتمع 🎙️' : 'Recitation Community Feed 🎙️'}
        </Text>
        <Text style={styles.feedSubtitle}>
          {language === 'ar' 
            ? 'تفاعل مع تلاوات زملائك، استمع للأصوات العذبة، وسجّل تلاوتك الخاصة أو محاكاة القراء' 
            : 'Listen to recitations, react to top voices, and share your own recitations'}
        </Text>
      </View>

      {/* 2. Top Actions Bar */}
      <View style={styles.topActionsBar}>
        <TouchableOpacity
          style={styles.recordActionBtn}
          onPress={() => navigation.navigate('Voice')}
          activeOpacity={0.85}
        >
          <Text style={styles.recordActionBtnText}>🎙️ {language === 'ar' ? 'سجّل تلاوتك الآن' : 'Record Recitation'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterToggleBtn, showFilters && styles.filterToggleBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterToggleBtnText, showFilters && styles.filterToggleBtnTextActive]}>
            🔍 {language === 'ar' ? 'تصفية' : 'Filters'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Filter Sheet */}
      {showFilters && (
        <View style={styles.filterSheet}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {/* Style Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{language === 'ar' ? 'طريقة التلاوة:' : 'Style:'}</Text>
              <View style={styles.badgeRow}>
                {['ALL', 'murattal', 'mujawwad'].map(styleOption => (
                  <TouchableOpacity
                    key={styleOption}
                    style={[styles.filterBadge, filterStyle === styleOption && styles.filterBadgeActive]}
                    onPress={() => setFilterStyle(styleOption)}
                  >
                    <Text style={[styles.filterBadgeText, filterStyle === styleOption && styles.filterBadgeTextActive]}>
                      {styleOption === 'ALL' ? (language === 'ar' ? 'الكل' : 'All') : styleOption === 'murattal' ? (language === 'ar' ? 'مرتل 📖' : 'Murattal') : (language === 'ar' ? 'مجوّد 🎨' : 'Mujawwad')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Accuracy Match Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{language === 'ar' ? 'نسبة التطابق:' : 'Accuracy:'}</Text>
              <View style={styles.badgeRow}>
                {['ALL', '90', '80', '70'].map(acc => (
                  <TouchableOpacity
                    key={acc}
                    style={[styles.filterBadge, filterAccuracy === acc && styles.filterBadgeActive]}
                    onPress={() => setFilterAccuracy(acc)}
                  >
                    <Text style={[styles.filterBadgeText, filterAccuracy === acc && styles.filterBadgeTextActive]}>
                      {acc === 'ALL' ? (language === 'ar' ? 'الكل' : 'All') : `${acc}%+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Qari Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{language === 'ar' ? 'القارئ المحاكى:' : 'Qari:'}</Text>
              <View style={styles.badgeRow}>
                <TouchableOpacity
                  style={[styles.filterBadge, filterReader === 'ALL' && styles.filterBadgeActive]}
                  onPress={() => setFilterReader('ALL')}
                >
                  <Text style={[styles.filterBadgeText, filterReader === 'ALL' && styles.filterBadgeTextActive]}>
                    {language === 'ar' ? 'الكل' : 'All'}
                  </Text>
                </TouchableOpacity>
                {readers.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.filterBadge, filterReader === r.id && styles.filterBadgeActive]}
                    onPress={() => setFilterReader(r.id)}
                  >
                    <Text style={[styles.filterBadgeText, filterReader === r.id && styles.filterBadgeTextActive]}>
                      {r.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Country Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{language === 'ar' ? 'حسب البلد:' : 'Country:'}</Text>
              <View style={styles.badgeRow}>
                {countriesList.map(c => (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.filterBadge, filterCountry === c.code && styles.filterBadgeActive]}
                    onPress={() => setFilterCountry(c.code)}
                  >
                    <Text style={[styles.filterBadgeText, filterCountry === c.code && styles.filterBadgeTextActive]}>
                      {language === 'ar' ? c.nameAr : c.nameEn}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* 4. Social Timeline with Redesigned Recitation Cards */}
      <ScrollView style={styles.timelineScroll} contentContainerStyle={styles.timelineContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingState message={language === 'ar' ? 'جارٍ تحميل تلاوات المجتمع...' : 'Loading community recitations...'} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadFeed} />
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            icon="🍂"
            title={language === 'ar' ? 'لا توجد تسجيلات بعد' : 'No Recitations Yet'}
            description={
              language === 'ar'
                ? 'لا توجد تسجيلات تطابق خيارات التصفية هذه. جرّب تعديل الفلاتر أو سجل تلاوتك لتنشرها!'
                : 'No recitations found matching these filters. Try modifying your filter choices or record a new one!'
            }
            actionLabel={language === 'ar' ? 'سجل تلاوتك الآن 🎙️' : 'Record Recitation 🎙️'}
            onAction={() => navigation.navigate('Voice')}
          />
        ) : (
          filteredPosts.map(post => (
            <View key={post.id} style={styles.postCard}>
              {/* Top Profile Header */}
              <View style={styles.profileRow}>
                <TouchableOpacity style={styles.moreIcon} onPress={() => handleSharePost(post)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 16 }}>🔗</Text>
                </TouchableOpacity>

                <View style={styles.profileMeta}>
                  <Text style={styles.postUserName}>
                    {post.userName} {getFlagEmoji(post.countryCode)}
                  </Text>
                  <View style={styles.levelBadgePill}>
                    <Text style={styles.levelBadgeText}>المستوى {post.userLevel}</Text>
                  </View>
                </View>
                
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {getReaderAvatarSymbol(post.readerId)}
                  </Text>
                </View>
              </View>

              {/* Redesigned Card Body (No Ayah text, focusing on Surah, Duration, Ayahs count, Plays, Shares) */}
              <View style={styles.quranCard}>
                {/* Header Surah Title */}
                <View style={styles.surahHeaderRow}>
                  <Text style={styles.surahTitleText}>📖 {post.surahName}</Text>
                  <View style={[styles.matchBadge, { backgroundColor: post.readerId === 'free_voice' ? '#F0FDFA' : '#ECFDF5' }]}>
                    <Text style={[styles.matchBadgeText, { color: post.readerId === 'free_voice' ? '#0D9488' : '#059669' }]}>
                      {post.readerId === 'free_voice' ? '🎤 تلاوة حرّة' : `⭐ ${post.matchPercentage}% تطابق`}
                    </Text>
                  </View>
                </View>

                {/* Speaker/Reader info */}
                <Text style={styles.readerSubText}>
                  🎙️ {post.readerName} ({post.style === 'murattal' ? 'مرتل' : 'مجوّد'})
                </Text>

                {/* Animated Waveform Audio Player Box */}
                <View style={styles.waveformContainer}>
                  <TouchableOpacity
                    style={styles.playBtn}
                    onPress={() => handleTogglePlay(post)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.playBtnIcon}>{playingPostId === post.id ? '⏸️' : '▶️'}</Text>
                  </TouchableOpacity>

                  <View style={styles.barsRow}>
                    {[12, 18, 28, 22, 10, 16, 26, 32, 22, 12, 18, 30, 24, 14, 20, 28, 22, 12, 8].map((h, i) => (
                      <View
                        key={i}
                        style={[
                          styles.waveBar,
                          { height: playingPostId === post.id ? Math.max(6, (h + (i % 3) * 6) % 34) : h },
                          playingPostId === post.id && { backgroundColor: colors.primary }
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* Stats Counters Sub-row */}
                <View style={styles.countersSubRow}>
                  <Text style={styles.countersSubText}>
                    ▶️ {post.playsCount || 420} {language === 'ar' ? 'استماع' : 'plays'}
                  </Text>
                </View>
              </View>

              {/* Social Reaction Buttons & Interactive Share Button */}
              <View style={styles.reactionActionRow}>
                <TouchableOpacity
                  style={[styles.reactionBtn, post.hasVotedMashallah && styles.reactionBtnActive]}
                  onPress={() => handleVote(post.id, 'mashallah')}
                  activeOpacity={0.7}
                >
                  <View style={styles.reactionBadgeCount}>
                    <Text style={styles.reactionBadgeCountText}>{post.mashallahCount}</Text>
                  </View>
                  <Text style={styles.reactionLabel}>⭐ {language === 'ar' ? 'ما شاء الله' : 'Mashallah'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reactionBtn, post.hasVotedSubhanallah && styles.reactionBtnActive]}
                  onPress={() => handleVote(post.id, 'subhanallah')}
                  activeOpacity={0.7}
                >
                  <View style={styles.reactionBadgeCount}>
                    <Text style={styles.reactionBadgeCountText}>{post.subhanallahCount}</Text>
                  </View>
                  <Text style={styles.reactionLabel}>📿 {language === 'ar' ? 'سبحان الله' : 'Subhanallah'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareBtnCard}
                  onPress={() => handleSharePost(post)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.shareBtnCardText}>🔗 {language === 'ar' ? 'مشاركة' : 'Share'} ({post.sharesCount || 0})</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
  },
  feedHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  feedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  feedSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  topActionsBar: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 14,
  },
  recordActionBtn: {
    flex: 1.8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  recordActionBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.surface,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  filterToggleBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  filterToggleBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterToggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  filterToggleBtnTextActive: {
    color: colors.primary,
    fontWeight: '900',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  filterSheet: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 14,
  },
  filterScroll: {
    flexDirection: 'row-reverse',
    gap: 20,
  },
  filterGroup: {
    gap: 8,
  },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  badgeRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  filterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadgeText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  filterBadgeTextActive: {
    color: colors.surface,
    fontWeight: '900',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    paddingBottom: 24,
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 30,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moreIcon: {
    padding: 6,
  },
  profileMeta: {
    flex: 1,
    marginRight: 10,
    alignItems: 'flex-start',
  },
  postUserName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  levelBadgePill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  levelBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
  },
  profileAvatarText: {
    fontSize: 22,
  },
  quranCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  surahHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  surahTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  readerSubText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
    marginBottom: 10,
  },
  metaChipsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 12,
  },
  metaChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  waveformContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    gap: 10,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnIcon: {
    fontSize: 16,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
  },
  waveBar: {
    width: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  durationLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  countersSubRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  countersSubText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  reactionActionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  reactionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  reactionBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  reactionBadgeCount: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  reactionBadgeCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  reactionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  shareBtnCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareBtnCardText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  adWrapper: {
    marginTop: 8,
  },
});
