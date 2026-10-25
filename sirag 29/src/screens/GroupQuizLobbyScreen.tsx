import React, { useState } from 'react';
import CinematicJourneyPanel from '../components/CinematicJourneyPanel';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import Svg, { Path } from 'react-native-svg';
import { LoadingState, EmptyState, ErrorState } from '../components/StateView';

// Custom interface for group room settings
export interface GroupQuizSettings {
  category: 'القرآن' | 'السنة' | 'الفقه' | 'السيرة' | 'التاريخ';
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'MCQ' | 'Completion';
  questionCount: number;
  maxPlayers: number;
  isPrivate: boolean;
}

// Predefined lists of active mock rooms for browser
const mockPublicRooms = [
  { id: 'ROOM-1024', host: 'خالد بن الوليد', category: 'السيرة', players: '3/8', difficulty: 'medium' },
  { id: 'ROOM-2048', host: 'سلمان الفارسي', category: 'القرآن', players: '5/16', difficulty: 'easy' },
  { id: 'ROOM-4096', host: 'البراء بن مالك', category: 'التاريخ', players: '2/4', difficulty: 'hard' },
];

export default function GroupQuizLobbyScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language, backArrow } = useLanguage();
  const styles = getStyles(colors);

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  
  // Customization settings state
  const [settings, setSettings] = useState<GroupQuizSettings>({
    category: 'القرآن',
    difficulty: 'easy',
    questionType: 'MCQ',
    questionCount: 10,
    maxPlayers: 8,
    isPrivate: false,
  });

  const [joinCode, setJoinCode] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [publicRooms, setPublicRooms] = useState(mockPublicRooms);

  const refreshRooms = async () => {
    setLoadingRooms(true);
    setRoomsError(null);
    try {
      await new Promise(r => setTimeout(r, 400));
      setPublicRooms(mockPublicRooms);
    } catch (err) {
      setRoomsError(
        language === 'ar'
          ? 'تعذر جلب الغرف العامة. يرجى التحقق من الاتصال والمحاولة مجدداً.'
          : 'Could not fetch public rooms. Please check your connection and try again.'
      );
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleCreateRoom = () => {
    // Generate a random 4-digit code
    const randomId = 'ROOM-' + Math.floor(1000 + Math.random() * 9000);
    navigation.navigate('GroupQuizWaiting', {
      roomId: randomId,
      isAdmin: true,
      initialSettings: settings,
    });
  };

  const handleJoinByCode = () => {
    if (!joinCode.trim()) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Warning',
        language === 'ar' ? 'الرجاء إدخال رمز الغرفة أولاً.' : 'Please enter the room code first.'
      );
      return;
    }
    const cleanCode = joinCode.trim().toUpperCase();
    navigation.navigate('GroupQuizWaiting', {
      roomId: cleanCode.startsWith('ROOM-') ? cleanCode : `ROOM-${cleanCode}`,
      isAdmin: false,
    });
  };

  return (
    <View style={styles.container}>
      {/* Custom Title Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('HomeTabs', { screen: 'ArenaHub' })}
          style={styles.backBtn}
        >
          <Text style={{ fontSize: 20, color: colors.primaryDeep }}>{backArrow}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'المسابقات الجماعية 👥' : 'Group Quizzes 👥'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <CinematicJourneyPanel titleAr="مجلس الأبطال" titleEn="Heroes Gathering" subtitleAr="اجمع فريقك، اختر مجال التحدي، وابدأ رحلة معرفة جماعية" subtitleEn="Gather your team, choose a challenge and learn together" icon="✦" compact />
      {/* Tab Selectors */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('create')}
          style={[styles.tabButton, activeTab === 'create' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
            {language === 'ar' ? 'إنشاء غرفة جديدة' : 'Create Room'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('join')}
          style={[styles.tabButton, activeTab === 'join' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'join' && styles.tabTextActive]}>
            {language === 'ar' ? 'انضمام لغرفة' : 'Join Room'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {activeTab === 'create' ? (
          <View style={styles.cardContainer}>
            <Text style={styles.sectionTitle}>
              {language === 'ar' ? '⚙️ تخصيص إعدادات المسابقة:' : '⚙️ Custom Quiz Settings:'}
            </Text>

            {/* Category selection */}
            <Text style={styles.label}>{language === 'ar' ? 'المجال الإسلامي' : 'Islamic Domain'}</Text>
            <View style={styles.optionGrid}>
              {(['القرآن', 'السنة', 'الفقه', 'السيرة', 'التاريخ'] as const).map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSettings(prev => ({ ...prev, category: cat }))}
                  style={[styles.optionBadge, settings.category === cat && styles.optionBadgeActive]}
                >
                  <Text style={[styles.optionText, settings.category === cat && styles.optionTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Difficulty selection */}
            <Text style={styles.label}>{language === 'ar' ? 'درجة الصعوبة' : 'Difficulty Tier'}</Text>
            <View style={styles.optionGrid}>
              {[
                { key: 'easy', ar: 'سهل (مبتدئ)', en: 'Easy' },
                { key: 'medium', ar: 'متوسط (متمكن)', en: 'Medium' },
                { key: 'hard', ar: 'صعب (بطل)', en: 'Hard' }
              ].map(tier => (
                <TouchableOpacity
                  key={tier.key}
                  onPress={() => setSettings(prev => ({ ...prev, difficulty: tier.key as any }))}
                  style={[styles.optionBadge, settings.difficulty === tier.key && styles.optionBadgeActive]}
                >
                  <Text style={[styles.optionText, settings.difficulty === tier.key && styles.optionTextActive]}>
                    {language === 'ar' ? tier.ar : tier.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Question type selection */}
            <Text style={styles.label}>{language === 'ar' ? 'نوع الأسئلة' : 'Question Format'}</Text>
            <View style={styles.optionGrid}>
              {[
                { key: 'MCQ', ar: 'اختيار من متعدد 🔘', en: 'MCQ 🔘' },
                { key: 'Completion', ar: 'إكمال الفراغ ✏️', en: 'Completion ✏️' }
              ].map(type => (
                <TouchableOpacity
                  key={type.key}
                  onPress={() => setSettings(prev => ({ ...prev, questionType: type.key as any }))}
                  style={[styles.optionBadge, settings.questionType === type.key && styles.optionBadgeActive]}
                >
                  <Text style={[styles.optionText, settings.questionType === type.key && styles.optionTextActive]}>
                    {language === 'ar' ? type.ar : type.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Question count selection */}
            <Text style={styles.label}>{language === 'ar' ? 'عدد الأسئلة' : 'Number of Questions'}</Text>
            <View style={styles.optionGrid}>
              {[5, 10, 15, 20].map(count => (
                <TouchableOpacity
                  key={count}
                  onPress={() => setSettings(prev => ({ ...prev, questionCount: count }))}
                  style={[styles.optionBadge, settings.questionCount === count && styles.optionBadgeActive]}
                >
                  <Text style={[styles.optionText, settings.questionCount === count && styles.optionTextActive]}>
                    {count} {language === 'ar' ? 'أسئلة' : 'questions'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Max players capacity selection */}
            <Text style={styles.label}>{language === 'ar' ? 'السعة القصوى للمشاركين' : 'Max Players Capacity'}</Text>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                onPress={() => setSettings(prev => ({ ...prev, maxPlayers: Math.max(2, prev.maxPlayers - 1) }))}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperBtnText}>-</Text>
              </TouchableOpacity>
              
              <TextInput
                style={styles.stepperInput}
                keyboardType="numeric"
                value={String(settings.maxPlayers)}
                onChangeText={(val) => {
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    setSettings(prev => ({ ...prev, maxPlayers: Math.max(2, Math.min(100, num)) }));
                  } else if (val === '') {
                    setSettings(prev => ({ ...prev, maxPlayers: 2 }));
                  }
                }}
              />

              <TouchableOpacity
                onPress={() => setSettings(prev => ({ ...prev, maxPlayers: Math.min(100, prev.maxPlayers + 1) }))}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
              
              <Text style={styles.stepperSuffix}>
                {language === 'ar' ? 'أبطال' : 'players'}
              </Text>
            </View>

            {/* Room Privacy selection */}
            <Text style={styles.label}>{language === 'ar' ? 'خصوصية الغرفة' : 'Room Privacy'}</Text>
            <View style={styles.optionGrid}>
              {[
                { key: false, ar: 'عامة (يمكن للجميع الانضمام)', en: 'Public' },
                { key: true, ar: 'خاصة (عن طريق كود الدعوة فقط)', en: 'Private' }
              ].map(privacy => (
                <TouchableOpacity
                  key={privacy.key ? 'private' : 'public'}
                  onPress={() => setSettings(prev => ({ ...prev, isPrivate: privacy.key }))}
                  style={[styles.optionBadge, settings.isPrivate === privacy.key && styles.optionBadgeActive]}
                >
                  <Text style={[styles.optionText, settings.isPrivate === privacy.key && styles.optionTextActive]}>
                    {language === 'ar' ? privacy.ar : privacy.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Launch Button */}
            <TouchableOpacity
              onPress={handleCreateRoom}
              style={styles.actionButton}
              activeOpacity={0.9}
            >
              <Text style={styles.actionButtonText}>
                {language === 'ar' ? '✨ إنشاء الغرفة والانتقال للانتظار' : '✨ Create Waiting Room'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardContainer}>
            <Text style={styles.sectionTitle}>
              {language === 'ar' ? '🔑 انضمام بواسطة رمز الغرفة:' : '🔑 Join via Room Code:'}
            </Text>

            <TextInput
              style={styles.codeInput}
              placeholder={language === 'ar' ? 'أدخل الرمز هنا (مثال: ROOM-1234)' : 'Enter Code (e.g. ROOM-1234)'}
              placeholderTextColor="#9CA3AF"
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              returnKeyType="done"
            />

            <TouchableOpacity
              onPress={handleJoinByCode}
              style={[styles.actionButton, { backgroundColor: colors.accentDeep }]}
              activeOpacity={0.9}
            >
              <Text style={styles.actionButtonText}>
                {language === 'ar' ? '🚪 دخول الغرفة' : '🚪 Enter Room'}
              </Text>
            </TouchableOpacity>

            {/* Public Rooms List browser */}
            <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>
              {language === 'ar' ? '🌍 غرف عامة نشطة حالياً:' : '🌍 Active Public Rooms:'}
            </Text>

            {loadingRooms ? (
              <LoadingState message={language === 'ar' ? 'جارٍ البحث عن غرف عامة...' : 'Searching for public rooms...'} />
            ) : roomsError ? (
              <ErrorState message={roomsError} onRetry={refreshRooms} />
            ) : publicRooms.length === 0 ? (
              <EmptyState
                icon="👥"
                title={language === 'ar' ? 'لا توجد غرف عامة حالياً' : 'No Public Rooms Available'}
                description={language === 'ar' ? 'كن أول من ينشئ غرفة وادعُ أصدقاءك للمنافسة!' : 'Be the first to create a room and invite friends!'}
                actionLabel={language === 'ar' ? 'أنشئ غرفة الآن ✨' : 'Create Room Now ✨'}
                onAction={() => setActiveTab('create')}
              />
            ) : (
              publicRooms.map(room => (
                <View key={room.id} style={styles.roomCard}>
                  <View style={styles.roomBadge}>
                    <Text style={styles.roomBadgeText}>{room.category}</Text>
                  </View>
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomTitleText}>
                      {language === 'ar' ? `غرفة البطل: ${room.host}` : `${room.host}'s Room`}
                    </Text>
                    <Text style={styles.roomSubText}>
                      {language === 'ar' ? `الصعوبة: ${room.difficulty} | كود: ${room.id}` : `Difficulty: ${room.difficulty} | Code: ${room.id}`}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-start' }}>
                    <Text style={styles.roomPlayersCount}>{room.players}</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('GroupQuizWaiting', { roomId: room.id, isAdmin: false })}
                      style={styles.joinBtnSmall}
                    >
                      <Text style={styles.joinBtnSmallText}>{language === 'ar' ? 'دخول' : 'Join'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
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
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryDeep,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  tabRow: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primaryDeep,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  tabTextActive: {
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 12,
    textAlign: 'right',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'right',
  },
  optionGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionBadgeActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#34A853',
  },
  optionText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  optionTextActive: {
    color: '#137333',
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  codeInput: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
    marginBottom: 8,
  },
  roomCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roomBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  roomBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  roomInfo: {
    flex: 1,
  },
  roomTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  roomSubText: {
    fontSize: 10.5,
    color: colors.textSecondary,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
    marginTop: 2,
  },
  roomPlayersCount: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 4,
  },
  joinBtnSmall: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  joinBtnSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  stepperContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  stepperInput: {
    width: 60,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  stepperSuffix: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginRight: 8,
  },
});
